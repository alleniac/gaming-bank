import { NextResponse } from 'next/server'
import { getSettlements } from '@/services/settlementService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settlements = getSettlements()
  return NextResponse.json({ settlements })
}
