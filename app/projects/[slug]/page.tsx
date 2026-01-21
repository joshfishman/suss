import { redirect } from 'next/navigation';
import { isEditMode } from '@/lib/route-helpers';

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ edit?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const editMode = isEditMode(resolvedSearchParams);
  const { slug } = await params;
  redirect(`/${slug}${editMode ? '?edit=1' : ''}`);
}
