@AGENTS.md
@~/.claude/CLAUDE.md

# sisko-v2 — CLAUDE.md

> Claude reads this file on every message. Keep it lean — every line costs tokens.
> Global rules (architecture, conventions, file map protocol) live in root CLAUDE.md.

## Project Overview

- **Purpose**: TODO — one sentence on what this project does
- **Stack**: TypeScript, Next.js (App Router), Tailwind CSS, Geist fonts
- **Entry points**: `npm run dev` → `next dev`; root page at `app/page.tsx`
- **Data layer**: Unknown — fill in manually

## Architecture Rules

> Project-specific rules. Global rules in root CLAUDE.md.

1. **App Router only** — use Server Components by default; add `'use client'` only where interactivity is required
2. **Read AGENTS.md** before writing any Next.js code — this version may have breaking API changes vs training data

## Conventions

> Project-specific conventions. Global conventions in root CLAUDE.md.

- Fonts loaded via `next/font/google`, variables set as CSS custom properties in layout
- Tailwind utility classes only — no custom CSS files beyond `globals.css`

## Directory Map

```
app/
  page.tsx                            # Landing overview LevelUP (gerakan) + cuplikan event → /login + /daftar
  about/page.tsx                      # Tentang LevelUP (dari PROFILE_LUP.pdf): cerita, Visi, Misi, Values; foto public/about/
  program/page.tsx                    # Program: Penyembahan + Pemuridan (ayat, tujuan) + galeri dokumentasi masonry (stub; nanti dari dashboard BRIM)
components/landing/zine.tsx           # Design system landing (kertas lecek, torn, Strip, Tape, doodle, ZineHeader/Footer) dipakai / + /about
  login/page.tsx                      # PWA login: email+password (peserta lalu pengurus) + Google
  daftar/page.tsx                     # Pendaftaran v2 Gen Z (intro → form live MemberCard → kartu jadi); Google baru → completeRegistration
  daftar/layout.tsx                   # Permanent Marker (--font-marker) khusus /daftar
  dashboard/layout.tsx                # MemberShell bottom nav (skip /dashboard/kota + /dashboard/v2/kota)
  dashboard/page.tsx                  # Beranda PWA: MemberCard, level, tiket, ModeSwitch
  dashboard/kartu/                    # Detail Kartu Anggota
  dashboard/tiket/                    # My Tickets (TicketRow) + [id] QR detail proto
  dashboard/riwayat/                  # Milestone stub dari registrasi
  dashboard/kesaksian/                # Kesaksian UI stub
  dashboard/profil/                   # Profil + masuk pengurus sheet
  dashboard/profil/edit/              # Perubahan Data v2; ajukan pindah LevelUP Kota (nasional approve)
lib/actions/wilayah.ts                # listProvinsi/Kabupaten/Kecamatan/Desa (BPS codes)
lib/actions/pindah-kota.ts            # ajukan/batal/list/approve/reject pindah LevelUP Kota (nasional only)
  dashboard/v2/kota/alk/pindah-kota/  # Nasional: antrian Approve/Tolak pindah kota
  dashboard/v2/kota/alk/tiket-nasional/ # Nasional: antrian Approve/Tolak tiket event nasional (wwtype)
lib/registrasi-status.ts              # nasional Get Ticket → pending; absen only after confirmed
  events/page.tsx                     # List event anggota (proto EventsScreen)
  join/[eventId]/                    # View Event + Get Ticket (Offline; Online → /absen; nasional → approve dulu)
  dashboard/kota/alk/page.tsx         # Beranda ALK legacy (Kas/Surat shell) — fallback
  dashboard/v2/kota/alk/              # Sekretariat PWA v2 (proto k-*): beranda, anggota, approval, event, scan, lainnya
lib/alk-auth.ts                       # requireAlkPengurus for v2 kota ALK
lib/actions/pengurus-kota.ts          # list/create/update pengurus per kota (Anggota tab)
lib/actions/pwa-auth.ts               # loginEmailPassword, completeRegistration, dual session
lib/pengurus-session.ts               # pengurus cookie helpers; alk dest → /dashboard/v2/kota/alk
lib/pwa-member.ts                     # tier labels + MemberCardData
components/alk-v2/                    # Sekretariat v2 shell + screens (PWA look, real data); event-approve = Approval Event; event-detail = Detail Event
  dashboard/v2/kota/alk/event/[id]/   # Detail Event v2 (EventDetailV2Client, proto KEventScreen)
  dashboard/v2/kota/alk/event/[id]/approve/ # Nasional: approve/reject event (v2 UI)
components/pwa/                       # LevelUP PWA UI kit + MemberShell (PlainBar/Panel/Qr)
  dashboard/kota/alk/approval/page.tsx # List approval squad dari table upgrade
  dashboard/kota/alk/event/[id]/approve/ # Sekretariat: approve/reject event
  dashboard/kota/alk/event/[id]/dana/   # ALK Kota: form pengajuan support dana (per event)
  dashboard/kota/brim/event/[id]/approve/ # Brim Nasional: approvebrimnas
  dashboard/kota/brim/wfe-flyer/       # Brim Nasional: flyer pusat WW JFE / WFE serentak
  absen/[eventId]/                    # Event Online: scan QR -> login+registrasi+absen otomatis
lib/actions/upgrade.ts                # joinVolunteer, joinSquad, approveSquad
lib/actions/wfe-serentak.ts           # kampanye flyer pusat JFE (range bulan)
lib/event-sesi.ts                     # multi-sesi absen: wajib, hadirPenuh, dup key
lib/event-approval.ts                 # append notenasional (ALK/Brim prefixes)
lib/event-poster.ts                    # resolveEventPosterUrl: posterevent then image_url
lib/event-link.ts                     # eventEntryPath: Online -> /absen/{id}, Offline -> /join/{id}
lib/event-absen-window.ts             # jendela absen online, hitung WIB eksplisit (bukan TZ proses)
lib/wib.ts                            # wibToday/wibStartOfMonth: batas hari+bulan WIB utk kolom @db.Date
instrumentation.ts                    # pin TZ=Asia/Jakarta saat boot (jaring pengaman, bukan penyangga)
lib/actions/absen-online.ts           # onlineCheckin: registrasi + absen satu aksi (idempoten)
lib/flyer-qa.ts                       # Cursor webhook QA flyer WW bulanan + JFE/WFE; parse + poll
lib/berita-acara-qa.ts                # Cursor webhook QA berita acara (link surat); parse + poll
lib/telegram.ts                       # notifyTelegram → group (nasional ops)
lib/actions/reimburse.ts              # submitReimburse (ALK Kota) + approve/rejectReimburseNasional (tabel reimburse)
lib/monitoring-sheet.ts               # Form Monitoring Teknis: status H-14 / H+14 / kelengkapan per event kota
app/api/internal/monitoring-sheet/    # GET ?year= (Bearer MONITORING_SHEET_SECRET) → dibaca Apps Script
scripts/monitoring-sheet.gs           # Apps Script: paste ke spreadsheet, sync tab per tahun tiap 5 menit
task.md                               # Blocked: approval sampai core
```

