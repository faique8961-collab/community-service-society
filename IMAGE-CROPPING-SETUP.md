# Image cropping update — setup instructions

This project update adds a reusable image cropper to the admin dashboard and saves image shape metadata for announcements and event photographs.

## Before replacing files

1. Make a backup of your current project folder.
2. Open your Supabase project → **SQL Editor**.
3. Run the complete contents of `supabase-image-cropping-migration.sql`.
4. Wait for the SQL query to finish successfully before deploying the updated React code.

The migration is additive. It does not delete or rewrite existing announcement or event images. Existing event images receive a `4:3` display default; existing announcement records receive the same default.

## Apply the project update

1. Extract the supplied ZIP.
2. Copy the extracted `community-service-society` folder contents over your existing project folder, allowing the updated source files to replace their old versions.
3. **Keep your existing `.env` file.** It is intentionally not included in the ZIP because it contains your private Supabase credentials.
4. Open a terminal in the project folder and run:

   ```bash
   npm ci
   npm run dev
   ```

## What changed

- A shared cropper component now powers the team, event, and announcement image workflows.
- The cropper supports square (`1:1`), portrait (`3:4`), and landscape (`4:3`) crops, zoom, dragging/repositioning, and a preview before upload.
- Announcements support one optional cropped image. The latest three published announcements appear on the public homepage.
- Event cover images and each gallery image have independent crop ratios. The public event cards, detail galleries, and photo archive use the saved ratio metadata.
- Existing image URLs remain supported. Pasting an external URL does not crop or upload that image; it only lets you select its display ratio.
- Images selected from the computer are cropped and compressed before being uploaded to the existing `society-images` bucket. Announcement images use the existing `events/` storage prefix (`events/announcements/`) to remain compatible with event-folder storage policies.
- Unused uploaded files are cleaned up when replaced or removed where the app can safely confirm they are no longer referenced.

## Quick verification

After starting the site:

1. Sign in to `/admin`.
2. Open **Team** and confirm the existing photo cropper still works.
3. Create an announcement, upload a photo, try all three ratios, and save it as a draft. Publish it when ready.
4. Edit an event, upload a new cover image, then upload multiple gallery images. Crop each image separately and select different ratios.
5. Check the public homepage, `/events`, an event detail page, and `/gallery`.

If the browser reports a database-column error, confirm that the SQL migration was run in the same Supabase project configured in your `.env`.
