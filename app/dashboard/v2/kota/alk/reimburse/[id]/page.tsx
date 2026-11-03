import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getReimburseReview } from '@/lib/actions/reimburse'
import { ReimburseReviewV2Client } from '@/components/alk-v2/reimburse'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2ReimburseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pengurus = await requireAlkPengurus()
  if (!pengurus.isNasional) redirect(`${ALK_EVENT_BASE}/${id}/dana`)
  const review = await getReimburseReview(Number(id))
  if (!review) redirect(`${ALK_BASE}/reimburse`)
  return <ReimburseReviewV2Client review={review} />
}