## Recent Updates [2026-10-30]
- `/daftar`: Nomor WA + LevelUP Kota opsional (label `(opsional)`); Tamu bisa skip — `completeRegistration` tidak wajibkan keduanya
- `/login`: tombol Masuk dengan Google dipindah ke atas email/password (di dalam kartu) supaya terlihat tanpa scroll

## Recent Updates [2026-10-28]
- Detail Event list registrasi + presensi: 3 baris (nama[+kota] / gereja / email[+sesi]); `AbsenRow` + query peserta include gereja (v2 + legacy)
- Event nasional (`wwtype=nasional`): Get Ticket → `registrasi.status=pending` sampai Sekretariat Nasional Approve → `confirmed` (Tolak → `cancelled`, bisa ajukan ulang). CTA Ajukan Tiket / Menunggu Approval; antrian `/dashboard/v2/kota/alk/tiket-nasional` + todo beranda nasional; scan/absen ditolak kalau belum approved; Online nasional tidak auto-redirect `/absen` (pakai join dulu)

## Recent Updates [2026-10-27]
- Sekretariat v2 Detail Event: `/dashboard/v2/kota/alk/event/[id]` pakai `EventDetailV2Client` (Hero+TopBar+DateBlock glass, Stepper status, Ajukan/Scanner CTA, poster, QA, ListCard detail/registrasi/presensi) align `KEventScreen`; legacy `EventDetailPage` tetap di `/dashboard/kota/alk/event/[id]`
- Sekretariat Scan: tombol **Fullscreen Scan** → overlay kiri kamera penuh / kanan list absen live (poll 4s); QR auto-absen (tanpa konfirmasi); popup hijau/merah 1 detik lalu scan lanjut; Esc/✕ tutup
- `/program` (layout dulu): 2 program dari PDF Fokus Kegiatan — 01 Penyembahan (Membangun tahta bagi Kristus, Mzm 22:4) + 02 Pemuridan (Murid yang memuridkan, Mat 28:19-20), kartu ayat + kartu Tujuan, galeri `Dokumentasi` masonry (`columns-*`, `<img>` tinggi alami, polaroid + caption) + empty state. `PROGRAMS[].docs` = foto contoh (`public/program/`, `public/about/`); nanti diganti upload dashboard BRIM Nasional (`{ src, caption }`), di luar scope
- `ZineHeader`: Tentang + Program + Masuk; di mobile Tentang/Program turun ke baris kedua (logo tidak boleh menyusut). `Snap`/`Heading`/`HL` pindah ke `components/landing/zine.tsx`
- Profil edit: **Ajukan perubahan LevelUP Kota** → tabel `pindah_kota`; kota tetap sampai `sekretariatnasional` Approve; Tolak + alasan; antrian `/dashboard/v2/kota/alk/pindah-kota` + todo beranda nasional; `prod-migrate` CREATE TABLE idempotent
- `/about` (Tentang LevelUP) dari Community Profile PDF: hero "From God's Presence to God's Mission" + teks Tentang, cerita 2019 / 2025 DeeperWP / 44 kota, lalu 3 inti: Visi (versi revisi halaman 6 PDF, highlight kuning + ring Amanat Agung), 4 Misi (sticky note), 5 Values (polaroid + foto per value), CTA "Be part of us". Foto diekstrak ke `public/about/`
- Primitive landing (paper/torn/Strip/Tape/doodle/CtaButtons) dipindah ke `components/landing/zine.tsx` + `ZinePage`/`ZineHeader`/`ZineFooter`; header kedua halaman punya link Tentang + Masuk. Halaman zine baru wajib pakai modul ini, jangan salin ulang
- Catatan: visi di landing `/` (levelupgen.com, Pentakosta 2033) beda dengan visi PDF di `/about`
- Tiket detail `/dashboard/tiket/[id]`: poster full width tinggi alami (`h-auto`), bukan crop `aspect-[16/9]` + `object-cover` (sama pola View Event `/join`)
- Profil Perubahan Data → page `/dashboard/profil/edit` (v2 Hero+SectionCard): identitas, wilayah cascade BPS, komunitas, pendidikan; email + LevelUP Kota locked; `lib/actions/wilayah.ts`; `updatePesertaProfile` field penuh (kota optional)
- `/daftar` (Gabung LevelUP) redesign v2 + Gen Z: Hero merah + progress 3 langkah (kuning), headline Permanent Marker + sticker kuning (`#ffd83d`, senada landing), MemberCard miring sebagai teaser / live preview (nama, gereja, kota ke-update saat ngetik; foto Google), form `SectionCard` Tentang kamu / Komunitasmu, LevelUP Kota = sheet searchable (bukan `<select>`), jalur level Tamu→Volunteer→Squad→Core; sukses = kartu `LUP-{id}` + Next up (tiket / Join Volunteer). Logika submit tidak berubah. Nama cabang sudah berawalan "LevelUP" — jangan prefix lagi
- Tier labels: userlevel 4 = PIC, 5 = LevelUP Pusat (bukan Leader/Tim Nasional); MemberCard Tamu / PIC / LevelUP Pusat tanpa suffix `/ MEMBER`
- Sekretariat v2 Buat/Edit Event: `EventForm variant="v2"` (Hero+TopBar, SectionCard Info/Waktu/Sesi/Lokasi/Lainnya, FLD, chip target, BTN_RED) align `KEventNewScreen`; legacy kota path tetap
- Event form Maps: fix kotak abu pertama buka — `ensureGoogleMaps` promise shared + poll `importLibrary` (race `loading=async` / stale onload remount); bukan deprecation Marker/Autocomplete
- Sekretariat v2 Approval Event: `/dashboard/v2/kota/alk/event/[id]/approve` pakai `EventApproveV2Client` (PlainBar + CARD + Pill + Approve/Reject saja, gaya proto); Perlu Tindakan nasional → langsung ke halaman ini
- PWA iOS Add to Home Screen: Hero + PlainBar sisakan `env(safe-area-inset-top)` supaya nama/judul tidak ketutup status bar (`black-translucent` + `viewport-fit: cover`)
- Sekretariat v2: Perlu Tindakan + Pengajuan Event punya search + pagination; Scan pakai desain proto (pilih event/sesi, kamera gold frame, Nyalakan Kamera) bukan ScannerClient lama
- Sekretariat PWA v2 di `/dashboard/v2/kota/alk` (desain proto `k-*`): AlkShell nav Beranda/Anggota/Scan/Event/Lainnya; real data; Anggota = CRUD pengurus; `pengurusDest(alk)` → v2; legacy `/dashboard/kota/alk` tetap (Kas/Surat)
- Tiket: progress daftar di kartu Registration (`n dari targetjumlah`). Penuh (`n >= target`, target > 0) → tombol Registration Full; `createRegistrasi` menolak tiket baru (join, daftar, absen online). Strip event `FULL`. Yang sudah punya tiket tetap bisa lihat tiket
- View Event `/join/[id]`: poster full width tinggi alami (bukan crop 16:10); role target 0 Tamu · 1 Volunteer · 2 Squad · 3 Core · 4 PIC · 5 LevelUP Pusat, pengurus 1 Admin LK · 2 BRIM
- `/` = landing LevelUP gaya kolase/zine Gen Z: kertas lecek (SVG feTurbulence), pinggir sobek (`torn()` clip-path polygon), font Permanent Marker (dimuat di `app/page.tsx` saja), label strip hitam/kuning, poster event asli ditempel selotip, doodle crown/heart/smiley; copy dari levelupgen.com (visi 2033, WFE, ministries) + scroller event; Get Ticket → `/login?callbackUrl=/join/{id}`. Logo putih wajib di atas chip merah (tak terbaca di latar terang)

