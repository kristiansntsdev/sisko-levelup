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
  layout.tsx        # Root layout: fonts, metadata, body shell
  page.tsx          # Home page (replace with actual content)
next.config.ts      # Next.js config (empty scaffold — add options here)
```

## Recent Updates [2026-08-15]
- Event absensi: tampilkan userlevel (volunteer/squad/core/pic) di sebelah nama pada Presensi Scan QR

- Internal API: `POST /api/internal/verify-member` (Bearer `INTERNAL_API_SECRET`) looks up `auth_users`/`peserta` by email or usercode for winner-principle LevelUp login

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
