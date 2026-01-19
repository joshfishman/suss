'use client';

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

export function HeaderBlock({ content, isEditing = false, onChange }: HeaderBlockProps) {
  return (
    <div
      className={`relative w-full h-full flex flex-col justify-center p-6 bg-black text-white transition-colors ${isEditing ? 'group hover:bg-zinc-950' : ''}`}
      dir="ltr"
    >
      {(content.header || isEditing) && (
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
          className={`text-3xl md:text-5xl font-extralight tracking-tight outline-none rounded px-2 -mx-2 text-left transition-colors ${isEditing ? 'cursor-text hover:bg-zinc-900 focus:bg-zinc-900' : ''}`}
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
          onBlur={(e) => {
            if (!onChange) return;
            onChange({
              ...content,
              description: e.currentTarget.innerHTML || '',
            });
          }}
          onPaste={handleFormattedPaste}
          onMouseDown={(e) => isEditing && e.stopPropagation()}
          className={`text-base md:text-lg text-white/70 outline-none rounded px-2 -mx-2 text-left transition-colors [&_a]:underline [&_a]:text-white/90 ${isEditing ? 'cursor-text hover:bg-zinc-900 focus:bg-zinc-900' : ''} ${content.header || isEditing ? 'mt-4' : ''}`}
          data-placeholder="Description"
          dangerouslySetInnerHTML={{ __html: content.description || '' }}
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
