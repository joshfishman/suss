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
  const { title, description, published_page_id, layout_mode } = body;

  const { data, error } = await supabase
    .from(draftMode ? 'pages_drafts' : 'pages')
    .upsert(
      {
        slug,
        title,
        description,
        layout_mode: layout_mode || 'snap',
        ...(draftMode ? { published_page_id: published_page_id || null } : {}),
      },
      { onConflict: 'slug' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
