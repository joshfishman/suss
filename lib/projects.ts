import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

export interface ProjectPreview {
  id: string;
  slug: string;
  title: string;
  description: string;
  first_block: any | null;
}

export async function getProjects() {
  const getCachedProjects = unstable_cache(
    async () => {
      const supabase = createPublicClient();

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
        throw pagesError;
      }

      if (!pages?.length) {
        return [] as ProjectPreview[];
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
        throw blocksError;
      }

      const firstBlockByPage = new Map<string, any>();
      for (const block of blocks || []) {
        if (!firstBlockByPage.has(block.page_id)) {
          firstBlockByPage.set(block.page_id, block);
        }
      }

      return filteredPages.map((page) => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        description: page.description || '',
        first_block: firstBlockByPage.get(page.id) || null,
      }));
    },
    ['projects'],
    { tags: ['projects'] }
  );

  return getCachedProjects();
}
