'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import GridLayout, { Layout, LayoutItem, horizontalCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Page, ContentBlock } from '@/lib/types/content';
import { BlockRenderer } from '@/components/content-blocks/block-renderer';
import { BlockEditorModal } from './block-editor-modal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Edit, Video, Type, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PageEditorProps {
  page: Page;
  initialBlocks: ContentBlock[];
}

export function PageEditor({ page, initialBlocks }: PageEditorProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({ title: page.title, description: page.description || '', blocks: initialBlocks });

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

  // Auto-save function
  const performSave = useCallback(async () => {
    setSaveStatus('saving');
    setIsSaving(true);
    
    try {
      // Save page settings
      await fetch(`/api/pages/${page.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      // Delete blocks that were removed
      for (const block of lastSavedRef.current.blocks) {
        if (!block.id.startsWith('temp-') && !blocks.find(b => b.id === block.id)) {
          await fetch(`/api/content-blocks/${block.id}`, {
            method: 'DELETE',
          });
        }
      }

      // Delete all existing temp blocks and recreate
      for (const block of lastSavedRef.current.blocks) {
        if (!block.id.startsWith('temp-')) {
          await fetch(`/api/content-blocks/${block.id}`, {
            method: 'DELETE',
          });
        }
      }

      // Create all blocks fresh
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        await fetch('/api/content-blocks', {
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
      }

      lastSavedRef.current = { title, description, blocks };
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, blocks, page.slug, page.id]);

  // Trigger auto-save on changes
  useEffect(() => {
    const hasChanges = 
      title !== lastSavedRef.current.title ||
      description !== lastSavedRef.current.description ||
      JSON.stringify(blocks) !== JSON.stringify(lastSavedRef.current.blocks);

    if (hasChanges) {
      setSaveStatus('unsaved');
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        performSave();
      }, 1500); // Auto-save after 1.5 seconds of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, description, blocks, performSave]);

  const layout = blocks.map((block) => ({
    i: block.layout.i,
    x: block.layout.x,
    y: block.layout.y,
    w: block.layout.w,
    h: block.layout.h,
    minW: 1,
    maxW: 4,
    minH: 2,
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

  const handleAddBlock = useCallback((type: 'image' | 'vimeo' | 'text') => {
    // Find first row (y=0) and calculate used width there
    const firstRowBlocks = blocks.filter(b => b.layout.y === 0);
    const usedWidth = firstRowBlocks.reduce((sum, b) => sum + b.layout.w, 0);
    
    // If there's space in the first row, add there; otherwise start a new row
    const nextX = usedWidth < 4 ? usedWidth : 0;
    const nextY = usedWidth < 4 ? 0 : (blocks.length > 0 ? Math.max(...blocks.map(b => b.layout.y + b.layout.h)) : 0);

    const newBlock: ContentBlock = {
      id: `temp-${Date.now()}`,
      page_id: page.id,
      block_type: type,
      content: type === 'image' 
        ? { url: '', alt: '', caption: '' }
        : type === 'vimeo'
        ? { vimeo_id: '', title: '', caption: '' }
        : { html: 'Click to edit text', style: 'paragraph' },
      layout: {
        i: `block-${Date.now()}`,
        x: nextX,
        y: nextY,
        w: 1,
        h: type === 'text' ? 3 : 6, // 6 rows = 300px for images/videos
      },
      sort_order: blocks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, [page.id, blocks]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handleEditBlock = useCallback((block: ContentBlock) => {
    setEditingBlock(block);
  }, []);

  const handleSaveBlock = useCallback((updatedBlock: ContentBlock) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
  }, []);

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
          
          // Calculate position: place side by side on first row (y=0)
          const allBlocks = [...blocks, ...newBlocks];
          const firstRowBlocks = allBlocks.filter(b => b.layout.y === 0);
          const usedWidth = firstRowBlocks.reduce((sum, b) => sum + b.layout.w, 0);
          
          // If there's space in first row, add there; otherwise start new row
          const nextX = usedWidth < 4 ? usedWidth : 0;
          const nextY = usedWidth < 4 ? 0 : (allBlocks.length > 0 ? Math.max(...allBlocks.map(b => b.layout.y + b.layout.h)) : 0);
          
          const newBlock: ContentBlock = {
            id: `temp-${Date.now()}-${Math.random()}`,
            page_id: page.id,
            block_type: 'image',
            content: { url: data.url, alt: file.name, caption: '' },
            layout: {
              i: `block-${Date.now()}-${Math.random()}`,
              x: nextX,
              y: nextY,
              w: 1, // Start at 1 column width, side by side
              h: 6, // 6 rows = 300px
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
    <div className="min-h-screen bg-white" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-medium">Drop images here</p>
          </div>
        </div>
      )}

      {/* Admin toolbar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
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
              <Button
                onClick={() => handleAddBlock('text')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Type className="w-4 h-4 mr-2" />
                Text
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

      {/* Simulated page header */}
      <header className="bg-black pt-16">
        <nav className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extralight tracking-widest text-white uppercase">
              the Suss
            </span>
            <div className="flex gap-12">
              <span className="text-sm font-light tracking-wide uppercase text-white/60">Home</span>
              <span className="text-sm font-light tracking-wide uppercase text-white/60">About</span>
              <span className="text-sm font-light tracking-wide uppercase text-white/60">Projects</span>
            </div>
          </div>
        </nav>
      </header>

      {/* Page hero - editable */}
      <section className="py-20 px-8 bg-white">
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
            className="text-lg md:text-xl font-light text-gray-500 leading-relaxed max-w-2xl outline-none focus:bg-gray-50 rounded px-2 -mx-2 transition-colors cursor-text"
            data-placeholder="Click to add a description..."
          >
            {description || ''}
          </p>
        </div>
      </section>

      {/* Content grid */}
      <div className="container mx-auto px-8 pb-20" ref={containerRef}>
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
              <Button onClick={() => handleAddBlock('text')} variant="outline" size="sm">
                <Type className="w-4 h-4 mr-2" />
                Add Text
              </Button>
            </div>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layout}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            compactor={horizontalCompactor}
            autoSize={true}
            gridConfig={{
              cols: 4,
              rowHeight: 50,
              margin: [16, 16] as const,
              containerPadding: [0, 0] as const,
            }}
            dragConfig={{
              enabled: true,
            }}
            resizeConfig={{
              enabled: true,
            }}
          >
            {blocks.map((block) => (
              <div
                key={block.layout.i}
                className="relative rounded-lg overflow-hidden bg-gray-100 group"
              >
                <BlockRenderer block={block} isEditing />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
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
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {/* Block editor modal */}
      {editingBlock && (
        <BlockEditorModal
          block={editingBlock}
          onSave={handleSaveBlock}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}
