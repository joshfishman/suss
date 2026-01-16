'use client';

import { ImageContent } from '@/lib/types/content';
import { ImageIcon } from 'lucide-react';

interface ImageBlockProps {
  content: ImageContent;
  isEditing?: boolean;
}

export function ImageBlock({ content, isEditing = false }: ImageBlockProps) {
  // Show placeholder if no image URL
  if (!content.url) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No image selected</p>
        </div>
        {isEditing && (
          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            Image
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full group">
      <img
        src={content.url}
        alt={content.alt || ''}
        className="w-full h-auto object-contain"
      />
      {content.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
          {content.caption}
        </div>
      )}
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Image
        </div>
      )}
    </div>
  );
}
