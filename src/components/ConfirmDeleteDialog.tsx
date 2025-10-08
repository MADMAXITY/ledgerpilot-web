"use client"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, Chip, Box } from '@mui/material'
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded'

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  vendor,
  bill,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  vendor?: string | null
  bill?: string | null
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberRounded color="warning" />
        Confirm deletion
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.25}>
          <Typography variant="body2" color="text.secondary">
            This will remove the ingestion and its invoice permanently. This action cannot be undone.
          </Typography>
          {(vendor || bill) ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {vendor ? <Chip size="small" variant="outlined" label={`Vendor: ${vendor}`} /> : null}
              {bill ? <Chip size="small" variant="outlined" label={`Bill #: ${bill}`} /> : null}
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={() => void onConfirm()}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

