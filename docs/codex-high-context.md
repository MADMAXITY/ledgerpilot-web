# Codex-High Context — LedgerPilot Web UI
_Last updated: 2025-10-01 (Asia/Kolkata)_

This document is the **single source of truth** for Codex-High to scaffold and implement the **LedgerPilot** Next.js web app. It aligns Frontend ↔ Backend (n8n) ↔ Supabase and supersedes any older UI notes. **DB schema lives separately** (do not redefine tables here), but column names referenced below MUST match the actual DB schema.

---

## 0) Key Decisions (Locked)
- **Auth Provider:** Use **Google Login** via Supabase Auth. Email/password is **not required** (optional to enable later).
- **Org Scoping:** `public.current_org_id()` is available and granted to `authenticated`. All org-scoped reads/writes assume this.
- **Storage Addressing:** Use a **single field** `storage_key` everywhere (no `bucket` + `object_path` split in UI).  
  Example value: `invoices-original/<org_id>/<uuid>-<original_filename>.pdf`
- **Storage RLS:** The private bucket **`invoices-original`** is RLS-protected with:  
  `name LIKE public.current_org_id() || '/%'` for both **insert** and **select** policies (on `storage.objects`).  
  _This is already applied at the DB side; UI must follow the pathing convention above._
- **n8n Contracts:** Base URL is read from env. **No idempotency key** is required by API calls.
- **Ingestion Flow:** The **UI** inserts rows into **`files`** and **`ingestions`**, then calls an n8n **start** endpoint **with the `ingestion_id`**.
- **Design System:** **MUI** components; modern, premium feel; smooth UX; sensible defaults for fonts/icons/colors.

---

## 1) Environment Variables
Create a strict `.env.local` and a mirrored `.env.example`. Do **not** hardcode secrets in code.

```bash
# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Auth (Next.js App URLs)

# Backend (n8n)
NEXT_PUBLIC_API_BASE_URL=https://api.ledgerpilot.example.com   # do not hardcode; always read from env

# Optional: Sentry/Telemetry
NEXT_PUBLIC_SENTRY_DSN=
```

> **Rule:** The UI must fetch from `process.env.NEXT_PUBLIC_API_BASE_URL` for all server calls. Do not import relative paths.

---

## 2) Authentication (Google Login)
**Email/password is not required.** Use only **Google OAuth** at first.

### Supabase Console
1. **Authentication → Providers → Google**  
   - Enable Google
   - Set **Client ID** and **Client Secret** from Google Cloud Console
2. **Settings → Redirect URLs**  
   - Add your app origin(s) (dev + prod), e.g.  
     `http://localhost:3000`  
     `https://ledgerpilot.example.com`
3. **Callback:** Supabase handles callbacks at:  
   `https://<your-supabase-project>.supabase.co/auth/v1/callback` (auto-managed)

### Google Cloud Console (OAuth Client)
- App type: **Web application**
- Authorized JavaScript origins: your app origins
- Authorized redirect URI: the Supabase callback above

### Next.js (sign in/out)
```ts
// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

```tsx
// app/(auth)/login/page.tsx
'use client'
import { supabase } from '@/lib/supabase'
import { Button } from '@mui/material'

export default function Login() {
  return (
    <Button
      variant="contained"
      onClick={() =>
        supabase.auth.signInWithOAuth({ provider: 'google', options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }})
      }
    >
      Continue with Google
    </Button>
  )
}
```

> You may add an `/auth/callback` route to show a loading state while Supabase completes the session establishment and then redirect to the dashboard.

---

## 3) Org Bootstrap (First Login)
After successful login, ensure a **profile row exists** and the user is bound to an org. Implement a tiny server action/route to upsert on first page load.

### Contract
- **Input:** none (uses session)
- **Behavior:** If no `profiles` row for `auth.uid()`, create one and attach an org (new or existing).  
- **Output:** `{ ok: true, org_id }`

### Sketch
```ts
// app/api/bootstrap/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  // 1) Fetch or create profile bound to an org
  // 2) Return org_id
  return NextResponse.json({ ok: true, org_id: '...' })
}
```

> All subsequent API calls and RLS policies derive `org_id` via `public.current_org_id()` on the DB, not from the client request body.

---

## 4) Storage (Files) — Single `storage_key`
Always upload to `invoices-original` with path:  
`<org_id>/<uuid>-<original_filename>`

### Upload
```ts
const file = input.files[0]
const orgId = await getOrgId() // from /api/bootstrap
const objectName = `${orgId}/${crypto.randomUUID()}-${file.name}`

