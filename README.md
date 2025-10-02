LedgerPilot is a Next.js App Router app for uploading invoices to Supabase Storage, creating ingestion jobs, and reviewing/approving bill drafts. It follows the contracts and flows defined in docs/codex-high-context.md.

Quick start

- Copy .env.example to .env.local and set values:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_API_BASE_URL (your n8n/dev API)
- Install deps: npm i
- Run: npm run dev

Notes

- Auth is Google-only via Supabase. After login, the app calls /api/bootstrap to ensure a profile and org, returning org_id for the session.
- All backend API calls use NEXT_PUBLIC_API_BASE_URL.
- Upload flow: Storage upload (invoices-original/<org>/<uuid>-<filename>) -> insert files (storage_key single field) -> insert ingestions (status queued) -> POST /ingestions/:id/start.
- Reviewer queue and details fetch from the API. Approve/Reject calls hit the approval endpoints and show toasts.

Scripts

- npm run dev: Start dev server on http://localhost:3000
