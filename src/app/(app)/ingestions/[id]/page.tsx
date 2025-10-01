import { Container, Stack, Typography } from '@mui/material'
import BillPreview from '@/components/BillPreview'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { UiIngestionState } from '@/types/contracts'

export default async function IngestionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const idNum = Number(params.id)
  const { data: ing, error } = await supabase
    .from('ingestions')
    .select('ingestion_id, created_at, status, approval_status, bill_payload_draft, error, file_id')
    .eq('ingestion_id', idNum)
    .maybeSingle()

  if (!ing || error) {
    return (
      <Container maxWidth="md">
        <Typography variant="h6">Ingestion not found</Typography>
      </Container>
    )
  }

  let storageKey: string | null = null
  if (ing.file_id) {
    const { data: fileRow } = await supabase
      .from('files')
      .select('storage_key')
      .eq('file_id', ing.file_id)
      .maybeSingle()
    storageKey = fileRow?.storage_key ?? null
  }

  const uiState = computeUiState(ing.status as string, ing.approval_status as string, ing.bill_payload_draft)

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Typography variant="h5">Ingestion #{ing.ingestion_id} · {uiState}</Typography>
        <BillPreview
          ingestionId={ing.ingestion_id}
          storageKey={storageKey}
          billPayloadDraft={ing.bill_payload_draft}
          error={ing.error}
        />
      </Stack>
    </Container>
  )
}

function computeUiState(status: string, approval: string, draft: unknown): UiIngestionState {
  if (approval === 'ready' && draft) return 'Ready'
  switch ((status || '').toLowerCase()) {
    case 'queued':
      return 'Queued'
    case 'extracting':
      return 'Extracting'
    case 'matched':
      return 'Matched'
    case 'posting':
      return 'Posting'
    case 'billed':
      return 'Billed'
    case 'failed':
      return 'Failed'
    default:
      return 'Queued'
  }
}
