'use client';

import { useEffect, useRef } from 'react';
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
  const titleElRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionElRef = useRef<HTMLParagraphElement | null>(null);
  const titleFocusedRef = useRef(false);
  const descriptionFocusedRef = useRef(false);

  useEffect(() => {
    if (!titleElRef.current || titleFocusedRef.current) return;
    titleElRef.current.textContent = title || '';
  }, [title]);

  useEffect(() => {
    if (!descriptionElRef.current || descriptionFocusedRef.current) return;
    descriptionElRef.current.textContent = description || '';
  }, [description]);

  return (
    <>
      <h1
        ref={(node) => {
          titleElRef.current = node;
          if (typeof titleRef === 'function') {
            titleRef(node);
          } else if (titleRef) {
            (titleRef as React.MutableRefObject<HTMLHeadingElement | null>).current = node;
          }
        }}
        dir="ltr"
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={(e) => {
          if (!onTitleChange) return;
          onTitleChange(e.currentTarget.textContent || '');
        }}
        onBlur={(e) => {
          titleFocusedRef.current = false;
          if (!onTitleChange) return;
          onTitleChange(e.currentTarget.textContent || '');
        }}
        onPaste={handlePlainTextPaste}
        onFocus={() => {
          titleFocusedRef.current = true;
        }}
        className={`text-5xl md:text-7xl font-extralight tracking-tight mb-6 outline-none whitespace-pre-wrap ${
          isEditing ? 'hover:bg-zinc-900 focus:bg-zinc-900 rounded px-2 -mx-2 transition-colors cursor-text text-left' : ''
        }`}
        data-placeholder={isEditing ? 'Page Title' : undefined}
      />
      {showDescription && (
        <p
          ref={(node) => {
            descriptionElRef.current = node;
            if (typeof descriptionRef === 'function') {
              descriptionRef(node);
            } else if (descriptionRef) {
              (descriptionRef as React.MutableRefObject<HTMLParagraphElement | null>).current = node;
            }
          }}
          dir="ltr"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) => {
            if (!onDescriptionChange) return;
            onDescriptionChange(e.currentTarget.textContent || '');
          }}
          onBlur={(e) => {
            descriptionFocusedRef.current = false;
            if (!onDescriptionChange) return;
            onDescriptionChange(e.currentTarget.textContent || '');
          }}
          onPaste={handlePlainTextPaste}
          onFocus={() => {
            descriptionFocusedRef.current = true;
          }}
          className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl outline-none whitespace-pre-wrap ${
            isEditing
              ? 'text-white/70 hover:bg-zinc-900 focus:bg-zinc-900 rounded px-2 -mx-2 transition-colors cursor-text text-left'
              : 'text-muted-foreground'
          }`}
          data-placeholder={isEditing ? 'Click to add a description...' : undefined}
        />
      )}
    </>
  );
}
