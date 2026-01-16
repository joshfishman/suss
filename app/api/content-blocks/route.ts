import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const draftMode = url.searchParams.get('draft') === '1';
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { page_id, block_type, content, layout, sort_order } = body;

  let { data, error } = await supabase
    .from(draftMode ? 'content_blocks_drafts' : 'content_blocks')
    .insert({
      ...(draftMode ? { page_draft_id: page_id } : { page_id }),
      block_type,
      content,
      layout,
      sort_order
    })
    .select()
    .single();

  if (error && draftMode) {
    const { data: draftPage } = await supabase
      .from('pages_drafts')
      .select('id')
      .eq('published_page_id', page_id)
      .single();
    if (draftPage?.id) {
      const retry = await supabase
        .from('content_blocks_drafts')
        .insert({
          page_draft_id: draftPage.id,
          block_type,
          content,
          layout,
          sort_order,
        })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
