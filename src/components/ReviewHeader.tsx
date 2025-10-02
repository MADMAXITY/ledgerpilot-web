"use client"
import { Stack, Button, Chip, Typography, type ChipProps, Tooltip, Divider } from '@mui/material'
import { CheckRounded, CloseRounded, InsertDriveFileRounded } from '@mui/icons-material'

type Props = {
  vendor: string
  billNo: string
  billDate: string
  status: 'billed' | 'failed' | 'ready' | 'posting' | 'matched' | 'queued' | 'extracting'
  mode: 'manual' | 'auto'
  onApprove?: () => void
  onReject?: () => void
  onView?: () => void
  canAct?: boolean
}

export default function ReviewHeader({ vendor, billNo, billDate, status, mode, onApprove, onReject, onView, canAct }: Props) {
  const statusColor: ChipProps['color'] = status === 'billed' ? 'success' : status === 'failed' ? 'error' : 'warning'

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
        <Chip size="small" color={statusColor} label={`status: ${status}`} />
        <Chip size="small" color="info" label={`mode: ${mode}`} />
        {status !== 'billed' && <Chip size="small" color="warning" label={`approval: ${status === 'ready' ? 'ready' : 'pending'}`} />}
      </Stack>

      <Typography variant="h5" fontWeight={700}>{vendor}</Typography>
      <Typography variant="body2" sx={{ opacity: 0.8 }}>{billNo} • {billDate}</Typography>

      <Stack direction="row" spacing={1.2}>
        {canAct && (
          <>
            <Tooltip title="Approve (A)">
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckRounded />}
                  onClick={onApprove}
                  sx={{
                    background: 'rgba(99,102,241,.18)',
                    color: 'primary.light',
                    border: '1px solid rgba(99,102,241,.36)',
                    boxShadow: 'none',
                    '&:hover': { background: 'rgba(99,102,241,.26)', boxShadow: 'none' },
                  }}
                >
                  Approve
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Reject (R)">
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseRounded />}
                  onClick={onReject}
                  sx={{
                    borderColor: 'rgba(239,68,68,.38)',
                    color: '#FCA5A5',
                    background: 'rgba(239,68,68,.10)',
                    '&:hover': { background: 'rgba(239,68,68,.16)', borderColor: 'rgba(239,68,68,.48)' },
                  }}
                >
                  Reject
                </Button>
              </span>
            </Tooltip>
          </>
        )}
        <Tooltip title="View uploaded bill (V)">
          <Button
            variant="text"
            startIcon={<InsertDriveFileRounded />}
            onClick={onView}
            sx={{ color: 'inherit', opacity: 0.9, '&:hover': { opacity: 1 } }}
          >
            View uploaded bill
          </Button>
        </Tooltip>
      </Stack>
      <Divider sx={{ my: 1.5 }} />
    </Stack>
  )
}
