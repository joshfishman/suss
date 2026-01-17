'use client';

import { ContentBlock } from '@/lib/types/content';
import { BlockRenderer } from './content-blocks/block-renderer';
import { PageTemplate } from './page-template';
import { PageHero } from './page-hero';

interface PageViewerProps {
  title: string;
  description?: string | null;
  blocks: ContentBlock[];
}

export function PageViewer({ title, description, blocks }: PageViewerProps) {
  if (blocks.length === 0) {
    return (
      <PageTemplate
        readOnly
        hero={<PageHero title={title} description={description} />}
        content={null}
      />
    );
  }

  const getColSpanClass = (w: number) => {
    switch (w) {
      case 1:
        return 'col-span-1';
      case 2:
        return 'col-span-2';
      case 3:
        return 'col-span-3';
      default:
        return 'col-span-4';
    }
  };

  return (
    <PageTemplate
      readOnly
      hero={<PageHero title={title} description={description} />}
      content={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`rounded-lg overflow-hidden ${getColSpanClass(block.layout.w)} md:${getColSpanClass(block.layout.w)}`}
            >
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      }
    />
  );
}
