import type { Metadata } from 'next'
import { loadDanaByToken } from '@/lib/dana-approval'
import { DanaApproval, DanaLinkDead } from '@/components/dana/dana-approval'

// The token in the URL is the only auth: never index it, never send it as a Referer to Drive/Blob links.
export const metadata: Metadata = {
  title: 'Pengajuan Dana LevelUP',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function DanaLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const res = await loadDanaByToken(token)
  if (!res) return <DanaLinkDead />
  return <DanaApproval token={token} peran={res.peran} view={res.view} />
}
