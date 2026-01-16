import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  let { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('*')
    .eq('page_type', 'project')
    .order('created_at', { ascending: false });
  let usingPageType = true;

  if (pagesError && /page_type/i.test(pagesError.message)) {
    const fallback = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false });
    pages = fallback.data || [];
    pagesError = fallback.error;
    usingPageType = false;
  }

  if (pagesError) {
    return NextResponse.json({ error: pagesError.message }, { status: 500 });
  }

  if (!pages?.length) {
    return NextResponse.json({ projects: [] });
  }

  const filteredPages = usingPageType
    ? pages.filter((page) => page.page_type === 'project')
    : pages.filter((page) => !['home', 'about', 'projects'].includes(page.slug));

  const pageIds = filteredPages.map((page) => page.id);
  const { data: blocks, error: blocksError } = await supabase
    .from('content_blocks')
    .select('*')
    .in('page_id', pageIds)
    .order('sort_order', { ascending: true });

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  const firstBlockByPage = new Map<string, any>();
  for (const block of blocks || []) {
    if (!firstBlockByPage.has(block.page_id)) {
      firstBlockByPage.set(block.page_id, block);
    }
  }

  const projects = filteredPages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description || '',
    first_block: firstBlockByPage.get(page.id) || null,
  }));

  return NextResponse.json({ projects });
}
