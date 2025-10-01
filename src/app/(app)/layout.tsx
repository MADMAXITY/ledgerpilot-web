import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { OrgProvider } from '@/lib/org'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <AppLayout>
      <OrgProvider>{children}</OrgProvider>
    </AppLayout>
  )
}
