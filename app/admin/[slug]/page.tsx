import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageEditor } from '@/components/admin/admin-page-editor';

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

  return <AdminPageEditor page={page} initialBlocks={blocks || []} />;
}

export default async function AdminPageEdit({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <EditorContent slug={slug} />
      </Suspense>
    </div>
  );
}
