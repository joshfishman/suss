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
        return 'text-3xl md:text-5xl font-bold text-white';
      case 'caption':
        return 'text-sm md:text-base text-white/70';
      default:
        return 'text-base md:text-lg text-white';
    }
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-start px-0 py-4 bg-black"
      dir="ltr"
      style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
    >
      <div
        dir="ltr"
        className={`${getClassName()} w-full`}
        style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
        dangerouslySetInnerHTML={{ __html: `<div dir="ltr" style="direction:ltr;text-align:left;unicode-bidi:isolate">${content.html}</div>` }}
      />
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Text
        </div>
      )}
    </div>
  );
}
