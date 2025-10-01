import { Container, Paper, Skeleton, Stack, Typography } from '@mui/material'

export default function Loading() {
  return (
    <Container maxWidth="xl">
      <Typography variant="h5" sx={{ mb: 2 }}>Loading ingestion…</Typography>
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="rounded" height={500} />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="rounded" height={500} />
        </Paper>
      </Stack>
    </Container>
  )
}

