'use client';

import { ContentBlock } from '@/lib/types/content';
import { BlockRenderer } from './content-blocks/block-renderer';

interface PageViewerProps {
  blocks: ContentBlock[];
}

export function PageViewer({ blocks }: PageViewerProps) {
  if (blocks.length === 0) {
    return null;
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
    <div className="container mx-auto px-8">
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
    </div>
  );
}
