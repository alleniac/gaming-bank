'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SettlementStatus } from '@/domain/types'

type Settlement = {
  id: string
  week_start_ts: number
  penalty_minutes: number
  penalty_usd: number
  status: SettlementStatus
  created_at: number
  settled_at: number | null
  note: string | null
}

type Props = {
  settlements: Settlement[]
}

export default function SettlementsClient({ settlements }: Props) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function settle(id: string) {
    setStatus('Saving...')
    await fetch(`/api/settlements/${id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    })
    setStatus('Settled')
    setNote('')
    router.refresh()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-semibold">Weekly penalties</div>
          <p className="text-sm text-slate-400">Settle when you pay the USD amount.</p>
        </div>
        {status ? <div className="text-sm text-slate-300">{status}</div> : null}
      </div>
      <div className="overflow-auto">
        <table className="table min-w-full text-sm">
          <thead>
            <tr>
              <th>Week</th>
              <th>Debt minutes</th>
              <th>Penalty ($)</th>
              <th>Status</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr>
                <td className="text-slate-400" colSpan={6}>
                  Nothing pending.
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.week_start_ts).toLocaleDateString()}</td>
                  <td>{s.penalty_minutes}</td>
                  <td>${s.penalty_usd}</td>
                  <td className={s.status === SettlementStatus.PENDING ? 'text-amber-300' : 'text-emerald-300'}>{s.status}</td>
                  <td>{s.note || ''}</td>
                  <td>
                    {s.status === SettlementStatus.PENDING ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Optional note"
                          className="bg-slate-800 text-slate-100 rounded-lg px-2 py-1 border border-slate-700"
                        />
                        <button type="button" onClick={() => settle(s.id)}>
                          Mark settled
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
