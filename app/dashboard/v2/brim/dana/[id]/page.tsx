import { redirect } from 'next/navigation'
import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { getReimburseReviewBrim } from '@/lib/actions/reimburse'
import { ReimburseReviewV2Client } from '@/components/alk-v2/reimburse'
import { BRIM_DANA_BASE } from '@/components/brim-v2/paths'

export default async function BrimV2DanaReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireBrimNasionalPage()
  const review = await getReimburseReviewBrim(Number(id))
  if (!review) redirect(BRIM_DANA_BASE)
  return <ReimburseReviewV2Client review={review} backHref={BRIM_DANA_BASE} />
}
