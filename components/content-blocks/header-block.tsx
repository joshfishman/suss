import { HeaderContent } from '@/lib/types/content';

interface HeaderBlockProps {
  content: HeaderContent;
  isEditing?: boolean;
}

export function HeaderBlock({ content, isEditing = false }: HeaderBlockProps) {
  return (
    <div className="relative w-full h-full flex flex-col justify-center p-6">
      <h3 className="text-3xl md:text-5xl font-extralight tracking-tight">
        {content.header || 'Header'}
      </h3>
      <p className="text-base md:text-lg text-white/70 mt-4">
        {content.description || 'Description'}
      </p>
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Header
        </div>
      )}
    </div>
  );
}
