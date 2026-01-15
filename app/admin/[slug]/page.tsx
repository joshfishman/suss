import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageEditor } from '@/components/admin/page-editor';

async function EditorContent({ slug }: { slug: string }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!page) {
    redirect('/admin');
  }

  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true });

  return <PageEditor page={page} initialBlocks={blocks || []} />;
}

export default async function AdminPageEdit({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>}>
      <EditorContent slug={slug} />
    </Suspense>
  );
}
