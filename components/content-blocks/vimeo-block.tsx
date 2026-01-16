'use client';

import { VimeoContent } from '@/lib/types/content';
import { Video } from 'lucide-react';

interface VimeoBlockProps {
  content: VimeoContent;
  isEditing?: boolean;
}

export function VimeoBlock({ content, isEditing = false }: VimeoBlockProps) {
  // Show placeholder if no Vimeo ID
  if (!content.vimeo_id) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-400">
          <Video className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No video ID set</p>
        </div>
        {isEditing && (
          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            Vimeo
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video">
      <iframe
        src={`https://player.vimeo.com/video/${content.vimeo_id}?title=0&byline=0&portrait=0`}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
      {content.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
          {content.caption}
        </div>
      )}
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Vimeo
        </div>
      )}
    </div>
  );
}
