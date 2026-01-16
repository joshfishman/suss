import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { PageViewer } from '@/components/page-viewer';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/page-hero';

async function PageContent() {
  const supabase = await createClient();

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'home')
    .single();

  if (!page) {
    return <div>Page not found</div>;
  }

  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true });

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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="pt-20 flex-1">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <PageContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
