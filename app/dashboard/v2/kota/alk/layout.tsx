import { requireAlkPengurus } from '@/lib/alk-auth'
import { AlkShell } from '@/components/alk-v2/shell'

export default async function AlkV2Layout({ children }: { children: React.ReactNode }) {
  await requireAlkPengurus()
  return <AlkShell>{children}</AlkShell>
}
