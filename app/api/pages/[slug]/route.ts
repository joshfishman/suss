import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const url = new URL(request.url);
  const draftMode = url.searchParams.get('draft') === '1';
  
  const { data: page, error: pageError } = await supabase
    .from(draftMode ? 'pages_drafts' : 'pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (pageError) {
    return NextResponse.json({ error: pageError.message }, { status: 404 });
  }

  const { data: blocks, error: blocksError } = await supabase
    .from(draftMode ? 'content_blocks_drafts' : 'content_blocks')
    .select('*')
    .eq(draftMode ? 'page_draft_id' : 'page_id', page.id)
    .order('sort_order', { ascending: true });

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  return NextResponse.json({ page, blocks });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const url = new URL(request.url);
  const draftMode = url.searchParams.get('draft') === '1';
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, hero_title, published_page_id, layout_mode, page_type } = body;

  const upsertPayload = {
    slug,
    title,
    description,
    hero_title: hero_title ?? title,
    layout_mode: layout_mode || 'snap',
    page_type: page_type || 'page',
    ...(draftMode ? { published_page_id: published_page_id || null } : {}),
  };

  let { data, error } = await supabase
    .from(draftMode ? 'pages_drafts' : 'pages')
    .upsert(upsertPayload, { onConflict: 'slug' })
    .select()
    .single();

  if (error && /(layout_mode|page_type|hero_title)/i.test(error.message)) {
    const {
      layout_mode: _layoutMode,
      page_type: _pageType,
      hero_title: _heroTitle,
      ...fallbackPayload
    } = upsertPayload;
    const fallback = await supabase
      .from(draftMode ? 'pages_drafts' : 'pages')
      .upsert(fallbackPayload, { onConflict: 'slug' })
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Don't allow deleting reserved pages
  const reservedSlugs = ['home', 'about', 'projects'];
  if (reservedSlugs.includes(slug)) {
    return NextResponse.json({ error: 'Cannot delete reserved pages' }, { status: 400 });
  }

  // Delete draft page and its blocks first
  const { data: draftPage } = await supabase
    .from('pages_drafts')
    .select('id')
    .eq('slug', slug)
    .single();

  if (draftPage) {
    await supabase
      .from('content_blocks_drafts')
      .delete()
      .eq('page_draft_id', draftPage.id);

    await supabase
      .from('pages_drafts')
      .delete()
      .eq('slug', slug);
  }

  // Delete published page and its blocks
  const { data: publishedPage } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .single();

  if (publishedPage) {
    await supabase
      .from('content_blocks')
      .delete()
      .eq('page_id', publishedPage.id);

    await supabase
      .from('pages')
      .delete()
      .eq('slug', slug);
  }

  if (!draftPage && !publishedPage) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
