# MCS Community Service Society website

A React + Vite website using the supplied MCS Community Service Society text and branding assets.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Build for deployment

```bash
npm run build
npm run preview
```

## Updating content

- Society history, mission, initiatives and committee biographies: `src/data/content.js`
- Main page layout and sections: `src/App.jsx`
- Visual theme and responsive styling: `src/index.css`
- Images: `public/images/`

Committee portrait placeholders are intentional. Add approved portraits to `public/images/` and then update each committee entry and its card in `src/App.jsx` when ready.

## Notes

- This is the public-facing first content/design pass. The admin dashboard, Supabase authentication, database and CMS have not yet been connected.
- Only the supplied clothing-drive photograph is currently used. Other event image slots can be added when photographs are supplied.
- The supplied university logo JPG contains a visible checkerboard background, so it is not used in the design. The society logo PNG is used instead.
- No unverified impact totals are published. The supplied history text contains an unclear fundraising figure range; confirm the exact figure before publishing a number.
- Review all biographies, spelling, titles and photo permissions with the society before deployment.
