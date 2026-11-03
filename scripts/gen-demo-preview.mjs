#!/usr/bin/env node
// Generates the /demo-preview copies of the REAL member + Sekretariat UI.
//
// The demo must look exactly like the real app, so instead of redrawing screens we copy the real client
// components and only rewire three things:
//   1. `@/lib/actions/*`, `next-auth/react`, `@/app/admin/actions` → localStorage shims (components/demo-preview/shim)
//   2. route strings (/dashboard, /events, /join, /login, /daftar, /absen) → /demo-preview/...
//   3. a handful of explicit, asserted patches for the flows the demo adds (volunteer approval, reimburse tile)
// Run:  node scripts/gen-demo-preview.mjs      (re-run after changing any source listed below)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SHIM_ACTIONS = ['absen', 'event', 'jobs-place', 'kas-kota', 'peserta', 'pengurus-kota', 'pindah-kota', 'pwa-auth', 'registrasi', 'reimburse', 'upgrade', 'wfe-serentak', 'wilayah']

/** [source, destination] */
const FILES = [
  // member app
  ['app/dashboard/layout.tsx', 'app/demo-preview/dashboard/layout.tsx'],
  ['app/dashboard/page.tsx', 'app/demo-preview/dashboard/page.tsx'],
  ['app/dashboard/kartu/page.tsx', 'app/demo-preview/dashboard/kartu/page.tsx'],
  ['app/dashboard/tiket/page.tsx', 'app/demo-preview/dashboard/tiket/page.tsx'],
  ['app/dashboard/tiket/[id]/ticket-detail-client.tsx', 'app/demo-preview/dashboard/tiket/[id]/ticket-detail-client.tsx'],
  ['app/dashboard/tiket/[id]/absen-event-button.tsx', 'app/demo-preview/dashboard/tiket/[id]/absen-event-button.tsx'],
  ['app/dashboard/riwayat/page.tsx', 'app/demo-preview/dashboard/riwayat/page.tsx'],
  ['app/dashboard/kesaksian/page.tsx', 'app/demo-preview/dashboard/kesaksian/page.tsx'],
  ['app/dashboard/pemuridan/page.tsx', 'app/demo-preview/dashboard/pemuridan/page.tsx'],
  ['app/dashboard/pemuridan/[slug]/page.tsx', 'app/demo-preview/dashboard/pemuridan/[slug]/page.tsx'],
  ['app/dashboard/profil/page.tsx', 'app/demo-preview/dashboard/profil/page.tsx'],
  ['app/dashboard/profil/edit/page.tsx', 'app/demo-preview/dashboard/profil/edit/page.tsx'],
  ['app/events/page.tsx', 'app/demo-preview/events/page.tsx'],
  ['app/join/[eventId]/join-client.tsx', 'app/demo-preview/join/[eventId]/join-client.tsx'],
  ['app/daftar/page.tsx', 'app/demo-preview/daftar/page.tsx'],
  ['components/pwa/shell.tsx', 'components/demo-preview/clone/pwa/shell.tsx'],
  // Sekretariat v2 (event-approve, pindah-kota, tiket-nasional are Sekretariat Nasional only: not in the demo)
  ...['anggota', 'approval', 'beranda', 'event-detail', 'events', 'lainnya', 'list-tools', 'reimburse', 'scan', 'shell', 'ui'].map((n) => [`components/alk-v2/${n}.tsx`, `components/demo-preview/clone/alk-v2/${n}.tsx`]),
  ['components/alk-v2/paths.ts', 'components/demo-preview/clone/alk-v2/paths.ts'],
  ['components/kota/event-form.tsx', 'components/demo-preview/clone/kota/event-form.tsx'],
  ['app/dashboard/kota/alk/event/[id]/dana/dana-client.tsx', 'components/demo-preview/clone/kota/dana-client.tsx'],
]

const C = '@/components/demo-preview/clone'
const S = '@/components/demo-preview/shim'

