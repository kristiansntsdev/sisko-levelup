'use client'
// Client version of app/join/[eventId]/page.tsx. Online events open here too (the QR-only /absen page is not in the demo).
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getEventById } from '@/components/demo-preview/shim/actions/event'
import { countActiveRegistrasi, findRegistrasiMine } from '@/components/demo-preview/shim/actions/registrasi'
import { useSession } from '@/components/demo-preview/shim/session'
import { JoinClient } from './join-client'

type Props = React.ComponentProps<typeof JoinClient>

export default function JoinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { status, data: session } = useSession()
  const [props, setProps] = useState<Props>()
  const idPeserta = session?.user?.idPeserta

  useEffect(() => {
    if (status === 'loading') return
    Promise.all([getEventById(Number(eventId)), idPeserta ? findRegistrasiMine(idPeserta, Number(eventId)) : null, countActiveRegistrasi(Number(eventId))]).then(([event, mine, registered]) =>
      setProps({
        event,
        isRegistered: !!mine && mine.status !== 'pending',
        registrasiId: mine && mine.status !== 'pending' ? mine.id : null,
        pendingApproval: mine?.status === 'pending',
        registered,
      }),
    )
  }, [eventId, idPeserta, status])

  if (!props) return null
  return <JoinClient {...props} />
}
