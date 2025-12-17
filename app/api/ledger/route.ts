import { NextResponse } from 'next/server'
import { ledgerWithRunningBalance } from '@/services/ledgerViewService'
import { isAuthenticated } from '@/services/authService'

export const runtime = 'nodejs'

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ledger = ledgerWithRunningBalance(300)
  return NextResponse.json({ ledger })
}
