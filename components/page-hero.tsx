'use client';

import type { Ref } from 'react';

interface PageHeroProps {
  title: string;
  description?: string | null;
  isEditing?: boolean;
  onTitleChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  titleRef?: Ref<HTMLHeadingElement>;
  descriptionRef?: Ref<HTMLParagraphElement>;
}

// Paste plain text only
function handlePlainTextPaste(e: React.ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
}

export function PageHero({
  title,
  description,
  isEditing = false,
  onTitleChange,
  onDescriptionChange,
  titleRef,
  descriptionRef,
}: PageHeroProps) {
  const showDescription = isEditing || Boolean(description);

  return (
    <>
      <h1
        ref={titleRef}
        dir="ltr"
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={(e) => {
          if (!onTitleChange) return;
          onTitleChange(e.currentTarget.textContent || '');
        }}
        onPaste={handlePlainTextPaste}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        className={`text-5xl md:text-7xl font-extralight tracking-tight mb-6 outline-none ${
          isEditing ? 'focus:bg-gray-800 rounded px-2 -mx-2 transition-colors cursor-text text-left' : ''
        }`}
        data-placeholder={isEditing ? 'Page Title' : undefined}
      >
        {title}
      </h1>
      {showDescription && (
        <p
          ref={descriptionRef}
          dir="ltr"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (!onDescriptionChange) return;
            onDescriptionChange(e.currentTarget.textContent || '');
          }}
          onPaste={handlePlainTextPaste}
          className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl outline-none ${
            isEditing
              ? 'text-white/70 focus:bg-gray-800 rounded px-2 -mx-2 transition-colors cursor-text text-left'
              : 'text-muted-foreground'
          }`}
          data-placeholder={isEditing ? 'Click to add a description...' : undefined}
        >
          {description || ''}
        </p>
      )}
    </>
  );
}
