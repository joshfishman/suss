'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page, ContentBlock } from '@/lib/types/content';
import { GridEditor } from './grid-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface AdminPageEditorProps {
  page: Page;
  initialBlocks: ContentBlock[];
}

export function AdminPageEditor({ page, initialBlocks }: AdminPageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description || '');
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch(`/api/pages/${page.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      router.refresh();
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSave = async (blocks: ContentBlock[]) => {
    // Delete all existing blocks
    for (const block of initialBlocks) {
      if (!block.id.startsWith('temp-')) {
        await fetch(`/api/content-blocks/${block.id}`, {
          method: 'DELETE',
        });
      }
    }

    // Create new blocks
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

    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit {page.title}</h1>
        </div>
        <Link href={`/${page.slug}`} target="_blank">
          <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">Preview Page</Button>
        </Link>
      </div>

      {/* Page Settings */}
      <div className="border border-gray-700 rounded-lg bg-gray-800">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between p-4 text-left text-white"
        >
          <span className="font-medium">Page Settings (Title & Description)</span>
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showSettings && (
          <div className="p-4 pt-0 space-y-4 border-t border-gray-700">
            <div>
              <Label htmlFor="title" className="text-white">Page Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Page Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Page description (shown on the page hero)"
                className="w-full min-h-[100px] p-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
              />
            </div>
            <Button onClick={handleSaveSettings} disabled={savingSettings} size="sm" className="bg-white text-black hover:bg-gray-200">
              <Save className="w-4 h-4 mr-2" />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>

      <GridEditor
        pageId={page.id}
        initialBlocks={initialBlocks}
        onSave={handleSave}
      />
    </div>
  );
}
