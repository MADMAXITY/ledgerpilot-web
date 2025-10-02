# Recent UI Changes — Oct 2025

This document captures the latest UX and visual polish applied across the app. It complements the baseline architecture in `docs/LEDGERPILOT_WEB_ARCHITECTURE.md` and product flows in `docs/codex-high-context.md`.

## Highlights

- Background & Surfaces
  - Single root gradient (via `CssBaseline`) with optional grain overlay to remove banding/seams.
  - Unified Paper/Card/Drawer surfaces using the same paper color and subtle 1px borders.

- MUI + Next 15
  - Added `@mui/material-nextjs` App Router cache provider in `src/app/providers.tsx` to stabilize Emotion SSR and prevent hydration mismatches.

- Review Page
  - KPI cards have a hover lift/border and set filters on click; Failed hides at 0.
  - Table rows show a pointer cursor, deeper hover tint, and a subtle inset 1px border; density toggle added; vendor tooltips + truncation; totals right‑aligned (tabular numerals).
  - Drawer: compact Lines (product name + match status only); softer Approve/Reject buttons; divider under actions; keyboard shortcuts (A/R/V; J/K list navigation) with tooltips.

- Login & Favicon
  - Redesigned login landing with the logo image, feature bullets, trust chips, and a sign‑in card.
  - Favicon switched to `public/favicon.png` via explicit `<link rel="icon" ...>` entries in `app/layout.tsx`.

- Upload & Settings
  - Upload page heading removed; focused upload card only (centered, constrained width).
  - Settings “Save Changes” button softened (calmer tint + border, no heavy shadow).

- Environment Simplification
  - Removed `NEXT_PUBLIC_APP_URL`; OAuth redirect now uses `window.location.origin`. Ensure your Supabase Auth console lists all app origins with `/auth/callback`.

See `docs/LEDGERPILOT_WEB_ARCHITECTURE.md` §16 for an integrated change log.

