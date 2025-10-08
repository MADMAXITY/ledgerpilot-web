# UI Changes — Manual Matching Redesign

This document summarizes all UI work implemented in this session to replace auto‑matching with a fully manual, reviewer‑driven item selection workflow and polish the Review experience.

## Overview
- Removed auto‑match behavior in the UI; reviewers select items manually per line.
- Consolidated resolution into the Draft area using a `LineResolver` experience.
- Added a left‑anchored suggestions dropdown, catalog browsing, and a clear “Needs create” action.
- Gated approval behind a new “Mark Ready” step once all lines are resolved.
- Simplified Review by removing approval mode selection and the “Mode” column.
- Implemented a safe delete flow for non‑billed ingestions and improved cross‑screen refresh.

## Ingestion Drawer & Line Resolution
- Persistent drawers: the Bill viewer (left) and Ingestion drawer (right) can be open together; neither dims/overlaps the other.
- Removed the redundant “Lines” block; all resolution happens in the Draft panel via `LineResolver`.
- For each draft line item:
  - “Select match” opens the suggestions dropdown (see below).
  - “Browse catalog…” lets the reviewer search the org catalog by name/SKU.
  - “Needs create” marks the line as `to_create` (no item assigned yet).
  - Selecting a suggestion or catalog result immediately updates both `invoice_lines.item_id` and the draft `line_items[x].item_id`.

## Suggestions UX (Dropdown)
- Placement: dropdown opens to the immediate left of the right drawer; never overlaps the drawer content.
- Presentation: wider menu (up to ~420px/44vw) with word‑wrapping for long item names; no horizontal scroll.
- Content: shows the top 4–5 candidate matches with small chips (HSN and similarity) and row separators for readability.
- Loading: shows a loader/spinner until suggestions are ready; no premature “No suggestions” state.
- Actions: includes “Browse catalog…” entry at the end of the list.

## Actions & Approval Gating
- Match selection: updates the DB and the draft in one action; line is marked human_matched.
- Needs create: marks the line as `to_create` and clears any draft `item_id` for that row.
- Mark Ready: visible only when a draft exists, counts.unmatched === 0, and approval status is Pending.
  - On click, sets approval status to Ready and refreshes the drawer data.
- Approve/Reject: remain blocked until Ready; after action, the drawer refreshes and notifies the Review list.

## Review Page
- ReviewerTable
  - Removed “Mode” column (no approval‑mode choice; always manual).
  - Delete mode: toggle reveals a red trash icon for non‑billed rows; opens a confirmation dialog before delete.
  - On delete success: row is removed and metrics update immediately.
- MetricsBar
  - Added “Items need resolution” card (Matched + approval Pending). Clicking filters the table to Matched state.

## Upload Page
- Removed the Approval mode toggle — uploads are always manual now.
- New ingestions are inserted without an `approval_mode` field in the UI; related UI controls are removed.

## Bill Viewer
- The Bill viewer drawer is persistent and can be used side‑by‑side with the Ingestion drawer for quick reference during line resolution.

## Visual Polish
- Smaller chips for metadata (HSN/similarity) with reduced padding and font size.
- Clear row separators in the suggestions list to improve readability.
- Long item names wrap across lines; no horizontal scrolling in suggestion menus.

## Data Freshness & Cross‑Refresh
- The Ingestion drawer emits a `review:refresh` event after key actions (mark ready, approve, reject, delete).
- The Review list listens to this event and refreshes rows and metrics to stay in sync without manual reloads.

## Components Touched
- IngestionDrawer, LineResolver, CatalogSearchDialog, ConfirmDeleteDialog, ReviewerTable, MetricsBar, UploadDropzone, BillViewerDrawer.

## What Was Removed (UI)
- Auto‑matching controls and indicators tied to the legacy flow.
- Approval mode selection in Upload and any related UI.
- “Mode” column from the ReviewerTable.

## QA Checklist (UI)
- Suggestions dropdown anchors to the left of the drawer and never overlaps it.
- Long names wrap; no horizontal scroll in the suggestions list.
- Chips are compact and readable; rows have clear separators.
- Selecting a suggestion updates both the line’s `item_id` and the draft instantly.
- “Needs create” marks the line and clears any draft `item_id`.
- “Mark Ready” appears only when all lines are resolved and approval is Pending; Approve/Reject are gated until Ready.
- Deleting a non‑billed ingestion requires confirmation and updates the list + metrics immediately.
- Review list and MetricsBar refresh after mark ready, approve, reject, or delete.

