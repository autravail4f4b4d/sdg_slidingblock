# SDG Escape — Unlock 2030

A landscape-first, offline-capable sliding-block puzzle for an SDG exhibit. It uses no backend, no account, and no remote runtime assets.

## Run locally

```bash
npm install
npm run dev
```

For local manual UAT of the three fixed, unapproved fixtures, start Vite with the explicit flag:

```powershell
$env:VITE_UAT_MODE = 'true'
npm run dev
```

This exposes TUKLAS, UNAWA, and KILOS only in that local process. It does not alter production pools or manual-UAT approval records.

Use the URL shown by Vite. For a production check:

```bash
npm test
npm run verify:pools
npm run build
```

## Tablet install

Build and serve the `dist` folder over HTTPS (or localhost during development), then open it in Chrome for Android. Use Chrome’s **Install app** prompt/menu option. After the first successful load, the included service worker caches app resources for offline use.

The board is touch-first and landscape-friendly; portrait remains usable with a compact layout.

## Architecture

- `src/game/` keeps state, collision, moves, solver, scoring, and browser storage independent from rendering.
- `src/data/productionLevels.ts` contains only pre-generated variants that have passed exact solving, quality checks, and manual UAT; `src/data/smokeFixtures.ts` retains non-production historical layouts.
- `src/game/replay.ts` persists offline per-tier shuffle bags so approved variants do not repeat until their tier pool is exhausted.
- `src/main.ts` handles Pointer Events, snapshots for undo, timer, hint, menus, and result flow.
- `public/sw.js` and `public/manifest.webmanifest` provide the lightweight PWA behavior.

`docs/reference/SDG_ESCAPE_VISUAL_TARGET.png` defines the intended visual direction only. Production puzzle geometry is defined by the solver-verified level configuration.

Production pools remain intentionally empty until candidates pass every promotion gate. `npm run verify:pools` is nonzero while a tier has fewer than three approved variants.

## Physical-device verification still needed

The PWA manifest, service worker, responsive layout, and Pointer Events are implemented and browser-testable. Installing on a real Android tablet, reopening without network, and checking touch feel should be performed on the target exhibit hardware.
