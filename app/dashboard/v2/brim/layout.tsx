import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { BrimShell } from '@/components/brim-v2/shell'

export default async function BrimV2Layout({ children }: { children: React.ReactNode }) {
  await requireBrimNasionalPage()
  return <BrimShell>{children}</BrimShell>
}
