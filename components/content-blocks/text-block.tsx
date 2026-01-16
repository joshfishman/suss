'use client';

import { TextContent } from '@/lib/types/content';

interface TextBlockProps {
  content: TextContent;
  isEditing?: boolean;
}

export function TextBlock({ content, isEditing = false }: TextBlockProps) {
  const getClassName = () => {
    switch (content.style) {
      case 'heading':
        return 'text-3xl md:text-5xl font-bold';
      case 'caption':
        return 'text-sm md:text-base text-muted-foreground';
      default:
        return 'text-base md:text-lg';
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div
        dir="ltr"
        className={`${getClassName()} text-left`}
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Text
        </div>
      )}
    </div>
  );
}
