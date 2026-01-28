export type BlockType = 'image' | 'vimeo' | 'text';
export type LayoutMode = 'snap' | 'free';
export type PageType = 'page' | 'project';

export interface ContentBlock {
  id: string;
  page_id: string;
  block_type: BlockType;
  content: ImageContent | VimeoContent | TextContent;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    i: string; // unique identifier for grid item
  };
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ImageContent {
  url: string;
  path?: string;
  alt?: string;
  caption?: string;
}

export interface VimeoContent {
  vimeo_id: string;
  title?: string;
  caption?: string;
}

export interface TextContent {
  header: string;
  description: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  description?: string;
  hero_title?: string;
  layout_mode?: LayoutMode;
  page_type?: PageType;
  created_at: string;
  updated_at: string;
}