## Recent Updates [2026-10-26]
- PWA Events/Tickets/View Event align prototype: `/events` search + kota sheet + venue chips + EventCard strip OPEN; `/dashboard/tiket` TicketRow perforated QR + tab gelap; ticket detail poster + gold QR frame; `/join/[id]` JPCC panels + Get Ticket sheet (bukan full-bleed poster lama)
- Member PWA dari prototype (admin `/admin` + `/dashboard/kota/*` tetap): login email+password cek peserta lalu pengurus; Google tanpa auto-create peserta → `needsRegistration` → `/daftar` `completeRegistration`; dual session ModeSwitch; shell bottom nav; MemberCard/beranda/tiket/profil; stub riwayat/kesaksian/daily words
- Prototype MemberCard (Detail Kartu Anggota): tanpa QR + tanggal; Status Anggota tetap Aktif; label tier userlevel 0 Tamu · 1 Volunteer · 2 Squad · 3 Core · 4 PIC (`Leader` → PIC)

## Recent Updates [2026-10-24]
- Prototype Sekretariat tab Anggota = daftar `pengurus` saja (Admin LK/BRIM); tanpa status aktif — set email + password; Tambah hanya pengurus (bukan peserta). Peserta lewat PWA daftar → Volunteer → Squad → Approval Member
- `/prototype`: prototype UI klik-able (publik, tanpa auth, data dummy di `components/prototype/data.ts`) dari desain `public/LEVELUP PWA - ALL.pdf` + `LEVELUP Alk – ALL.pdf`, struktur meniru PWA anggota PPHTGD. Mode PWA Anggota + Sekretariat; `?s=<screen>` buka layar langsung (id di `components/prototype/screens.ts`). Logo transparan `public/prototype/levelup-logo.png` diekstrak dari PDF
- Prototype: Events/View Event meniru MyJPCC (status OPEN/FULL/CLOSED, eligibility dari Target Peserta/Pengurus) → Get Ticket → tiket QR payload `{p,e,ev}` (sama `lib/qr.ts`); Sekretariat absen per event + sesi (wajib/opsional, hadir lengkap) & form Buat Event mengikuti `components/kota/event-form.tsx`. Aturan di `components/prototype/logic.ts` memakai `hadirPenuh`/`sesiWajibIds` + `onlineAbsenPhase` asli; jam prototype tetap Jumat 23 Okt 2026 19:25 WIB. Filter Events per LevelUP Kota (`cabang`, default kota anggota; event nasional `id_cabang '0'` selalu tampil); Sekretariat hanya melihat event kotanya + nasional. Login prototype: pengurus email+password → Sekretariat, anggota pilih akun Google; akun Google baru → Pendaftaran (`?s=daftar`, field = `app/daftar`) → Tamu → Join Volunteer → Join Squad (pilih kota, bisa dipindah) → Approval Member Sekretariat (`?s=k-approval`); Core belum dibuka seperti sisko. 1 HP = 1 sesi peserta (Google) + 1 sesi pengurus (email+password): tidak ada konsep suami-istri sama sekali (LevelUP = anak muda; relasi pasangan, ganti akun, dan copy "suami-istri" dari PPHTGD dibuang); toggle Kartu Saya/Akun Sekretariat hanya saat sesi pengurus aktif, keluar per sesi

