"use client"
import useSWR from 'swr'
import { Box, Paper, Stack, Typography } from '@mui/material'
import type { UiIngestionState } from '@/types/contracts'

type Metrics = {
  billed_30d: number
  billed_total: number
  ready_count: number
  failed_count: number
}

function useMetrics() {
  return useSWR<Metrics>(
    '/api/ingestions/metrics',
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('failed to load metrics')
      return (await res.json()) as Metrics
    },
    { refreshInterval: 10000 }
  )
}

export default function MetricsBar({ onSelectState }: { onSelectState?: (s: UiIngestionState) => void }) {
  const { data } = useMetrics()

  const billedBig = data ? `${data.billed_30d} / ${data.billed_total}` : '—'
  const readyBig = data ? `${data.ready_count}` : '—'
  const failedBig = data ? `${data.failed_count}` : '—'

  const Card = ({
    big,
    label,
    onClick,
    hidden,
  }: {
    big: string | number
    label: string
    onClick?: () => void
    hidden?: boolean
  }) => {
    if (hidden) return null
    return (
      <Paper
        onClick={onClick}
        elevation={0}
        sx={{
          p: 2,
          px: 2.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          cursor: onClick ? 'pointer' : 'default',
          minWidth: 180,
          '&:hover': onClick ? { backgroundColor: 'rgba(148,163,184,0.08)' } : undefined,
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {big}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {label}
        </Typography>
      </Paper>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="stretch">
        <Card big={billedBig} label="Billed (30d / lifetime)" onClick={() => onSelectState?.('Billed')} />
        <Card big={readyBig} label="Ready for approval" onClick={() => onSelectState?.('Ready')} />
        <Card big={failedBig} label="Failed ingestions" onClick={() => onSelectState?.('Failed')} hidden={!data || (data && data.failed_count === 0)} />
      </Stack>
    </Box>
  )
}

