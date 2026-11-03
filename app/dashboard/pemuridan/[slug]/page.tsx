import { notFound } from 'next/navigation'
import { StoryPlayer } from '@/components/pemuridan/story-player'
import { PEMURIDAN, findSeri } from '@/lib/pemuridan'

export const generateStaticParams = () => PEMURIDAN.map(({ slug }) => ({ slug }))

export default async function PemuridanSeriPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!findSeri(slug)) notFound()
  return <StoryPlayer slug={slug} backHref="/dashboard/pemuridan" />
}
