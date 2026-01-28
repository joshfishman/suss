'use client';

import type { Ref } from 'react';

import { ContentBlock, ImageContent, VimeoContent, TextContent } from '@/lib/types/content';
import { ImageBlock } from './image-block';
import { VimeoBlock } from './vimeo-block';
import { TextBlock } from './text-block';

interface BlockRendererProps {
  block: ContentBlock;
  isEditing?: boolean;
  onTextChange?: (blockId: string, content: TextContent) => void;
  textMeasureRef?: Ref<HTMLDivElement>;
}

export function BlockRenderer({
  block,
  isEditing = false,
  onTextChange,
  textMeasureRef,
}: BlockRendererProps) {
  switch (block.block_type) {
    case 'image':
      return <ImageBlock content={block.content as ImageContent} isEditing={isEditing} />;
    case 'vimeo':
      return <VimeoBlock content={block.content as VimeoContent} isEditing={isEditing} />;
    case 'text':
    default:
      // Treat 'text' and any legacy 'header' blocks as text
      return (
        <TextBlock
          content={block.content as TextContent}
          isEditing={isEditing}
          onChange={(content) => onTextChange?.(block.id, content)}
          measureRef={textMeasureRef}
        />
      );
  }
}
