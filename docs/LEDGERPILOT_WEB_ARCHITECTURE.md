# LedgerPilot Web — Architecture, Features, and Change Log

This document captures the implemented architecture, user‑facing features, data contracts, and the changes delivered during this build session. It complements the product prompts and contracts in `docs/`:

- docs/codex-high-context.md — Source of truth for flows, UI states, and contracts
- docs/CODEX_PROMPT_LEDGERPILOT.md — Task prompt used for this build

The codebase is a Next.js App Router application written in TypeScript with Material UI (MUI), Supabase (SSR helpers), SWR, and notistack.

## 1) Technology Stack

- Framework: Next.js (App Router, TypeScript)
- UI: MUI v5 + Inter font
- State/Data Fetch: SWR for client, native fetch for server
- Auth: Supabase Auth (Google only), SSR clients (`@supabase/ssr`)
- Storage: Supabase Storage (`invoices-original/<org>/<uuid>-<filename>`, single `storage_key`)
- Notifications: notistack
- Tables/Schema: See `docs/dbschema.sql`. UI strictly uses existing columns.

## 2) Environment

Populate `.env.local` from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL` (n8n / backend base URL)
- Optional: `NEXT_PUBLIC_SENTRY_DSN`

All backend calls use `NEXT_PUBLIC_API_BASE_URL` (never hardcoded). Auth redirect uses `window.location.origin` at runtime; no app URL env is required.

## 3) Routing and Layout

- `(auth)/login` — Google login via Supabase `signInWithOAuth`
- `auth/callback` — server route to exchange code for Supabase session
- `(app)/layout.tsx` — protected layout using Supabase SSR server client and cookie auth gate
- `(app)/page.tsx` — Upload page
- `(app)/queue/page.tsx` — Review list
- `(app)/ingestions/[id]/page.tsx` — Ingestion detail (read-only SSR from DB)
- `(app)/settings/page.tsx` — Org + OAuth settings

App shell:

- `src/components/AppLayout.tsx` — AppBar with logo, Drawer side-nav (Upload, Review, Settings), avatar menu.
- `src/app/providers.tsx` — ThemeProvider + CssBaseline + SnackbarProvider
- `src/theme.ts` — Premium dark theme with modern accents (indigo/cyan), consistent components.

## 4) Supabase Clients

- `src/lib/supabase-server.ts` — `createServerClient` (awaited cookies) for SSR routes and gated layout
- `src/lib/supabase.ts` — `createBrowserClient` for client interactions (upload flows, previews)

## 5) Next API (Server) Endpoints

- `GET /api/bootstrap` — Creates/ensures profile bound to an org (first login). Returns `{ ok, org_id }`.
- `GET /api/ingestions/list` — Paginated list for Review:
  - Reads from `ingestions`, joins `invoices` for totals; parses `bill_payload_draft` to prefer draft `bill_number` and `vendor_id`.
  - Resolves draft `vendor_id` → vendor name via `vendors` (grouped per org for efficiency).
  - Emits fields: `id, created_at, state (UI), ingestion_status, approval_status, approval_mode, vendor_guess, bill_number, total_guess`.
- `GET /api/ingestions/:id` — Detail view for Review drawer:
  - Reads `ingestions` (status, approval_mode/status, `bill_payload_draft`) + `files` (resolve `storage_key`).
  - Reads `invoices` + `invoice_lines` and enriches item names:
    - If a line has `item_id` and is not `to_create`, look up name in `items_catalog_duplicate`.
    - If a line is `to_create` (no `item_id`), keep the `invoice_lines.item_name` as the display name.
  - Enriches `bill_payload_draft` with vendor name (`vendors`) and line item names:
    - When a draft line has `item_id`, look up name in `items_catalog_duplicate`.
    - When a draft line has no `item_id`, map sequentially to `invoice_lines` for that invoice (1→1st, 2→2nd, …) and use the corresponding `invoice_lines.item_name` as the display name.
- `ALL /api/n8n/[...path]` — Proxy to `NEXT_PUBLIC_API_BASE_URL` (CORS fallback).
- `GET|POST /api/settings/oauth` — Reads/creates/updates `oauth_tokens` per current org (requires refresh_token only for initial create; NOT NULL column).
- `POST /api/settings/org` — Upserts org + binds current profile to that org.

## 6) Client Components

### AppLayout
- AppBar with large `public/logo.png` (name + icon), and Drawer for navigation.
- Avatar menu provides Sign out.

### UploadDropzone
- Approval mode toggle (`manual`/`auto`).
- Drag-drop or file chooser.
- Flow:
  1) Upload to Supabase Storage (`invoices-original/<org>/<uuid>-<filename>`, no upsert)
  2) Insert into `files` with single `storage_key`
  3) Insert into `ingestions` (`status = queued`, `approval_mode` from toggle)
  4) POST `${API_BASE}/ingestions/:id/start` to transition to `Extracting` (n8n)
- Subtle success message: “Invoice received and processing has started.”
- Error UX: short alert + “View details” dialog (no raw dumping in UI).
- Resets file input to allow re-uploading the same file.

### ReviewerTable (Review)
- DataGrid with columns:
  - Created (date)
  - Vendor (from draft vendor via `vendors`, fallback to `invoices`)
  - Bill # (from draft bill number, fallback to `invoices`)
  - Total (from `invoices`)
  - Ingestion (chips: Queued, Extracting, Matched, Posting, Billed, Failed)
  - Approval (chips: Pending, Ready, Approved, Rejected)
  - Mode (chips: Auto/Manual)
- Clicking a row opens the right slide-in detail drawer.
- Loading shimmer and comfortable density styling.

### IngestionDrawer (Right Panel)
- Header chips: `status`, `mode`, `approval`.
- “View uploaded bill” chip toggles a separate left drawer viewer (see below).
- When `approval_mode = manual` and `approval_status = ready`, shows Approve and Reject buttons:
  - Approve → POST `${API_BASE}/approvals/:ingestion_id/approve`
  - Reject → POST `${API_BASE}/approvals/:ingestion_id/reject` with `{ reason }`
  - No client DB updates — the webhook updates the DB; drawer re-fetches detail after the call.
- Invoice summary (vendor name, bill number · date, total).
- Lines (DB): numbered as `1.` `2.` …; chip per `match_state`; uses enriched item names.
- Draft: vendor (via `vendors`), bill number/date/due date, discount flags, and draft line items (with item names from `items_catalog_duplicate`) — also numbered `1.` `2.` …

### BillViewerDrawer (Left Panel)
- Dedicated left drawer to preview the uploaded bill.
- PDFs: pdf.js viewer (page-fit on open) with native zoom toolbar.
- Images: custom viewer with `- / 100% / +` controls; the observed “50% zoom” baseline is normalized as “100%” in the UI.

### StateChip
- Consistent MUI chips for UI FSM states (Queued, Extracting, Matched, Ready, Posting, Billed, Failed).

## 7) Auth and Gating

- Google-only login via Supabase Auth.
- Server-protected routes via Supabase SSR client with awaited cookies.
- `/api/bootstrap` ensures profile row bound to an org on first login.

## 8) Performance and UX

- Route‑level loading skeletons for Queue and Ingestion detail.
- SWR loading indicators for responsive interactions.
- Optimized DataGrid density; removed distracting focus outlines; improved hover.

## 9) Upload & Review Data Rules

- Upload uses a single `storage_key` field (never split bucket/path in UI).
- Listing in Review resolves vendor and bill number from `bill_payload_draft` when available:
  - `vendor_id` → `vendors.name` per org
  - `bill_number` → draft’s field; fallback to `invoices.bill_number`
- Detail view enriches DB lines and draft lines with item names via `items_catalog_duplicate`.

## 10) Security and Contracts

- No service‑role keys in the browser.
- All webhooks and job control endpoints under `NEXT_PUBLIC_API_BASE_URL`.
- UI never updates `approval_status` directly — Approve/Reject call the webhook only.

## 11) Settings

- Org — set the current user’s org (upserts `orgs` + binds `profiles.org_id`).
- OAuth (Zoho) — client_id, client_secret, and (first time) refresh_token for `oauth_tokens` (NOT NULL refresh_token). Subsequent updates allow partial field changes.

## 12) Files and Folders (high level)

- `src/app/(auth)/*` — Login, auth callback
- `src/app/(app)/*` — Protected application pages
- `src/app/api/*` — Next API endpoints (SSR, read-only or server actions)
- `src/components/*` — UI components
- `src/lib/*` — clients and helpers
- `src/types/*` — contracts and DTOs used in UI

## 13) Change Log (this session)

Highlights:

- Implemented Supabase SSR auth and gated layouts; fixed cookie handling for Next.js 15.
- Upload flow with approval mode toggle; subtle success + error details dialog; input reset for repeat uploads.
- Replaced “Recent Uploads” with a focused Upload screen.
- Built Review list with vendor & bill number from draft (via vendors + draft bill number), status chips (Ingestion + Approval), and Mode chip.
- Added right slide‑in Ingestion drawer with:
  - Status/Mode/Approval chips
  - Left drawer Bill viewer (pdf.js or image zoom panel) — initial fit‑to‑page
  - Lines and Draft sections (numbered, enriched names)
  - Approve/Reject buttons that only call backend webhooks (no client DB update)
- Built Settings:
  - Org binding
  - OAuth credentials manager for `oauth_tokens` with create/update semantics
- Added `/api/ingestions/list` and `/api/ingestions/:id` SSR endpoints (DB‑backed, enriched data)
- Added `/api/n8n/[...path]` proxy fallback (CORS resilience)
- Applied polished dark theme, larger logo, and modern styling.

## 14) Developer Notes & TODOs

- Currency formatting can be made locale-aware with a small helper.
- Reviewer filters: add default filter “Approval: Ready” and date range.
- Replace `prompt()` in Reject with a MUI dialog form.
- Optional: vendor and item catalog search for bulk match/resolve flows.

## 15) Runbook

1. `npm i`
2. Create `.env.local` using `.env.example`
3. `npm run dev`
4. Visit `/login` and sign in with Google
5. Set Organization in `/settings` (if needed) and OAuth credentials
6. Use `/` to upload and `/queue` to review items

This document will evolve alongside contracts in `docs/codex-high-context.md` and the DB schema in `docs/dbschema.sql`.


## 16) Follow-up Change Log (UI polish & infra)

This pass focused on production-level polish, UX affordances, and hydration stability.

- Background and surfaces
  - Single root gradient and optional grain overlay to eliminate banding/seams.
  - Unify Paper/Card/Drawer on the same paper surface color with subtle 1px borders.

- MUI + Next 15 integration
  - Added `@mui/material-nextjs` App Router cache provider in `src/app/providers.tsx` to stabilize Emotion SSR and avoid hydration mismatches.

- Review page
  - MetricsBar: hover lift + border tint; cards clickable to filter; hides Failed when 0; skeletons while loading.
  - Table: pointer cursor on rows, stronger hover tint with 1px inset border; density toggle (comfortable/compact); zebra striping; vendor tooltip + truncation; totals right-aligned with tabular numerals.
  - Drawer: compact Lines (only product name + match status) for clean scanning; soft Approve/Reject styles with a divider; keyboard shortcuts A/R/V and J/K supported.

- Login & favicon
  - New login landing with product logo, feature bullets, trust chips, and a sign-in card.
  - Favicon switched to `public/favicon.png` via explicit link tags and metadata.

- Upload & Settings
  - Upload page heading removed; only the upload card is shown; card centered with a constrained max width.
  - Settings "Save Changes" button softened (no heavy shadow; subtle border/tint).

- Environment simplification
  - Removed `NEXT_PUBLIC_APP_URL`; OAuth redirect now uses `window.location.origin` at runtime. Ensure all callback origins are added to Supabase Auth.
