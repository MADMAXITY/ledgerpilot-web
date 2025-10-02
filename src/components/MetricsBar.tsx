"use client"
import useSWR from 'swr'
import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material'
import type { UiIngestionState } from '@/types/contracts'
import { useSnackbar } from 'notistack'

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
  const { enqueueSnackbar } = useSnackbar()

  const billedBig = data ? `${data.billed_30d} / ${data.billed_total}` : '—'
  const readyBig = data ? `${data.ready_count}` : '—'
  const failedBig = data ? `${data.failed_count}` : '—'

  const MetricCard = ({ value, label, sub, onClick, hidden }: { value: number | string; label: string; sub?: string; onClick?: () => void; hidden?: boolean }) => {
    if (hidden) return null
    return (
      <Card
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `${label} metric` : undefined}
        variant="outlined"
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          minWidth: 180,
          transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
          '&:hover': onClick
            ? {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(99,102,241,.18)',
                borderColor: 'primary.light',
              }
            : undefined,
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={800}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              {sub}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="stretch">
        {!data ? (
          <>
            <Skeleton variant="rounded" width={180} height={86} />
            <Skeleton variant="rounded" width={180} height={86} />
            <Skeleton variant="rounded" width={180} height={86} />
          </>
        ) : (
          <>
            <MetricCard
              value={billedBig}
              label="Billed"
              sub="(30d / lifetime)"
              onClick={() => {
                enqueueSnackbar('Filter: Billed', { variant: 'info' })
                onSelectState?.('Billed')
              }}
            />
            <MetricCard
              value={readyBig}
              label="Ready for approval"
              onClick={() => {
                enqueueSnackbar('Filter: Ready', { variant: 'info' })
                onSelectState?.('Ready')
              }}
            />
            <MetricCard
              value={failedBig}
              label="Failed ingestions"
              onClick={() => {
                enqueueSnackbar('Filter: Failed', { variant: 'info' })
                onSelectState?.('Failed')
              }}
              hidden={data.failed_count === 0}
            />
          </>
        )}
      </Stack>
    </Box>
  )
}
