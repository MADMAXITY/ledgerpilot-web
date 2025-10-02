# LedgerPilot — UI Design Upgrade Spec (v2 Addendum)

**Objective:** Polish the new look to a “tip‑top, production‑grade” standard. Fix background banding lines, tighten spacing, improve legibility & hierarchy, and unify action styles across pages. This addendum **extends** the earlier spec (`ledgerpilot-ui-design-spec.md`).

---

## A) Visual Bugs & Banding Fix

### A1) Remove “horizon lines” / gradient seams
Cause: multiple elements (e.g., `body`, page containers) each render their own gradient layers, creating visible seams where they meet. Also, radial gradients on different stacking contexts can band on some GPUs.

**Fix strategy**
1. Render background gradients **once** at the **root** (via `CssBaseline` `body::before`), and ensure all app containers are `background: transparent`.
2. Add optional **grain overlay** to hide any residual banding without extra network requests.
3. Avoid blur/shadows on massive surfaces; keep them to local components (cards/drawers).

**Code (drop‑in):** update your `MuiCssBaseline.styleOverrides` in `theme.ts`:

```ts
MuiCssBaseline: {
  styleOverrides: {
    ':root': {
      '--lp-bg-base': '#0B0F1A',
      '--lp-bg-paper': '#121826',
      '--lp-bg-overlay': '#0F1526',
    },
    body: {
      backgroundColor: 'var(--lp-bg-base)',
      // Neutral fallback ensures no flashes
      backgroundImage: 'none',
    },
    'body::before': {
      content: '""',
      position: 'fixed',
      inset: 0,
      zIndex: -2,
      pointerEvents: 'none',
      // Single, app‑wide gradient stack
      background: [
        'radial-gradient(1000px 600px at 75% -10%, rgba(99,102,241,.12), transparent 60%)',
        'radial-gradient(800px 500px at 10% 110%, rgba(139,92,246,.08), transparent 60%)',
        'linear-gradient(#0B0F1A,#0B0F1A)'
      ].join(','),
      backgroundRepeat: 'no-repeat',
    },
    // Optional subtle grain overlay to defeat banding (pure CSS, no asset)
    'body::after': {
      content: '""',
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      pointerEvents: 'none',
      opacity: .035,
      mixBlendMode: 'overlay',
      backgroundImage:
        `repeating-radial-gradient(circle at 0 0, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 1px, transparent 3px)`,
    },
    // Ensure app shells don't re‑paint their own gradients
    '#__next, #root, .app-shell, main': { background: 'transparent' },
  },
}
```

> If you still notice faint banding on specific GPUs, nudge the alpha values to `.10/.06` or increase the gradient radii by ~15% to reduce steps.

### A2) Consistent paper surfaces
Some cards/containers show slight color steps vs. page background. Make all **Paper/Card** use the same base with translucent borders.

```ts
MuiPaper: { styleOverrides: { root: { backgroundColor: 'var(--lp-bg-paper)', border: '1px solid rgba(255,255,255,.06)' } } }
MuiCard:  { styleOverrides: { root:  { backgroundColor: 'var(--lp-bg-paper)' } } }
```

---

## B) Global Polish

### B1) Typography & numerics
- Add **tabular numbers** for totals, amounts, and table columns.
- Slightly increase body line-height for longer descriptions.

```ts
typography: {
  // merge with your existing theme.typography
  body1: { lineHeight: 1.6 },
  allVariants: { fontFeatureSettings: '"tnum" on, "cv10" on', fontVariantNumeric: 'tabular-nums' },
}
```

### B2) Spacing rhythm
- Page gutters: **24px** (sm), **32px** (md+).
- Components spacing: prefer **8 / 12 / 16 / 24** steps only.

### B3) Icon scale
- Use 18–20px icons inside chips and buttons to reduce visual noise.

---

## C) Navigation & Shell

- Left rail: add a faint inner divider and a subtle active pill.
- Keep the brand lockup fixed at top; ensure nav items never scroll under it.

```tsx
<Box sx={{ height: '100%', boxShadow: 'inset -1px 0 0 rgba(255,255,255,.06)' }}>
  {/* Active item pill */}
  <ListItemButton
    selected={isActive}
    sx={{
      borderRadius: 1.5,
      '&.Mui-selected': {
        backgroundColor: 'rgba(99,102,241,.12)',
        '&:hover': { backgroundColor: 'rgba(99,102,241,.16)' },
      },
    }}
  />
</Box>
```

---

## D) Review Page

### D1) KPI Cards (Metrics Bar)
- Reduce card height by 12–16px; large number (H5), tiny caption (caption).
- Entire card clickable → sets table filter.
- Hide **Failed** card when count is **0**.

