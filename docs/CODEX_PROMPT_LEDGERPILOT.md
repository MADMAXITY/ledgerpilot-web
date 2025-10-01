# Codex-High Build Prompt — LedgerPilot Web App
**Use this file as the single prompt for the project.** Follow it end‑to‑end. If anything conflicts, always obey file `codex-high-context.md`.

## Context Files (present in docs/ under repo root)
- `codex-high-context.md` ← **Source of truth** for UI contracts, flows, and design
- `dbschema.sql` ← DB column names only (do **not** redefine or migrate schema)

## Hard Rules (do not violate)
1) **Obey `codex-high-context.md` exactly**: Google auth only, single `storage_key`, UI creates `ingestions` then calls `POST /ingestions/:id/start`, exact FSM state names, MUI design.
2) **Never invent DB columns**. Only use what exists in `dbschema.sql`. If a column is needed but missing, surface a TODO and proceed without blocking.
3) **No service-role keys on the client.** Read API base from `NEXT_PUBLIC_API_BASE_URL`. No idempotency keys.
4) **Next.js App Router + TypeScript + MUI v5**; premium, modern, fast UX.
5) **Small, production-ready code**; use sensible defaults; keep consistent style.

## Assumptions
- The repository is already scaffolded with `create-next-app` (TS + App Router). If a file is missing, create it.
- `codex-high-context.md` governs architecture & contracts. Treat it like a spec.

---

## Tasks (Implement in order)

### 1) Project Setup
- Add/ensure dependencies:
  ```bash
  npm i @mui/material @mui/icons-material @emotion/react @emotion/styled \
        @supabase/ssr @supabase/auth-helpers-nextjs \
        zod swr notistack
  ```
- Configure **ESLint & Prettier** (if missing) with standard Next.js TS rules.
- Add `.editorconfig` with UTF-8 LF, 2 spaces.

### 2) Environment
- Create `.env.example` **exactly** as defined in `codex-high-context.md` (Supabase URL/Anon, APP_URL, API base, optional Sentry). Do not hardcode secrets.
- Ensure the app reads `NEXT_PUBLIC_API_BASE_URL` for all backend calls.

### 3) Theming & Layout
- Add `theme.ts` with premium dark theme (palette/typography/shape) as sketched in `codex-high-context.md`.
- Wrap the app with MUI ThemeProvider + CssBaseline; load **Inter** font.
- Create `components/AppLayout.tsx` with AppBar (logo/title + user avatar) and a collapsible SideNav.

### 4) Supabase Client & API Wrapper
- `lib/supabase.ts` — browser client via `@supabase/ssr` (anon key only).
- `lib/api.ts` — small helper around `fetch` that prefixes `NEXT_PUBLIC_API_BASE_URL`, throws on non‑2xx, and returns JSON.

### 5) Auth (Google only) & Session Gate
- `/login` page: “Continue with Google” using `supabase.auth.signInWithOAuth` with `redirectTo = ${APP_URL}/auth/callback`.
- `/auth/callback` route: transient loading state then redirect to `/`.
- Implement a server‑side session gate for protected routes (`/`, `/queue`, `/ingestions/[id]`) using `@supabase/auth-helpers-nextjs`.
- Header avatar menu: show user email, **Sign out** action.

### 6) Org Bootstrap
- Add **`/api/bootstrap`** route per spec. On first authenticated load, upsert the profile bound to an org and return `{ ok, org_id }`.
- Client boot: call this once after login and cache `org_id` for the session.

### 7) Storage & Files (single `storage_key`)
- **Upload convention**: `invoices-original/<org_id>/<uuid>-<filename>`
- On Dashboard upload:
  1. Upload the file to Supabase Storage (`invoices-original`) at the path above (no upsert).
  2. Insert a row in `files` with **`storage_key`** set to `invoices-original/<org_id>/<uuid>-<filename>` (no `bucket/object_path` split).
  3. Generate signed URLs for previews when needed (never expose service-role).

### 8) Ingestions (UI creates, n8n starts)
- After inserting `files`, **insert an `ingestions` row** with `state = "Queued"`, `source = "web"`, and any optional notes.
- Call **`POST ${API_BASE}/ingestions/:id/start`** (no body) to transition the job to `Extracting` in n8n.
- Respect the exact FSM states from the spec:
  - `Queued` → `Extracting` → `Matched` → `Ready` → `Posting` → `Billed` (or `Failed`)

### 9) Routes & Screens
- `/` **Dashboard/Upload**
  - Dropzone → upload → `files` insert → `ingestions` insert → call start endpoint.
  - Show “Recent Uploads” with **State chips** and toasts on success/error.
- `/queue` **Reviewer Queue**
  - MUI DataGrid (server‑fetched) with filters by state/date.
  - Columns: created_at, vendor_guess, total_guess, state chip, open detail.
- `/ingestions/[id]` **Ingestion Detail / Bill Preview**
  - Left: original file preview (signed URL).
  - Right: read‑only `bill_payload_draft` and metadata.
  - Actions: **Approve** → `POST /approvals/:ingestion_id/approve`  
             **Reject** → `POST /approvals/:ingestion_id/reject` with `{ reason }`
  - Show timeline of state changes (if available) and error panel when `Failed`.

### 10) Components
- `UploadDropzone` — input, file validations, progress.
- `StateChip` — renders exact FSM labels with consistent colors.
- `ReviewerTable` — DataGrid wrapper with filtering and pagination.
- `BillPreview` — JSON viewer (read‑only), download original button, approve/reject buttons.

### 11) Types & Contracts
- `types/contracts.ts` — DTOs that mirror the **Backend API — Contracts** in `codex-high-context.md` (list, detail, approvals, start, FSM labels). Keep enums in sync with the spec.

### 12) Data Fetch Patterns
- Prefer **Server Components** for data lists/detail SSR where viable; use **SWR** for client interactivity (mutations for approve/reject).
- Centralize error handling; show toasts via **notistack**.

### 13) README
- Add a concise README with setup steps, env variables, `npm run dev`, and notes on pointing to dev/staging n8n via `NEXT_PUBLIC_API_BASE_URL`.

---

## Output Requirements (from Codex)
- Provide a **file-by-file plan and diffs**, or full file contents for newly created files.
- **No lorem ipsum.** Use meaningful names/labels consistent with the spec.
- Use the exact FSM labels.
- Any ambiguity → defer to `codex-high-context.md` and proceed.

---

## Definition of Done
- Google login works; protected routes (`/`, `/queue`, `/ingestions/[id]`) are gated.
- `/api/bootstrap` creates/ensures profile ↔ org and returns `org_id`.
- Dashboard upload flow works: Storage upload → `files` row (single `storage_key`) → `ingestions` row (`Queued`) → `POST /ingestions/:id/start`.
- Reviewer queue and detail pages render with the **exact** state chips and data contracts from the spec.
- Approve/Reject calls function and surface success/error toasts.
- All backend calls read base URL from `NEXT_PUBLIC_API_BASE_URL`.
- `.env.example` matches the spec; app runs locally with mocked or live n8n.
- Code is TypeScript, App Router, MUI themed, and production‑ready (lint passes).
