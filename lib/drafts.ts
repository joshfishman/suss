import { createClient } from '@/lib/supabase/server';
import { ContentBlock, Page } from '@/lib/types/content';

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
    return { page: null, blocks: [] as ContentBlock[] };
  }

  let { data: draftPage } = await supabase
    .from('pages_drafts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!draftPage) {
    const { data: createdDraft, error: createdDraftError } = await supabase
      .from('pages_drafts')
      .insert({
        slug: livePage.slug,
        title: livePage.title,
        description: livePage.description,
        layout_mode: livePage.layout_mode || 'snap',
        published_page_id: livePage.id,
        page_type: livePage.page_type || 'page',
      })
      .select()
      .single();

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
  const supabase = await createClient();

  if (draftMode) {
    return ensureDrafts(slug);
  }

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
}
