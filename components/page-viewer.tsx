'use client';

import { ContentBlock } from '@/lib/types/content';
import { BlockRenderer } from './content-blocks/block-renderer';

interface PageViewerProps {
  blocks: ContentBlock[];
}

export function PageViewer({ blocks }: PageViewerProps) {
  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No content yet</p>
      </div>
    );
  }

  // Convert blocks to grid layout
  return (
    <div className="relative w-full">
      {blocks.map((block) => {
        const { x, y, w, h } = block.layout;
        
        // Calculate positioning based on a 12-column grid
        const leftPercent = (x / 12) * 100;
        const widthPercent = (w / 12) * 100;
        const topPx = y * 100; // Each grid row is 100px
        const heightPx = h * 100;

        return (
          <div
            key={block.id}
            className="absolute"
            style={{
              left: `${leftPercent}%`,
              top: `${topPx}px`,
              width: `${widthPercent}%`,
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
          height: `${Math.max(...blocks.map(b => (b.layout.y + b.layout.h) * 100))}px`,
        }}
      />
    </div>
  );
}
