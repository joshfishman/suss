'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Rnd } from 'react-rnd';
import { Page, ContentBlock } from '@/lib/types/content';
import {
  GRID_COLS,
  GRID_GAP,
  clampGridX,
  colWidth,
  gridToPxW,
  gridToPxX,
  gridToPxY,
  pxToGridW,
  pxToGridX,
  ratioToPxH,
} from '@/lib/grid';
import { BlockRenderer } from '@/components/content-blocks/block-renderer';
import { BlockEditorModal } from './block-editor-modal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Edit, Video, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

interface ImageItem {
  id: string;
  layoutId: string;
  url: string;
}

function createBlockId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sizesChanged(
  prev: Record<string, { width: number; height: number }>,
  next: Record<string, { width: number; height: number }>
) {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return true;
  for (const key of nextKeys) {
    const prevSize = prev[key];
    const nextSize = next[key];
    if (!prevSize || !nextSize) return true;
    if (prevSize.width !== nextSize.width || prevSize.height !== nextSize.height) {
      return true;
    }
  }
  return false;
}


function isOverlapping(
  currentId: string,
  next: { x: number; y: number; w: number; h: number },
  blocks: ContentBlock[]
) {
  return blocks.some((block) => {
    if (block.id === currentId) return false;
    const other = block.layout;
    const overlapX = next.x < other.x + other.w && next.x + next.w > other.x;
    const overlapY = next.y < other.y + other.h && next.y + next.h > other.y;
    return overlapX && overlapY;
  });
}

function normalizeInitialBlocks(blocks: ContentBlock[]) {
  const seen = new Set<string>();
  return blocks.map((block) => {
    let key = block.layout?.i || block.id || createBlockId('block');
    if (seen.has(key)) {
      key = createBlockId('block');
    }
    seen.add(key);
    const isLegacyGrid = block.layout?.h <= 10 && block.layout?.y <= 50;
    const nextLayout = {
      ...block.layout,
      i: key,
      y: isLegacyGrid ? gridToPxY(block.layout.y) : block.layout.y,
      h: isLegacyGrid ? gridToPxY(block.layout.h) : block.layout.h,
    };
    return {
      ...block,
      layout: nextLayout,
    };
  });
}

interface PageEditorProps {
  page: Page & { published_page_id?: string | null };
  initialBlocks: ContentBlock[];
  draftMode?: boolean;
  editOnPublic?: boolean;
  exitHref?: string;
  readOnly?: boolean;
}

