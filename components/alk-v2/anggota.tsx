'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type ChangeEvent, type FormEvent } from 'react'
import {
  createPengurusKota,
  updatePengurusKota,
  type PengurusKotaRow,
} from '@/lib/actions/pengurus-kota'
import { ALK_BASE, divisiToRole } from './paths'
import { ANTON, BTN, BTN_SHELL, ERROR, IconButton, MONO, PANEL, PaperHeader, PaperMain, PRESS, Strip } from '@/components/pwa/paper-ui'
import { SearchBox } from './list-tools'
import { Empty, FLD, Field, FieldGroup, Icon, Note, PersonChip, Pill, Seg, SectionCard, Sheet, SheetHead, Toast } from './ui'

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
    <PaperMain>
      <PaperHeader
        sticker={`${namaCabang} · ${members.length} pengurus`}
        title="LevelUP Kota"
        action={
          <button type="button" onClick={() => router.push(`${ALK_BASE}/anggota/baru`)} className={`shrink-0 rotate-2 ${BTN_SHELL}`}>
            <Strip className="px-4 py-2 text-[16px]">
              <Icon name="plus" className="w-4 h-4" sw={2.4} />
              Tambah
            </Strip>
          </button>
        }
      />
      <div className="px-5 mt-5 pb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Cari nama atau email" />
        <div className="mt-4 space-y-2.5">
          {list.length ? (
            list.map((m) => (
              <button key={m.id_pengurus} type="button" onClick={() => setEdit(m)} className={`w-full flex items-center gap-3 p-3 text-left ${PANEL} ${PRESS}`}>
                <PersonChip />
                <span className="flex-1 min-w-0">
                  <span className={`${ANTON} block text-[16px] leading-tight tracking-[.02em] truncate`}>
                    {m.nama}
                    {m.me && <span className="text-[#c21f24]"> · Kamu</span>}
                  </span>
                  <span className={`${MONO} block mt-0.5 text-[11px] text-[#44403c] truncate`}>{m.username}</span>
                </span>
                <Pill tone="gold">{divisiToRole(m.divisi)}</Pill>
              </button>
            ))
          ) : (
            <Empty>Tidak ada pengurus yang cocok</Empty>
          )}
        </div>
      </div>
      {edit && <MemberEditSheet m={edit} onClose={() => setEdit(null)} />}
    </PaperMain>
  )
}

function MemberEditSheet({ m, onClose }: { m: PengurusKotaRow; onClose: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState(m.username)
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
        <SheetHead title={m.nama} sub="Ubah email / peran login" />
        <div className="space-y-4">
          <FieldGroup label="Peran">
            <Seg
              options={[
                ['Admin LK', 'Admin LK'],
                ['BRIM', 'BRIM'],
              ]}
              value={role}
              onChange={(v) => setRole(v as 'Admin LK' | 'BRIM')}
            />
          </FieldGroup>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FLD} />
          </Field>
          <Field label="Password">
            <input
              value={m.password}
              type="text"
              readOnly
              disabled
              className={FLD}
            />
          </Field>
          {error && <p role="alert" className={ERROR}>{error}</p>}
          <button type="button" disabled={pending} onClick={save} className={BTN}>
            <Strip>Simpan</Strip>
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
    <PaperMain>
      <PaperHeader
        sticker="Sekretariat"
        title="Tambah Pengurus"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(`${ALK_BASE}/anggota`)} className="-rotate-3" />}
      />
      <form onSubmit={submit} className="px-5 mt-5 space-y-5 pb-8">
        <SectionCard lift icon="userPlus" tint="red" title="Pengurus" sub="Langsung bisa login — tanpa approval pusat">
          <FieldGroup label="Peran">
            <Seg
              options={[
                ['Admin LK', 'Admin LK'],
                ['BRIM', 'BRIM'],
              ]}
              value={f.role}
              onChange={(role) => setF({ ...f, role: role as 'Admin LK' | 'BRIM' })}
            />
          </FieldGroup>
          <Field label="Nama">
            <input value={f.name} onChange={set('name')} className={FLD} placeholder="Nama lengkap" maxLength={255} />
          </Field>
          <FieldGroup label="Jenis Kelamin">
            <Seg
              options={[
                ['L', 'Laki-laki'],
                ['P', 'Perempuan'],
              ]}
              value={f.g}
              onChange={(g) => setF({ ...f, g: g as 'L' | 'P' })}
            />
          </FieldGroup>
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
        {error && <p role="alert" className={ERROR}>{error}</p>}
        <button disabled={!valid || pending} type="submit" className={BTN}>
          <Strip>
            <Icon name="check" className="w-[18px] h-[18px]" sw={2.6} />
            Simpan Pengurus
          </Strip>
        </button>
      </form>
    </PaperMain>
  )
}
