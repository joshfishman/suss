import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageEditor } from '@/components/admin/page-editor';
import { getPageData } from '@/lib/drafts';
import type { Metadata } from 'next';
import { buildSearchString, isEditMode } from '@/lib/route-helpers';

async function PageContent({
  slug,
  editMode,
  loginRedirectTo,
}: {
  slug: string;
  editMode: boolean;
  loginRedirectTo: string;
}) {
  const supabase = await createClient();

  if (editMode) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/auth/login?next=${encodeURIComponent(loginRedirectTo)}`);
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { page } = await getPageData(params.slug, false);

  if (!page) {
    return {};
  }

  const title = page.title;
  const description = page.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
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
  const loginRedirectTo = `/${slug}${buildSearchString(resolvedSearchParams)}`;

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <PageContent slug={slug} editMode={editMode} loginRedirectTo={loginRedirectTo} />
    </Suspense>
  );
}
