import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try listing from user's folder first
  let { data, error } = await supabase.storage
    .from('page-images')
    .list(user.id, {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  // If user folder is empty, try listing root
  if ((!data || data.length === 0) && !error) {
    const rootResult = await supabase.storage
      .from('page-images')
      .list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    if (rootResult.data && rootResult.data.length > 0) {
      // Filter to only include files (not folders) or check subfolders
      const filesAndFolders = rootResult.data;
      const allImages: typeof data = [];
      
      for (const item of filesAndFolders) {
        // If it's a folder (no metadata), list its contents
        if (item.id === null) {
          const folderResult = await supabase.storage
            .from('page-images')
            .list(item.name, { limit: 200 });
          if (folderResult.data) {
            allImages.push(...folderResult.data.map(f => ({ ...f, folder: item.name })));
          }
        } else {
          // It's a file at root level
          allImages.push(item);
        }
      }
      data = allImages;
    }
  }

  if (error) {
    console.error('Storage list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no data or empty array, return early with empty images
  if (!data || data.length === 0) {
    return NextResponse.json({ images: [] });
  }

  const images = await Promise.all(
    (data || [])
      .filter((item) => item.name && !item.name.startsWith('.'))
      .map(async (item: { name: string; created_at?: string; folder?: string }) => {
        // Use folder from item if available (from subfolder scan), otherwise use user.id
        const folder = item.folder || user.id;
        const path = `${folder}/${item.name}`;
        const { data: signedData, error: signedError } = await supabase.storage
          .from('page-images')
          .createSignedUrl(path, 60 * 60);
        const signedUrl = signedData?.signedUrl;

        if (signedError || !signedUrl) {
          const { data: { publicUrl } } = supabase.storage
            .from('page-images')
            .getPublicUrl(path);
          return {
            name: item.name,
            path,
            url: publicUrl,
            created_at: item.created_at,
          };
        }

        return {
          name: item.name,
          path,
          url: signedUrl,
          created_at: item.created_at,
        };
      })
  );

  return NextResponse.json({ images });
}
