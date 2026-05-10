import { Suspense } from 'react'
import { ScannerClient } from './scanner-client'

export default function ScannerPage() {
  return (
    <Suspense>
      <ScannerClient />
    </Suspense>
  )
}
