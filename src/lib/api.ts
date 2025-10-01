export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${API_BASE}${path}`
  const { method = 'GET', body, headers } = opts
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    // Likely CORS/network issue. Fallback to server proxy.
    const proxyUrl = `/api/n8n${path.startsWith('/') ? path : `/${path}`}`
    res = await fetch(proxyUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}
