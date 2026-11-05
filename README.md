# Jeanette Janvier: portfolio site

Sculpture and installation portfolio for Jeanette Janvier, built for her MFA (Master of Fine Arts) applications.

## What is where
- `index.html`: the front page.
- `contact.html`: the contact page, with the contact form embedded from Tally.
- `rays.js`: draws the folded paper stingrays, which swim on both pages and double as the menu on the front page.
- `feed.js`: the food box and the feeding game.
- `art/`: her own photos, such as the fiber medium wave sculpture.
- `build.js`: runs on Vercel. It copies the site into `public/` and fetches the older artwork images from jeanettejanvier.com.
- `versions/`: earlier versions kept for reference (v3 to v6). All versions are also live on Vercel as jeanette-janvier-vN.vercel.app.

## Adding new work
Put the photo in `art/`, reference it from `index.html`, then commit and push. Vercel deploys automatically.
