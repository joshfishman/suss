'use client';

import type { Ref } from 'react';

import { TextContent } from '@/lib/types/content';

interface TextBlockProps {
  content: TextContent;
  isEditing?: boolean;
  onChange?: (content: TextContent) => void;
  measureRef?: Ref<HTMLDivElement>;
}

export function TextBlock({ content, isEditing = false, onChange, measureRef }: TextBlockProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col justify-start bg-black text-white"
      dir="ltr"
    >
      <div ref={measureRef} className="w-full py-10 px-0">
        <h3
          dir="ltr"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (!onChange) return;
            onChange({
              ...content,
              header: e.currentTarget.textContent || '',
            });
          }}
          onMouseDown={(e) => isEditing && e.stopPropagation()}
          className={`text-3xl md:text-5xl font-extralight tracking-tight outline-none focus:bg-transparent rounded text-left ${isEditing ? 'cursor-text' : ''}`}
          data-placeholder="Header"
        >
          {content.header || ''}
        </h3>
        {content.description || isEditing ? (
          <p
            dir="ltr"
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => {
              if (!onChange) return;
              onChange({
                ...content,
                description: e.currentTarget.textContent || '',
              });
            }}
            onMouseDown={(e) => isEditing && e.stopPropagation()}
            className={`text-base md:text-lg text-white/70 mt-4 outline-none focus:bg-transparent rounded text-left ${isEditing ? 'cursor-text' : ''}`}
            data-placeholder="Description"
          >
            {content.description || ''}
          </p>
        ) : null}
      </div>
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Text
        </div>
      )}
    </div>
  );
}
