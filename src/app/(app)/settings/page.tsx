"use client"
import { useEffect, useState } from 'react'
import { Alert, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
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
  const [refreshToken, setRefreshToken] = useState('')
  const [hasTokenRow, setHasTokenRow] = useState<boolean | null>(null)

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
        } else {
          setHasTokenRow(false)
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
          <Typography variant="h6">Zoho OAuth</Typography>
          {hasTokenRow === false ? (
            <Alert severity="info">No OAuth token row yet for this org. To create one you must also supply a refresh token the first time.</Alert>
          ) : null}
          <TextField label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
          <TextField label="Client Secret" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
          <TextField label="Refresh Token (only required first time)" type="password" value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} />
          <Box>
            <Button
              variant="contained"
              disabled={oauthLoading}
              onClick={async () => {
                try {
                  setOauthLoading(true)
                  const r = await fetch('/api/settings/oauth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken || undefined }),
                  })
                  if (!r.ok) throw new Error(await r.text())
                  enqueueSnackbar('OAuth credentials saved', { variant: 'success' })
                  setRefreshToken('')
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : 'Save failed'
                  enqueueSnackbar(msg, { variant: 'error' })
                } finally {
                  setOauthLoading(false)
                }
              }}
            >
              Save OAuth
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
