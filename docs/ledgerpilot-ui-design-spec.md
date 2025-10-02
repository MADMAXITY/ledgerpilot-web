# LedgerPilot — UI Design Upgrade Spec (MUI v5)

**Goal:** Elevate LedgerPilot to a premium, industry-grade UI while keeping the footprint lean. This document is implementation-ready for Codex/Cursor. It defines visual language, theme overrides, component specs, and interaction patterns.

---

## 1) Scope

- Apply unified dark theme across **Upload**, **Review**, **Settings**, and the **Review Drawer**.
- Introduce a premium action model (Approve primary, Reject destructive-outlined).
- Add a compact **Metrics Bar** on Review (already built) with upgraded visuals and interactions.
- Keep current IA and data flows; this is a **styling + micro-interaction** upgrade.

---

## 2) Visual Language (Tokens)

- **Base surfaces**
  - `bg/base`: `#0B0F1A`
  - `bg/paper`: `#121826`
  - `bg/overlay`: `#0F1526`
  - **Borders**: `rgba(255,255,255,0.06)`
- **Accent palette**
  - Primary: `#6366F1` (indigo), hover/depth `#7C83FF`, dark `#4F46E5`
  - Secondary: `#8B5CF6`
- **State colors**
  - Success `#22C55E`, Error `#EF4444`, Warning `#F59E0B`, Info `#38BDF8`
- **Text**
  - Primary `#E6E8F0`, Secondary `#A8B0C3`
- **Typography**
  - Family: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`
  - Buttons: `font-weight: 600`, `text-transform: none`
  - Headings: slightly negative letter-spacing
- **Radius & spacing**
  - Radius: **14–16px** for containers; **999** for pills/chips
  - Spacing grid: **8px**

---

## 3) Theme Setup (MUI v5)

Create `theme.ts` and wrap the app: `<ThemeProvider theme={theme}>`.

```ts
// src/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    background: { default: '#0B0F1A', paper: '#121826' },
    primary:  { main: '#6366F1', light: '#7C83FF', dark: '#4F46E5', contrastText: '#fff' },
    secondary:{ main: '#8B5CF6' },
    success:  { main: '#22C55E' },
    error:    { main: '#EF4444' },
    warning:  { main: '#F59E0B' },
    info:     { main: '#38BDF8' },
    divider:  'rgba(255,255,255,0.08)',
    text:     { primary: '#E6E8F0', secondary: '#A8B0C3' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
    h5: { fontWeight: 700, letterSpacing: -0.2 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.1 },
    body2: { color: 'rgba(230,232,240,.78)' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(1200px 600px at 80% -10%, rgba(99,102,241,.10), transparent)',
        },
        '*::-webkit-scrollbar': { height: 10, width: 10 },
        '*::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,.14)', borderRadius: 10 },
        '::selection': { background: 'rgba(99,102,241,.35)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          '&:focus-visible': { boxShadow: '0 0 0 3px rgba(99,102,241,.45)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7C83FF 0%, #6366F1 60%)',
          boxShadow: '0 10px 30px rgba(99,102,241,.35)',
          '&:hover': { boxShadow: '0 8px 24px rgba(99,102,241,.45)' },
        },
        outlined: {
          borderWidth: 1.5, '&:hover': { borderWidth: 1.5 },
        },
        containedError: {
          background: 'rgba(239,68,68,.14)',
          color: '#FCA5A5',
          border: '1px solid rgba(239,68,68,.35)',
          '&:hover': { background: 'rgba(239,68,68,.22)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600, paddingInline: 6 },
        filledSuccess: { backgroundColor: 'rgba(34,197,94,.12)', color: '#34D399' },
        filledError:   { backgroundColor: 'rgba(239,68,68,.12)', color: '#FCA5A5' },
        filledWarning: { backgroundColor: 'rgba(245,158,11,.14)', color: '#FBBF24' },
        filledInfo:    { backgroundColor: 'rgba(56,189,248,.14)', color: '#7DD3FC' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F1526',
          borderLeft: '1px solid rgba(255,255,255,.06)',
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,.5)',
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
  },
});
```

---

## 4) Components & Patterns

### 4.1 Review Drawer Header (premium actions)

```tsx
// components/ReviewHeader.tsx
import { Stack, Button, Chip, Typography } from '@mui/material';
import { CheckRounded, CloseRounded, InsertDriveFileRounded } from '@mui/icons-material';

type Props = {
  vendor: string; billNo: string; billDate: string;
  status: 'billed'|'failed'|'ready'; mode: 'manual'|'auto';
  onApprove: () => void; onReject: () => void; onView: () => void;
};

export function ReviewHeader({ vendor, billNo, billDate, status, mode, onApprove, onReject, onView }: Props) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
        <Chip size="small" color={status === 'billed' ? 'success' : status === 'failed' ? 'error' : 'warning'} label={`status: ${status}`} />
        <Chip size="small" color="info" label={`mode: ${mode}`} />
        {status !== 'billed' && <Chip size="small" color="warning" label="approval: ready" />}
      </Stack>

      <Typography variant="h5" fontWeight={700}>{vendor}</Typography>
      <Typography variant="body2" sx={{ opacity: .8 }}>{billNo} • {billDate}</Typography>

      <Stack direction="row" spacing={1.2}>
        <Button variant="contained" color="primary" startIcon={<CheckRounded />} onClick={onApprove}>Approve</Button>
        <Button variant="outlined" color="error" startIcon={<CloseRounded />} onClick={onReject}>Reject</Button>
        <Button variant="text" startIcon={<InsertDriveFileRounded />} onClick={onView} sx={{ color: 'inherit', opacity: .9 }}>
          View uploaded bill
        </Button>
      </Stack>
    </Stack>
  );
}
```

**Notes**
- Only **Approve** is contained (gradient). Reject is **outlined error** with confident contrast.
- Remove any custom shadow on Reject.
- Show a **Reject Confirm Dialog** (below) before finalizing:

```tsx
// components/RejectDialog.tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

