import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { slug } = body;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const { data: draftPage, error: draftError } = await supabase
    .from('pages_drafts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (draftError || !draftPage) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  const livePageId = draftPage.published_page_id;
  if (!livePageId) {
    return NextResponse.json({ error: 'Missing published_page_id' }, { status: 400 });
  }

  let { error: pageUpdateError } = await supabase
    .from('pages')
    .update({
      title: draftPage.title,
      description: draftPage.description,
      hero_title: draftPage.hero_title || draftPage.title,
      layout_mode: draftPage.layout_mode || 'snap',
      page_type: draftPage.page_type || 'page',
    })
    .eq('id', livePageId);

  if (pageUpdateError && /(layout_mode|page_type|hero_title)/i.test(pageUpdateError.message)) {
    const fallback = await supabase
      .from('pages')
      .update({
        title: draftPage.title,
        description: draftPage.description,
      })
      .eq('id', livePageId);
    pageUpdateError = fallback.error;
  }

  if (pageUpdateError) {
    return NextResponse.json({ error: pageUpdateError.message }, { status: 500 });
  }

  const { data: draftBlocks, error: draftBlocksError } = await supabase
    .from('content_blocks_drafts')
    .select('*')
    .eq('page_draft_id', draftPage.id)
    .order('sort_order', { ascending: true });

  if (draftBlocksError) {
    return NextResponse.json({ error: draftBlocksError.message }, { status: 500 });
  }

  // Replace live blocks
  const { error: deleteError } = await supabase
    .from('content_blocks')
    .delete()
    .eq('page_id', livePageId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (draftBlocks?.length) {
    const { error: insertError } = await supabase
      .from('content_blocks')
      .insert(
        draftBlocks.map((block: any) => ({
          page_id: livePageId,
          block_type: block.block_type,
          content: block.content,
          layout: block.layout,
          sort_order: block.sort_order,
        }))
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Clear drafts after publish
  await supabase.from('content_blocks_drafts').delete().eq('page_draft_id', draftPage.id);
  await supabase.from('pages_drafts').delete().eq('id', draftPage.id);

  return NextResponse.json({ success: true });
}