## Recent Updates [2026-10-22]
- Daftar (`/daftar` + form data diri `/absen/[eventId]`): dropdown LevelUP Kota (`getCabangs`) → `peserta.kotalevelup`, wajib. Peserta baru (No. WA kosong) mulai kosong — `auth.ts` tetap isi `'2'` sebagai placeholder, jangan dipakai sebagai default form
- Atom baru `components/ui/select.tsx` (`Select`, gaya sama dengan `Input`)
- Join squad (dashboard): tombol buka sheet pilih LevelUP kota → `joinSquad(kotalevelup)` set `peserta.kotalevelup` + insert `upgrade`. Saat pending tombol tetap bisa diklik → pindah pengajuan ke kota lain (approval ALK ikut `peserta.kotalevelup`)

## Recent Updates [2026-10-18]
- Form Monitoring Teknis live di Google Sheets: Apps Script tarik `/api/internal/monitoring-sheet` tiap 5 menit, satu tab per tahun, section per bulan. Semua event kota (`id_cabang` ≠ 0)
- Centang Berita Acara/Flyer + Keterangan = manual reviewer, dipertahankan per `id_event` (kolom P tersembunyi); kolom lain otomatis
- Kolom baru (NULL untuk baris lama = "tidak tercatat" → centang manual dipertahankan): `event.created_at`, `dokumentasi_kota.created_at` (default CURRENT_TIMESTAMP), `reimburse.laporan_at` (diisi `submitReimburse` saat LPJ pertama kali ada). LPJ = `reimburse.laporan`

