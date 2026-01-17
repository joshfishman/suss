'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import GridLayout, { Layout, LayoutItem, noCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ContentBlock, BlockType } from '@/lib/types/content';
import { BlockRenderer } from '@/components/content-blocks/block-renderer';
import { BlockEditorModal } from './block-editor-modal';
import { Button } from '@/components/ui/button';
import { Plus, Save, Trash2, Edit } from 'lucide-react';

interface GridEditorProps {
  pageId: string;
  initialBlocks: ContentBlock[];
  onSave: (blocks: ContentBlock[]) => Promise<void>;
}

export function GridEditor({ pageId, initialBlocks, onSave }: GridEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const layout = blocks.map((block) => ({
    i: block.layout.i,
    x: block.layout.x,
    y: block.layout.y,
    w: block.layout.w,
    h: block.layout.h,
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

  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock: ContentBlock = {
      id: `temp-${Date.now()}`,
      page_id: pageId,
      block_type: type,
      content: type === 'image'
        ? { url: '', alt: '', caption: '' }
        : type === 'vimeo'
          ? { vimeo_id: '', title: '', caption: '' }
          : { header: '', description: '' },
      layout: {
        i: `block-${Date.now()}`,
        x: 0,
        y: Infinity,
        w: type === 'text' ? 6 : 4,
        h: type === 'text' ? 2 : 4,
      },
      sort_order: blocks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBlocks((prev) => [...prev, newBlock]);
  }, [pageId, blocks.length]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(blocks);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <div className="flex gap-2">
          <Button
            onClick={() => handleAddBlock('image')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Image
          </Button>
          <Button
            onClick={() => handleAddBlock('vimeo')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vimeo
          </Button>
          <Button
            onClick={() => handleAddBlock('text')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-gray-200">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        compactor={noCompactor}
        gridConfig={{
          cols: 12,
          rowHeight: 100,
          margin: [10, 10] as const,
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
            className="relative border-2 border-dashed border-gray-600 rounded-lg overflow-hidden bg-gray-800"
          >
            <BlockRenderer block={block} isEditing />
            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditBlock(block);
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBlock(block.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </GridLayout>

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
