"use client"
import useSWR from 'swr'
import { createContext, useContext, ReactNode, useMemo } from 'react'

type Bootstrap = { ok: boolean; org_id?: string }

const OrgContext = createContext<{ orgId: string | null }>({ orgId: null })

async function fetcher(url: string): Promise<Bootstrap> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('bootstrap failed')
  return res.json()
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const { data } = useSWR<Bootstrap>('/api/bootstrap', fetcher)
  const value = useMemo(() => ({ orgId: data?.org_id ?? null }), [data])
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  return useContext(OrgContext)
}