## Recent Updates [2026-10-09]
- Form event: flyer > 4 MB ditolak di client (dulu Vercel 413 sebelum server action jalan → "Failed to fetch")

## Recent Updates [2026-09-28]
- Pengajuan Support Dana: ALK Kota isi form per event (`/dashboard/kota/alk/event/[id]/dana`) → Sekretariat Nasional approve/reject di halaman approve event yang sudah ada (section baru, terpisah dari approval flyer/QA)
- Pakai tabel `reimburse` yang sudah ada di schema (sebelumnya cuma dibaca raw SQL untuk stat Beranda ALK, belum pernah ditulis) — kolom `approvepphtgd`/`approvekeuangan`/dst masih kosong, di luar scope (tahap lanjutan)
- Form terkunci (read-only) untuk ALK Kota begitu `reimburse.approvenasional='1'`; reject bisa diajukan ulang

## Recent Updates [2026-09-25]
- Fix TZ jendela absen: `eventDateTime`/`getOnlineAbsenWindow` hitung WIB eksplisit (`Date.UTC` - `WIB_OFFSET_MS`), bukan `setHours` waktu lokal. Di server UTC dulu jam selesai 20:00 WIB dibaca jadi 20:00 UTC = absen baru buka 02:45 WIB besoknya
- `lib/wib.ts`: `wibToday`/`wibStartOfMonth`/`wibStartOfNextMonth` — batas hari+bulan WIB sebagai UTC midnight, sebanding dengan kolom `@db.Date`. Dipakai auto-absence + "Tiket Aktif bulan ini" (`getRegistrasiByPeserta`) dan event terdekat di dashboard. Di server UTC, cara lama bikin jam 00:00-07:00 WIB dihitung hari/bulan kemarin
- `instrumentation.ts` pin `TZ=Asia/Jakarta` saat boot — sekarang jaring pengaman saja (semua hitungan tanggal sudah eksplisit WIB). Di Vercel bisa juga set env `TZ`
- Absen online seamless: QR event Online -> `/absen/[eventId]`; auto login Google (`/login?auto=1`), registrasi + absen satu aksi `onlineCheckin`; data diri via form inline (bukan redirect `/daftar`); multi-sesi -> picker sesi tersisa; di luar jendela -> countdown auto-absen
- `eventEntryPath` dipakai QRSheet ALK, `linkevent` (create + update), `eventJoinLink`; `/join/[id]` redirect ke `/absen/[id]` untuk event Online (QR lama tetap jalan)

