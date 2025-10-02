"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import MenuIcon from '@mui/icons-material/Menu'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import QueueIcon from '@mui/icons-material/Queue'
import SettingsIcon from '@mui/icons-material/Settings'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { useOrg } from '@/lib/org'

const drawerWidth = 240

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [email, setEmail] = useState<string | null>(null)
  const { orgId } = useOrg()

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [supabase])

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev)
  const open = Boolean(anchorEl)
  const pathname = usePathname()

  const drawer = (
    <div>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <Image src="/logo.png" alt="LedgerPilot" width={200} height={36} style={{ height: 36, width: 'auto' }} />
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/"
            selected={pathname === '/'}
            sx={{
              borderRadius: 1.25,
              mx: 1,
              '&.Mui-selected': { background: 'rgba(99,102,241,.10)' },
            }}
          >
            <ListItemIcon>
              <CloudUploadIcon />
            </ListItemIcon>
            <ListItemText primary="Upload" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/queue"
            selected={pathname === '/queue'}
            sx={{
              borderRadius: 1.25,
              mx: 1,
              '&.Mui-selected': { background: 'rgba(99,102,241,.10)' },
            }}
          >
            <ListItemIcon>
              <QueueIcon />
            </ListItemIcon>
            <ListItemText primary="Review" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/settings"
            selected={pathname === '/settings'}
            sx={{
              borderRadius: 1.25,
              mx: 1,
              '&.Mui-selected': { background: 'rgba(99,102,241,.10)' },
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Image src="/logo.png" alt="LedgerPilot" width={260} height={48} style={{ height: 48, width: 'auto' }} />
          </Box>
          {orgId ? (
            <Box sx={{ mr: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)', fontSize: 12 }}>
              Org: {orgId}
            </Box>
          ) : null}
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {email ? email[0]?.toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>{email ?? 'Signed in'}</MenuItem>
            <Divider />
            <MenuItem
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="navigation">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              boxShadow: 'inset -1px 0 0 rgba(255,255,255,.06)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              boxShadow: 'inset -1px 0 0 rgba(255,255,255,.06)',
            },
          }}
          open
        >
          <Box sx={{ height: '100%' }}>
            {drawer}
          </Box>
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 3, md: 4 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, background: 'transparent' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
