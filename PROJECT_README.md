# Portfolio CMS with React Grid Layout

A minimalist portfolio website inspired by [onecrew.tv](https://onecrew.tv/) with a powerful admin interface for managing content using drag-and-drop functionality.

## Features

- 🎨 **Minimalist Design** - Clean, professional aesthetic inspired by onecrew.tv
- 🔐 **Admin Authentication** - Single private login for content management
- 📐 **Drag & Drop Grid Layout** - Intuitive content arrangement with react-grid-layout
- 🖼️ **Image Blocks** - Upload and display images with captions
- 🎥 **Vimeo Integration** - Embed Vimeo videos seamlessly
- 📝 **Text Blocks** - Add formatted text content
- 📱 **Responsive** - Adapts to all screen sizes
- 🚀 **Next.js 15** - Built with the latest Next.js features
- 🔒 **Supabase Auth** - Secure authentication and database

## Pages

- **Home** (`/`) - Landing page
- **About** (`/about`) - About page
- **Projects** (`/projects`) - Projects gallery page
- **Admin** (`/admin`) - Content management dashboard (auth required)

## Setup

### 1. Database Migration

Run the migration to create the necessary tables:

```bash
# Navigate to your Supabase project and run the migration
# Located at: supabase/migrations/20260114_create_pages_schema.sql
```

Or manually create the tables using the Supabase SQL editor.

### 2. Environment Variables

Make sure your `.env.local` contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

## Admin Usage

### Accessing the Admin Panel

1. Navigate to `/auth/login`
2. Sign in with your admin credentials
3. Go to `/admin` to see the dashboard

### Managing Pages

1. From the admin dashboard, click "Edit" on any page (Home, About, Projects)
2. Use the toolbar to add content blocks:
   - **Add Image** - Upload images with drag & drop
   - **Add Vimeo** - Embed Vimeo videos by ID
   - **Add Text** - Add formatted text content

### Working with the Grid Editor

- **Drag** - Click and drag blocks to reposition them
- **Resize** - Drag the bottom-right corner of blocks to resize
- **Edit** - Click on a block to edit its content
- **Delete** - Click the trash icon to remove a block
- **Save** - Click "Save Layout" to persist changes

### Content Block Types

#### Image Block
- Upload images via drag & drop or file picker
- Add alt text for accessibility
- Add optional captions

#### Vimeo Block
- Enter the Vimeo video ID (e.g., `123456789` from `vimeo.com/123456789`)
- Add optional title and caption
- Videos are embedded responsively

#### Text Block
- Write HTML content (supports basic formatting)
- Choose from three styles:
  - **Heading** - Large, bold text
  - **Paragraph** - Standard body text
  - **Caption** - Smaller, muted text

## Grid Layout System

The grid uses a 12-column layout:
- Each column is 1/12 of the viewport width
- Row height is 100px
- Blocks can span multiple columns and rows
- Grid is responsive and adapts to screen size

### Example Layout

```
┌─────────────────────────────────────┐
│  Header (12 cols x 2 rows)         │
├──────────────────┬──────────────────┤
│  Image           │  Image           │
│  (6 cols x 4)    │  (6 cols x 4)    │
├──────────────────┴──────────────────┤
│  Text (12 cols x 2 rows)           │
└─────────────────────────────────────┘
```

## Styling

The design follows onecrew.tv's minimalist aesthetic:

- **Typography** - Light font weights, tight tracking
- **Colors** - Black and white with subtle grays
- **Layout** - Clean, spacious, grid-based
- **Navigation** - Fixed header with uppercase links
- **Interactions** - Subtle hover states and transitions

## API Routes

### Pages
- `GET /api/pages/[slug]` - Get page data and blocks
- `PUT /api/pages/[slug]` - Update page metadata

### Content Blocks
- `POST /api/content-blocks` - Create a new block
- `PUT /api/content-blocks/[id]` - Update a block
- `DELETE /api/content-blocks/[id]` - Delete a block

### Upload
- `POST /api/upload` - Upload images to Supabase Storage

## Database Schema

### `pages`
- `id` - UUID primary key
- `slug` - Unique page identifier
- `title` - Page title
- `description` - Optional description
- `created_at` / `updated_at` - Timestamps

### `content_blocks`
- `id` - UUID primary key
- `page_id` - Foreign key to pages
- `block_type` - 'image' | 'vimeo' | 'text'
- `content` - JSONB (block-specific data)
- `layout` - JSONB (x, y, w, h, i)
- `sort_order` - Integer for ordering
- `created_at` / `updated_at` - Timestamps

## Tech Stack

- **Framework** - Next.js 15 with App Router
- **Language** - TypeScript
- **Styling** - Tailwind CSS
- **Database** - Supabase (PostgreSQL)
- **Auth** - Supabase Auth
- **Storage** - Supabase Storage
- **Grid Layout** - react-grid-layout
- **File Upload** - react-dropzone
- **UI Components** - Radix UI + shadcn/ui

## Development Tips

### Adding New Pages

1. Create the page slug in the database
2. Create the route file in `app/[slug]/page.tsx`
3. Add the link to the navigation in `components/site-header.tsx`

### Customizing Styles

- Edit `app/globals.css` for global styles
- Modify `tailwind.config.ts` for theme customization
- Update component styles in individual files

### Extending Block Types

1. Add new type to `lib/types/content.ts`
2. Create component in `components/content-blocks/`
3. Update `block-renderer.tsx` to handle new type
4. Add button in `grid-editor.tsx`

## Troubleshooting

### Images not uploading
- Check Supabase Storage bucket permissions
- Verify authentication token is valid
- Check file size limits

### Grid layout not saving
- Ensure user is authenticated
- Check browser console for API errors
- Verify database permissions

### Vimeo videos not loading
- Verify Vimeo video ID is correct
- Check video privacy settings on Vimeo
- Ensure iframe embedding is allowed

## License

MIT
