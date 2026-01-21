'use client';

import type { Ref } from 'react';

import { TextContent } from '@/lib/types/content';

interface TextBlockProps {
  content: TextContent;
  isEditing?: boolean;
  onChange?: (content: TextContent) => void;
  measureRef?: Ref<HTMLDivElement>;
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

export function TextBlock({ content, isEditing = false, onChange, measureRef }: TextBlockProps) {
  return (
    <div
      className={`relative w-full h-full flex flex-col justify-start bg-black text-white transition-colors ${isEditing ? 'group hover:bg-zinc-950' : ''}`}
      dir="ltr"
    >
      <div ref={measureRef} className="w-full py-10 px-0">
        {(content.header || isEditing) && (
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
            onBlur={(e) => {
              if (!onChange) return;
              onChange({
                ...content,
                header: e.currentTarget.textContent || '',
              });
            }}
            onPaste={handlePlainTextPaste}
            onMouseDown={(e) => isEditing && e.stopPropagation()}
            className={`text-3xl md:text-5xl font-extralight tracking-tight outline-none rounded text-left transition-colors ${isEditing ? 'cursor-text hover:bg-zinc-900 focus:bg-zinc-900 px-2 -mx-2' : ''}`}
            data-placeholder="Header"
          >
            {content.header || ''}
          </h3>
        )}
        {(content.description || isEditing) && (
          <p
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
              if (!onChange) return;
              onChange({
                ...content,
                description: e.currentTarget.innerHTML || '',
              });
            }}
            onPaste={handleFormattedPaste}
            onMouseDown={(e) => isEditing && e.stopPropagation()}
            className={`text-base md:text-lg text-white/70 outline-none rounded text-left transition-colors [&_a]:underline [&_a]:text-white/90 ${isEditing ? 'cursor-text hover:bg-zinc-900 focus:bg-zinc-900 px-2 -mx-2' : ''} ${content.header || isEditing ? 'mt-4' : ''}`}
            data-placeholder="Description"
            dangerouslySetInnerHTML={{ __html: content.description || '' }}
          />
        )}
      </div>
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Text
        </div>
      )}
    </div>
  );
}
