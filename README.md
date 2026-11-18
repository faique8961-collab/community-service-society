
# Community Service Society website

A React + Vite starter for the society's public website and future content-management dashboard.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

1. Extract this folder.
2. Open a terminal in the project folder.
3. Run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (usually http://localhost:5173).

## Build check

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
  components/       Shared site components
  data/             Temporary sample content
  lib/              Supabase client and shared utilities
  pages/            Public pages and admin placeholder
  App.jsx           Routes
  index.css         Global styles and Tailwind import
  main.jsx          React entry point
```

## Supabase setup (later milestone)

1. Create a Supabase project owned by the society.
2. Copy its Project URL and publishable/anon key into a local `.env` file.
3. Never put the `service_role` key in frontend code.
4. We will add database tables, Row Level Security policies, authentication and storage policies before enabling the admin CMS.

## Cloudflare Pages deployment (later milestone)

- Connect the GitHub repository to Cloudflare Pages.
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables once Supabase is configured.

The free `pages.dev` address can be used initially. Free-plan limits and provider terms should be checked at deployment time.

## Important before launch

Replace sample society details and imagery with approved material. Obtain permission before publishing identifiable photographs or personal information, especially involving children or vulnerable people. Add and test database security policies before accepting real enquiries or administrator accounts.
=======
# community-service-society
Website for Community Service

