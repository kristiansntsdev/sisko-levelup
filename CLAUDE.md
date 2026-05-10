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
