import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const draftMode = url.searchParams.get('draft') === '1';

  const { error } = await supabase
    .from(draftMode ? 'content_blocks_drafts' : 'content_blocks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
