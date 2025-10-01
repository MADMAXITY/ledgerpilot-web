import { NextResponse, type NextRequest } from 'next/server'

type Ctx = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx)
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx)
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx)
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx)
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx)
}

async function proxy(req: NextRequest, ctx: Ctx) {
  const upstream = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!upstream) return NextResponse.json({ error: 'API base not configured' }, { status: 500 })
  const { path } = await ctx.params
  const subpath = path.join('/')
  const targetUrl = new URL(`${upstream}/${subpath}`)

  // preserve query string
  const reqUrl = new URL(req.url)
  reqUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v))

  const init: RequestInit = {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
  }

  const res = await fetch(targetUrl.toString(), init)
  const text = await res.text()
  const headers = new Headers({ 'content-type': res.headers.get('content-type') || 'application/json' })
  return new NextResponse(text, { status: res.status, headers })
}
