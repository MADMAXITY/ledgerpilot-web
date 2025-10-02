"use client"
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import StatusChip, { type StatusChipType } from './StatusChip'

type Item = {
  name: string
  match_state?: string | null
}

export default function LineItemsMinimal({ items }: { items: Item[] }) {
  const toType = (s?: string | null): StatusChipType => {
    const v = (s || '').toLowerCase()
    const allowed: StatusChipType[] = ['to_create', 'unmatched', 'auto_matched', 'human_matched', 'created']
    return (allowed as string[]).includes(v) ? (v as StatusChipType) : 'unmatched'
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
      {items.map((it, i) => (
        <Card key={i} variant="outlined">
          <CardContent sx={{ minHeight: 84 }}>
            <Typography
              fontWeight={600}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {it.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
              <StatusChip type={toType(it.match_state)} size="small" />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

