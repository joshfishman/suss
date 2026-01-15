'use client';

import { ContentBlock } from '@/lib/types/content';
import { BlockRenderer } from './content-blocks/block-renderer';

interface PageViewerProps {
  blocks: ContentBlock[];
}

const ROW_HEIGHT = 50;
const GAP = 16;

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
          
          // Calculate positioning based on a 4-column grid with 50px rows
          const leftPercent = (x / 4) * 100;
          const widthPercent = (w / 4) * 100;
          const topPx = y * ROW_HEIGHT + y * GAP;
          const heightPx = h * ROW_HEIGHT + (h - 1) * GAP;

          return (
            <div
              key={block.id}
              className="absolute rounded-lg overflow-hidden"
              style={{
                left: `calc(${leftPercent}% + ${x * (GAP / 4)}px)`,
                top: `${topPx}px`,
                width: `calc(${widthPercent}% - ${GAP - (w * (GAP / 4))}px)`,
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
            height: `${Math.max(...blocks.map(b => (b.layout.y + b.layout.h) * ROW_HEIGHT + b.layout.y * GAP))}px`,
          }}
        />
      </div>
    </div>
  );
}
