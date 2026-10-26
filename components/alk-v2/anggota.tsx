'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type ChangeEvent, type FormEvent } from 'react'
import {
  createPengurusKota,
  updatePengurusKota,
  type PengurusKotaRow,
} from '@/lib/actions/pengurus-kota'
import { ALK_BASE, divisiToRole } from './paths'
import {
  Avatar,
  BTN_RED,
  CARD,
  Empty,
  FLD,
  Field,
  Hero,
  Icon,
  LIFT,
  PageHero,
  Seg,
  SectionCard,
  Sheet,
  SheetHead,
  Toast,
  TopBar,
  Note,
} from './ui'

export function AnggotaListClient({
  members,
  namaCabang,
}: {
  members: PengurusKotaRow[]
  namaCabang: string
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<PengurusKotaRow | null>(null)
  const needle = q.trim().toLowerCase()
  const list = members.filter(
    (m) =>
      !needle ||
      `${m.nama} ${m.username} ${divisiToRole(m.divisi)}`.toLowerCase().includes(needle),
  )

  return (
    <section>
      <PageHero
        title="LevelUP Kota"
        sub={`${namaCabang} · ${members.length} pengurus`}
        action={{ label: 'Tambah', onClick: () => router.push(`${ALK_BASE}/anggota/baru`) }}
        pb="pb-20"
      />
      <div className="px-5 -mt-12 relative pb-4">
        <label className={`flex items-center gap-2.5 ${LIFT} px-4 py-3.5`}>
          <Icon name="search" className="w-5 h-5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Cari nama atau email"
            enterKeyHint="search"
            className="flex-1 min-w-0 outline-none text-[15px] bg-transparent"
          />
        </label>
        <div className="mt-4 space-y-2.5">
          {list.length ? (
            list.map((m) => (
              <button
                key={m.id_pengurus}
                type="button"
                onClick={() => setEdit(m)}
                className={`w-full flex items-center gap-3 ${CARD} p-3 text-left active:scale-[.99] transition`}
              >
                <span className="w-11 h-11 shrink-0 rounded-full overflow-hidden">
                  <Avatar g="L" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-[14px] text-[#3b1417] truncate">
                    {m.nama}
                    {m.me && <span className="text-[11px] font-semibold text-[#96792a]"> · Kamu</span>}
                  </span>
                  <span className="block text-[12px] text-slate-500 truncate">{m.username}</span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-full ring-1 ring-slate-200">
                  {divisiToRole(m.divisi)}
                </span>
              </button>
            ))
          ) : (
            <Empty>Tidak ada pengurus yang cocok</Empty>
          )}
        </div>
      </div>
      {edit && <MemberEditSheet m={edit} onClose={() => setEdit(null)} />}
    </section>
  )
}

function MemberEditSheet({ m, onClose }: { m: PengurusKotaRow; onClose: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState(m.username)
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Admin LK' | 'BRIM'>(divisiToRole(m.divisi))
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function save() {
    setError('')
    start(async () => {
      const res = await updatePengurusKota({
        id: m.id_pengurus,
        email,
        password: password || undefined,
        role,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setToast('Disimpan')
      onClose()
      router.refresh()
    })
  }

  return (
    <>
      <Sheet open onClose={onClose}>
        <SheetHead title={m.nama} sub="Ubah email + password login" />
        <div className="space-y-4">
          <Field label="Peran">
            <Seg
              options={[
                ['Admin LK', 'Admin LK'],
                ['BRIM', 'BRIM'],
              ]}
              value={role}
              onChange={(v) => setRole(v as 'Admin LK' | 'BRIM')}
            />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FLD} />
          </Field>
          <Field label="Password baru (opsional)">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="text"
              className={FLD}
              placeholder="Kosongkan jika tidak diubah"
            />
          </Field>
          {error && <p className="text-[13px] text-rose-600">{error}</p>}
          <button type="button" disabled={pending} onClick={save} className={`w-full py-3.5 ${BTN_RED}`}>
            Simpan
          </button>
        </div>
      </Sheet>
      <Toast msg={toast} />
    </>
  )
}

export function AnggotaBaruClient() {
  const router = useRouter()
  const [f, setF] = useState({
    name: '',
    g: '' as '' | 'L' | 'P',
    role: 'Admin LK' as 'Admin LK' | 'BRIM',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const valid = f.name.trim().length >= 3 && f.g && f.email.trim().includes('@') && f.password.length >= 4

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    setError('')
    start(async () => {
      const res = await createPengurusKota({
        nama: f.name,
        email: f.email,
        password: f.password,
        role: f.role,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`${ALK_BASE}/anggota`)
      router.refresh()
    })
  }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-16">
        <TopBar title="Tambah Pengurus" back={() => router.push(`${ALK_BASE}/anggota`)} />
      </Hero>
      <form onSubmit={submit} className="px-5 -mt-10 relative space-y-4 pb-8">
        <SectionCard lift icon="userPlus" tint="red" title="Pengurus" sub="Langsung bisa login — tanpa approval pusat">
          <Field label="Peran">
            <Seg
              options={[
                ['Admin LK', 'Admin LK'],
                ['BRIM', 'BRIM'],
              ]}
              value={f.role}
              onChange={(role) => setF({ ...f, role: role as 'Admin LK' | 'BRIM' })}
            />
          </Field>
          <Field label="Nama">
            <input value={f.name} onChange={set('name')} className={FLD} placeholder="Nama lengkap" maxLength={255} />
          </Field>
          <Field label="Jenis Kelamin">
            <Seg
              options={[
                ['L', 'Laki-laki'],
                ['P', 'Perempuan'],
              ]}
              value={f.g}
              onChange={(g) => setF({ ...f, g: g as 'L' | 'P' })}
            />
          </Field>
        </SectionCard>
        <SectionCard icon="shield" tint="gold" title="Login" sub="Email + password untuk masuk Sekretariat">
          <Field label="Email">
            <input value={f.email} onChange={set('email')} type="email" className={FLD} placeholder="nama@levelup.id" autoComplete="off" />
          </Field>
          <Field label="Password">
            <input value={f.password} onChange={set('password')} type="text" className={FLD} placeholder="Minimal 4 karakter" autoComplete="off" />
          </Field>
        </SectionCard>
        <Note>Peserta tidak ditambah di sini — mereka daftar lewat PWA lalu Join Squad.</Note>
        {error && <p className="text-[13px] text-rose-600">{error}</p>}
        <button disabled={!valid || pending} type="submit" className={`w-full py-3.5 flex items-center justify-center gap-2 ${BTN_RED}`}>
          <Icon name="check" className="w-[18px] h-[18px]" />
          Simpan Pengurus
        </button>
      </form>
    </section>
  )
}
