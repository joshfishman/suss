import { createClient } from '@/lib/supabase/server';
import { ContentBlock, Page } from '@/lib/types/content';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

interface DraftPage extends Page {
  published_page_id?: string | null;
}

async function ensureDrafts(slug: string) {
  const supabase = await createClient();

  const { data: livePage } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!livePage) {
    const { data: draftPage } = await supabase
      .from('pages_drafts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!draftPage) {
      return { page: null, blocks: [] as ContentBlock[] };
    }

    const { data: draftBlocks } = await supabase
      .from('content_blocks_drafts')
      .select('*')
      .eq('page_draft_id', draftPage.id)
      .order('sort_order', { ascending: true });

    return {
      page: draftPage as DraftPage,
      blocks: (draftBlocks || []) as ContentBlock[],
    };
  }

  let { data: draftPage } = await supabase
    .from('pages_drafts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!draftPage) {
    const insertPayload = {
      slug: livePage.slug,
      title: livePage.title,
      description: livePage.description,
      hero_title: livePage.hero_title || livePage.title,
      layout_mode: livePage.layout_mode || 'snap',
      published_page_id: livePage.id,
      page_type: livePage.page_type || 'page',
    };

    let { data: createdDraft, error: createdDraftError } = await supabase
      .from('pages_drafts')
      .insert(insertPayload)
      .select()
      .single();

    if (createdDraftError && /(hero_title|layout_mode|page_type)/i.test(createdDraftError.message)) {
      const { hero_title: _heroTitle, layout_mode: _layoutMode, page_type: _pageType, ...fallbackPayload } =
        insertPayload;
      const fallback = await supabase
        .from('pages_drafts')
        .insert(fallbackPayload)
        .select()
        .single();
      createdDraft = fallback.data;
      createdDraftError = fallback.error;
    }

    if (createdDraftError || !createdDraft) {
      return { page: null, blocks: [] as ContentBlock[] };
    }

    draftPage = createdDraft;

    const { data: liveBlocks } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page_id', livePage.id)
      .order('sort_order', { ascending: true });

    if (liveBlocks?.length) {
      // Check if draft blocks already exist to avoid duplicates
      const { data: existingDraftBlocks } = await supabase
        .from('content_blocks_drafts')
        .select('id')
        .eq('page_draft_id', draftPage.id)
        .limit(1);

      if (!existingDraftBlocks?.length) {
        await supabase
          .from('content_blocks_drafts')
          .insert(
            liveBlocks.map((block) => ({
              page_draft_id: draftPage.id,
              block_type: block.block_type,
              content: block.content,
              layout: block.layout,
              sort_order: block.sort_order,
            })),
          );
      }
    }
  }

  const { data: draftBlocks } = await supabase
    .from('content_blocks_drafts')
    .select('*')
    .eq('page_draft_id', draftPage.id)
    .order('sort_order', { ascending: true });

  return {
    page: draftPage as DraftPage,
    blocks: (draftBlocks || []) as ContentBlock[],
  };
}

export async function getPageData(slug: string, draftMode: boolean) {
  if (draftMode) {
    return ensureDrafts(slug);
  }

  const getCachedLivePageData = unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!page) {
        return { page: null, blocks: [] as ContentBlock[] };
      }

      const { data: blocks } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('sort_order', { ascending: true });

      return {
        page: page as Page,
        blocks: (blocks || []) as ContentBlock[],
      };
    },
    ['page-data', slug],
    { tags: [`page:${slug}`] }
  );

  return getCachedLivePageData();
}
