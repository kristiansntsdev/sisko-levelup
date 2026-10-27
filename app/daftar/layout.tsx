import type { ReactNode } from 'react'
import { Permanent_Marker } from 'next/font/google'

const marker = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--font-marker', display: 'swap' })

export default function DaftarLayout({ children }: { children: ReactNode }) {
  return <div className={marker.variable}>{children}</div>
}
