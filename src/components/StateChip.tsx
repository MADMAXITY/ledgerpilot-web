"use client"
import { Chip } from '@mui/material'
import type { UiIngestionState } from '@/types/contracts'

function colorFor(state: UiIngestionState): 'default' | 'success' | 'error' | 'warning' | 'info' {
  switch (state) {
    case 'Queued':
      return 'default'
    case 'Extracting':
      return 'info'
    case 'Matched':
      return 'info'
    case 'Ready':
      return 'warning'
    case 'Posting':
      return 'warning'
    case 'Billed':
      return 'success'
    case 'Failed':
      return 'error'
    default:
      return 'default'
  }
}

export default function StateChip({ state }: { state: UiIngestionState }) {
  return <Chip size="small" color={colorFor(state)} label={state} />
}

