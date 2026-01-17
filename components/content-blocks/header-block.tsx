'use client';

import { HeaderContent } from '@/lib/types/content';

interface HeaderBlockProps {
  content: HeaderContent;
  isEditing?: boolean;
  onChange?: (content: HeaderContent) => void;
}

export function HeaderBlock({ content, isEditing = false, onChange }: HeaderBlockProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col justify-center p-6 bg-black text-white"
      dir="ltr"
    >
      <h3
        dir="ltr"
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={(e) => {
          if (!onChange) return;
          onChange({
            ...content,
            header: e.currentTarget.textContent || '',
          });
        }}
        className="text-3xl md:text-5xl font-extralight tracking-tight outline-none focus:bg-transparent rounded px-2 -mx-2 text-left"
        data-placeholder="Header"
      >
        {content.header || ''}
      </h3>
      {content.description || isEditing ? (
        <p
          dir="ltr"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) => {
            if (!onChange) return;
            onChange({
              ...content,
              description: e.currentTarget.textContent || '',
            });
          }}
          className="text-base md:text-lg text-white/70 mt-4 outline-none focus:bg-transparent rounded px-2 -mx-2 text-left"
          data-placeholder="Description"
        >
          {content.description || ''}
        </p>
      ) : null}
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Header
        </div>
      )}
    </div>
  );
}
