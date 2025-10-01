import Link from 'next/link'
import { Box, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { apiFetch } from '@/lib/api'
import type { IngestionListItem } from '@/types/contracts'
import StateChip from './StateChip'

export default async function RecentUploads() {
  let items: IngestionListItem[] = []
  try {
    items = await apiFetch<IngestionListItem[]>(`/ingestions?page=1&page_size=10`)
  } catch {
    // ignore, show empty
  }

  if (!items.length) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          No recent uploads.
        </Typography>
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 1 }}>
      <List>
      {items.map((it) => (
        <ListItem key={it.id} disablePadding secondaryAction={<StateChip state={it.state} />}> 
          <ListItemButton component={Link} href={`/ingestions/${it.id}`}>
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="subtitle1">{it.vendor_guess || 'Unknown vendor'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(it.created_at).toLocaleString()}
                  </Typography>
                </Stack>
              }
              secondary={it.total_guess != null ? `Total: ${it.total_guess}` : undefined}
            />
          </ListItemButton>
        </ListItem>
      ))}
      </List>
    </Paper>
  )
}
