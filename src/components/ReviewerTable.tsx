"use client"
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
//
import type { IngestionListItem, UiIngestionState } from '@/types/contracts'
import StateChip from './StateChip'

async function listFetcher(url: string): Promise<IngestionListItem[]> {
  // fetch from our Next API (Supabase-backed)
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  const arr = (json?.items || []) as Array<Record<string, unknown>>
  return arr.map((r) => mapUnknownToListItem(r))
}

type UnknownRecord = Record<string, unknown>

function mapUnknownToListItem(r: UnknownRecord): IngestionListItem {
  const id = (r['id'] ?? r['ingestion_id'] ?? r['uuid'] ?? r['pk'] ?? r['ID']) as string | number
  const createdAt = (r['created_at'] ?? r['createdAt'] ?? new Date().toISOString()) as string
  const stateRaw = (r['state'] ?? r['status'] ?? 'Queued') as string
  return {
    id,
    state: (stateRaw as UiIngestionState) || 'Queued',
    created_at: createdAt,
    vendor_guess: (r['vendor_guess'] as string | null) ?? null,
    total_guess: (r['total_guess'] as number | null) ?? null,
    bill_number: (r['bill_number'] as string | null) ?? null,
    approval_mode: (r['approval_mode'] as string | null) ?? undefined,
    ingestion_status: (r['ingestion_status'] as string | null) ?? undefined,
    approval_status: (r['approval_status'] as string | null) ?? undefined,
    error: (r['error'] as string | null) ?? null,
  }
}

// computeUiState used server-side now; kept for completeness in fallback cases

export default function ReviewerTable({
  onOpen,
  filterState,
  onFilterStateChange,
}: {
  onOpen?: (id: number | string) => void
  filterState?: UiIngestionState | 'All'
  onFilterStateChange?: (s: UiIngestionState | 'All') => void
}) {
  const controlled = typeof filterState !== 'undefined'
  const [localState, setLocalState] = useState<UiIngestionState | 'All'>(filterState ?? 'All')
  const state = controlled ? (filterState as UiIngestionState | 'All') : localState
  const setState = (v: UiIngestionState | 'All') => {
    if (controlled) onFilterStateChange?.(v)
    else setLocalState(v)
  }
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: '1', page_size: '50' })
    if (state !== 'All') params.set('state', state)
    return `/api/ingestions/list?${params.toString()}`
  }, [state])

  const { data, isLoading } = useSWR<IngestionListItem[]>(query, listFetcher)

  const columns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      renderCell: (p) => {
        const v = (p.row as { created_at: string }).created_at
        return new Date(v).toLocaleString()
      },
      sortable: true,
    },
    { field: 'vendor_guess', headerName: 'Vendor', flex: 1 },
    { field: 'bill_number', headerName: 'Bill #', width: 160 },
    { field: 'total_guess', headerName: 'Total', width: 120 },
    {
      field: 'ingestion_status',
      headerName: 'Ingestion',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const v = String(p.value || '').toLowerCase()
        const map: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
          queued: { label: 'Queued', color: 'default' },
          extracting: { label: 'Extracting', color: 'info' },
          matched: { label: 'Matched', color: 'info' },
          posting: { label: 'Posting', color: 'warning' },
          billed: { label: 'Billed', color: 'success' },
          failed: { label: 'Failed', color: 'error' },
        }
        const cfg = map[v] || { label: v || '-', color: 'default' as const }
        return <Chip size="small" label={cfg.label} color={cfg.color} />
      },
    },
    {
      field: 'approval_status',
      headerName: 'Approval',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const v = String(p.value || '').toLowerCase()
        const map: Record<string, { label: string; color: 'default' | 'warning' | 'success' }> = {
          pending: { label: 'Pending', color: 'default' },
          ready: { label: 'Ready', color: 'warning' },
          approved: { label: 'Approved', color: 'success' },
          rejected: { label: 'Rejected', color: 'default' },
        }
        const cfg = map[v] || { label: v || '-', color: 'default' as const }
        return <Chip size="small" label={cfg.label} color={cfg.color} variant={v === 'ready' ? 'filled' : 'outlined'} />
      },
    },
    {
      field: 'approval_mode',
      headerName: 'Mode',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const v = String(p.value || '').toLowerCase()
        const label = v === 'auto' ? 'Auto' : v === 'manual' ? 'Manual' : '-'
        const color: 'default' | 'info' = v === 'auto' ? 'info' : 'default'
        return <Chip size="small" label={label} color={color} variant={v === 'auto' ? 'filled' : 'outlined'} />
      },
    },
    // Action column removed; row click opens slide-in
  ]

  return (
    <Stack spacing={2}>
      <FormControl size="small" sx={{ width: 220 }}>
        <InputLabel id="state-label">Filter by state</InputLabel>
        <Select
          labelId="state-label"
          value={state}
          label="Filter by state"
          onChange={(e) => setState(e.target.value as UiIngestionState | 'All')}
        >
          <MenuItem value="All">All</MenuItem>
          {(['Queued', 'Extracting', 'Matched', 'Ready', 'Posting', 'Billed', 'Failed'] as UiIngestionState[]).map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={data || []}
          loading={isLoading}
          density="comfortable"
          rowHeight={52}
          columns={columns}
          pageSizeOptions={[25, 50]}
          pagination
          disableRowSelectionOnClick
          getRowId={(r) => r.id}
          onRowClick={(p) => onOpen?.(p.id)}
          sx={{
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(148, 163, 184, 0.06)' },
          }}
        />
      </Box>
    </Stack>
  )
}
