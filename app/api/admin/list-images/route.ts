import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.storage
    .from('page-images')
    .list(user.id, {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const images = (data || [])
    .filter((item) => item.name)
    .map((item) => {
      const path = `${user.id}/${item.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(path);

      return {
        name: item.name,
        path,
        url: publicUrl,
        created_at: item.created_at,
      };
    });

  return NextResponse.json({ images });
}
