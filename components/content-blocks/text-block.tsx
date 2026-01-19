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
  document.execCommand('insertText', false, text);
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
    document.execCommand('insertHTML', false, temp.innerHTML);
  } else {
    document.execCommand('insertText', false, text);
  }
}

export function TextBlock({ content, isEditing = false, onChange, measureRef }: TextBlockProps) {
  return (
    <div
      className={`relative w-full h-full flex flex-col justify-start bg-black text-white transition-colors ${isEditing ? 'hover:bg-white/5' : ''}`}
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
          onPaste={handlePlainTextPaste}
          onMouseDown={(e) => isEditing && e.stopPropagation()}
          className={`text-3xl md:text-5xl font-extralight tracking-tight outline-none rounded text-left transition-colors ${isEditing ? 'cursor-text hover:bg-white/10 focus:bg-white/10 px-2 -mx-2' : ''}`}
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
                description: e.currentTarget.innerHTML || '',
              });
            }}
            onPaste={handleFormattedPaste}
            onMouseDown={(e) => isEditing && e.stopPropagation()}
            className={`text-base md:text-lg text-white/70 mt-4 outline-none rounded text-left transition-colors [&_a]:underline [&_a]:text-white/90 ${isEditing ? 'cursor-text hover:bg-white/10 focus:bg-white/10 px-2 -mx-2' : ''}`}
            data-placeholder="Description"
            dangerouslySetInnerHTML={{ __html: content.description || '' }}
          />
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
