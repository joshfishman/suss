import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageEditor } from '@/components/admin/page-editor';
import { getPageData } from '@/lib/drafts';

async function PageContent({ slug, editMode }: { slug: string; editMode: boolean }) {
  const supabase = await createClient();

  if (editMode) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/auth/login');
    }
  }

  const { page, blocks } = await getPageData(slug, editMode);

  const isReserved = ['home', 'about', 'projects'].includes(slug);
  const isProject =
    page &&
    (page.page_type === 'project' ||
      (!page.page_type && !isReserved) ||
      page.slug?.startsWith('project-'));

  if (!isProject) {
    return <div>Page not found</div>;
  }

  if (editMode) {
    return (
      <PageEditor
        page={page}
        initialBlocks={blocks || []}
        draftMode
        editOnPublic
        exitHref={`/${slug}`}
      />
    );
  }

  return (
    <PageEditor
      page={page}
      initialBlocks={blocks || []}
      readOnly
    />
  );
}

function isEditMode(searchParams?: { edit?: string | string[] }) {
  const editParam = searchParams?.edit;
  if (Array.isArray(editParam)) {
    return editParam.includes('1') || editParam.includes('true');
  }
  return editParam === '1' || editParam === 'true';
}

export default async function ProjectRootPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ edit?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const editMode = isEditMode(resolvedSearchParams);
  const { slug } = await params;

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <PageContent slug={slug} editMode={editMode} />
    </Suspense>
  );
}
