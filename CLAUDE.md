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
  dashboard/page.tsx                  # Dashboard user: join volunteer/squad
  dashboard/kota/alk/page.tsx         # Beranda ALK (saldo + approval member)
  dashboard/kota/alk/approval/page.tsx # List approval squad dari table upgrade
  dashboard/kota/alk/event/[id]/approve/ # Sekretariat: approve/reject event
  dashboard/kota/brim/event/[id]/approve/ # Brim Nasional: approvebrimnas
lib/actions/upgrade.ts                # joinVolunteer, joinSquad, approveSquad
lib/event-approval.ts                 # append notenasional (ALK/Brim prefixes)
lib/telegram.ts                       # notifyTelegram → group (nasional ops)
task.md                               # Blocked: approval sampai core
```

## Recent Updates [2026-08-22]
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
