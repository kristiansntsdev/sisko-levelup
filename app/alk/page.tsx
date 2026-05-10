'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, Alert } from '@/components/ui'
import { getEventById, type EventSummary } from '@/lib/actions/event'

type EventState = EventSummary | 'not_found' | null

export default function AlkPage() {
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const [eventIdInput, setEventIdInput] = useState('')
  const [event, setEvent] = useState<EventState>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const id = Number(eventIdInput)
    if (!id) return
    startTransition(async () => {
      const result = await getEventById(id)
      setEvent(result ?? 'not_found')
      setShowQR(false)
    })
  }

  const foundEvent = event && event !== 'not_found' ? event : null

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-8 pb-safe flex flex-col gap-6 justify-center">
      <div className="flex flex-col gap-4">
        <Input
          label="ID Event"
          placeholder="Masukkan ID event"
          type="number"
          value={eventIdInput}
          onChange={(e) => setEventIdInput(e.target.value)}
        />

        <Button fullWidth loading={isPending} onClick={handleSubmit}>
          Submit
        </Button>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => setShowQR((v) => !v)}
        >
          {showQR ? 'Sembunyikan QR' : 'Generate QR'}
        </Button>
      </div>

      {event === 'not_found' && (
        <Alert
          variant="error"
          title="Event tidak ditemukan"
          description="Periksa ID event dan coba lagi."
        />
      )}

      {foundEvent && (
        <Card variant="elevated" className="p-4 flex flex-col gap-3">
          <div>
            <p className="font-semibold text-fg">{foundEvent.nama_event}</p>
            <p className="text-sm text-muted mt-0.5">
              {foundEvent.tglDisplay} · {foundEvent.jamevent}
            </p>
          </div>
          <Button fullWidth onClick={() => router.push('/alk/scanner')}>
            Mulai Scanner
          </Button>
        </Card>
      )}

      {showQR && foundEvent && (
        <Card variant="elevated" className="p-6 flex flex-col items-center gap-4">
          <p className="text-xs text-muted uppercase tracking-wider">QR Event</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=EVENT-${foundEvent.id_event}&color=1c1917&bgcolor=ffffff`}
            alt="QR Event"
            width={200}
            height={200}
            className="rounded-input"
          />
          <p className="text-sm font-medium text-fg">{foundEvent.nama_event}</p>
        </Card>
      )}
    </main>
  )
}
