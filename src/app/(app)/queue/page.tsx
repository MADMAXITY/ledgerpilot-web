"use client"
import { Container, Typography } from '@mui/material'
import ReviewerTable from '@/components/ReviewerTable'
import IngestionDrawer from '@/components/IngestionDrawer'
import { useState } from 'react'

export default function QueuePage() {
  const [openId, setOpenId] = useState<number | string | null>(null)
  return (
    <Container maxWidth="xl">
      <Typography variant="h5" sx={{ mb: 2 }}>
        Review
      </Typography>
      <ReviewerTable onOpen={(id) => setOpenId(id)} />
      <IngestionDrawer id={openId} open={openId != null} onClose={() => setOpenId(null)} />
    </Container>
  )
}
