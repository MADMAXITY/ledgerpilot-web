create table public.bills (
  bill_id bigint generated always as identity not null,
  org_id text not null,
  zoho_bill_id text null,
  vendor_id text not null,
  invoice_id bigint not null,
  payload_sent jsonb not null,
  payload_reply jsonb null,
  status text not null,
  created_at timestamp with time zone null default now(),
  constraint bills_pkey primary key (bill_id),
  constraint bills_zoho_bill_id_key unique (zoho_bill_id),
  constraint bills_invoice_id_fkey foreign KEY (invoice_id) references invoices (invoice_id) on update CASCADE on delete RESTRICT,
  constraint bills_org_id_fkey foreign KEY (org_id) references orgs (org_id) on delete CASCADE,
  constraint bills_status_check check (
    (
      status = any (
        array['created'::text, 'posted'::text, 'failed'::text]
      )
    )
  )
) TABLESPACE pg_default;

create table public.files (
  file_id bigint generated always as identity not null,
  org_id text not null,
  source text not null,
  source_ref text null,
  storage_key text not null,
  mime_type text null,
  size_bytes bigint null,
  uploaded_at timestamp with time zone null default now(),
  constraint files_pkey primary key (file_id),
  constraint files_org_id_fkey foreign KEY (org_id) references orgs (org_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists files_org_idx on public.files using btree (org_id, uploaded_at desc) TABLESPACE pg_default;


create table public.ingestions (
  ingestion_id bigint generated always as identity not null,
  org_id text not null,
  file_id bigint not null,
  status text not null,
  error jsonb null,
  created_at timestamp with time zone null default now(),
  finished_at timestamp with time zone null,
  approval_mode text not null default 'manual'::text,
  approval_status text not null default 'pending'::text,
  bill_payload_draft jsonb null,
  constraint ingestions_pkey primary key (ingestion_id),
  constraint ingestions_file_id_fkey foreign KEY (file_id) references files (file_id) on delete CASCADE,
  constraint ingestions_org_id_fkey foreign KEY (org_id) references orgs (org_id) on delete CASCADE,
  constraint ingestions_approval_mode_check check (
    (
      approval_mode = any (array['auto'::text, 'manual'::text])
    )
  ),
  constraint ingestions_approval_status_check check (
    (
      approval_status = any (
        array[
          'pending'::text,
          'ready'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  ),
  constraint ingestions_status_check check (
    (
      status = any (
        array[
          'queued'::text,
          'extracting'::text,
          'matched'::text,
          'posting'::text,
          'billed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists ing_approval_ready_idx on public.ingestions using btree (org_id) TABLESPACE pg_default
where
  (
    (approval_status = 'ready'::text)
    and (bill_payload_draft is not null)
  );

create index IF not exists ingestions_org_approval_idx on public.ingestions using btree (org_id, approval_status) TABLESPACE pg_default;

create index IF not exists ingestions_org_status_idx on public.ingestions using btree (org_id, status) TABLESPACE pg_default;


create table public.invoice_lines (
  line_id bigint generated always as identity not null,
  invoice_id bigint not null,
  line_no integer not null,
  description text null,
  hsn_sac text null,
  quantity numeric(18, 4) not null default 1,
  rate numeric(18, 4) null,
  amount numeric(18, 2) null,
  meta jsonb null,
  item_name text null,
  match_state text not null default 'unmatched'::text,
  item_id text null,
  discount_percent numeric(7, 4) null,
  constraint invoice_lines_pkey primary key (line_id),
  constraint invoice_lines_invoice_id_fkey foreign KEY (invoice_id) references invoices (invoice_id) on delete CASCADE,
  constraint invoice_lines_match_state_chk check (
    (
      match_state = any (
        array[
          'unmatched'::text,
          'to_create'::text,
          'auto_matched'::text,
          'human_matched'::text,
          'created'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists invoice_lines_invoice_idx on public.invoice_lines using btree (invoice_id) TABLESPACE pg_default;


create table public.invoices (
  invoice_id bigint generated always as identity not null,
  org_id text not null,
  ingestion_id bigint not null,
  vendor_name text not null,
  vendor_gstin text null,
  bill_number text not null,
  bill_date date not null,
  due_date date null,
  grand_total numeric(18, 2) null,
  currency text null default 'INR'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint invoices_pkey primary key (invoice_id),
  constraint invoices_ingestion_id_fkey foreign KEY (ingestion_id) references ingestions (ingestion_id) on delete CASCADE,
  constraint invoices_org_id_fkey foreign KEY (org_id) references orgs (org_id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists invoices_org_vendor_bill_idx on public.invoices using btree (org_id, vendor_name, bill_number) TABLESPACE pg_default;


create table public.invoices_raw (
  raw_id bigint generated always as identity not null,
  org_id text not null,
  ingestion_id bigint not null,
  extractor text not null,
  payload jsonb not null,
  created_at timestamp with time zone null default now(),
  constraint invoices_raw_pkey primary key (raw_id),
  constraint invoices_raw_ingestion_id_fkey foreign KEY (ingestion_id) references ingestions (ingestion_id) on delete CASCADE,
  constraint invoices_raw_org_id_fkey foreign KEY (org_id) references orgs (org_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists invoices_raw_ingest_idx on public.invoices_raw using btree (ingestion_id) TABLESPACE pg_default;

create table public.orgs (
  org_id text not null,
  name text null,
  zoho_region_base text null default 'https://www.zohoapis.in'::text,
  created_at timestamp with time zone null default now(),
  constraint orgs_pkey primary key (org_id)
) TABLESPACE pg_default;

create table public.profiles (
  user_id uuid not null,
  org_id text not null,
  constraint profiles_pkey primary key (user_id),
  constraint profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.vendors (
  org_id text not null,
  vendor_id text not null,
  name text not null,
  gstin text null,
  raw jsonb null,
  updated_at timestamp with time zone null default now(),
  constraint vendors_pkey primary key (org_id, vendor_id),
  constraint vendors_org_id_fkey foreign KEY (org_id) references orgs (org_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists vendors_org_name_idx on public.vendors using btree (org_id, lower(name)) TABLESPACE pg_default;