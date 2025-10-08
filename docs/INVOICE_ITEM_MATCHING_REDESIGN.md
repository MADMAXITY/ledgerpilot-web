# Invoice Item Matching Redesign — Plan (Draft)

This plan removes auto-match, introduces human selection with suggestions, and preserves bill draft + approval pipeline. No code changes yet.

## Flow
- Intake (n8n): Extract → Normalize → Suggest candidates (store only) → Build preview draft → `ingestions.status='matched'`, `approval_status='pending'`.
- Review (UI): For each line choose (a) suggested item, (b) browse catalog, or (c) mark `to_create`. Server rebuilds preview after each change.
- Approve (n8n): Ensure no `unmatched` lines → create missing items (`to_create`) → rebuild final payload → post Zoho bill → upload file → `status='billed'`.

## n8n Changes
- ItemMatch Vector → Candidates: keep vector search; write top 4–5 to DB; never set `item_id` or `auto_matched`.
- Executioner (intake): stop UpdateItems/BillHandler; build preview draft; set `status='matched'`, keep `approval_status='pending'`.
- RebuildDraft (new): by `invoice_id`; builds preview (or strict in approval path).
- Approval pipeline: (1) validate no `unmatched`, (2) UpdateItems for `to_create`, (3) rebuild final payload (strict), (4) BillHandler.

## Next API Endpoints
- POST `/api/ingestions/:id/lines/:lineId/assign` → `{ item_id }` → set `human_matched`, rebuild preview; return refreshed `{ lines, counts, draft, approval_status }`.
- POST `/api/ingestions/:id/lines/:lineId/needs-create` → set `to_create`, rebuild preview; return refreshed detail.
- POST `/api/ingestions/:id/ready` → validate zero `unmatched`; set `approval_status='ready'`.
- GET `/api/lines/:lineId/candidates?top=5` → ranked suggestions `{ item_id, name, hsn8, similarity, reason, rank }`.
- GET `/api/items?q=&limit=&offset=` → search `items_catalog_duplicate` for browse dialog.

## Frontend (MUI)
- Lines list: show best suggestion chip; actions: See matches (expand 4–5), Browse catalog, Needs create.
- Approval: enable Approve only when `approval_status='ready'`; show Mark ready when `unmatched=0`.
- Draft panel: show preview JSON; final payload is rebuilt on Approve.

## BillPayloadBuilder
- Preview: tolerate lines without `item_id`; include placeholders (desc/qty/rate/discount/hsn). Optional `draft_stage: 'preview'`.
- Final: strict Zoho rules; every line valid; always rebuild on Approve.

## Database Schema (Additions)

```sql
-- Candidates per invoice line
create table if not exists public.invoice_line_match_candidates (
  org_id text not null,
  invoice_id bigint not null,
  line_id bigint not null,
  candidate_item_id text not null,
  candidate_name text not null,
  hsn8 text null,
  similarity double precision not null,
  reason text null,
  algo_version text not null default 'v1',
  rank smallint not null,
  created_at timestamptz default now(),
  constraint invoice_line_match_candidates_pkey primary key (line_id, candidate_item_id),
  constraint ilmc_org_fkey foreign key (org_id) references public.orgs (org_id) on delete cascade,
  constraint ilmc_invoice_fkey foreign key (invoice_id) references public.invoices (invoice_id) on delete cascade,
  constraint ilmc_line_fkey foreign key (line_id) references public.invoice_lines (line_id) on delete cascade
);

create index if not exists ilmc_line_rank_idx on public.invoice_line_match_candidates (line_id, rank);
create index if not exists ilmc_org_invoice_idx on public.invoice_line_match_candidates (org_id, invoice_id);

-- Fast readiness checks
create index if not exists invoice_lines_invoice_match_idx on public.invoice_lines (invoice_id, match_state);

-- Optional tracking
-- alter table public.ingestions add column if not exists last_draft_built_at timestamptz null;

-- RLS outline (adapt to your policies)
-- alter table public.invoice_line_match_candidates enable row level security;
-- create policy ilmc_select on public.invoice_line_match_candidates for select using (
--   exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.org_id = org_id)
-- );
-- create policy ilmc_insert on public.invoice_line_match_candidates for insert with check (true);
```

## Notes
- Treat `auto_matched` as legacy; stop writing it. Use `human_matched` and `to_create`.
- Ensure `items_catalog_duplicate` exists with at least: `org_id, item_id, name, hsn_or_sac`.
- Approval pipeline should refuse when any `unmatched` lines remain or `approval_status!='ready'`.
