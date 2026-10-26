import { Barlow_Semi_Condensed, Plus_Jakarta_Sans } from 'next/font/google'
import { MemberShell } from '@/components/pwa/shell'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-proto',
  subsets: ['latin'],
  display: 'swap',
})

const barlow = Barlow_Semi_Condensed({
  variable: '--font-proto-card',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} ${barlow.variable}`}>
      <MemberShell>{children}</MemberShell>
    </div>
  )
}