function transform(src) {
  let t = src
  t = t.replace(new RegExp(`from '@/lib/actions/(${SHIM_ACTIONS.join('|')})'`, 'g'), `from '${S}/actions/$1'`)
  t = t.replaceAll("from 'next-auth/react'", `from '${S}/session'`)
  t = t.replaceAll("from '@/app/admin/actions'", `from '${S}/admin-actions'`)
  t = t.replaceAll("'@/components/alk-v2/", `'${C}/alk-v2/`)
  t = t.replaceAll("'@/components/pwa/shell'", `'${C}/pwa/shell'`)
  t = t.replaceAll("'@/components/kota/event-form'", `'${C}/kota/event-form'`)
  t = t.replaceAll("'@/app/dashboard/kota/alk/event/[id]/dana/dana-client'", `'${C}/kota/dana-client'`)
  // route strings: '/dashboard...', "/events", `/join/${id}`, callbackUrl=/dashboard
  t = t.replace(/(['"`])\/(dashboard|events|join|login|daftar|absen)(?=[/?'"`$#]|\b)/g, '$1/demo-preview/$2')
  t = t.replace(/callbackUrl=\/(dashboard|events|join|login|daftar|absen)/g, 'callbackUrl=/demo-preview/$1')
  return t
}

/** Explicit edits, asserted so a change in the real file fails loudly instead of silently drifting. */
const PATCHES = {
  'components/pwa/shell.tsx': [
    ["from './ui'", "from '@/components/pwa/ui'"],
    ['/^\\/dashboard\\/tiket\\/\\d+/', '/^\\/demo-preview\\/dashboard\\/tiket\\/\\d+/'],
    ['/^\\/dashboard\\/pemuridan\\/[^/]+/', '/^\\/demo-preview\\/dashboard\\/pemuridan\\/[^/]+/'],
  ],
  'app/dashboard/page.tsx': [
    ['import { getPendingSquadForMe, joinSquad, joinVolunteer }', 'import { getPendingSquadForMe, getPendingVolunteerForMe, joinSquad, joinVolunteer }'],
    ['  const [pendingSquad, setPendingSquad] = useState(false)\n', '  const [pendingSquad, setPendingSquad] = useState(false)\n  const [pendingVolunteer, setPendingVolunteer] = useState(false)\n'],
    ['      getActiveSessions(),\n    ]).then(([regs, p, c, pending, cabs, sessions]) => {\n', '      getActiveSessions(),\n      getPendingVolunteerForMe(),\n    ]).then(([regs, p, c, pending, cabs, sessions, pendingVol]) => {\n      setPendingVolunteer(pendingVol)\n'],
    ["    if (res.ok) {\n      setUserLevel('1')\n      flash('Kamu sekarang Volunteer')\n    }", "    if (res.ok) {\n      setPendingVolunteer(true)\n      flash('Pengajuan Volunteer terkirim')\n    }"],
    ['  level,\n  pendingSquad,\n  joinLoading,', '  level,\n  pendingVolunteer,\n  pendingSquad,\n  joinLoading,'],
    ['  level: string\n  pendingSquad: boolean\n', '  level: string\n  pendingVolunteer: boolean\n  pendingSquad: boolean\n'],
    [
      "      {level === '0' && (\n        <>\n",
      "      {level === '0' && pendingVolunteer && (\n        <p className={`${MONO} mt-4 flex items-center gap-2 rounded-[10px] border-2 border-dotted border-[#161616]/50 px-3 py-2.5 text-[12px] font-bold`}>\n          <Icon name=\"clock\" className=\"w-4 h-4 shrink-0\" />\n          Menunggu approval Admin LK\n        </p>\n      )}\n      {level === '0' && !pendingVolunteer && (\n        <>\n",
    ],
    ['            pendingSquad={pendingSquad}\n            joinLoading', '            pendingSquad={pendingSquad}\n            pendingVolunteer={pendingVolunteer}\n            joinLoading'],
  ],
  'components/alk-v2/approval.tsx': [
    ['import { approveSquad }', 'import { approveSquad, approveVolunteer }'],
    ['{ items, namaCabang }: { items: Item[]; namaCabang: string }', "{ items, namaCabang, kind = 'squad' }: { items: Item[]; namaCabang: string; kind?: 'squad' | 'volunteer' }"],
    ['const res = await approveSquad(id)', "const res = kind === 'volunteer' ? await approveVolunteer(id) : await approveSquad(id)"],
    ['setToast(`${nama} sekarang Squad`)', "setToast(`${nama} sekarang ${kind === 'volunteer' ? 'Volunteer' : 'Squad'}`)"],
    ['sticker={`${list.length} menunggu approve squad`}', 'sticker={`${list.length} menunggu approve ${kind}`}'],
    ['title="Approval Member"', "title={kind === 'volunteer' ? 'Approval Volunteer' : 'Approval Member'}"],
    ['{u.usercode} · VOLUNTEER → SQUAD', "{u.usercode} · {kind === 'volunteer' ? 'TAMU → VOLUNTEER' : 'VOLUNTEER → SQUAD'}"],
  ],
  'components/alk-v2/beranda.tsx': [
    [
      "    { i: 'calPlus', t: 'Buat Event', tint: 'red', href: `${ALK_BASE}/event/new` },",
      "    { i: 'userPlus', t: 'Approval Volunteer', tint: 'gold', href: `${ALK_BASE}/approval-volunteer` },\n    { i: 'calPlus', t: 'Buat Event', tint: 'red', href: `${ALK_BASE}/event/new` },",
    ],
  ],
}

const HEADER = (src) => `/* eslint-disable */\n// GENERATED from ${src} by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.\n`

let n = 0
for (const [src, dest] of FILES) {
  let out = transform(readFileSync(join(ROOT, src), 'utf8'))
  for (const [find, replace] of PATCHES[src] ?? []) {
    if (!out.includes(find)) throw new Error(`gen-demo-preview: patch target not found in ${src}:\n${find}`)
    out = out.replace(find, () => replace)
  }
  const file = join(ROOT, dest)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, HEADER(src) + out)
  n++
}
console.log(`gen-demo-preview: wrote ${n} files`)
