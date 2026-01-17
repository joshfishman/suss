'use client';

import { useEffect, useState } from 'react';
import { ContentBlock, ImageContent, VimeoContent, TextContent } from '@/lib/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface BlockEditorModalProps {
  block: ContentBlock;
  onSave: (block: ContentBlock) => void;
  onClose: () => void;
  initialTab?: 'upload' | 'existing';
}

export function BlockEditorModal({ block, onSave, onClose, initialTab = 'upload' }: BlockEditorModalProps) {
  const [content, setContent] = useState(block.content);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>(initialTab);
  const [existingImages, setExistingImages] = useState<{ url: string; name: string }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || block.block_type !== 'image') return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setContent({ ...content, url: data.url } as ImageContent);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (block.block_type !== 'image') return;
    if (activeTab !== 'existing') return;
    if (existingImages.length > 0) return;

    const loadImages = async () => {
      setLoadingImages(true);
      try {
        const response = await fetch('/api/admin/list-images');
        const data = await response.json();
        if (response.ok && data.images) {
          setExistingImages(data.images);
        }
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
  }, [activeTab, block.block_type, existingImages.length]);

  const handleSave = () => {
    onSave({ ...block, content });
    onClose();
  };

  const renderEditor = () => {
    switch (block.block_type) {
      case 'image':
        const imageContent = content as ImageContent;
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('upload')}
                className={activeTab === 'upload' ? 'bg-white text-black' : 'border-gray-600 text-white hover:bg-gray-700'}
              >
                Upload
              </Button>
              <Button
                variant={activeTab === 'existing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('existing')}
                className={activeTab === 'existing' ? 'bg-white text-black' : 'border-gray-600 text-white hover:bg-gray-700'}
              >
                Existing
              </Button>
            </div>
            {activeTab === 'upload' && (
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'border-white' : 'border-gray-600'}`}>
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">
                  {uploading ? 'Uploading...' : 'Drag & drop an image, or click to select'}
                </p>
              </div>
            )}
            {activeTab === 'existing' && (
              <div className="space-y-3">
                {loadingImages && (
                  <p className="text-sm text-gray-400">Loading images...</p>
                )}
                {!loadingImages && existingImages.length === 0 && (
                  <p className="text-sm text-gray-400">No images yet. Upload one first.</p>
                )}
                {!loadingImages && existingImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                    {existingImages.map((image) => (
                      <button
                        key={image.url}
                        type="button"
                        onClick={() => {
                          const nextContent = { ...imageContent, url: image.url };
                          setContent(nextContent);
                          onSave({ ...block, content: nextContent });
                        }}
                        className={`relative rounded-lg overflow-hidden border ${imageContent.url === image.url ? 'border-white' : 'border-gray-700'} hover:border-white transition-colors`}
                      >
                        <img src={image.url} alt={image.name} className="w-full h-20 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {imageContent.url && (
              <img
                src={imageContent.url}
                alt="Preview"
                className="w-full max-h-48 object-contain rounded-lg bg-black/20"
              />
            )}
            <div>
              <Label htmlFor="alt" className="text-white">Alt Text</Label>
              <Input
                id="alt"
                value={imageContent.alt || ''}
                onChange={(e) => setContent({ ...imageContent, alt: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="caption" className="text-white">Caption</Label>
              <Input
                id="caption"
                value={imageContent.caption || ''}
                onChange={(e) => setContent({ ...imageContent, caption: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );
      
      case 'vimeo':
        const vimeoContent = content as VimeoContent;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vimeo_id" className="text-white">Vimeo Video ID</Label>
              <Input
                id="vimeo_id"
                value={vimeoContent.vimeo_id}
                onChange={(e) => setContent({ ...vimeoContent, vimeo_id: e.target.value })}
                placeholder="e.g., 123456789"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="title" className="text-white">Title</Label>
              <Input
                id="title"
                value={vimeoContent.title || ''}
                onChange={(e) => setContent({ ...vimeoContent, title: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="caption" className="text-white">Caption</Label>
              <Input
                id="caption"
                value={vimeoContent.caption || ''}
                onChange={(e) => setContent({ ...vimeoContent, caption: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );
      
      case 'text':
        const textContent = content as TextContent;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="header" className="text-white">Header</Label>
              <Input
                id="header"
                value={textContent.header || ''}
                onChange={(e) => setContent({ ...textContent, header: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <textarea
                id="description"
                value={textContent.description || ''}
                onChange={(e) => setContent({ ...textContent, description: e.target.value })}
                className="w-full min-h-[200px] p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 max-w-xl w-full max-h-[80vh] overflow-y-auto border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">Edit {block.block_type} Block</h2>
        {renderEditor()}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-white hover:bg-gray-700">Cancel</Button>
          <Button onClick={handleSave} className="bg-white text-black hover:bg-gray-200">Save</Button>
        </div>
      </div>
    </div>
  );
}
