# my-things

A tiny, mobile-first web app for collecting things on one cutting-mat style board. Tap anywhere empty on the mat (or press **New**) to add a tile:

- **YouTube**: paste any YouTube link (or a video ID). The tile shows the thumbnail; tap it to play.
- **Text**: a quick note
- **Image**: a photo from your device, downscaled so it fits in browser storage
- **Website**: any URL, shown as a screenshot preview from [thum.io](https://www.thum.io/)

Long press a tile (or right-click it, or focus it and press Enter) to **Edit** it, **Open in new tab**, or **Delete** it. Hold a tile and then drag to move it; on a computer you can drag right away. Drag the grip in its bottom-right corner to resize it. Tiles snap to the mat's grid and can't overlap. The mat is 16 columns wide and scales with the screen, so the layout looks the same on a phone and a desktop.

Tiles are saved in your browser's `localStorage`, so they stay on the device you added them on. Photos take up most of that space; if it fills up, the app tells you instead of losing the change. Use **Export** to download a `tiles.json` backup and **Import** to restore it on another device or browser.

## Development

Requires Node `^22.13.0` or `>=24`.

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also serve on your LAN to test on a phone
```

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

## Deploying to GitHub Pages

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which lints, tests, builds, and publishes `dist/` to GitHub Pages.

One-time setup: in the repository on GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
