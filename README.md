# my-things

A tiny, mobile-first web app for collecting things on one cutting-mat style board. Tap anywhere empty on the mat (or press **New**) to add a tile:

- **YouTube**: paste any YouTube link (or a video ID). The tile shows the thumbnail; tap it to play.
- **Text**: a quick note
- **Image**: a photo from your device, downscaled to 1024px
- **Website**: any URL, shown as a screenshot preview from [thum.io](https://www.thum.io/)

Long press a tile (or right-click it, or focus it and press Enter) to **Edit** it, **Open in new tab**, or **Delete** it. Hold a tile and then drag to move it; on a computer you can drag right away. Drag the grip in its bottom-right corner to resize it. Tiles snap to the mat's grid and can't overlap. The mat is 16 columns wide and scales with the screen, so the layout looks the same on a phone and a desktop.

When you're signed out, tiles are saved in your browser's `localStorage`, so they stay on that device. Photos take up most of that space; if it fills up, the app tells you instead of losing the change.

**Sign in** with GitHub to sync your tiles across devices. The first time you sign in on a device, the tiles saved there move into your account (if the account already has tiles, the app asks first and puts them below). The app reloads your tiles whenever you come back to the tab.

Use **Export** to download a `tiles.json` backup (photos included) and **Import** to restore it.

## Development

Requires Node `^22.13.0` or `>=24`.

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also serve on your LAN to test on a phone
```

Without Supabase settings the app runs local-only and hides **Sign in**. To try cloud sync locally, copy [`.env.example`](.env.example) to `.env.local` and fill in your project's values.

Other scripts:

| Script            | What it does                        |
| ----------------- | ----------------------------------- |
| `npm test`        | Run unit tests (Vitest)             |
| `npm run lint`    | Lint with ESLint                    |
| `npm run build`   | Type-check and build into `dist/`   |
| `npm run preview` | Serve the production build locally  |

## Adding a tile type

Each tile type lives in one file under [`src/tiles/`](src/tiles/). It defines the label, icon, default size in grid cells, form fields, `defaults` that prefill the form when editing, a `parse` function that validates the form input, an optional `href` for **Open in new tab**, and a `View` component. To add a new type:

1. Add its shape to the `Tile` union in [`src/types.ts`](src/types.ts).
2. Create `src/tiles/<type>.tsx` exporting a `TileDef<'<type>'>`.
3. Register it in [`src/tiles/registry.ts`](src/tiles/registry.ts) and add a validator in [`src/storage.ts`](src/storage.ts).
4. Add a migration under [`supabase/migrations/`](supabase/migrations/) that allows the new type in the `tiles.type` check.

## Deploying to GitHub Pages

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which lints, tests, builds, and publishes `dist/` to GitHub Pages.

One-time setup: in the repository on GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.

## Cloud sync setup (Supabase)

The site stays a static build on GitHub Pages; the browser talks to [Supabase](https://supabase.com/) directly. The publishable key ends up in the page, which is expected: row-level security limits every user to their own tiles and photos.

1. Create a free Supabase project. In its **SQL Editor**, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It creates the `tiles` table, the private `photos` bucket, and their row-level security policies.
2. Create a GitHub OAuth app (GitHub **Settings > Developer settings > OAuth Apps > New OAuth App**):
   - **Homepage URL**: `https://nosarabs.github.io/my-things/`
   - **Authorization callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`

   Then paste its client ID and a new client secret into Supabase **Authentication > Sign In / Providers > GitHub** and enable it.
3. In Supabase **Authentication > URL Configuration**, set **Site URL** to `https://nosarabs.github.io/my-things/` and add `http://localhost:5173/**` to **Redirect URLs**.
4. In this repository on GitHub, open **Settings > Secrets and variables > Actions > Variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (from Supabase **Project Settings > API Keys**). Push or re-run the deploy workflow to pick them up. Put the same values in `.env.local` for development.
5. If the app is just for you: after your first sign-in, turn off **Allow new users to sign up** in Supabase **Authentication > Sign In / Providers**. Row-level security already keeps other people out of your data, but this stops them from using your project's free quota.
