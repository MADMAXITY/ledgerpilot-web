"use client"
import { useEffect, useState } from 'react'
import { Alert, Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Divider, Paper, Stack, TextField, Typography, IconButton, Tooltip } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useSnackbar } from 'notistack'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useOrg } from '@/lib/org'

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient()
  const { enqueueSnackbar } = useSnackbar()
  const { orgId } = useOrg()
  const [email, setEmail] = useState<string>('')
  const [org, setOrg] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [hasTokenRow, setHasTokenRow] = useState<boolean | null>(null)
  const [hasRefreshToken, setHasRefreshToken] = useState<boolean>(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [supabase])

  useEffect(() => {
    if (orgId) setOrg(orgId)
  }, [orgId])

  useEffect(() => {
    const loadOauth = async () => {
      setOauthLoading(true)
      try {
        const r = await fetch('/api/settings/oauth')
        const j = await r.json()
        if (j?.oauth) {
          setHasTokenRow(true)
          setClientId(j.oauth.client_id || '')
          setClientSecret(j.oauth.client_secret || '')
          setHasRefreshToken(!!j.oauth.refresh_token)
        } else {
          setHasTokenRow(false)
          setHasRefreshToken(false)
        }
      } catch {/* ignore */}
      finally { setOauthLoading(false) }
    }
    loadOauth()
  }, [])

  const onSave = async () => {
    if (!org.trim()) {
      enqueueSnackbar('Org ID cannot be empty', { variant: 'warning' })
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/settings/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      enqueueSnackbar('Organization updated', { variant: 'success' })
      // Refresh to pick new org
      window.location.reload()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" sx={{ mb: 2 }}>
        Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField label="Email" value={email} InputProps={{ readOnly: true }} />
          <TextField label="Organization ID" value={org} onChange={(e) => setOrg(e.target.value)} helperText="Set the org this user belongs to" />
          <Box>
            <Button variant="contained" onClick={onSave} disabled={loading}>
              Save Changes
            </Button>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Zoho OAuth</Typography>
              {hasRefreshToken ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">Refresh token: valid</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Not connected</Typography>
              )}
            </AccordionSummary>
            <AccordionDetails>
              {hasRefreshToken ? (
                <Alert severity="success">A valid refresh token is stored for this org.</Alert>
              ) : (
                <Stack spacing={2}>
                  {hasTokenRow === false ? (
                    <Alert severity="info">No OAuth token record yet. Enter client credentials and the auth code to connect.</Alert>
                  ) : null}
                  <TextField label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
                  <TextField label="Client Secret" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">Generate Zoho auth code:</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title={clientId ? 'Copy auth URL' : 'Enter Client ID first'}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopyIcon fontSize="small" />}
                            disabled={!clientId}
                            onClick={() => {
                              if (!clientId) return
                              const url = `https://accounts.zoho.in/oauth/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent('https://n8n.neuraledgen8n.live/')}&scope=${encodeURIComponent('ZohoBooks.fullaccess.all')}&access_type=offline&prompt=consent`
                              navigator.clipboard.writeText(url)
                              enqueueSnackbar('Auth URL copied', { variant: 'success' })
                            }}
                          >
                            Copy Auth URL
                          </Button>
                        </span>
                      </Tooltip>
                      {!clientId && (
                        <Typography variant="caption" color="text.secondary">Enter Client ID</Typography>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Open the copied URL in a new tab, authorize, then paste the returned code below.
                    </Typography>
                  </Stack>
                  <TextField label="Auth Code" value={authCode} onChange={(e) => setAuthCode(e.target.value)} helperText="Paste the temporary Zoho auth code" />
                  <Box>
                    <Button
                      variant="contained"
                      disabled={oauthLoading || !org || !clientId || !clientSecret || !authCode}
                      onClick={async () => {
                        try {
                          setOauthLoading(true)
                          // 1) Ensure client_id/secret exist in DB (placeholder refresh_token allowed)
                          const r = await fetch('/api/settings/oauth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
                          })
                          if (!r.ok) throw new Error(await r.text())
                          // 2) Call backend webhook to exchange auth code → refresh token and persist it server-side
                          const base = process.env.NEXT_PUBLIC_API_BASE_URL
                          const resp = await fetch(`${base}/zoho/${org}/${encodeURIComponent(authCode)}/refresh`, { method: 'POST' })
                          if (!resp.ok) throw new Error(await resp.text())
                          // 3) Recheck OAuth row and reflect status
                          const g = await fetch('/api/settings/oauth')
                          const j = await g.json()
                          setHasTokenRow(!!j?.oauth)
                          setHasRefreshToken(!!j?.oauth?.refresh_token)
                          enqueueSnackbar('Zoho connected', { variant: 'success' })
                        } catch (e: unknown) {
                          const msg = e instanceof Error ? e.message : 'Connect failed'
                          enqueueSnackbar(msg, { variant: 'error' })
                        } finally {
                          setOauthLoading(false)
                        }
                      }}
                    >
                      Connect Zoho
                    </Button>
                  </Box>
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Paper>
    </Container>
  )
}
