import { HeaderContent } from '@/lib/types/content';

interface HeaderBlockProps {
  content: HeaderContent;
  isEditing?: boolean;
  onChange?: (content: HeaderContent) => void;
}

export function HeaderBlock({ content, isEditing = false, onChange }: HeaderBlockProps) {
  return (
    <div className="relative w-full h-full flex flex-col justify-center p-6">
      <h3
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={(e) => {
          if (!onChange) return;
          onChange({
            ...content,
            header: e.currentTarget.textContent || '',
          });
        }}
        className="text-3xl md:text-5xl font-extralight tracking-tight outline-none focus:bg-gray-800/60 rounded px-2 -mx-2"
        data-placeholder="Header"
      >
        {content.header || ''}
      </h3>
      {content.description ? (
        <p
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (!onChange) return;
            onChange({
              ...content,
              description: e.currentTarget.textContent || '',
            });
          }}
          className="text-base md:text-lg text-white/70 mt-4 outline-none focus:bg-gray-800/60 rounded px-2 -mx-2"
          data-placeholder="Description"
        >
          {content.description}
        </p>
      ) : isEditing ? (
        <p
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            if (!onChange) return;
            onChange({
              ...content,
              description: e.currentTarget.textContent || '',
            });
          }}
          className="text-base md:text-lg text-white/70 mt-4 outline-none focus:bg-gray-800/60 rounded px-2 -mx-2"
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
