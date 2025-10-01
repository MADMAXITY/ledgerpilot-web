import { createTheme, alpha } from '@mui/material/styles'

// Clean, professional dark theme with subtle AI accents
const primary = '#6366f1' // indigo-500
const secondary = '#22d3ee' // cyan-400
const surface = '#0b0f14'
const paper = '#0e1420'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: primary },
    secondary: { main: secondary },
    success: { main: '#22c55e' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#60a5fa' },
    background: { default: surface, paper },
    divider: alpha('#93c5fd', 0.12),
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
    h1: { fontWeight: 800, letterSpacing: -0.4 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0.1 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: alpha('#ffffff', 0.08),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: '0 6px 16px rgba(99,102,241,0.25)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#0e1420', 0.9),
          backdropFilter: 'blur(6px)',
          borderBottom: `1px solid ${alpha('#93c5fd', 0.15)}`,
        },
      },
    },
  },
})

export default theme