export function RejectDialog({ open, onClose, onConfirm }:{open:boolean; onClose:()=>void; onConfirm:(reason:string)=>void}){
  const [reason, setReason] = React.useState('');
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reject bill</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth multiline minRows={3} placeholder="Reason (optional, visible in activity log)"
          value={reason} onChange={e=>setReason(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={()=>onConfirm(reason)}>Reject</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 4.2 Status Chips (single source of truth)

```tsx
// components/StatusChip.tsx
import { Chip } from '@mui/material';
type T = 'billed'|'failed'|'ready'|'auto_matched'|'unmatched';
const MAP: Record<T,{color:any;label:string}> = {
  billed: { color:'success', label:'Billed' },
  failed: { color:'error', label:'Failed' },
  ready: { color:'warning', label:'Ready' },
  auto_matched: { color:'success', label:'auto_matched' },
  unmatched: { color:'warning', label:'needs match' },
};
export const StatusChip = ({ type }:{type:T}) => <Chip size="small" color={MAP[type].color} label={MAP[type].label} />;
```

### 4.3 Line Items (tidy cards)

Render as a two-column responsive grid (`md:2`, `sm:1`): each card has title, tiny meta row (qty • rate • discount • HSN), and amount aligned right.

```tsx
// components/LineItems.tsx
import { Grid, Card, CardContent, Stack, Typography } from '@mui/material';

export function LineItems({ items }:{items:Array<{name:string; qty:number; rate:number; discount:number; hsn:string; amount:number; matched:boolean}>}){
  return (
    <Grid container spacing={1.5}>
      {items.map((it, i)=>(
        <Grid item xs={12} md={6} key={i}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography fontWeight={600}>{it.name}</Typography>
                <Typography variant="body2" sx={{ opacity:.8 }}>{it.amount.toLocaleString()}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ opacity:.75 }}>
                Qty: {it.qty} • Rate: {it.rate} • Discount: {it.discount} • HSN/SAC: {it.hsn}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
```

### 4.4 Metrics Bar (KPI cards)

- Each KPI is a **Card** with icon, large number, tiny caption.
- Click actions: set table filter (`Billed`, `Ready`, `Failed`).
- Hide **Failed** when zero. Show skeletons while loading.

```tsx
// components/MetricsBar.tsx
import { Card, CardContent, Stack, Typography } from '@mui/material';

export function MetricCard({value,label,sub,onClick}:{value:number|string;label:string;sub?:string;onClick?:()=>void}){
  return (
    <Card onClick={onClick} variant="outlined" sx={{ cursor:onClick?'pointer':'default' }}>
      <CardContent>
        <Typography variant="h5" fontWeight={800}>{value}</Typography>
        <Typography variant="body2" sx={{ opacity:.75 }}>{label}</Typography>
        {sub && <Typography variant="caption" sx={{ opacity:.6 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}
```

### 4.5 Navigation

- Left rail gets a subtle separator (`box-shadow: inset -1px 0 0 rgba(255,255,255,.06)`).
- Active item uses a pill background: `background: rgba(99,102,241,.10); border-radius: 10px;`

---

## 5) Micro‑interactions & Accessibility

- **Keyboard shortcuts:** `A` approve, `R` reject (opens dialog), `V` view bill, `J/K` navigate rows.
- **Focus rings:** high-contrast (already in Button override).
- **Hover:** table row tint `rgba(99,102,241,.06)`.
- **Loading:** skeletons for metrics and line-items.
- **Toasts:** “Approved”, “Rejected (reason)”, “Filter: Ready”.

---

## 6) Empty & Error States

- Empty Review: icon + “Nothing to approve” + button → **Upload**.
- Failed row drawer: show compact error snippet + **View logs** (link to n8n execution).

---

## 7) Implementation Order

1. Add `theme.ts`, wrap with `ThemeProvider`.  
2. Replace Review drawer header with `ReviewHeader` + `RejectDialog`.  
3. Swap line items to grid cards; adopt `StatusChip`.  
4. Style Metrics bar with `MetricCard`; wire click→filter.  
5. Add keyboard shortcuts and skeletons.  

---

## 8) Definition of Done

- Buttons, chips, cards match theme; Reject has **no glow/shadow**.  
- Review drawer feels cohesive; actions consistent across rows.  
- Metrics cards clickable; Failed hidden when `0`.  
- Keyboard shortcuts work; focus-visible ring is present.  
- All pages honor the new surfaces/borders/typography.  

---

## 9) Notes for Codex

- Use `sx` where local overrides are needed; prefer theme for global changes.  
- Do **not** introduce extra libraries; keep to MUI v5 and icons.  
- Keep components headless (props only) so they can be reused in other pages.  

---

**End of spec.**
