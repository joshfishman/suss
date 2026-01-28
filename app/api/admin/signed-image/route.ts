import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawPath = url.searchParams.get('path');
  if (!rawPath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  const parsedPath = rawPath.includes('page-images')
    ? rawPath.split('page-images/')[1]
    : rawPath;
  const normalizedPath = parsedPath.replace(/^\/+/, '');

  const { data, error } = await supabase.storage
    .from('page-images')
    .createSignedUrl(normalizedPath, 60 * 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'Failed to sign URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
