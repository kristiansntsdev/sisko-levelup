# Backlog

## Notifikasi (lanjutan Web Push)

- [ ] **Push pengajuan dana per step ke pengurus kota (ALK Kota)**
  - Urutan: Diajukan → Review Sekretariat / BRIM Nasional (setuju atau tolak) → Siap kirim ke Korwil → Korwil setuju/tolak → PIC LevelUP setuju/tolak → Cair.
  - Sekarang hanya Sekretariat + BRIM Nasional yang dapat push untuk dana (padanan Telegram, lewat `danaTelegram` di `lib/dana-flow.ts`).
  - Cara: di `danaTelegram`, tambah `idCabang: event.id_cabang` + `kotaJuga: true` ke `pushAlert`, dan beri `url` untuk peran `alk-kota` (`/dashboard/v2/kota/alk/reimburse/{idEvent}`). Cek isi pesan per step supaya ALK Kota tahu aksinya (mis. "Kirim link ke Korwil").
- [ ] **Push Air Hidup + Kabar Terbaru** (setelah Air Hidup naik ke produksi; sekarang hanya `/demo-preview`, belum ada tabel `ww_laporan`)
  - Level 0–3: laporan WW / Kabar Terbaru dari semua kota.
  - PIC (4): air kotanya hampir menipis (sekali per tahap Haus / Kering) + kabar kota lain.
  - LevelUP Pusat (5): ringkasan kota yang mau kering + update laporan.
  - Cara: job baru di `lib/push/jobs.ts` (`JOBS`) untuk air menipis, dan push langsung dari action Lapor WW untuk kabar terbaru.
- [ ] Push ke anggota saat tiket nasional disetujui / ditolak, pindah kota di-approve, dan approval Squad (belum diminta).
- [ ] Preferensi notifikasi per jenis (sekarang aktif / nonaktif per HP).