## Recent Updates [2026-09-06]
- Fix tanggal event off-by-one WIB→UTC: `parseLocalDate`/`isoDate` pakai UTC midnight; form `tglRaw` tidak lagi `toISOString().slice(0,10)`; display Telegram/flyer `timeZone: 'UTC'`

## Recent Updates [2026-09-06]
- Event Online: tidak tampil peta (form, detail ALK/VOL, tombol Telegram Maps); pin + radius tidak wajib di QA

## Recent Updates [2026-09-03]
- Absensi multi-sesi Sekretariat: tabel `event_sesi` + `absen.id_sesi`; form nasional CRUD sesi (toggle wajib); scanner pilih sesi manual; detail event count per sesi + hadir lengkap; kota tetap 1 absen/event
- Tipe event `nasional` (wwtype): opsi hanya di form Sekretariat; skip semua QA AI (flyer + berita acara)

## Recent Updates [2026-09-02]
- Flyer pusat WW JFE/WFE: Brim Nasional upload template + range bulan; event `jfe` di range di-QA vs template (satu webhook flyer); parser checklist align prompt produksi
- QA Berita Acara: event dengan `suratpemberitahuan` → Cursor review (helper, bukan gate); kolom `berita_acara_qa`; satu Ajukan di detail + snapshot di approve ALK/Brim
- Telegram Diajukan: `QA flyer` + `QA berita acara`; banner Butuh Revisi jika salah satu REVISI; Dibuat/Diedit ditahan jika ada review

## Recent Updates [2026-08-22]
- WW bulanan + flyer: Ajukan ke Telegram; halaman approve ALK/Brim tampilkan snapshot QA dari DB (tanpa poll)
- Event flyer v2: kolom `image_url` (Vercel Blob); display `posterevent` dulu, kosong baru Blob; upload flyer di form buat/edit
- Blob upload pakai `BLOB_READ_WRITE_TOKEN` eksplisit (OIDC development tidak terhubung ke store)
- Telegram approve/reject: `Tanggal Event` 1 hari vs rentang `(beberapa hari)`; kota `[Event Kota]` + Cabang
- Telegram approve/reject: event kota → `[Event Kota]` + Cabang (namacabang); nasional tetap Tipe seluruh_kota/khusus
- Sekretariat + Brim Nasional tab Event: list semua event (tanpa filter `id_cabang`); kota tetap per cabang
- Tab Event (ALK + Brim) search nama/alamat/tanggal/ID; saat cari tampil semua match tanpa pagination
- Prod migrate via Vercel `/api/internal/prod-migrate`: `event.approvebrimnas` + `brimnasional` `divisi=brim`
- Brim Nasional (`brimnasional@gmail.com`) tab Event seperti Sekretariat; approve di `/dashboard/kota/brim/event/[id]/approve`
- `brimnasional@gmail.com` `divisi` → `brim` (prod); admin login route alk/brim/vol ke dashboard masing-masing

