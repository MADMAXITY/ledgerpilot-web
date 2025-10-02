"use client"
import * as React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'

export default function RejectDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = React.useState('')
  React.useEffect(() => {
    if (!open) setReason('')
  }, [open])
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reject bill</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          placeholder="Reason (optional, visible in activity log)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={() => onConfirm(reason)}>
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  )
}

