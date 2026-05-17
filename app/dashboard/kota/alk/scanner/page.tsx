import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ScannerClient } from '@/app/alk/scanner/scanner-client'

export default async function AlkScannerPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  return (
    <Suspense>
      <ScannerClient backUrl="/dashboard/kota/alk" />
    </Suspense>
  )
}
