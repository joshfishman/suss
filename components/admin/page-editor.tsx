'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import GridLayout, { Layout, LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Page, ContentBlock } from '@/lib/types/content';
import { BlockRenderer } from '@/components/content-blocks/block-renderer';
import { BlockEditorModal } from './block-editor-modal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Edit, Video, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import ImageMeasurer from 'react-virtualized-image-measurer';

interface ImageItem {
  id: string;
  layoutId: string;
  url: string;
}

function ImageSizeCollector({
  sizes,
  onChange,
}: {
  sizes: Record<string, { width: number; height: number }>;
  onChange: (sizes: Record<string, { width: number; height: number }>) => void;
}) {
  useEffect(() => {
    console.log('[image-measurer] collector sizes', sizes);
    onChange(sizes);
  }, [sizes, onChange]);

  return null;
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

function normalizeInitialBlocks(blocks: ContentBlock[]) {
  const seen = new Set<string>();
  return blocks.map((block) => {
    let key = block.layout?.i || block.id || createBlockId('block');
    if (seen.has(key)) {
      key = createBlockId('block');
    }
    seen.add(key);
    return key === block.layout?.i
      ? block
      : {
          ...block,
          layout: {
            ...block.layout,
            i: key,
          },
        };
  });
}

interface PageEditorProps {
  page: Page & { published_page_id?: string | null };
  initialBlocks: ContentBlock[];
  draftMode?: boolean;
  editOnPublic?: boolean;
  exitHref?: string;
}

export function PageEditor({
  page,
  initialBlocks,
  draftMode = false,
  editOnPublic = false,
  exitHref,
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
  const [showEditControls, setShowEditControls] = useState(editOnPublic);
  const [activeUploadBlockId, setActiveUploadBlockId] = useState<string | null>(null);
  const [editorInitialTab, setEditorInitialTab] = useState<'upload' | 'existing'>('upload');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({ title: page.title, description: page.description || '', blocks: initialBlocks });
  const lastAttemptRef = useRef({ title: page.title, description: page.description || '', blocks: initialBlocks });
  const isSavingSyncRef = useRef(false);
  const normalizedImageLayoutsRef = useRef(new Set<string>());
  const [measuredSizes, setMeasuredSizes] = useState<Record<string, { width: number; height: number }>>({});

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const imageItems = useMemo<ImageItem[]>(() => {
    const items = blocks
      .filter((block) => block.block_type === 'image')
      .map((block) => {
        const content = block.content as { url?: string };
        return content?.url
          ? { id: block.id, layoutId: block.layout.i, url: content.url }
          : null;
      })
      .filter((item): item is ImageItem => Boolean(item));
    console.log('[image-measurer] imageItems', items);
    return items;
  }, [blocks]);

  const handleSizesChange = useCallback(
    (sizes: Record<string, { width: number; height: number }>) => {
      if (sizesChanged(measuredSizes, sizes)) {
        console.log('[image-measurer] sizes', sizes);
        setMeasuredSizes(sizes);
      }
    },
    [measuredSizes]
  );

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

        const ratio = size.width / size.height;
        const newH = Math.max(1, Math.round(block.layout.w / ratio));
        console.log('[image-measurer] apply ratio', {
          url: content.url,
          ratio,
          w: block.layout.w,
          oldH: block.layout.h,
          newH,
        });
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

      return changed ? next : prev;
    });
  }, [measuredSizes]);

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
          await fetch(`/api/content-blocks/${block.id}${draftQuery}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: block.content,
              layout: block.layout,
              sort_order: i,
            }),
          });
          updatedBlocks.push(block);
        }
      }

      if (blocks.some((block) => block.id.startsWith('temp-'))) {
        setBlocks(updatedBlocks);
      }

      lastSavedRef.current = { title, description, blocks: updatedBlocks };
      lastAttemptRef.current = { title, description, blocks: updatedBlocks };
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
      // Prevent retry loop until user makes another change
      lastAttemptRef.current = { title, description, blocks };
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
    if (isSavingSyncRef.current) return;
    const hasChanges = 
      title !== lastAttemptRef.current.title ||
      description !== lastAttemptRef.current.description ||
      JSON.stringify(blocks) !== JSON.stringify(lastAttemptRef.current.blocks);

    if (hasChanges) {
      setSaveStatus('unsaved');
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        lastAttemptRef.current = { title, description, blocks };
        performSave();
      }, 1500); // Auto-save after 1.5 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, blocks, performSave]);

  // No aspect ratio tracking (simplified editor)

  const layout = blocks.map((block) => ({
    i: block.layout.i,
    x: block.layout.x,
    y: block.layout.y,
    w: block.layout.w,
    h: block.layout.h,
    minW: 1,
    maxW: 4,
    minH: 1,
  }));

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        const layoutItem = newLayout.find((l: LayoutItem) => l.i === block.layout.i);
        if (layoutItem) {
          return {
            ...block,
            layout: {
              ...block.layout,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
        return block;
      })
    );
  }, []);

  const getRatioForBlock = useCallback((block: ContentBlock) => {
    if (block.block_type === 'vimeo') {
      return 16 / 9;
    }
    if (block.block_type === 'image') {
      const content = block.content as { url?: string };
      if (!content?.url) return null;
      const size = measuredSizes[content.url];
      if (!size) return null;
      return size.width / size.height;
    }
    return null;
  }, [measuredSizes]);

  const handleResize = useCallback((
    layout: Layout,
    oldItem: LayoutItem,
    newItem: LayoutItem,
    placeholder: LayoutItem
  ) => {
    const block = blocks.find((b) => b.layout.i === newItem.i);
    if (!block) return;
    const ratio = getRatioForBlock(block);
    if (!ratio) return;

    const widthChanged = newItem.w !== oldItem.w;
    const heightChanged = newItem.h !== oldItem.h;

    if (widthChanged) {
      const newHeight = Math.max(1, Math.round(newItem.w / ratio));
      newItem.h = newHeight;
      placeholder.h = newHeight;
    } else if (heightChanged) {
      const newWidth = Math.max(1, Math.round(newItem.h * ratio));
      newItem.w = newWidth;
      placeholder.w = newWidth;
    }
  }, [blocks, getRatioForBlock]);

  const handleResizeStop = useCallback((
    layout: Layout,
    oldItem: LayoutItem,
    newItem: LayoutItem
  ) => {
    // Keep ratios locked; no updates needed here
  }, []);

  const handleAddBlock = useCallback((type: 'image' | 'vimeo') => {
    // Find first row (y=0) and calculate used width there
    const firstRowBlocks = blocks.filter(b => b.layout.y === 0);
    const usedWidth = firstRowBlocks.reduce((sum, b) => sum + b.layout.w, 0);
    
    // If there's space in the first row, add there; otherwise start a new row
    const nextX = usedWidth < 4 ? usedWidth : 0;
    const nextY = usedWidth < 4 ? 0 : (blocks.length > 0 ? Math.max(...blocks.map(b => b.layout.y + b.layout.h)) : 0);

    const blockId = createBlockId('block');
    
    // Simple default sizing
    const blockW = 2;
    const blockH = 3;

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
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
  }, []);

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
          const blockH = 3;
          
          // Calculate position: place side by side on first row (y=0)
          const allBlocks = [...blocks, ...newBlocks];
          const firstRowBlocks = allBlocks.filter(b => b.layout.y === 0);
          const usedWidth = firstRowBlocks.reduce((sum, b) => sum + b.layout.w, 0);
          
          // If there's space in first row, add there; otherwise start new row
          const nextX = usedWidth + blockW <= 4 ? usedWidth : 0;
          const nextY = usedWidth + blockW <= 4 ? 0 : (allBlocks.length > 0 ? Math.max(...allBlocks.map(b => b.layout.y + b.layout.h)) : 0);
          
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
  }, [blocks, page.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    noClick: true,
    onDragEnter: () => setIsDraggingFile(true),
    onDragLeave: () => setIsDraggingFile(false),
  });


  return (
    <div className="min-h-screen bg-black text-white flex flex-col" {...getRootProps()}>
      <input {...getInputProps()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-medium">Drop images here</p>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {editOnPublic && (
        <button
          type="button"
          onClick={() => setShowEditControls((prev) => !prev)}
          className="fixed bottom-6 right-6 z-[70] bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-100"
        >
          {showEditControls ? 'Hide Edit' : 'Edit'}
        </button>
      )}

      {/* Admin toolbar - fixed bottom to keep public layout intact */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] bg-black text-white ${showEditControls || !editOnPublic ? '' : 'hidden'}`}>
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

      {/* Site header - matches public layout */}
      <SiteHeader />

      <main className="pt-20 flex-1">
        {/* Page hero - editable (matches public styling) */}
        <section className="py-20 px-8">
          <div className="container mx-auto max-w-4xl">
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
          <GridLayout
            className="layout"
            layout={layout}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            gridConfig={{
              cols: 4,
              rowHeight: 100,
              margin: [16, 16] as const,
              containerPadding: [0, 0] as const,
            }}
            dragConfig={{ enabled: true }}
            resizeConfig={{ enabled: true }}
          >
            {blocks.map((block) => (
              <div
                key={block.layout.i}
                className="relative rounded-lg overflow-hidden bg-gray-100 group"
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
                <BlockRenderer block={block} isEditing />
                {(showEditControls || !editOnPublic) && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      {block.block_type === 'image' ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadButton(block);
                            }}
                            className="bg-white text-black hover:bg-gray-100"
                          >
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectExisting(block);
                            }}
                            className="bg-white text-black hover:bg-gray-100"
                          >
                            Existing
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBlock(block);
                          }}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
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
              </div>
            ))}
          </GridLayout>
        )}
        </div>
      </main>

      {/* Site footer - same as front end */}
      <SiteFooter />

      {imageItems.length > 0 && (
        <div className="sr-only">
          <ImageMeasurer
            items={imageItems}
            image={(item: ImageItem) => item.url}
            defaultWidth={400}
            defaultHeight={300}
          >
            {({ sizes }) => (
              <ImageSizeCollector sizes={sizes} onChange={handleSizesChange} />
            )}
          </ImageMeasurer>
        </div>
      )}

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
