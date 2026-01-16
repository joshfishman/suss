'use client';

import { ContentBlock, HeaderContent, ImageContent, VimeoContent, TextContent } from '@/lib/types/content';
import { ImageBlock } from './image-block';
import { VimeoBlock } from './vimeo-block';
import { TextBlock } from './text-block';
import { HeaderBlock } from './header-block';

interface BlockRendererProps {
  block: ContentBlock;
  isEditing?: boolean;
}

export function BlockRenderer({ block, isEditing = false }: BlockRendererProps) {
  switch (block.block_type) {
    case 'image':
      return <ImageBlock content={block.content as ImageContent} isEditing={isEditing} />;
    case 'vimeo':
      return <VimeoBlock content={block.content as VimeoContent} isEditing={isEditing} />;
    case 'text':
      return <TextBlock content={block.content as TextContent} isEditing={isEditing} />;
    case 'header':
      return <HeaderBlock content={block.content as HeaderContent} isEditing={isEditing} />;
    default:
      return null;
  }
}
