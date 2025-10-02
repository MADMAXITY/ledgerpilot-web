"use client"
import { Container, Stack, Typography } from '@mui/material'
import ReviewerTable from '@/components/ReviewerTable'
import IngestionDrawer from '@/components/IngestionDrawer'
import { useState } from 'react'
import MetricsBar from '@/components/MetricsBar'
import type { UiIngestionState } from '@/types/contracts'

export default function QueuePage() {
  const [openId, setOpenId] = useState<number | string | null>(null)
  const [filterState, setFilterState] = useState<UiIngestionState | 'All'>('All')
  return (
    <Container maxWidth="xl">
      <Typography variant="h5" sx={{ mb: 2 }}>
        Review
      </Typography>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <MetricsBar onSelectState={(s) => setFilterState(s)} />
      </Stack>
      <ReviewerTable onOpen={(id) => setOpenId(id)} filterState={filterState} onFilterStateChange={setFilterState} activeId={openId} />
      <IngestionDrawer id={openId} open={openId != null} onClose={() => setOpenId(null)} />
    </Container>
  )
}
