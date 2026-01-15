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

  // Convert blocks to grid layout using 4-column system
  return (
    <div className="container mx-auto px-8">
      <div className="relative w-full">
        {blocks.map((block) => {
          const { x, y, w, h } = block.layout;
          
          // Calculate positioning based on a 4-column grid
          const leftPercent = (x / 4) * 100;
          const widthPercent = (w / 4) * 100;
          const topPx = y * 150 + y * 16; // Each grid row is 150px with 16px gap
          const heightPx = h * 150 + (h - 1) * 16;

          return (
            <div
              key={block.id}
              className="absolute"
              style={{
                left: `calc(${leftPercent}% + ${x * 4}px)`,
                top: `${topPx}px`,
                width: `calc(${widthPercent}% - ${16 - (w * 4)}px)`,
                height: `${heightPx}px`,
              }}
            >
              <BlockRenderer block={block} />
            </div>
          );
        })}
        {/* Add spacer for total height */}
        <div
          style={{
            height: `${Math.max(...blocks.map(b => (b.layout.y + b.layout.h) * 150 + b.layout.y * 16))}px`,
          }}
        />
      </div>
    </div>
  );
}
