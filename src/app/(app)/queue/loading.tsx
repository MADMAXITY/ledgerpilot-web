import { Container, Paper, Skeleton, Stack, Typography } from '@mui/material'

export default function Loading() {
  return (
    <Container maxWidth="xl">
      <Typography variant="h5" sx={{ mb: 2 }}>Review</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={40} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Stack>
      </Paper>
    </Container>
  )
}
