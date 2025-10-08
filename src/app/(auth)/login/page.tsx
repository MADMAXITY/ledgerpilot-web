"use client"
import Image from 'next/image'
import { Box, Button, Card, CardContent, Chip, Container, Divider, Stack, Typography } from '@mui/material'
import UploadFileRounded from '@mui/icons-material/UploadFileRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import SpeedRounded from '@mui/icons-material/SpeedRounded'
import { createSupabaseBrowserClient } from '@/lib/supabase'

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ color: 'primary.light', mt: '2px' }}>{icon}</Box>
      <Box>
        <Typography fontWeight={600}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {desc}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function Login() {
  return (
    <Container maxWidth="md" sx={{ mt: { xs: 6, md: 10 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'center' }}>
        <Box>
          <Stack spacing={2.5} alignItems={{ xs: 'center', md: 'flex-start' }}>
            <Image src="/logo.png" alt="LedgerPilot" width={260} height={72} priority style={{ height: 'auto', width: 'auto', maxWidth: '100%' }} />
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.2, textAlign: { xs: 'center', md: 'left' } }}>
              Automate invoice intake and approvals
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              Upload bills, let AI extract details, review quickly, and post to your books.
            </Typography>
            <Stack spacing={1.5} sx={{ width: '100%' }}>
              <Feature icon={<UploadFileRounded fontSize="small" />} title="Simple uploads" desc="Drag & drop PDFs or images; we handle the rest." />
              <Feature icon={<AutoAwesomeRounded fontSize="small" />} title="Accurate extraction" desc="Smart vendor, bill #, dates and line items." />
              <Feature icon={<CheckCircleRounded fontSize="small" />} title="One‑click approval" desc="Approve or reject with clear context and audit trail." />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip size="small" icon={<SpeedRounded fontSize="small" />} label="Fast onboarding" />
              <Chip size="small" icon={<ShieldRounded fontSize="small" />} label="Org‑scoped data" />
              <Chip size="small" icon={<LockRounded fontSize="small" />} label="Secure OAuth" />
            </Stack>
            </Stack>
        </Box>
        <Box>
          <Card variant="outlined" sx={{ backdropFilter: 'blur(6px)' }}>
            <CardContent>
              <Stack spacing={2} alignItems="center" sx={{ p: { xs: 1, md: 1.5 } }}>
                <Typography variant="h6" fontWeight={700} sx={{ textAlign: 'center' }}>
                  Sign in
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Continue with your Google account to access LedgerPilot.
                </Typography>
                <Button
                  size="large"
                  variant="contained"
                  onClick={() => {
                    const supabase = createSupabaseBrowserClient()
                    const base = (process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE || (typeof window !== 'undefined' ? window.location.origin : ''))
                      .replace(/\/$/, '')
                    return supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${base}/auth/callback` },
                    })
                  }}
                  sx={{ width: '100%' }}
                >
                  Continue with Google
                </Button>
                <Divider flexItem sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  By continuing, you agree to our terms and acknowledge our privacy policy.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  )
}
