import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    background: { default: '#0B0F1A', paper: '#121826' },
    primary: { main: '#6366F1', light: '#7C83FF', dark: '#4F46E5', contrastText: '#fff' },
    secondary: { main: '#8B5CF6' },
    success: { main: '#22C55E' },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    info: { main: '#38BDF8' },
    divider: 'rgba(255,255,255,0.08)',
    text: { primary: '#E6E8F0', secondary: '#A8B0C3' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
    h5: { fontWeight: 700, letterSpacing: -0.2 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.1 },
    body2: { color: 'rgba(230,232,240,.78)' },
    body1: { lineHeight: 1.6 },
    allVariants: { fontFeatureSettings: '"tnum" on, "cv10" on', fontVariantNumeric: 'tabular-nums' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--lp-bg-base': '#0B0F1A',
          '--lp-bg-paper': '#121826',
          '--lp-bg-overlay': '#0F1526',
        },
        body: {
          backgroundColor: 'var(--lp-bg-base)',
          backgroundImage: 'none',
        },
        'body::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          pointerEvents: 'none',
          background: [
            'radial-gradient(1000px 600px at 75% -10%, rgba(99,102,241,.12), transparent 60%)',
            'radial-gradient(800px 500px at 10% 110%, rgba(139,92,246,.08), transparent 60%)',
            'linear-gradient(#0B0F1A,#0B0F1A)',
          ].join(','),
          backgroundRepeat: 'no-repeat',
        },
        'body::after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: 0.035,
          mixBlendMode: 'overlay',
          backgroundImage:
            'repeating-radial-gradient(circle at 0 0, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 1px, transparent 3px)',
        },
        '#__next, #root, .app-shell, main': { background: 'transparent' },
        '*::-webkit-scrollbar': { height: 10, width: 10 },
        '*::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,.14)', borderRadius: 10 },
        '::selection': { background: 'rgba(99,102,241,.35)' },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundColor: 'var(--lp-bg-paper)', border: '1px solid rgba(255,255,255,.06)' } } },
    MuiCard: { styleOverrides: { root: { backgroundColor: 'var(--lp-bg-paper)' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          '&:focus-visible': { boxShadow: '0 0 0 3px rgba(99,102,241,.45)' },
          '& .MuiButton-startIcon > *:nth-of-type(1), & .MuiButton-endIcon > *:nth-of-type(1)': {
            fontSize: 20,
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7C83FF 0%, #6366F1 60%)',
          boxShadow: '0 10px 30px rgba(99,102,241,.35)',
          '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,.45)' },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
        },
        containedError: {
          background: 'rgba(239,68,68,.14)',
          color: '#FCA5A5',
          border: '1px solid rgba(239,68,68,.35)',
          '&:hover': { background: 'rgba(239,68,68,.22)' },
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600, paddingInline: 6 },
        icon: { fontSize: 18 },
        colorSuccess: { backgroundColor: 'rgba(34,197,94,.12)', color: '#34D399' },
        colorError: { backgroundColor: 'rgba(239,68,68,.12)', color: '#FCA5A5' },
        colorWarning: { backgroundColor: 'rgba(245,158,11,.14)', color: '#FBBF24' },
        colorInfo: { backgroundColor: 'rgba(56,189,248,.14)', color: '#7DD3FC' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'var(--lp-bg-paper)',
          borderLeft: '1px solid rgba(255,255,255,.06)',
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,.35)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: '#121826',
          border: '1px solid rgba(255,255,255,.08)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:hover': { backgroundColor: 'rgba(99,102,241,.06)' } } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          backdropFilter: 'blur(6px)',
          background: 'rgba(13,17,28,.92)',
          border: '1px solid rgba(255,255,255,.06)',
        },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(18,24,38,0.9)',
          backdropFilter: 'blur(6px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
  },
})

export default theme
