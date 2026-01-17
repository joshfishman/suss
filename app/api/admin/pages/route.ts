import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, page_type')
    .order('created_at', { ascending: true });

  // Fallback if page_type column doesn't exist
  if (error && /page_type/i.test(error.message)) {
    const fallback = await supabase
      .from('pages')
      .select('id, slug, title')
      .order('created_at', { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Infer page_type from slug if not present
  const pages = (data || []).map((page) => ({
    ...page,
    page_type: page.page_type || (page.slug?.startsWith('project-') ? 'project' : 'page'),
  }));

  return NextResponse.json({ pages });
}
