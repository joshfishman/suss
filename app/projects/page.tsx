import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BlockRenderer } from '@/components/content-blocks/block-renderer';
import { PageShell } from '@/components/page-shell';
import { ContentBlock } from '@/lib/types/content';

async function getProjects() {
  const supabase = await createClient();

  let { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('*')
    .eq('page_type', 'project')
    .order('created_at', { ascending: false });

  if (pagesError && /page_type/i.test(pagesError.message)) {
    const fallback = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false });
    pages = fallback.data || [];
    pagesError = fallback.error;
  }

  if (pagesError || !pages?.length) {
    return [];
  }

  const filteredPages = pages.filter(
    (page) => page.page_type === 'project' || page.slug?.startsWith('project-')
  );
  if (!filteredPages.length) {
    return [];
  }

  const pageIds = filteredPages.map((page) => page.id);
  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('*')
    .in('page_id', pageIds)
    .order('sort_order', { ascending: true });

  const firstBlockByPage = new Map<string, ContentBlock>();
  for (const block of blocks || []) {
    if (!firstBlockByPage.has(block.page_id)) {
      firstBlockByPage.set(block.page_id, block as ContentBlock);
    }
  }

  return filteredPages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description || '',
    first_block: firstBlockByPage.get(page.id) || null,
  }));
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <PageShell>
      <section className="container mx-auto px-8 pb-24">
        <div className="mb-10" style={{ direction: 'ltr', textAlign: 'left' }}>
          <h1
            className="text-5xl md:text-7xl font-extralight tracking-tight mb-6 text-white"
            style={{ direction: 'ltr', textAlign: 'left' }}
          >
            Projects
          </h1>
          <p
            className="text-lg md:text-xl font-light text-white/70 leading-relaxed max-w-2xl"
            style={{ direction: 'ltr', textAlign: 'left' }}
          >
            A curated selection of our latest work.
          </p>
        </div>
        {projects.length === 0 ? (
          <p className="text-white/60 text-sm">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => {
              const firstBlock = project.first_block;
              const isVimeo = firstBlock?.block_type === 'vimeo';

              return (
                <div key={project.id} className="group" style={{ direction: 'ltr', textAlign: 'left' }}>
                  <Link
                    href={`/${project.slug}`}
                    className="mb-3 text-lg font-light text-white inline-flex"
                    style={{ direction: 'ltr' }}
                  >
                    {project.title}
                  </Link>
                  {firstBlock ? (
                    isVimeo ? (
                      <div className="rounded-lg overflow-hidden bg-black">
                        <BlockRenderer block={firstBlock} />
                      </div>
                    ) : (
                      <Link href={`/${project.slug}`} className="block rounded-lg overflow-hidden bg-black">
                        <BlockRenderer block={firstBlock} />
                      </Link>
                    )
                  ) : (
                    <div className="rounded-lg bg-white/5 text-white/60 text-sm p-6">
                      No preview yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
