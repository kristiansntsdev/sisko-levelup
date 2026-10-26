import { Suspense } from 'react'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { ScannerClient } from '@/app/alk/scanner/scanner-client'
import { ALK_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2ScannerPage() {
  await requireAlkPengurus()
  return (
    <Suspense>
      <ScannerClient backUrl={ALK_BASE} />
    </Suspense>
  )
}