```tsx
<Card variant="outlined" onClick={onClick} sx={{ cursor:'pointer', minWidth: 220 }}>
  <CardContent sx={{ py: 1.5 }}>
    <Typography variant="h5" fontWeight={800}>{value}</Typography>
    <Typography variant="body2" sx={{ opacity:.75 }}>{label}</Typography>
    {!!sub && <Typography variant="caption" sx={{ opacity:.6 }}>{sub}</Typography>}
  </CardContent>
</Card>
```

### D2) Table
- **Sticky header** and **row density toggle** (comfortable/compact).
- Right-align numeric columns; truncate long vendor names with tooltip.
- Row hover tint: `rgba(99,102,241,.06)`.
- Optional zebra striping at 3% opacity for large lists.

```ts
MuiTableHead: { styleOverrides: { root: { position: 'sticky', top: 0, backgroundColor: 'var(--lp-bg-paper)', zIndex: 1 } } }
```

---

## E) Review Drawer (Approve/Reject)

### E1) Header actions
- Approve: **contained / gradient** (primary).  
- Reject: **outlined / error** (no shadow).  
- “View uploaded bill”: text button with steady color (inherit @ 90% opacity).

Add subtle **divider** under the action row to separate from content.

### E2) Content layout
- Introduce a top **“Invoice summary”** card (already present): label rows with subtle keys.
- **Lines**: render as two-column cards with right‑aligned amount (tabular numbers).
- **Draft**: same grid style for parity; carry tiny captions for qty/rate/discount/HSN.

**Card style (shared):**

```tsx
const paneCard = {
  variant: 'outlined' as const,
  sx: { '& .MuiCardContent-root': { p: 1.5 } }
};
```

### E3) Keyboard shortcuts & tooltips
- `A` Approve, `R` Reject (opens confirm dialog), `V` View file, `J/K` navigate list.
- Show shortcuts in button tooltips: “Approve (A)”, “Reject (R)”.

### E4) Reject flow
- Use the `RejectDialog` from v1 spec; on confirm → toast “Rejected” with reason snippet.

---

## F) Upload & Settings

- Upload card: reduce internal max width and center icon/title tightly.
- Settings form: align labels/inputs to an **8px grid**; ensure “Save Changes” button uses primary contained style; success toast on save.

---

## G) Color & State Chips (Unify)

Make chips skimmable and consistent:

```ts
MuiChip: {
  styleOverrides: {
    root: { borderRadius: 999, fontWeight: 600, paddingInline: 6 },
    filledSuccess: { backgroundColor: 'rgba(34,197,94,.12)', color: '#34D399' },   // Billed / auto_matched
    filledWarning: { backgroundColor: 'rgba(245,158,11,.14)', color: '#FBBF24' }, // Ready
    filledError:   { backgroundColor: 'rgba(239,68,68,.12)', color: '#FCA5A5' },   // Failed / Rejected
    filledInfo:    { backgroundColor: 'rgba(56,189,248,.14)', color: '#7DD3FC' },  // Mode
  }
}
```

Expose a central `StatusChip` helper to prevent label drift (as in v1 spec).

---

## H) Micro‑Interactions

- **Focus rings**: keep 3px primary focus for all actionable elements.
- **Toasts**: success/info/error variants with consistent placement (bottom-right).
- **Skeletons**: metrics + drawer list while loading; 1.2s shimmer.

---

## I) Accessibility & QA

- Minimum contrast ratio 4.5:1 on text; verify chips on dark backgrounds.
- Test zoom at 125/150% without layout break.
- Check keyboard‑only flows for **Approve/Reject/View** and **filter chips**.
- Confirm high‑DPI rendering: no blurry borders at `1px` (use `borderColor` over box-shadow).
- Verify there are **no background seams** on all pages after A1 changes.

---

## J) Definition of Done (v2)

- No banding/seam “horizon lines” visible at any viewport.  
- KPI cards clickable; Failed hidden at 0; numbers use **tabular** alignment.  
- Review drawer uses unified card style; amounts right‑aligned; actions with tooltips + shortcuts.  
- Table header sticky; density toggle present; numeric columns aligned right.  
- Global chips/colors consistent across pages.  

---

### Optional: Minimal Layout Helper (App Shell)

```tsx
// components/AppShell.tsx (optional)
import { Box, Container } from '@mui/material';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left nav here */}
      <Box component="main" sx={{ flex: 1, p: { xs: 3, md: 4 }, background: 'transparent' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 0, md: 2 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
```

---

**Implementation order:** A1 → A2 → D2 (sticky header) → E1/E2 → B1 → D1 → G → H.

**End of v2 Addendum.**
