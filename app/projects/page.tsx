import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageEditor } from '@/components/admin/page-editor';
import { getPageData } from '@/lib/drafts';
import type { Metadata } from 'next';
import { buildSearchString, isEditMode } from '@/lib/route-helpers';

async function PageContent({
  editMode,
  loginRedirectTo,
}: {
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

  const { page, blocks } = await getPageData('projects', editMode);

  if (!page) {
    return <div>Page not found</div>;
  }

  if (editMode) {
    return (
      <PageEditor
        page={page}
        initialBlocks={blocks || []}
        draftMode
        editOnPublic
        exitHref="/projects"
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

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageData('projects', false);

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

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const editMode = isEditMode(resolvedSearchParams);
  const loginRedirectTo = `/projects${buildSearchString(resolvedSearchParams)}`;

  if (editMode) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <PageContent editMode loginRedirectTo={loginRedirectTo} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <PageContent editMode={false} loginRedirectTo={loginRedirectTo} />
    </Suspense>
  );
}
