import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || '').trim();
  let slug = String(body.slug || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Missing title' }, { status: 400 });
  }
  if (!slug) {
    slug = slugify(title);
  }
  if (!slug) {
    slug = `project-${Date.now()}`;
  }

  const insertPayload = {
    slug,
    title,
    description: '',
    layout_mode: 'snap',
    page_type: 'project',
  };

  let { data, error } = await supabase
    .from('pages')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    // Fallback in case new columns don't exist yet
    if (/(layout_mode|page_type)/i.test(error.message)) {
      const { layout_mode: _layoutMode, page_type: _pageType, ...fallbackPayload } = insertPayload;
      const fallback = await supabase
        .from('pages')
        .insert(fallbackPayload)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug: data.slug, title: data.title });
}
