"use client"
import { ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import theme from '@/theme'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  )
}
