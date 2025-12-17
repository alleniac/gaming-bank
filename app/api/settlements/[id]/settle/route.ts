import { NextResponse } from 'next/server'
import { settlePenalty } from '@/services/settlementService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note : undefined
  settlePenalty(resolvedParams.id, note)
  return NextResponse.json({ ok: true })
}
