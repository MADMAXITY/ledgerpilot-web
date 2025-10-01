export type UiIngestionState =
  | 'Queued'
  | 'Extracting'
  | 'Matched'
  | 'Ready'
  | 'Posting'
  | 'Billed'
  | 'Failed'

export interface IngestionListItem {
  id: string | number
  state: UiIngestionState
  created_at: string
  vendor_guess?: string | null
  total_guess?: number | null
  bill_number?: string | null
  approval_mode?: 'auto' | 'manual' | string
  ingestion_status?: 'queued' | 'extracting' | 'matched' | 'posting' | 'billed' | 'failed' | string
  approval_status?: 'pending' | 'ready' | 'approved' | 'rejected' | string
  error?: string | null
}

export interface IngestionDetailResponse {
  ingestion: {
    id: string | number
    state: UiIngestionState
    created_at: string
    file_id?: number | null
    storage_key?: string | null
    error?: unknown
  }
  bill_payload_draft?: unknown
  extraction_summary?: string | null
}

export interface StartIngestionResponse {
  ok: boolean
  ingestion_id: string | number
  state: 'Extracting'
}

export interface ApprovalResponse {
  ok: boolean
  state: 'Approved' | 'Rejected'
}
