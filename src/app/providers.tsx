"use client"
import { ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import theme from '@/theme'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
