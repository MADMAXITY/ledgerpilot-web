"use client"
import { Button, Container, Stack, Typography } from '@mui/material'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function Login() {
  return (
    <Container maxWidth="sm" sx={{ mt: 12 }}>
      <Stack spacing={3} alignItems="center">
        <Typography variant="h4" fontWeight={700}>Welcome to LedgerPilot</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Sign in with Google to continue
        </Typography>
        <Button
          size="large"
          variant="contained"
          onClick={() => {
            const supabase = createSupabaseBrowserClient()
            return supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
            })
          }}
        >
          Continue with Google
        </Button>
      </Stack>
    </Container>
  )
}
