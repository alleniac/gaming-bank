import { redirect } from 'next/navigation'
import { ledgerWithRunningBalance } from '@/services/ledgerViewService'
import { isAuthenticated } from '@/services/authService'
import { LedgerEntryType } from '@/domain/types'

export const dynamic = 'force-dynamic'

function formatType(type: LedgerEntryType) {
  return type.replace('_', ' ')
}

export default async function LedgerPage() {
  if (!(await isAuthenticated())) redirect('/login')
  const ledger = ledgerWithRunningBalance(300)
  return (
    <main className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-semibold">Ledger</div>
          <p className="text-sm text-slate-400">Running balance derived from every transaction.</p>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="table min-w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.created_at).toLocaleString()}</td>
                <td>{formatType(entry.type)}</td>
                <td className={entry.amount_minutes >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {entry.amount_minutes}
                </td>
                <td className={entry.runningBalance !== null && entry.runningBalance < 0 ? 'text-rose-300' : ''}>
                  {entry.runningBalance ?? '—'}
                </td>
                <td className="text-slate-400">{entry.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
