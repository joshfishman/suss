import { redirect } from 'next/navigation';

function isEditMode(searchParams?: { edit?: string | string[] }) {
  const editParam = searchParams?.edit;
  if (Array.isArray(editParam)) {
    return editParam.includes('1') || editParam.includes('true');
  }
  return editParam === '1' || editParam === 'true';
}

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
