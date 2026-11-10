import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/client'

export const maxDuration = 60

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function checkSecret(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice(7) === secret
}

async function ensureEventColumn(name: string, ddl: string): Promise<boolean> {
  const cols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event'
      AND COLUMN_NAME = ${name}
  `
  const missing = cols.length === 0
  if (missing) await db.$executeRawUnsafe(ddl)
  return missing
}

/**
 * Kolom timestamp baru: baris lama tetap NULL ("tidak tercatat"), baris baru
 * dapat CURRENT_TIMESTAMP. ADD dengan DEFAULT langsung akan mengisi semua baris
 * lama dengan waktu migrate — Form Monitoring jadi salah menilai H-14 / H+14.
 */
async function ensureTimestampColumn(table: string, name: string, withDefault: boolean): Promise<boolean> {
  const cols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
      AND COLUMN_NAME = ${name}
  `
  if (cols.length > 0) return false
  await db.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${name} DATETIME(0) NULL`)
  if (withDefault) {
    await db.$executeRawUnsafe(
      `ALTER TABLE ${table} MODIFY COLUMN ${name} DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP`,
    )
  }
  return true
}

/** Idempotent prod: event columns, wfe_serentak, brimnasional divisi=brim. */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return unauthorized()

  const addedColumn = await ensureEventColumn(
    'approvebrimnas',
    'ALTER TABLE event ADD COLUMN approvebrimnas TEXT NULL',
  )
  const backfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET approvebrimnas = '0' WHERE approvebrimnas IS NULL OR approvebrimnas = ''`,
  )

  const addedImageUrl = await ensureEventColumn(
    'image_url',
    'ALTER TABLE event ADD COLUMN image_url TEXT NULL',
  )
  const imageBackfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET image_url = '' WHERE image_url IS NULL`,
  )

  const addedFlyerQa = await ensureEventColumn(
    'flyer_qa',
    'ALTER TABLE event ADD COLUMN flyer_qa LONGTEXT NULL',
  )
  const flyerQaBackfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET flyer_qa = '' WHERE flyer_qa IS NULL`,
  )

  const addedBeritaAcaraQa = await ensureEventColumn(
    'berita_acara_qa',
    'ALTER TABLE event ADD COLUMN berita_acara_qa LONGTEXT NULL',
  )
  const beritaAcaraQaBackfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET berita_acara_qa = '' WHERE berita_acara_qa IS NULL`,
  )

  const tables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wfe_serentak'
  `
  const addedWfeSerentak = tables.length === 0
  if (addedWfeSerentak) {
    await db.$executeRawUnsafe(`
      CREATE TABLE wfe_serentak (
        id INT NOT NULL AUTO_INCREMENT,
        bulan_mulai DATE NOT NULL,
        bulan_selesai DATE NOT NULL,
        image_url TEXT NOT NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_wfe_serentak_range (bulan_mulai, bulan_selesai)
      )
    `)
  }

  const sesiTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_sesi'
  `
  const addedEventSesi = sesiTables.length === 0
  if (addedEventSesi) {
    await db.$executeRawUnsafe(`
      CREATE TABLE event_sesi (
        id_sesi INT NOT NULL AUTO_INCREMENT,
        id_event INT NOT NULL,
        nama VARCHAR(255) NOT NULL,
        tanggal DATE NOT NULL,
        jam_mulai VARCHAR(8) NOT NULL DEFAULT '',
        jam_selesai VARCHAR(8) NOT NULL DEFAULT '',
        wajib TINYINT(1) NOT NULL DEFAULT 1,
        urutan INT NOT NULL DEFAULT 0,
        PRIMARY KEY (id_sesi),
        KEY idx_event_sesi_event (id_event),
        CONSTRAINT event_sesi_event_fk FOREIGN KEY (id_event) REFERENCES event (id_event) ON DELETE CASCADE
      )
    `)
  }

  const absenSesiCols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'absen'
      AND COLUMN_NAME = 'id_sesi'
  `
  const addedAbsenIdSesi = absenSesiCols.length === 0
  if (addedAbsenIdSesi) {
    await db.$executeRawUnsafe(`ALTER TABLE absen ADD COLUMN id_sesi INT NULL`)
    await db.$executeRawUnsafe(`ALTER TABLE absen ADD KEY idx_absen_sesi (id_sesi)`)
  }

  const lokasiTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_lokasi'
  `
  const addedEventLokasi = lokasiTables.length === 0
  if (addedEventLokasi) {
    await db.$executeRawUnsafe(`
      CREATE TABLE event_lokasi (
        id_lokasi INT NOT NULL AUTO_INCREMENT,
        id_event INT NOT NULL,
        nama VARCHAR(255) NOT NULL,
        alamat VARCHAR(500) NOT NULL DEFAULT '',
        longlat VARCHAR(64) NOT NULL DEFAULT '',
        radius INT NOT NULL DEFAULT 0,
        urutan INT NOT NULL DEFAULT 0,
        PRIMARY KEY (id_lokasi),
        KEY idx_event_lokasi_event (id_event),
        CONSTRAINT event_lokasi_event_fk FOREIGN KEY (id_event) REFERENCES event (id_event) ON DELETE CASCADE
      )
    `)
  }

  const sesiLokasiCols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_sesi'
      AND COLUMN_NAME = 'id_lokasi'
  `
  const addedSesiIdLokasi = sesiLokasiCols.length === 0
  if (addedSesiIdLokasi) {
    await db.$executeRawUnsafe(`ALTER TABLE event_sesi ADD COLUMN id_lokasi INT NULL`)
    await db.$executeRawUnsafe(`ALTER TABLE event_sesi ADD KEY idx_event_sesi_lokasi (id_lokasi)`)
    await db.$executeRawUnsafe(
      `ALTER TABLE event_sesi ADD CONSTRAINT event_sesi_lokasi_fk FOREIGN KEY (id_lokasi) REFERENCES event_lokasi (id_lokasi) ON DELETE SET NULL`,
    )
  }

  const wwtypeCols = await db.$queryRaw<{ COLUMN_TYPE: string }[]>`
    SELECT COLUMN_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event'
      AND COLUMN_NAME = 'wwtype'
  `
  const wwtypeType = wwtypeCols[0]?.COLUMN_TYPE ?? ''
  const addedWwtypeNasional = !wwtypeType.includes('nasional')
  if (addedWwtypeNasional) {
    await db.$executeRawUnsafe(
      `ALTER TABLE event MODIFY COLUMN wwtype ENUM('bulanan','jfe','nasional') NOT NULL DEFAULT 'bulanan'`,
    )
  }

  // Legacy rows often have '' (invalid enum index 0) — Prisma P2023 → pages look empty
  const wwtypeBackfill = await db.$executeRaw(
    Prisma.sql`UPDATE event SET wwtype = 'bulanan' WHERE wwtype IS NULL OR wwtype = ''`,
  )

  const appLogTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_log'
  `
  const addedAppLog = appLogTables.length === 0
  if (addedAppLog) {
    await db.$executeRawUnsafe(`
      CREATE TABLE app_log (
        id INT NOT NULL AUTO_INCREMENT,
        level ENUM('info','error') NOT NULL DEFAULT 'info',
        model_name VARCHAR(64) NULL,
        operation VARCHAR(32) NULL,
        action VARCHAR(128) NULL,
        actor_type ENUM('pengurus','peserta','system','unknown') NOT NULL DEFAULT 'unknown',
        actor_id INT NULL,
        actor_label VARCHAR(255) NULL,
        success TINYINT(1) NOT NULL DEFAULT 1,
        error_message TEXT NULL,
        detail LONGTEXT NULL,
        route_path VARCHAR(255) NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_app_log_created_at (created_at),
        KEY idx_app_log_level_created (level, created_at),
        KEY idx_app_log_model_created (model_name, created_at),
        KEY idx_app_log_action_created (action, created_at),
        KEY idx_app_log_actor (actor_type, actor_id)
      )
    `)
  }

  const addedEventCreatedAt = await ensureTimestampColumn('event', 'created_at', true)
  const addedDokumentasiCreatedAt = await ensureTimestampColumn('dokumentasi_kota', 'created_at', true)
  const addedReimburseLaporanAt = await ensureTimestampColumn('reimburse', 'laporan_at', false)

  // Member baru vs lama: peserta yang sudah ada sebelum kolom ini tetap NULL (tanggal daftar tidak tercatat).
  // updated_at diisi MySQL sendiri (ON UPDATE) supaya perubahan dari luar Prisma / raw SQL ikut tercatat.
  // EXTRA dicek terpisah: kalau MODIFY gagal setelah ADD, run berikutnya tetap melengkapinya.
  const addedPesertaCreatedAt = await ensureTimestampColumn('peserta', 'created_at', true)
  const addedPesertaUpdatedAt = await ensureTimestampColumn('peserta', 'updated_at', false)
  const pesertaUpdatedAt = await db.$queryRaw<{ EXTRA: string }[]>`
    SELECT EXTRA FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'peserta'
      AND COLUMN_NAME = 'updated_at'
  `
  const setPesertaUpdatedAtOnUpdate = !/on update/i.test(pesertaUpdatedAt[0]?.EXTRA ?? '')
  if (setPesertaUpdatedAtOnUpdate) {
    await db.$executeRawUnsafe(
      `ALTER TABLE peserta MODIFY COLUMN updated_at DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    )
  }

  const pindahKotaTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pindah_kota'
  `
  const addedPindahKota = pindahKotaTables.length === 0
  if (addedPindahKota) {
    await db.$executeRawUnsafe(`
      CREATE TABLE pindah_kota (
        id_pindah INT NOT NULL AUTO_INCREMENT,
        id_peserta TEXT NOT NULL,
        dari_kota TEXT NOT NULL,
        ke_kota TEXT NOT NULL,
        catatan TEXT NOT NULL,
        status TEXT NOT NULL,
        notenasional TEXT NOT NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME(0) NULL,
        PRIMARY KEY (id_pindah),
        KEY idx_pindah_kota_peserta (id_peserta(64)),
        KEY idx_pindah_kota_status (status(8))
      )
    `)
  }

  const feedbackAppTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedback_app'
  `
  const addedFeedbackApp = feedbackAppTables.length === 0
  if (addedFeedbackApp) {
    await db.$executeRawUnsafe(`
      CREATE TABLE feedback_app (
        id_feedback INT NOT NULL AUTO_INCREMENT,
        id_peserta TEXT NOT NULL,
        pilihan TEXT NOT NULL,
        jawaban TEXT NOT NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_feedback),
        KEY idx_feedback_app_peserta (id_peserta(64))
      )
    `)
  }

  const kesaksianTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kesaksian'
  `
  const addedKesaksian = kesaksianTables.length === 0
  if (addedKesaksian) {
    await db.$executeRawUnsafe(`
      CREATE TABLE kesaksian (
        id_kesaksian INT NOT NULL AUTO_INCREMENT,
        id_peserta TEXT NOT NULL,
        isi TEXT NOT NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_kesaksian),
        KEY idx_kesaksian_peserta (id_peserta(64))
      )
    `)
  }

  // Alur dana: snapshot korwil PPHTGD + token link tanpa login per peran (Korwil → PIC LevelUP → Keuangan).
  const reimburseApprovalTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reimburse_approval'
  `
  const addedReimburseApproval = reimburseApprovalTables.length === 0
  if (addedReimburseApproval) {
    await db.$executeRawUnsafe(`
      CREATE TABLE reimburse_approval (
        id_reimburse INT NOT NULL,
        korwil_id INT NOT NULL,
        korwil_nama VARCHAR(255) NOT NULL,
        korwil_koordinator VARCHAR(255) NOT NULL DEFAULT '',
        korwil_wa VARCHAR(20) NULL,
        token_korwil VARCHAR(64) NOT NULL,
        token_pic VARCHAR(64) NOT NULL,
        token_keuangan VARCHAR(64) NOT NULL,
        korwil_at DATETIME(0) NULL,
        pic_at DATETIME(0) NULL,
        cair_at DATETIME(0) NULL,
        notif_pic_at DATETIME(0) NULL,
        notif_keuangan_at DATETIME(0) NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_reimburse),
        UNIQUE KEY uq_reimburse_approval_korwil (token_korwil),
        UNIQUE KEY uq_reimburse_approval_pic (token_pic),
        UNIQUE KEY uq_reimburse_approval_keuangan (token_keuangan)
      )
    `)
  }

  // Rekening tersimpan per LevelUP Kota: cache No Rekening / Nama Bank / Atas Nama untuk form dana.
  const rekeningKotaTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rekening_kota'
  `
  const addedRekeningKota = rekeningKotaTables.length === 0
  if (addedRekeningKota) {
    await db.$executeRawUnsafe(`
      CREATE TABLE rekening_kota (
        id_rekening INT NOT NULL AUTO_INCREMENT,
        id_cabang VARCHAR(16) NOT NULL,
        norek VARCHAR(64) NOT NULL,
        namabank VARCHAR(100) NOT NULL DEFAULT '',
        namarek VARCHAR(255) NOT NULL DEFAULT '',
        used_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_rekening),
        UNIQUE KEY uq_rekening_kota (id_cabang, norek)
      )
    `)
  }

  // Kas Kota: transaksi event menyimpan id_event (dulu hanya nama event di keterangan; nama event bisa kembar).
  const kasTxnIdEventCols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'kas_kota_txn'
      AND COLUMN_NAME = 'id_event'
  `
  const addedKasTxnIdEvent = kasTxnIdEventCols.length === 0
  if (addedKasTxnIdEvent) {
    await db.$executeRawUnsafe(`ALTER TABLE kas_kota_txn ADD COLUMN id_event INT NULL`)
    await db.$executeRawUnsafe(`ALTER TABLE kas_kota_txn ADD KEY idx_kas_kota_txn_event (id_event)`)
  }

  // Akses fitur beta per anggota (WeWorship prototype). Diisi developer langsung di DB, tanpa UI.
  const betaAksesTables = await db.$queryRaw<{ TABLE_NAME: string }[]>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'beta_akses'
  `
  const addedBetaAkses = betaAksesTables.length === 0
  if (addedBetaAkses) {
    await db.$executeRawUnsafe(`
      CREATE TABLE beta_akses (
        id_peserta INT NOT NULL,
        fitur VARCHAR(32) NOT NULL,
        created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_peserta, fitur),
        KEY idx_beta_akses_fitur (fitur)
      )
    `)
  }

  // Pengajuan dana: review Sekretariat Nasional + BRIM Nasional sebelum Korwil. Pengajuan yang sudah diajukan
  // sebelum langkah ini ada dianggap lolos review (link Korwil sudah dikirim), jadi backfill '1' hanya sekali,
  // saat kolom baru dibuat; pengajuan ulang berikutnya mulai lagi dari '' (submitReimburse).
  async function ensureColumn(table: string, name: string, ddl: string): Promise<boolean> {
    const cols = await db.$queryRaw<{ COLUMN_NAME: string }[]>`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${name}
    `
    if (cols.length > 0) return false
    await db.$executeRawUnsafe(ddl)
    return true
  }
  const addedReimburseSekre = await ensureColumn('reimburse', 'approvesekre',
    `ALTER TABLE reimburse ADD COLUMN approvesekre VARCHAR(1) NOT NULL DEFAULT '', ADD COLUMN notesekre VARCHAR(1000) NOT NULL DEFAULT ''`)
  const addedReimburseBrim = await ensureColumn('reimburse', 'approvebrim',
    `ALTER TABLE reimburse ADD COLUMN approvebrim VARCHAR(1) NOT NULL DEFAULT '', ADD COLUMN notebrim VARCHAR(1000) NOT NULL DEFAULT ''`)
  const reimburseReviewBackfill = addedReimburseSekre || addedReimburseBrim
    ? await db.$executeRaw(Prisma.sql`UPDATE reimburse SET approvesekre = '1', approvebrim = '1' WHERE ajukan IN ('Ajukan', '1')`)
    : 0
  const addedApprovalSekreAt = await ensureColumn('reimburse_approval', 'sekre_at',
    `ALTER TABLE reimburse_approval ADD COLUMN sekre_at DATETIME(0) NULL, ADD COLUMN brim_at DATETIME(0) NULL`)

  async function ensureTable(name: string, ddl: string): Promise<boolean> {
    const rows = await db.$queryRaw<{ TABLE_NAME: string }[]>`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${name}
    `
    if (rows.length > 0) return false
    await db.$executeRawUnsafe(ddl)
    return true
  }

  const addedArtikel = await ensureTable('artikel', `
    CREATE TABLE artikel (
      id_artikel INT NOT NULL AUTO_INCREMENT,
      slug VARCHAR(160) NOT NULL,
      judul VARCHAR(200) NOT NULL,
      ringkasan VARCHAR(300) NOT NULL DEFAULT '',
      cover_url VARCHAR(500) NOT NULL DEFAULT '',
      isi LONGTEXT NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'draft',
      published_at DATETIME(0) NULL,
      id_pengurus INT NOT NULL,
      created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id_artikel),
      UNIQUE KEY uq_artikel_slug (slug),
      KEY idx_artikel_status_pub (status, published_at)
    )
  `)
  const addedArtikelView = await ensureTable('artikel_view', `
    CREATE TABLE artikel_view (
      id_artikel INT NOT NULL,
      tanggal DATE NOT NULL,
      views INT NOT NULL DEFAULT 0,
      PRIMARY KEY (id_artikel, tanggal)
    )
  `)
  const addedArtikelLike = await ensureTable('artikel_like', `
    CREATE TABLE artikel_like (
      id_artikel INT NOT NULL,
      visitor VARCHAR(36) NOT NULL,
      created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_artikel, visitor)
    )
  `)
  const addedArtikelKomentar = await ensureTable('artikel_komentar', `
    CREATE TABLE artikel_komentar (
      id_komentar INT NOT NULL AUTO_INCREMENT,
      id_artikel INT NOT NULL,
      nama VARCHAR(60) NOT NULL,
      isi TEXT NOT NULL,
      visitor VARCHAR(36) NOT NULL,
      ip_hash VARCHAR(16) NOT NULL,
      hidden TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_komentar),
      KEY idx_artikel_komentar (id_artikel, created_at)
    )
  `)

  const brim = await db.pengurus.updateMany({
    where: { username: 'brimnasional@gmail.com' },
    data: { divisi: 'brim' },
  })
  const row = await db.pengurus.findFirst({
    where: { username: 'brimnasional@gmail.com' },
    select: { id_pengurus: true, username: true, divisi: true },
  })

  return NextResponse.json({
    ok: true,
    addedColumn,
    backfill,
    addedImageUrl,
    imageBackfill,
    addedFlyerQa,
    flyerQaBackfill,
    addedBeritaAcaraQa,
    beritaAcaraQaBackfill,
    addedWfeSerentak,
    addedEventSesi,
    addedAbsenIdSesi,
    addedEventLokasi,
    addedSesiIdLokasi,
    addedWwtypeNasional,
    wwtypeBackfill,
    addedAppLog,
    addedEventCreatedAt,
    addedDokumentasiCreatedAt,
    addedReimburseLaporanAt,
    addedPesertaCreatedAt,
    addedPesertaUpdatedAt,
    setPesertaUpdatedAtOnUpdate,
    addedPindahKota,
    addedFeedbackApp,
    addedKesaksian,
    addedReimburseApproval,
    addedRekeningKota,
    addedKasTxnIdEvent,
    addedBetaAkses,
    addedArtikel,
    addedArtikelView,
    addedArtikelLike,
    addedArtikelKomentar,
    addedReimburseSekre,
    addedReimburseBrim,
    reimburseReviewBackfill,
    addedApprovalSekreAt,
    brimUpdated: brim.count,
    brim: row,
  })
}
