import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageViewer } from '@/components/page-viewer';
import { PageHero } from '@/components/page-hero';
import { PageShell } from '@/components/page-shell';
import { PageEditor } from '@/components/admin/page-editor';
import { getPageData } from '@/lib/drafts';

async function PageContent({ editMode }: { editMode: boolean }) {
  const supabase = await createClient();

  if (editMode) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/auth/login');
    }
  }

  const { page, blocks } = await getPageData('home', editMode);

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
        exitHref="/home"
      />
    );
  }

  return (
    <>
      <PageHero 
        title={page.title} 
        description={page.description} 
      />
      <PageViewer blocks={blocks || []} />
    </>
  );
}

function isEditMode(searchParams?: { edit?: string | string[] }) {
  const editParam = searchParams?.edit;
  if (Array.isArray(editParam)) {
    return editParam.includes('1') || editParam.includes('true');
  }
  return editParam === '1' || editParam === 'true';
}

export default function HomePage({ searchParams }: { searchParams?: { edit?: string | string[] } }) {
  const editMode = isEditMode(searchParams);

  if (editMode) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <PageContent editMode />
      </Suspense>
    );
  }

  return (
    <PageShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <PageContent editMode={false} />
      </Suspense>
    </PageShell>
  );
}
