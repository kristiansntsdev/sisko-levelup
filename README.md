# sisko-v2

Event registration and attendance management platform for LUP. Participants register for events, receive a QR ticket, and are checked in by staff via a built-in scanner.

---

## Architecture

```
sisko-v2/
├── app/
│   ├── layout.tsx              # Root layout — DM Sans font, metadata
│   ├── page.tsx                # Landing / login redirect
│   ├── dashboard/
│   │   ├── page.tsx            # Participant dashboard (active ticket, upcoming events)
│   │   └── tiket/[id]/         # QR ticket detail page
│   ├── join/[eventId]/         # Event join flow (flyer → register)
│   ├── daftar/                 # First-time profile completion
│   ├── alk/                    # Staff attendance dashboard
│   │   └── scanner/            # QR scanner (camera → preview → confirm absen)
│   └── api/auth/               # NextAuth route handler
├── components/ui/              # Atomic UI components (Button, Card, Input, …)
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── qr.ts                   # QR payload encode/decode (shared, no 'use server')
│   ├── actions/                # Server Actions
│   │   ├── registrasi.ts       # Registration CRUD
│   │   ├── peserta.ts          # Participant lookup/update
│   │   ├── event.ts            # Event queries
│   │   ├── absen.ts            # Attendance insert + preview
│   │   └── jobs-place.ts       # School/company upsert
│   └── generated/              # Prisma-generated types and client
├── prisma.config.ts            # Prisma config
└── .github/workflows/          # CI/CD — preview + production deploys
```

**Stack**

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Font | DM Sans |
| Auth | NextAuth v5 (Google OAuth, JWT) |
| ORM | Prisma 7 (MariaDB adapter) |
| Deployment | Vercel (via GitHub Actions) |

---

## Workflow

### Participant flow

```
/join/[eventId]
  └─ Not logged in → Google login → back to /join/[eventId]
  └─ Logged in, no profile → /daftar?eventId=X → fill nowa/gereja/sekolah → create registrasi → /dashboard
  └─ Logged in, has profile → create registrasi immediately → /dashboard
  └─ Already registered → show event flyer only

/dashboard
  └─ Active ticket card → /dashboard/tiket/[id]
  └─ /dashboard/tiket/[id] → QR code (scan at event for attendance)
```

### Attendance flow (ALK staff)

```
/alk
  └─ Enter event ID → find event → Mulai Scanner
  └─ Generate QR → QR image for /join/[eventId] (print/share)

/alk/scanner?eventId=X
  └─ Camera opens → scan participant QR
  └─ QR decoded → show participant preview (name, gereja)
  └─ Confirm → insert absen row → /alk/data-peserta
```

### Deployment flow

```
git push origin main          → GitHub Actions: Preview Deploy → Vercel preview URL
git tag release-1.0.0
git push origin release-1.0.0 → GitHub Actions: Production Deploy → Vercel production URL
```

Vercel's native GitHub auto-build is disabled (`exit 0` in Ignored Build Step). All deploys go through GitHub Actions using `vercel pull → vercel build → vercel deploy --prebuilt`.

---

## Design System

### Tokens (CSS custom properties via Tailwind)

| Token | Usage |
|---|---|
| `bg-bg` | Page background |
| `bg-surface` | Card / nav background |
| `text-fg` | Primary text |
| `text-muted` | Secondary / label text |
| `text-accent` | Brand accent (buttons, badges) |
| `bg-accent-light` | Accent tint background |
| `border-border` | Default border color |
| `rounded-card` | Card border radius |
| `rounded-input` | Input / pill border radius |
| `pb-safe` | Bottom safe area inset |

### Components (`components/ui/`)

| Component | Variants |
|---|---|
| `Button` | `primary` (default), `secondary`; props: `loading`, `fullWidth` |
| `Card` | `default`, `elevated` |
| `Input` | Single variant; props: `label`, `error` |
| `Badge` | `default`, `amber`, `green`, `red` |
| `Alert` | `error`, `success`, `info` |
| `Avatar` | Initials fallback |
| `Tabs` | Controlled |
| `Toggle` | Controlled switch |
| `Toaster` | Toast notification host |

All components are exported from `components/ui/index.ts`.

---

## Installation

**Prerequisites**: Node 20+, access to the LUP MariaDB database.

```bash
# 1. Clone
git clone <repo-url>
cd sisko-v2

# 2. Environment
cp .env.example .env
# Fill in:
#   DATABASE_URL=mysql://...
#   AUTH_SECRET=...
#   AUTH_URL=http://localhost:3000
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...

# 3. Install dependencies
npm install

# 4. Pull schema and generate Prisma client
npx prisma db pull
npx prisma generate

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Contribute

1. **Branch from `main`**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Develop and commit**
   - Keep commits focused; one logical change per commit.

3. **Open a PR to `main`**
   - Merging to `main` automatically triggers a **Preview Deploy** in Vercel.
   - Share the preview URL for review.

4. **Tag for production**
   ```bash
   git tag release-1.0.0
   git push origin release-1.0.0
   ```
   This triggers the **Production Deploy** workflow.

**Secrets required in GitHub → Settings → Secrets and variables → Actions:**

| Secret | Source |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |
| `AUTH_URL` | Production URL (e.g. `https://sisko.example.com`) |
| `AUTH_SECRET` | Random secret string |
| `DATABASE_URL` | Production DB connection string |
| `GOOGLE_CLIENT_ID` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
