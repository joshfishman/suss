-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create content_blocks table for storing grid items
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,1
  block_type TEXT NOT NULL, -- 'image', 'vimeo', 'text'
  content JSONB NOT NULL, -- stores url, caption, vimeo_id, etc.
  layout JSONB NOT NULL, -- stores x, y, w, h for grid layout
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-images', 'page-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'page-images' );

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'page-images' );

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'page-images' );

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'page-images' );

-- Create RLS policies for pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view pages"
ON pages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage pages"
ON pages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create RLS policies for content_blocks
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view content blocks"
ON content_blocks FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage content blocks"
ON content_blocks FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default pages
INSERT INTO pages (slug, title, description)
VALUES 
  ('home', 'Home', 'Award-winning creative studio specializing in motion design, visual effects, and cinematic storytelling. We bring bold ideas to life through stunning visuals and meticulous craftsmanship, delivering compelling content for film, television, and digital platforms worldwide.'),
  ('about', 'About', 'We are a collective of passionate artists, designers, and filmmakers dedicated to pushing the boundaries of visual storytelling.'),
  ('projects', 'Projects', 'A curated selection of our finest work across motion graphics, film, and digital experiences.')
ON CONFLICT (slug) DO NOTHING;
