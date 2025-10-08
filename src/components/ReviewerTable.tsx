"use client"
import { useEffect, useMemo, useState } from 'react'
import { mutate as globalMutate } from 'swr'
import useSWR from 'swr'
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Button, Typography, ToggleButtonGroup, ToggleButton, Tooltip, IconButton } from '@mui/material'
import DeleteRounded from '@mui/icons-material/DeleteRounded'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import { useSnackbar } from 'notistack'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import type { GridRenderCellParams } from '@mui/x-data-grid'
//
import type { IngestionListItem, UiIngestionState } from '@/types/contracts'
// import StateChip from './StateChip'

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
  activeId,
}: {
  onOpen?: (id: number | string) => void
  filterState?: UiIngestionState | 'All'
  onFilterStateChange?: (s: UiIngestionState | 'All') => void
  activeId?: number | string | null
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

  const { data, isLoading, mutate } = useSWR<IngestionListItem[]>(query, listFetcher)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [deleteMode, setDeleteMode] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<IngestionListItem | null>(null)
  const { enqueueSnackbar } = useSnackbar()

  // Keep active index in sync with activeId when provided
  useEffect(() => {
    if (!activeId || !data) return
    const idx = data.findIndex((r) => String(r.id) === String(activeId))
    if (idx >= 0) setActiveIndex(idx)
  }, [activeId, data])

  // Refresh when other parts of UI signal updates (e.g., mark ready)
  useEffect(() => {
    const handler = () => {
      void mutate()
      void globalMutate('/api/ingestions/metrics')
    }
    window.addEventListener('review:refresh', handler)
    return () => window.removeEventListener('review:refresh', handler)
  }, [mutate])

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
    {
      field: 'vendor_guess',
      headerName: 'Vendor',
      flex: 1,
      renderCell: (p) => (
        <Tooltip title={p.value || ''}>
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.value}</Box>
        </Tooltip>
      ),
    },
    { field: 'bill_number', headerName: 'Bill #', width: 160 },
    { field: 'total_guess', headerName: 'Total', width: 120, headerAlign: 'right', align: 'right' },
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
    // Mode column removed (approval is always manual)
    // Action column (delete) toggled by deleteMode
    ...(deleteMode
      ? ([
          {
            field: 'actions',
            headerName: '',
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (p: GridRenderCellParams) => {
              const row = p.row as IngestionListItem & { ingestion_status?: string }
              const status = String(row.ingestion_status || '').toLowerCase()
              const canDelete = status !== 'billed'
              return (
                <Tooltip title={canDelete ? 'Delete' : 'Cannot delete billed'}>
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={!canDelete}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!canDelete) return
                        setPendingDelete(row)
                        setConfirmOpen(true)
                      }}
                    >
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )
            },
          } as GridColDef,
        ] as GridColDef[])
      : ([] as GridColDef[])),
  ]

  // Keyboard navigation: J/K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!data || data.length === 0) return
      if (key === 'j') {
        const next = activeIndex < 0 ? 0 : Math.min(activeIndex + 1, data.length - 1)
        setActiveIndex(next)
        onOpen?.(data[next].id)
      } else if (key === 'k') {
        const prev = activeIndex < 0 ? 0 : Math.max(activeIndex - 1, 0)
        setActiveIndex(prev)
        onOpen?.(data[prev].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, data, onOpen])

  // Empty overlay
  const NoRows = () => (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {state === 'Ready' ? 'Nothing to approve' : 'No rows'}
      </Typography>
      <Button size="small" variant="outlined" href="/">
        Upload
      </Button>
    </Stack>
  )

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
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" color="text.secondary">Density:</Typography>
        <ToggleButtonGroup size="small" exclusive value={density} onChange={(_e, v) => v && setDensity(v)}>
          <ToggleButton value="comfortable">Comfortable</ToggleButton>
          <ToggleButton value="compact">Compact</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={deleteMode ? 'Exit delete mode' : 'Enter delete mode'}>
          <Button size="small" variant={deleteMode ? 'contained' : 'outlined'} color={deleteMode ? 'error' : 'inherit'} onClick={() => setDeleteMode((v) => !v)}>
            {deleteMode ? 'Delete mode: ON' : 'Delete mode'}
          </Button>
        </Tooltip>
      </Stack>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
        vendor={pendingDelete?.vendor_guess || null}
        bill={pendingDelete?.bill_number || null}
        onConfirm={async () => {
          if (!pendingDelete) return
          try {
            const res = await fetch(`/api/ingestions/${pendingDelete.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())
            enqueueSnackbar('Deleted', { variant: 'success' })
            setConfirmOpen(false)
            setPendingDelete(null)
            await mutate()
            try { (await import('swr')).mutate('/api/ingestions/metrics') } catch {}
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Delete failed'
            enqueueSnackbar(msg, { variant: 'error' })
          }
        }}
      />
      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={data || []}
          loading={isLoading}
          density={density}
          rowHeight={52}
          columns={columns}
          pageSizeOptions={[25, 50]}
          pagination
          disableRowSelectionOnClick
          getRowId={(r) => r.id}
          onRowClick={(p) => {
            onOpen?.(p.id)
            if (data) {
              const idx = data.findIndex((r) => String(r.id) === String(p.id))
              if (idx >= 0) setActiveIndex(idx)
            }
          }}
          sx={{
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
            // Stronger hover affordance and pointer
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              transition: 'background-color 120ms ease, box-shadow 120ms ease',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.24)',
            },
            '& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
              backgroundColor: 'transparent',
            },
            '& .MuiDataGrid-virtualScrollerRenderZone .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: 'rgba(255,255,255,0.02)',
            },
          }}
          slots={{ noRowsOverlay: NoRows }}
        />
      </Box>
    </Stack>
  )
}
