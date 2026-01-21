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
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(text));
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
        onInput={(e) => {
          if (!onTitleChange) return;
          onTitleChange(e.currentTarget.textContent || '');
        }}
        onBlur={(e) => {
          if (!onTitleChange) return;
          onTitleChange(e.currentTarget.textContent || '');
        }}
        onPaste={handlePlainTextPaste}
        className={`text-5xl md:text-7xl font-extralight tracking-tight mb-6 outline-none whitespace-pre-wrap ${
          isEditing ? 'hover:bg-zinc-900 focus:bg-zinc-900 rounded px-2 -mx-2 transition-colors cursor-text text-left' : ''
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
          onInput={(e) => {
            if (!onDescriptionChange) return;
            onDescriptionChange(e.currentTarget.textContent || '');
          }}
          onBlur={(e) => {
            if (!onDescriptionChange) return;
            onDescriptionChange(e.currentTarget.textContent || '');
          }}
          onPaste={handlePlainTextPaste}
          className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl outline-none whitespace-pre-wrap ${
            isEditing
              ? 'text-white/70 hover:bg-zinc-900 focus:bg-zinc-900 rounded px-2 -mx-2 transition-colors cursor-text text-left'
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
