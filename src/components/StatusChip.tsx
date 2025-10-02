"use client"
import { Chip, type ChipProps } from '@mui/material'

export type StatusChipType = 'billed' | 'failed' | 'ready' | 'auto_matched' | 'unmatched' | 'to_create' | 'created' | 'human_matched'
const MAP: Record<StatusChipType, { color: ChipProps['color']; label: string }> = {
  billed: { color: 'success', label: 'Billed' },
  failed: { color: 'error', label: 'Failed' },
  ready: { color: 'warning', label: 'Ready' },
  auto_matched: { color: 'success', label: 'auto_matched' },
  human_matched: { color: 'success', label: 'human_matched' },
  created: { color: 'success', label: 'created' },
  unmatched: { color: 'warning', label: 'needs match' },
  to_create: { color: 'warning', label: 'needs create' },
}
export default function StatusChip({ type, size = 'small' as const }: { type: StatusChipType; size?: 'small' | 'medium' }) {
  return <Chip size={size} color={MAP[type].color} label={MAP[type].label} />
}
