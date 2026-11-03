/* eslint-disable */
// GENERATED from app/dashboard/pemuridan/[slug]/page.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
import { notFound } from 'next/navigation'
import { StoryPlayer } from '@/components/pemuridan/story-player'
import { PEMURIDAN, findSeri } from '@/lib/pemuridan'

export const generateStaticParams = () => PEMURIDAN.map(({ slug }) => ({ slug }))

export default async function PemuridanSeriPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!findSeri(slug)) notFound()
  return <StoryPlayer slug={slug} backHref="/demo-preview/dashboard/pemuridan" />
}