## Recent Updates [2026-08-21]
- Sekretariat event tab: filter Belum Approve / Ditolak (`approvenasional`≠1 + kosong/`notenasional`); ditolak tampil alasan + tombol ke approve page
- Sekretariat event approve: tombol approve di list → `/event/[id]/approve`; Approve set `approvenasional=1`; Reject append `ALK Nasional : …` ke `notenasional`; keduanya `notifyTelegram`
- Telegram: create event (kota + nasional) notif `[Event Kota|Nasional]`; buttons 🔗 Link Event · 🖼 Flyer (jika ada) · ✅ Approval; absen/registrasi → Detail Event
- Tiket Aktif: semua join bulan ini (`confirmed` + `absence`), termasuk tanggal yang sudah lewat; absen online tetap bisa sampai akhir bulan event
- Tiket online: halaman `/dashboard/tiket/[id]` — brand "event online", QR, tombol Absen Event (dibuka 15 menit sebelum `jamselesaievent`, berlaku sampai akhir bulan)
- Sekretariat nasional event tab: filter Semua / Seluruh Kota / Khusus / Belum Approve / Ditolak; form buat/edit pilih tipe → `id_cabang=0` + `khusus`
- Event create: `sekretariatnasional@gmail.com` → `id_cabang` / cabang efektif `0` (`resolveEventCabang`); pengurus 17 `kotalevelup` ""→`0`
- Admin login: `sekretariatnasional@gmail.com` (`pengurus` id 17) — `divisi` null → `alk` (password lama tetap); Hostinger MySQL remote timeout dari IP lokal

## Recent Updates [2026-08-20]
- WW dashboard: pengurus = userlevel ≥ 2 (Squad/Core/Leader/Nasional); peserta = < 2
- Event form Maps: `loading=async` on script URL (silences Google bootstrap warning)
- Admin `/admin` + `verify-member`: hanya pengurus ALK + password; email-as-username (adminlk*@gmail.com) via pengurus.username
- Event form: field `wwtype` (enum `bulanan` | `jfe`) di buat/edit event ALK; kolom ditambah manual di DB lalu `prisma db pull`
- Internal API: `POST /api/internal/ww-dashboard` — jumlah WW bulanan + grafik kehadiran pengurus vs peserta per cabang ALK

## Recent Updates [2026-08-18]
- Membership: join volunteer langsung (userlevel 1); join squad insert `upgrade`; admin ALK approve → userlevel 2 lalu hapus row
- Beranda ALK Kota: kartu ringkasan peserta (volunteer/core/squad), event offline/online, dan total dana usul/riil/event per cabang

## Recent Updates [2026-08-15]
- Event absensi: tampilkan userlevel (volunteer/squad/core/pic) di sebelah nama pada Presensi Scan QR

- Internal API: `POST /api/internal/verify-member` (Bearer `INTERNAL_API_SECRET`) — hanya pengurus `divisi=alk` (email / username pengurus / usercode ter-link)
## Recent Updates [2026-07-25]

- Fix createAbsen: transaction (absen then attend), try/catch, revalidatePath isolated; decodeQR allows empty email; Presensi query uses id_event_int OR id_event
- Event detail: pagination (10/page) for konfirmasi kehadiran + presensi; show total registrasi in detail + badge
- Scan ALK: `createAbsen` flips `absence`→`attend`; auto-absence only after event end date (not during event day)

## Recent Updates [2026-07-29]

- Kas Kota: dropdown event tampilkan tanggal event (contoh `10 November 2025`) dan pakai `id_event` supaya tidak ketuker untuk nama yang sama

## File Map

Global db: `~/.claude/file-map.db` — see root CLAUDE.md for full query reference.

Project ID for sisko-v2: `8`

```bash
# Search files
sqlite3 ~/.claude/file-map.db \
  "SELECT key, path, description, exports FROM files
   WHERE project_id = 8
   AND (description LIKE '%<keyword>%' OR path LIKE '%<keyword>%')"

# Log a change
sqlite3 ~/.claude/file-map.db \
  "INSERT INTO updates (project_id, file_key, datetime, changes)
   VALUES (8, '<key>', '<YYYY/MM/DD HH:mm>', '<what changed>')"
```