const { data, error } = await supabase.storage
  .from('invoices-original')
  .upload(objectName, file, { upsert: false })

if (error) throw error

// Persist to DB.files.storage_key (and any other required columns).
const { data: fileRow } = await supabase.from('files').insert({
  storage_key: `invoices-original/${objectName}`,
  // ...other columns your DB requires
}).select().single()
```

### Reading / Preview
For previews, generate a **signed URL** (do not expose service role):
```ts
const { data: signed } = await supabase.storage
  .from('invoices-original')
  .createSignedUrl(objectName, 60) // seconds
```

RLS on `storage.objects` uses:  
**`name LIKE public.current_org_id() || '/%'`** for both insert and select. Ensure the UI keeps `objectName` prefixed with `orgId/`.

---

## 5) Backend API (n8n) — Contracts
All requests use the base URL from `NEXT_PUBLIC_API_BASE_URL`. **No idempotency key**.

> **Flow choice (final):** The **UI** inserts into `files` and `ingestions`, **then** calls n8n to start by `ingestion_id`.

### 5.1 Create Ingestion (UI-side, not n8n)
After inserting into `files`, create an `ingestions` row with **state = "Queued"** (waiting to be picked up).

```ts
// Minimal example (actual columns depend on your DB schema)
const { data: ingestion } = await supabase.from('ingestions').insert({
  file_id: fileRow.id,
  source: 'web',
  state: 'Queued',      // waiting for processing
  notes: notes || null
}).select().single()
```

### 5.2 Start Processing (n8n)
**POST** `${API_BASE}/ingestions/:id/start`  
**Body:** _none_  
**Response:**
```json
{ "ok": true, "ingestion_id": "uuid", "state": "Extracting" }
```

> n8n should transition the row from `Queued` → `Extracting` immediately upon accepting the job.

### 5.3 List Ingestions
**GET** `${API_BASE}/ingestions?state=Queued|Extracting|...&page=1&page_size=20`  
**Response:** paginated list with minimal fields: `id, state, created_at, vendor_guess, total_guess, error`

### 5.4 Read Ingestion
**GET** `${API_BASE}/ingestions/:id`  
**Response:**  
- `ingestion` (core fields)  
- `bill_payload_draft` (JSON)  
- `extraction_summary` (optional human-readable)  

### 5.5 Approvals
**POST** `${API_BASE}/approvals/:ingestion_id/approve`  
**POST** `${API_BASE}/approvals/:ingestion_id/reject`  
**Body (reject):**
```json
{ "reason": "string" }
```
**Response:** `{ "ok": true, "state": "Approved|Rejected" }`

### 5.6 Retry/Finalize (optional)
**POST** `${API_BASE}/ingestions/:id/retry`  
**POST** `${API_BASE}/ingestions/:id/finalize`

> The UI never uses service-role keys; all secure operations happen server-side in n8n.

---

## 6) UI States & Screens (Skeletons)
Model the ingestion lifecycle as a **finite state machine**. Use these labels verbatim for consistency:

- `Queued` — file registered, waiting for OCR/extraction (ingestion row exists; not started or waiting to start)
- `Extracting` — OCR / parsing in progress
- `Matched` — vendor/items auto-matched (draft building)
- `Ready` — bill draft is ready for human review
- `Posting` — pushing to Zoho
- `Billed` — posted successfully (has `zoho_bill_id`)
- `Failed` — error occurred (surface `error` field)

### Screens
1. **Dashboard / Upload**
   - File dropzone → storage upload → **insert `files` row** → **insert `ingestions` row** → **POST `/ingestions/:id/start`**
   - “Recent Uploads” list with state chips
2. **Reviewer Queue**
   - Table (MUI DataGrid) with filters by `state` and date
   - Bulk actions: Approve/Reject (optional later)
3. **Bill Preview**
   - Original file preview (signed URL) on left
   - Draft fields on right (read-only for now)
   - Approve / Reject buttons + toast feedback
4. **Ingestion Detail**
   - Timeline of state changes
   - Error panel if `Failed`

Use **MUI Skeletons** to represent loading. Keep initial paint fast; stream data where possible.

---

## 7) Design System (MUI)
- **Library:** Material UI (v5+)
- **Icons:** Material Icons (rounded where available)
- **Typography:** Use a modern grotesk/sans (e.g., **Inter**, fallback to system UI)
- **Color Scheme:** Premium, high-contrast neutrals with a single accent
- **Motion:** Subtle transitions (200–250ms), reduce-motion aware
- **Density:** Comfortable by default; compact tables
- **Accessibility:** WCAG AA contrast on text/buttons

### Theme Sketch
```ts
// theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7C5CFC' },      // accent (replace to match brand)
    secondary: { main: '#00D1B2' },
    background: { default: '#0B0B0F', paper: '#121218' },
  },
  typography: {
    fontFamily: ['Inter', 'ui-sans-serif', 'system-ui'].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
  },
})
```

### Layout
- **AppBar:** left logo + title; right user avatar menu (logout)
- **SideNav:** icons + labels, collapsible
- **Main Content:** max-width responsive, content cards
- **Toasts:** success/error via `notistack` or MUI Snackbar

---

## 8) Routing (App Router)
```
/                → Dashboard / Upload
/queue           → Reviewer Queue
/ingestions/:id  → Ingestion Detail + Bill Preview
/login           → Google sign-in
/auth/callback   → transient loading → redirect
```

Protect routes with a simple session gate (server components + `@supabase/auth-helpers-nextjs`).

---

## 9) Data Fetch Patterns
- **Server Components** fetch lists/detail where possible (faster TTFB, less client JS).
- **Client Components** for interactive actions (upload, approve/reject).
- Use **SWR** or **React Query** for client cache on queues and detail pages.
- Always read API base from env.

---

## 10) Error Handling & Telemetry
- Centralize API error parsing (map `status` + `message`).
- Surface `ingestions.error` text in detail view when `Failed`.
- Optional: Sentry browser SDK with route sampling.

---

## 11) Security Notes
- Frontend uses **anon** key only.
- Never expose service-role keys in the browser.
- RLS is your guard rail; keep `storage_key` conventions and let policies enforce access.
- All third-party calls (Zoho, etc.) happen in **n8n**, not from the browser.

---

## 12) Test Data & Seeds (Optional but Helpful)
- A small seed script that inserts a **fake ingestion** in `Queued`/`Ready` with realistic `bill_payload_draft`.  
- Drop a couple of test files into `invoices-original/<dev-org>/...` for preview testing.

---

## 13) Ready-to-Implement Tasks (for Codex-High)
1. Scaffold Next.js App Router + MUI Theme + Auth session gate.
2. Build **Upload** page:
   - dropzone → Supabase upload
   - **insert `files` row**
   - **insert `ingestions` row (state='Queued')**
   - **POST `${API_BASE}/ingestions/:id/start`**
3. Build **Reviewer Queue**: server fetch + client filters, state chips.
4. Build **Ingestion Detail / Bill Preview**: file preview (signed URL) + draft JSON panel + Approve/Reject actions.
5. Wire **API client** that reads `NEXT_PUBLIC_API_BASE_URL`.
6. Add skeleton loaders and toasts across flows.
7. Add `/api/bootstrap` call on first load to ensure org binding.

---

## 14) Glossary
- **storage_key**: `invoices-original/<org>/<uuid>-<filename>` (single field used everywhere)
- **org_id**: Derived in DB via `public.current_org_id()`; not trusted from client input
- **ingestion**: A processing job from uploaded file → bill draft → (approved) Zoho bill

---

## 15) Future Enhancements (Out of Scope Now)
- Editable bill draft in UI (field-level edits)
- Bulk approval
- Role-based access (reviewer vs operator)
- Reprocessing with alternate OCR models
- Dark/Light theme switch
