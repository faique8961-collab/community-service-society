MCS COMMUNITY SERVICE SOCIETY — WEBSITE REVISION

This update addresses the latest requested changes:
- Restores the society logo in the header/footer and displays the university logo alongside it in the header, as well as on the homepage/about page.
- Removes the separate Initiatives navigation/page. Events is now the single archive for events AND initiatives, including event detail pages.
- Keeps the Gallery as the broader photo archive of all supplied photographs.
- Reorganises Our Team into a larger President feature, one Vice Presidents row, one General Secretaries row, followed by Joint Secretaries, Secretary Events, Secretary Media, and Secretary Finance sections.
- Labels the executive committee section as the Main Panel and notes the 8 Directors and 8 Department Directors as the wider supporting team.
- Adds a Volunteer page with Instagram and President/General Secretary contact cards.

IMPORTANT PHONE PLACEHOLDER:
The number +92 300 000 0000 is a dummy reference placeholder, not a verified society contact. Replace it with an approved phone number before publishing. Both contact cards currently use the same placeholder number.

INSTALL:
1. Commit or back up your current project first.
2. Extract this ZIP.
3. Copy its contents into the ROOT of your existing project folder, allowing the src files to be replaced and the public folder to merge.
4. Do NOT replace .git, package.json, or package-lock.json.
5. Run: npm run dev
6. Test: /, /about, /events, /team, /gallery, /get-involved
7. Run: npm run build

GITHUB (only after the site works and build succeeds):
  git status
  git add .
  git commit -m "Refine logos, events archive, team layout and volunteer page"
  git push origin main

The update includes the optimized image assets under public/images, including both branding logos. No Supabase/CMS functionality is included in this update.
