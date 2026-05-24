---
name: testing-shop
description: Test the Chalak Mobility shop Angular app end-to-end. Use when verifying UI changes, layout fixes, or feature additions to the shop frontend.
---

# Testing the Shop App

## Prerequisites

- Node.js 20+
- npm install with `--legacy-peer-deps` flag (required due to peer dependency conflicts)

## Serve Locally

```bash
cd /home/ubuntu/repos/chalak-mobility
npm install --legacy-peer-deps
npx nx serve shop
```

This starts both the Angular frontend (port 4200) and the API backend simultaneously.

## Key URLs

- Local dev: http://localhost:4200
- Vercel preview deploys are available on PRs (check PR comments from Vercel bot)

## App Structure

- Header component: `apps/shop/src/app/layout/header/`
- Footer component: `apps/shop/src/app/layout/footer/`
- Features: `apps/shop/src/app/features/` (hero, vehicles, pricing, booking, auth, etc.)
- Global styles: `apps/shop/src/styles.css`
- Static assets: `apps/shop/public/assets/` (logo.svg, vehicle images, etc.)

## Known Issues

- **Translation keys may show as raw keys** (e.g., `navigation.home` instead of "Home"). This might be a translation service configuration issue — not necessarily a bug in your changes.
- **`npm ci` fails on CI** due to lockfile sync issues with `@rspack` and `@module-federation` packages. This is a pre-existing issue on the `main` branch. CSS-only or template-only changes are not affected.
- **Global `* { transition: all 0.25s ease-in-out }` rule** in `styles.css` can cause unexpected animations during layout shifts. Be aware of this when testing layout-related fixes.

## Testing Tips

- For layout/CSS fixes, zoom into the affected region using browser DevTools or the computer tool's zoom action to get clear evidence.
- Test at multiple viewport widths — the app has no responsive breakpoints/media queries in the header, so flex layout behavior at narrow widths is important to verify.
- Use route navigation (click nav links) to verify components persist across route changes.

## Lint & Build

```bash
npx nx run-many -t lint
npx nx run-many -t build
npx nx run-many -t test
```

## Devin Secrets Needed

No secrets required for local testing of the shop frontend.
