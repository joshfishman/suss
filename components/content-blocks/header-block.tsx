'use client';

import { useEffect, useRef } from 'react';
import { HeaderContent } from '@/lib/types/content';

interface HeaderBlockProps {
  content: HeaderContent;
  isEditing?: boolean;
  onChange?: (content: HeaderContent) => void;
}

// Paste plain text only (for headers)
function handlePlainTextPaste(e: React.ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(text));
}

// Paste with allowed formatting (bold, italic, underline, links)
function handleFormattedPaste(e: React.ClipboardEvent) {
  e.preventDefault();
  const html = e.clipboardData.getData('text/html');
  const text = e.clipboardData.getData('text/plain');
  
  if (html) {
    // Parse HTML and keep only allowed tags
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all elements except allowed ones
    const walk = (node: Node) => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();
          const allowed = ['b', 'strong', 'i', 'em', 'u', 'a'];
          
          if (allowed.includes(tag)) {
            // Keep only href for links, remove all other attributes
            if (tag === 'a') {
              const href = el.getAttribute('href');
              Array.from(el.attributes).forEach(attr => el.removeAttribute(attr.name));
              if (href) el.setAttribute('href', href);
              el.setAttribute('target', '_blank');
              el.setAttribute('rel', 'noopener noreferrer');
            } else {
              // Remove all attributes from other allowed tags
              Array.from(el.attributes).forEach(attr => el.removeAttribute(attr.name));
            }
            walk(child);
          } else {
            // Replace disallowed element with its children
            const fragment = document.createDocumentFragment();
            while (el.firstChild) {
              fragment.appendChild(el.firstChild);
            }
            node.replaceChild(fragment, child);
            // Re-walk since we modified the DOM
            walk(node);
            return;
          }
        }
      }
    };
    
    walk(temp);
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = range.createContextualFragment(temp.innerHTML);
    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(text));
  }
}

export function HeaderBlock({ content, isEditing = false, onChange }: HeaderBlockProps) {
  const headerRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const headerFocusedRef = useRef(false);
  const descriptionFocusedRef = useRef(false);

  useEffect(() => {
    if (!headerRef.current || headerFocusedRef.current) return;
    headerRef.current.textContent = content.header || '';
  }, [content.header]);

  useEffect(() => {
    if (!descriptionRef.current || descriptionFocusedRef.current) return;
    descriptionRef.current.innerHTML = content.description || '';
  }, [content.description]);

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-center p-6 bg-black text-white transition-colors ${isEditing ? 'group hover:bg-zinc-950' : ''}`}
      dir="ltr"
    >
      {(content.header || isEditing) && (
        <h3
          ref={headerRef}
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
          onBlur={(e) => {
            headerFocusedRef.current = false;
            if (!onChange) return;
            onChange({
              ...content,
              header: e.currentTarget.textContent || '',
            });
          }}
          onPaste={handlePlainTextPaste}
          onMouseDown={(e) => isEditing && e.stopPropagation()}
          onFocus={() => {
            headerFocusedRef.current = true;
          }}
          className={`text-3xl md:text-5xl font-extralight tracking-tight outline-none rounded px-2 -mx-2 text-left transition-colors whitespace-pre-wrap ${isEditing ? 'cursor-text hover:bg-zinc-900 focus:bg-zinc-900' : ''}`}
          data-placeholder="Header"
        />
      )}
      {(content.description || isEditing) && (
        <p
          ref={descriptionRef}
          dir="ltr"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) => {
            if (!onChange) return;
            onChange({
              ...content,
              description: e.currentTarget.innerHTML || '',
            });
          }}
          onBlur={(e) => {
            descriptionFocusedRef.current = false;
            if (!onChange) return;
            onChange({
              ...content,
              description: e.currentTarget.innerHTML || '',
            });
          }}
          onPaste={handleFormattedPaste}
          onMouseDown={(e) => isEditing && e.stopPropagation()}
          onFocus={() => {
            descriptionFocusedRef.current = true;
          }}
          className={`text-base md:text-lg text-white/70 outline-none rounded px-2 -mx-2 text-left transition-colors [&_a]:underline [&_a]:text-white/90 ${isEditing ? 'cursor-text hover:bg-zinc-900 focus:bg-zinc-900' : ''} ${content.header || isEditing ? 'mt-4' : ''}`}
          data-placeholder="Description"
        />
      )}
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Header
        </div>
      )}
    </div>
  );
}
