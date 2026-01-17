'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Player from '@vimeo/player';
import { VimeoContent } from '@/lib/types/content';
import { Play, Pause, Video } from 'lucide-react';

interface VimeoBlockProps {
  content: VimeoContent;
  isEditing?: boolean;
}

export function VimeoBlock({ content, isEditing = false }: VimeoBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const initPlayer = useCallback(() => {
    if (!iframeRef.current || !content.vimeo_id || playerRef.current) return;
    try {
      playerRef.current = new Player(iframeRef.current);
      playerRef.current.on('play', () => setIsPlaying(true));
      playerRef.current.on('pause', () => setIsPlaying(false));
      playerRef.current.on('ended', () => setIsPlaying(false));
      playerRef.current.ready().then(() => setPlayerReady(true));
    } catch (error) {
      console.error('Failed to init Vimeo player:', error);
    }
  }, [content.vimeo_id]);

  useEffect(() => {
    // Initialize player immediately when component mounts
    const timer = setTimeout(() => {
      initPlayer();
    }, 100);
    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [initPlayer]);

  const handleTogglePlay = async () => {
    if (!playerRef.current) {
      initPlayer();
      // Wait a bit for player to initialize then play
      setTimeout(async () => {
        if (playerRef.current) {
          try {
            await playerRef.current.play();
          } catch (error) {
            console.error('Vimeo playback failed:', error);
          }
        }
      }, 200);
      return;
    }
    try {
      if (isPlaying) {
        await playerRef.current.pause();
      } else {
        await playerRef.current.play();
      }
    } catch (error) {
      console.error('Vimeo playback failed:', error);
    }
  };

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

  const showControls = isEditing || isHovering || !isPlaying;

  return (
    <div
      ref={containerRef}
      className="relative w-full group overflow-hidden bg-black"
      style={{
        // Use paddingBottom trick for aspect ratio when not in editor
        paddingBottom: isEditing ? undefined : '56.25%',
        height: isEditing ? '100%' : 0,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={() => {
        if (!isEditing) {
          handleTogglePlay();
        }
      }}
    >
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${content.vimeo_id}?title=0&byline=0&portrait=0&controls=0&background=0`}
        className="absolute top-0 left-0 w-full h-full border-0 bg-black z-0 pointer-events-none"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
      />
      {/* Top edge cover to hide Vimeo letterbox line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-black z-[1]" />
      {!isEditing && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleTogglePlay();
          }}
          className={`absolute inset-0 z-10 flex items-center justify-center bg-black/30 text-white transition-opacity ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ pointerEvents: showControls ? 'auto' : 'none' }}
        >
          {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
        </button>
      )}
      {content.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm z-20">
          {content.caption}
        </div>
      )}
      {isEditing && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded z-20">
          Vimeo
        </div>
      )}
    </div>
  );
}
