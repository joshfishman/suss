# Quick Setup Guide

This guide will get your portfolio CMS up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Git (optional)

## Step-by-Step Setup

### 1. Supabase Setup

#### Create a New Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be provisioned

#### Run Database Migration
1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/migrations/20260114_create_pages_schema.sql`
4. Click "Run" to execute the migration

This will create:
- `pages` table
- `content_blocks` table
- `page-images` storage bucket
- All necessary security policies

#### Get Your API Keys
1. Go to "Project Settings" > "API"
2. Copy your "Project URL" (starts with https://)
3. Copy your "anon/public" key

### 2. Environment Configuration

Create a `.env.local` file in the root of `suss-app/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials.

### 3. Install Dependencies

```bash
cd suss-app
npm install
```

### 4. Create Admin User

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/sign-up`

3. Create your admin account with:
   - Email address
   - Strong password

4. Check your email for verification link (if required)

### 5. Access Admin Panel

1. Go to `http://localhost:3000/auth/login`
2. Sign in with your credentials
3. Navigate to `http://localhost:3000/admin`

You should see the admin dashboard with three pages:
- Home
- About
- Projects

## First Content

Let's add some content to your homepage!

### 1. Edit Home Page

1. Click "Edit" on the Home page
2. You'll see the grid editor

### 2. Add a Header Image

1. Click "Add Image"
2. A new block appears in the grid
3. Click on the block to open the editor
4. Drag & drop an image or click to browse
5. Add alt text: "Welcome to my portfolio"
6. Click "Save"

### 3. Add a Vimeo Video

1. Click "Add Vimeo"
2. Click the block to edit
3. Enter a Vimeo ID (e.g., `76979871` for a demo)
4. Add a title: "Featured Work"
5. Click "Save"

### 4. Add Text

1. Click "Add Text"
2. Click the block to edit
3. Enter some content:
   ```html
   <h2>Welcome</h2>
   <p>Creative director and filmmaker based in Chicago.</p>
   ```
4. Select style: "Heading"
5. Click "Save"

### 5. Arrange Your Layout

1. Drag blocks to reposition them
2. Resize by dragging the bottom-right corner
3. Click "Save Layout" when satisfied

### 6. Preview Your Page

Click "Preview Page" to see your live site!

## Next Steps

### Customize Branding

Edit `components/site-header.tsx` to change:
- Logo/title
- Navigation items
- Header styling

### Add Custom Fonts

1. Add fonts to `app/layout.tsx`
2. Update `tailwind.config.ts` with font families
3. Apply in `app/globals.css`

### Create Project Pages

For individual project pages like [onecrew.tv/Washington-Commanders](https://onecrew.tv/Washington-Commanders):

1. Add a new page in the database:
   ```sql
   INSERT INTO pages (slug, title, description)
   VALUES ('my-project', 'My Project', 'A description');
   ```

2. Create the route file at `app/my-project/page.tsx`

3. Edit content at `/admin/my-project`

### Deploy to Production

#### Vercel (Recommended)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

#### Other Platforms
Works with any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS

## Common Issues

### "Invalid API Key"
- Double-check your `.env.local` file
- Ensure no trailing spaces in keys
- Restart dev server after changing env vars

### "Unauthorized" in Admin
- Make sure you're logged in
- Check Supabase auth session in browser DevTools
- Try logging out and back in

### Images Not Uploading
- Check Supabase Storage in dashboard
- Verify `page-images` bucket exists
- Check browser console for errors

### Grid Layout Looks Wrong
- Clear browser cache
- Check that CSS files are loaded
- Try resetting block positions

## Support

For issues or questions:
1. Check the `PROJECT_README.md` for detailed docs
2. Review Supabase documentation
3. Check Next.js documentation
4. Review react-grid-layout docs

## That's It!

You now have a fully functional portfolio CMS. Start creating beautiful content! 🎨