export function PageEditor({
  page,
  initialBlocks,
  draftMode = false,
  editOnPublic = false,
  exitHref,
  readOnly = false,
}: PageEditorProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => normalizeInitialBlocks(initialBlocks));
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showEditControls, setShowEditControls] = useState(!readOnly);
  const [activeUploadBlockId, setActiveUploadBlockId] = useState<string | null>(null);
  const [editorInitialTab, setEditorInitialTab] = useState<'upload' | 'existing'>('upload');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({ title: page.title, description: page.description || '', blocks: initialBlocks });
  const lastAttemptRef = useRef({ title: page.title, description: page.description || '', blocks: initialBlocks });
  const lastAttemptHashRef = useRef(JSON.stringify(initialBlocks));
  const isSavingSyncRef = useRef(false);
  const normalizedImageLayoutsRef = useRef(new Set<string>());
  const [measuredSizes, setMeasuredSizes] = useState<Record<string, { width: number; height: number }>>({});
  const measuredSizesRef = useRef<Record<string, { width: number; height: number }>>({});
  const lastImageUrlByLayoutRef = useRef<Record<string, string>>({});
  const imageRatioRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const styles = window.getComputedStyle(containerRef.current);
        const paddingX =
          parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
        const innerWidth = rect.width - paddingX;
        setContainerWidth(Math.max(0, Math.round(innerWidth)));
      }
    };

    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const imageItems = useMemo<ImageItem[]>(() => {
    return blocks
      .filter((block) => block.block_type === 'image')
      .map((block) => {
        const content = block.content as { url?: string };
        return content?.url
          ? { id: block.id, layoutId: block.layout.i, url: content.url }
          : null;
      })
      .filter((item): item is ImageItem => Boolean(item));
  }, [blocks]);

  const blocksHash = useMemo(() => JSON.stringify(blocks), [blocks]);

  useEffect(() => {
    measuredSizesRef.current = measuredSizes;
  }, [measuredSizes]);

  useEffect(() => {
    if (imageItems.length === 0) return;

    let cancelled = false;
    const nextSizes: Record<string, { width: number; height: number }> = {};

    const loadImages = async () => {
      await Promise.all(
        imageItems.map(
          (item) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                nextSizes[item.url] = { width: img.naturalWidth, height: img.naturalHeight };
                resolve();
              };
              img.onerror = () => resolve();
              img.src = item.url;
            })
        )
      );

      if (!cancelled && sizesChanged(measuredSizesRef.current, nextSizes)) {
        setMeasuredSizes(nextSizes);
      }
    };

    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }
    measureTimeoutRef.current = setTimeout(() => {
      loadImages();
    }, 200);
    return () => {
      cancelled = true;
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
      }
    };
  }, [imageItems]);

  useEffect(() => {
    blocks.forEach((block) => {
      if (block.block_type !== 'image') return;
      const content = block.content as { url?: string };
      if (!content?.url) return;

      const prevUrl = lastImageUrlByLayoutRef.current[block.layout.i];
      if (prevUrl && prevUrl !== content.url) {
        // Reset ratio normalization when image changes
        normalizedImageLayoutsRef.current.delete(block.layout.i);
      }
      lastImageUrlByLayoutRef.current[block.layout.i] = content.url;
    });
  }, [blocks]);

  // Auto-save function
  const performSave = useCallback(async () => {
    const draftQuery = draftMode ? '?draft=1' : '';
    setSaveStatus('saving');
    setIsSaving(true);
    isSavingSyncRef.current = true;
    
    try {
      // Save page settings
      await fetch(`/api/pages/${page.slug}${draftQuery}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          published_page_id: page.published_page_id || null,
        }),
      });

      // Delete blocks that were removed
      for (const block of lastSavedRef.current.blocks) {
        if (!block.id.startsWith('temp-') && !blocks.find(b => b.id === block.id)) {
          await fetch(`/api/content-blocks/${block.id}${draftQuery}`, {
            method: 'DELETE',
          });
        }
      }

      // Upsert blocks (create temp blocks, update existing ones)
      const updatedBlocks: ContentBlock[] = [];
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        if (block.id.startsWith('temp-')) {
          const response = await fetch(`/api/content-blocks${draftQuery}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page_id: page.id,
              block_type: block.block_type,
              content: block.content,
              layout: block.layout,
              sort_order: i,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            updatedBlocks.push({ ...block, id: data.id });
          } else {
            updatedBlocks.push(block);
          }
        } else {
          const response = await fetch(`/api/content-blocks/${block.id}${draftQuery}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: block.content,
              layout: block.layout,
              sort_order: i,
            }),
          });

          if (response.ok) {
            let payload: { missing?: boolean } | null = null;
            try {
              payload = await response.json();
            } catch (error) {
              payload = null;
            }

            if (payload?.missing) {
              const recreateResponse = await fetch(`/api/content-blocks${draftQuery}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  page_id: page.id,
                  block_type: block.block_type,
                  content: block.content,
                  layout: block.layout,
                  sort_order: i,
                }),
              });
              if (recreateResponse.ok) {
                const data = await recreateResponse.json();
                updatedBlocks.push({ ...block, id: data.id });
                continue;
              }
            }

            updatedBlocks.push(block);
            continue;
          }

          if (response.status === 404) {
            // Block missing (out-of-sync). Recreate it.
            const recreateResponse = await fetch(`/api/content-blocks${draftQuery}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                page_id: page.id,
                block_type: block.block_type,
                content: block.content,
                layout: block.layout,
                sort_order: i,
              }),
            });
            if (recreateResponse.ok) {
              const data = await recreateResponse.json();
              updatedBlocks.push({ ...block, id: data.id });
              continue;
            }
          }

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update block ${block.id}: ${errorText}`);
          }
          updatedBlocks.push(block);
        }
      }

      if (blocks.some((block) => block.id.startsWith('temp-'))) {
        setBlocks(updatedBlocks);
      }

      lastSavedRef.current = { title, description, blocks: updatedBlocks };
      lastAttemptRef.current = { title, description, blocks: updatedBlocks };
      lastAttemptHashRef.current = JSON.stringify(updatedBlocks);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
      // Prevent retry loop until user makes another change
      lastAttemptRef.current = { title, description, blocks };
      lastAttemptHashRef.current = JSON.stringify(blocks);
    } finally {
      setIsSaving(false);
      // Allow autosave after this cycle completes
      setTimeout(() => {
        isSavingSyncRef.current = false;
      }, 0);
    }
  }, [title, description, blocks, page.slug, page.id, draftMode, page.published_page_id]);

  // Trigger auto-save on changes
  useEffect(() => {
    if (readOnly) return;
    if (isSavingSyncRef.current) return;
    const hasChanges =
      title !== lastAttemptRef.current.title ||
      description !== lastAttemptRef.current.description ||
      blocksHash !== lastAttemptHashRef.current;

    if (hasChanges) {
      setSaveStatus('unsaved');
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        lastAttemptRef.current = { title, description, blocks };
        lastAttemptHashRef.current = blocksHash;
        performSave();
      }, 1500); // Auto-save after 1.5 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, blocksHash, performSave, readOnly]);

  // No aspect ratio tracking (simplified editor)

  const getRatioForBlock = useCallback((block: ContentBlock) => {
    if (block.block_type === 'vimeo') {
      return 16 / 9;
    }
    if (block.block_type === 'image') {
      const content = block.content as { url?: string };
      if (!content?.url) return imageRatioRef.current[block.layout.i] || 1;
      const size = measuredSizes[content.url];
      if (!size) return imageRatioRef.current[block.layout.i] || 1;
      const ratio =
        size.width > 0 && size.height > 0 ? size.width / size.height : NaN;
      if (!Number.isFinite(ratio)) {
        return imageRatioRef.current[block.layout.i] || 1;
      }
      return ratio;
    }
    return null;
  }, [measuredSizes]);

  const getBlockHeightPx = useCallback(
    (block: ContentBlock, widthOverride?: number) => {
      const ratio = getRatioForBlock(block);
      const effectiveW = widthOverride ?? block.layout.w;
      if (ratio) {
        return ratioToPxH(effectiveW, ratio, containerWidth);
      }
      return block.layout.h;
    },
    [getRatioForBlock, containerWidth]
  );

  const isOverlappingWithRatios = useCallback(
    (currentId: string, next: { x: number; y: number; w: number; h: number }) =>
      blocks.some((block) => {
        if (block.id === currentId) return false;
        const otherH = getBlockHeightPx(block);
        const other = { ...block.layout, h: otherH };
        const overlapX = next.x < other.x + other.w && next.x + next.w > other.x;
        const overlapY =
          next.y < other.y + other.h + GRID_GAP &&
          next.y + next.h + GRID_GAP > other.y;
        return overlapX && overlapY;
      }),
    [blocks, getBlockHeightPx]
  );

  const resolveOverlap = useCallback(
    (currentId: string, next: { x: number; y: number; w: number; h: number }) => {
      let candidate = { ...next };
      let safety = 0;
      while (isOverlappingWithRatios(currentId, candidate) && safety < 200) {
        let maxBottom = candidate.y;
        for (const block of blocks) {
          if (block.id === currentId) continue;
          const otherH = getBlockHeightPx(block);
          const overlapX =
            candidate.x < block.layout.x + block.layout.w &&
            candidate.x + candidate.w > block.layout.x;
          if (!overlapX) continue;
          const bottom = block.layout.y + otherH + GRID_GAP;
          if (bottom > maxBottom) maxBottom = bottom;
        }
        candidate = { ...candidate, y: maxBottom };
        safety += 1;
      }
      return candidate;
    },
    [blocks, getBlockHeightPx, isOverlappingWithRatios]
  );

  const resolveAllOverlaps = useCallback(
    (nextBlocks: ContentBlock[]) => {
      const sorted = [...nextBlocks].sort((a, b) => {
        if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
        return a.layout.x - b.layout.x;
      });
      const placed: ContentBlock[] = [];
      const resolvedById = new Map<string, ContentBlock>();
      let changed = false;

      for (const block of sorted) {
        let candidate = { ...block, layout: { ...block.layout } };
        let safety = 0;
        const nextYAfterOverlap = (item: ContentBlock) => {
          const itemH = getBlockHeightPx(item);
          let maxBottom = item.layout.y;
          let hasOverlap = false;
          for (const other of placed) {
            const otherH = getBlockHeightPx(other);
            const overlapX =
              item.layout.x < other.layout.x + other.layout.w &&
              item.layout.x + item.layout.w > other.layout.x;
            if (!overlapX) continue;
            const overlapY =
              item.layout.y < other.layout.y + otherH + GRID_GAP &&
              item.layout.y + itemH + GRID_GAP > other.layout.y;
            if (!overlapY) continue;
            hasOverlap = true;
            const bottom = other.layout.y + otherH + GRID_GAP;
            if (bottom > maxBottom) maxBottom = bottom;
          }
          return hasOverlap ? maxBottom : null;
        };

        while (safety < 200) {
          const nextY = nextYAfterOverlap(candidate);
          if (nextY === null) break;
          candidate = { ...candidate, layout: { ...candidate.layout, y: nextY } };
          safety += 1;
        }

        if (candidate.layout.y !== block.layout.y) {
          changed = true;
        }

        placed.push(candidate);
        resolvedById.set(candidate.id, candidate);
      }

      if (!changed) return nextBlocks;
      return nextBlocks.map((block) => resolvedById.get(block.id) ?? block);
    },
    [getBlockHeightPx]
  );

  useEffect(() => {
    setBlocks((prev) => {
      let changed = false;
      const next = prev.map((block) => {
        if (block.block_type !== 'vimeo') return block;
        const nextH = ratioToPxH(block.layout.w, 16 / 9, containerWidth);
        if (block.layout.h === nextH) return block;
        changed = true;
        return { ...block, layout: { ...block.layout, h: nextH } };
      });
      if (!changed) return prev;
      return resolveAllOverlaps(next);
    });
  }, [containerWidth, resolveAllOverlaps]);

  useEffect(() => {
    if (!Object.keys(measuredSizes).length) return;
    setBlocks((prev) => {
      let changed = false;
      const next = prev.map((block) => {
        if (block.block_type !== 'image') return block;
        const content = block.content as { url?: string };
        if (!content?.url) return block;

        const size = measuredSizes[content.url];
        if (!size) return block;

        if (normalizedImageLayoutsRef.current.has(block.layout.i)) {
          return block;
        }

        const ratio =
          size.width > 0 && size.height > 0 ? size.width / size.height : NaN;
        if (!Number.isFinite(ratio)) {
          return block;
        }
        imageRatioRef.current[block.layout.i] = ratio;
        const newH = ratioToPxH(block.layout.w, ratio, containerWidth);
        if (block.layout.h !== newH) {
          changed = true;
          normalizedImageLayoutsRef.current.add(block.layout.i);
          return {
            ...block,
            layout: { ...block.layout, h: newH },
          };
        }

        normalizedImageLayoutsRef.current.add(block.layout.i);
        return block;
      });

      if (!changed) return prev;
      return resolveAllOverlaps(next);
    });
  }, [measuredSizes, containerWidth, resolveAllOverlaps]);

  const handleAddBlock = useCallback((type: 'image' | 'vimeo') => {
    // Find first row (y=0) and calculate used width there
    const firstRowBlocks = blocks.filter(b => b.layout.y === 0);
    const usedWidth = firstRowBlocks.reduce((sum, b) => sum + b.layout.w, 0);
    
    // If there's space in the first row, add there; otherwise start a new row
    const nextX = usedWidth < GRID_COLS ? usedWidth : 0;
    const maxBottomY = blocks.length
      ? Math.max(...blocks.map((b) => b.layout.y + getBlockHeightPx(b)))
      : 0;
    const nextY = usedWidth < GRID_COLS ? 0 : maxBottomY;

    const blockId = createBlockId('block');
    
    // Simple default sizing
    const blockW = 2;
    const blockH =
      type === 'vimeo' ? ratioToPxH(blockW, 16 / 9, containerWidth) : ratioToPxH(blockW, 1, containerWidth);

    const newBlock: ContentBlock = {
      id: createBlockId('temp'),
      page_id: page.id,
      block_type: type,
      content: type === 'image' 
        ? { url: '', alt: '', caption: '' }
        : { vimeo_id: '', title: '', caption: '' },
      layout: {
        i: blockId,
        x: nextX,
        y: nextY,
        w: blockW,
        h: blockH,
      },
      sort_order: blocks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, [page.id, blocks, containerWidth]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handleClearBlocks = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/clear-content-blocks${draftMode ? '?draft=1' : ''}`, {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Failed to clear blocks');
        return;
      }

      setBlocks([]);
      lastSavedRef.current = { title, description, blocks: [] };
      lastAttemptRef.current = { title, description, blocks: [] };
      lastAttemptHashRef.current = JSON.stringify([]);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to clear blocks:', error);
    }
  }, [title, description, draftMode]);

  const handleEditBlock = useCallback((block: ContentBlock) => {
    setEditorInitialTab('upload');
    setEditingBlock(block);
  }, []);

  const handleSelectExisting = useCallback((block: ContentBlock) => {
    setEditorInitialTab('existing');
    setEditingBlock(block);
  }, []);

  const handleUploadToBlock = useCallback(async (block: ContentBlock, file: File) => {
    if (block.block_type !== 'image') return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) return;
      const data = await response.json();
      const content = block.content as { url?: string; alt?: string; caption?: string };
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id
            ? { ...b, content: { ...content, url: data.url } }
            : b
        )
      );
      normalizedImageLayoutsRef.current.delete(block.layout.i);
      lastImageUrlByLayoutRef.current[block.layout.i] = data.url;
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, []);

  const handleUploadButton = useCallback((block: ContentBlock) => {
    setActiveUploadBlockId(block.id);
    setEditorInitialTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleSaveBlock = useCallback((updatedBlock: ContentBlock) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== updatedBlock.id) return b;
        if (updatedBlock.block_type === 'image') {
          const prevUrl = (b.content as { url?: string })?.url;
          const nextUrl = (updatedBlock.content as { url?: string })?.url;
          if (prevUrl && nextUrl && prevUrl !== nextUrl) {
            normalizedImageLayoutsRef.current.delete(updatedBlock.layout.i);
            lastImageUrlByLayoutRef.current[updatedBlock.layout.i] = nextUrl;
          }
        }
        return updatedBlock;
      })
    );
  }, []);

  const handleUpdateVimeoField = useCallback(
    (blockId: string, field: 'vimeo_id' | 'title' | 'caption', value: string) => {
      setBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== blockId || block.block_type !== 'vimeo') return block;
          const content = block.content as { vimeo_id: string; title?: string; caption?: string };
          return {
            ...block,
            content: {
              ...content,
              [field]: value,
            },
          };
        })
      );
    },
    []
  );

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadBlockId) return;
    const block = blocks.find((b) => b.id === activeUploadBlockId);
    if (!block) return;
    handleUploadToBlock(block, file);
  }, [activeUploadBlockId, blocks, handleUploadToBlock]);

  const handlePublish = useCallback(async () => {
    if (!draftMode) return;
    try {
      const response = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: page.slug }),
      });

      if (!response.ok) {
        console.error('Failed to publish');
        return;
      }

      if (editOnPublic && exitHref) {
        router.push(exitHref);
        router.refresh();
        return;
      }

      router.refresh();
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  }, [draftMode, page.slug, editOnPublic, exitHref, router]);

  // Handle file drop for images
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsDraggingFile(false);
    
    const newBlocks: ContentBlock[] = [];
    
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) continue;
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Simple default size for dropped images
          const blockW = 2;
          const blockH = ratioToPxH(blockW, 1, containerWidth);
          
          // Calculate position: place side by side on first row (y=0)
          const allBlocks = [...blocks, ...newBlocks];
          const firstRowBlocks = allBlocks.filter(b => b.layout.y === 0);
          const usedWidth = firstRowBlocks.reduce((sum, b) => sum + b.layout.w, 0);
          
          // If there's space in first row, add there; otherwise start new row
          const nextX = usedWidth + blockW <= GRID_COLS ? usedWidth : 0;
          const nextY = usedWidth + blockW <= GRID_COLS ? 0 : (allBlocks.length > 0 ? Math.max(...allBlocks.map(b => b.layout.y + b.layout.h)) : 0);
          
          const blockId = createBlockId('block');
          
          const newBlock: ContentBlock = {
            id: createBlockId('temp'),
            page_id: page.id,
            block_type: 'image',
            content: { url: data.url, alt: file.name, caption: '' },
            layout: {
              i: blockId,
              x: nextX,
              y: nextY,
              w: blockW,
              h: blockH,
            },
            sort_order: blocks.length + newBlocks.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          newBlocks.push(newBlock);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    if (newBlocks.length > 0) {
      setBlocks((prev) => [...prev, ...newBlocks]);
    }
  }, [blocks, page.id, containerWidth]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    noClick: true,
    onDragEnter: () => setIsDraggingFile(true),
    onDragLeave: () => setIsDraggingFile(false),
  });


  return (
    <div className="min-h-screen bg-black text-white flex flex-col" {...(readOnly ? {} : getRootProps())}>
      {!readOnly && <input {...getInputProps()} />}
      {!readOnly && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      )}
      
      {/* Drag overlay */}
      {!readOnly && isDragActive && (
        <div className="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-medium">Drop images here</p>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {editOnPublic && !readOnly && (
        <button
          type="button"
          onClick={() => setShowEditControls((prev) => !prev)}
          className="fixed bottom-6 right-6 z-[70] bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-100"
        >
          {showEditControls ? 'Hide Edit' : 'Edit'}
        </button>
      )}

      {/* Edit mode badge */}
      {editOnPublic && !readOnly && (
        <div className="fixed top-4 left-4 z-[80] bg-white text-black px-3 py-1 rounded-full text-xs font-medium shadow">
          Edit Mode
        </div>
      )}

      {/* Admin toolbar - fixed top so it's always visible in edit mode */}
      {!readOnly && (
        <div className={`fixed top-0 left-0 right-0 z-[70] bg-black/95 backdrop-blur border-b border-white/10 text-white shadow ${showEditControls ? '' : 'hidden'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={editOnPublic ? (exitHref || `/${page.slug}`) : "/admin"}>
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {editOnPublic ? 'Exit' : 'Back'}
                </Button>
              </Link>
              <span className="text-sm text-gray-400">Editing: {page.title}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleAddBlock('image')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                onClick={() => handleAddBlock('vimeo')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Video className="w-4 h-4 mr-2" />
                Vimeo
              </Button>
              {draftMode && (
                <Button
                  onClick={handlePublish}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-300 hover:bg-green-900/30"
                >
                  Publish
                </Button>
              )}
              <Button
                onClick={handleClearBlocks}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-300 hover:bg-red-900/30"
              >
                Clear Blocks
              </Button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <Link href={`/${page.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">
                  Preview
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-gray-400">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Saved</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-yellow-400">Unsaved changes</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Site header - matches public layout */}
      <SiteHeader />

      <main className={`${readOnly ? 'pt-20' : 'pt-32'} flex-1`}>
        {/* Page hero - editable (matches public styling) */}
        <section className="py-20 px-8">
          <div className="container mx-auto px-8">
            <h1
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setTitle(e.currentTarget.textContent || '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="text-5xl md:text-7xl font-extralight tracking-tight mb-6 outline-none focus:bg-gray-50 rounded px-2 -mx-2 transition-colors cursor-text"
              data-placeholder="Page Title"
            >
              {title}
            </h1>
            <p
              ref={descriptionRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setDescription(e.currentTarget.textContent || '')}
              className="text-lg md:text-xl font-light text-white/70 leading-relaxed max-w-2xl outline-none focus:bg-gray-50 rounded px-2 -mx-2 transition-colors cursor-text"
              data-placeholder="Click to add a description..."
            >
              {description || ''}
            </p>
          </div>
        </section>

        {/* Content grid */}
        <div className="container mx-auto px-8 pb-24" ref={containerRef}>
        {blocks.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">Drag images here or use the toolbar to add content</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => handleAddBlock('image')} variant="outline" size="sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <Button onClick={() => handleAddBlock('vimeo')} variant="outline" size="sm">
                <Video className="w-4 h-4 mr-2" />
                Add Vimeo
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full min-h-[400px]"
            style={{
              minHeight: Math.max(
                400,
                (blocks.length
                  ? Math.max(...blocks.map((b) => b.layout.y + getBlockHeightPx(b)))
                  : 1) + GRID_GAP
              ),
            }}
          >
            {blocks.map((block) => {
              const ratio = getRatioForBlock(block);
              const widthPx = gridToPxW(block.layout.w, containerWidth);
              const heightPx = ratio ? widthPx / ratio : block.layout.h;
              const xPx = gridToPxX(block.layout.x, containerWidth);
              const yPx = block.layout.y;

              return (
                <Rnd
                  key={block.layout.i}
                  bounds="parent"
                  size={{ width: widthPx, height: heightPx }}
                  position={{ x: xPx, y: yPx }}
                  lockAspectRatio={ratio ?? false}
                  dragGrid={[colWidth(containerWidth) + GRID_GAP, 1]}
                  resizeGrid={[colWidth(containerWidth) + GRID_GAP, 1]}
                  minWidth={gridToPxW(1, containerWidth)}
                  maxWidth={gridToPxW(GRID_COLS, containerWidth)}
                  enableResizing={
                    !readOnly && showEditControls
                      ? {
                          top: false,
                          right: true,
                          bottom: true,
                          left: false,
                          topRight: false,
                          bottomRight: false,
                          bottomLeft: false,
                          topLeft: false,
                        }
                      : false
                  }
                  disableDragging={readOnly || !showEditControls}
                  onDragStop={(_, data) => {
                    const nextXRaw = pxToGridX(data.x, containerWidth);
                    const nextY = Math.max(0, data.y);
                    const nextX = clampGridX(nextXRaw, block.layout.w);
                    const effectiveH = getBlockHeightPx(block, block.layout.w);
                    const nextLayout = { x: nextX, y: nextY, w: block.layout.w, h: effectiveH };
                    const resolvedLayout = resolveOverlap(block.id, nextLayout);

                    setBlocks((prev) => {
                      const next = prev.map((b) =>
                        b.id === block.id
                          ? { ...b, layout: { ...b.layout, x: resolvedLayout.x, y: resolvedLayout.y } }
                          : b
                      );
                      return resolveAllOverlaps(next);
                    });
                  }}
                  onResizeStop={(_, __, ref, _delta, position) => {
                    const nextWidthPx = ref.offsetWidth;
                    const nextW = pxToGridW(nextWidthPx, containerWidth);
                    const nextH = ratio
                      ? ratioToPxH(nextW, ratio, containerWidth)
                      : Math.max(80, ref.offsetHeight);
                    const nextXRaw = pxToGridX(position.x, containerWidth);
                    const nextX = clampGridX(nextXRaw, nextW);
                    const nextY = Math.max(0, position.y);

                    setBlocks((prev) => {
                      const next = prev.map((b) =>
                        b.id === block.id
                          ? {
                              ...b,
                              layout: {
                                ...b.layout,
                                w: nextW,
                                h: nextH,
                                x: nextX,
                                y: nextY,
                              },
                            }
                          : b
                      );
                      return resolveAllOverlaps(next);
                    });
                  }}
                >
                  <div
                    className="relative rounded-lg overflow-hidden bg-gray-100 group w-full h-full"
                    onDragOver={(event) => {
                      if (block.block_type === 'image') {
                        event.preventDefault();
                      }
                    }}
                    onDrop={(event) => {
                      if (block.block_type !== 'image') return;
                      event.preventDefault();
                      const file = event.dataTransfer?.files?.[0];
                      if (file) {
                        handleUploadToBlock(block, file);
                      }
                    }}
                  >
                    <BlockRenderer block={block} isEditing={!readOnly && showEditControls} />
                    {!readOnly && showEditControls && (
                      <>
                        {block.block_type === 'vimeo' ? (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Vimeo ID"
                              value={(block.content as any)?.vimeo_id || ''}
                              onChange={(e) => handleUpdateVimeoField(block.id, 'vimeo_id', e.target.value)}
                              className="w-full bg-transparent text-white text-xs px-2 py-1 rounded border border-white/20"
                            />
                            <input
                              type="text"
                              placeholder="Title"
                              value={(block.content as any)?.title || ''}
                              onChange={(e) => handleUpdateVimeoField(block.id, 'title', e.target.value)}
                              className="w-full bg-transparent text-white text-xs px-2 py-1 rounded border border-white/20"
                            />
                            <input
                              type="text"
                              placeholder="Caption"
                              value={(block.content as any)?.caption || ''}
                              onChange={(e) => handleUpdateVimeoField(block.id, 'caption', e.target.value)}
                              className="w-full bg-transparent text-white text-xs px-2 py-1 rounded border border-white/20"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBlock(block.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-3 py-2 flex justify-end gap-2 pointer-events-none">
                            <div className="flex gap-2 pointer-events-auto">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectExisting(block);
                                }}
                                className="bg-white text-black hover:bg-gray-100"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBlock(block.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Rnd>
              );
            })}
          </div>
        )}
        </div>
      </main>

      {/* Site footer - same as front end */}
      <SiteFooter />

      {/* Image sizes are measured via Image() loader */}

      {/* Block editor modal */}
      {editingBlock && (
        <BlockEditorModal
          block={editingBlock}
          onSave={handleSaveBlock}
          onClose={() => setEditingBlock(null)}
          initialTab={editorInitialTab}
        />
      )}
    </div>
  );
}
