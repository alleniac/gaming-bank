import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDashboard } from '@/services/dashboardService'
import { isAuthenticated } from '@/services/authService'
import DashboardClient from './DashboardClient'
import SystemTimezone from './SystemTimezone'

export const dynamic = 'force-dynamic'

function fmtMinutes(value: number) {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  return `${sign}${abs} min`
}

function countdown(target: number) {
  const diff = target - Date.now()
  if (diff <= 0) return 'processing soon'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  return `${days}d ${hours}h`
}


export default async function Home() {
  if (!(await isAuthenticated())) redirect('/login')
  const dashboard = getDashboard()

  return (
    <main className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="card">
          <div className="text-sm text-slate-400 mb-2">Current balance</div>
          <div className="text-3xl font-semibold">{fmtMinutes(dashboard.balance)}</div>
          <p className="text-sm text-slate-400 mt-1">Debt: {fmtMinutes(-dashboard.debtMinutes)}</p>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400 mb-2">Effective rate</div>
          <div className="text-3xl font-semibold">
            {dashboard.effectiveRate}:1
            {dashboard.debtDay > 0 ? <span className="text-sm text-slate-400 ml-2">day {dashboard.debtDay}</span> : null}
          </div>
          <p className="text-sm text-slate-400 mt-1">Base rate {dashboard.settings.baseRateFocusPerGaming}:1</p>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400 mb-2">Timezone</div>
          <div className="text-sm text-slate-600">
            System: <SystemTimezone />
          </div>
          <div className="text-sm text-slate-600">Server preset: {dashboard.settings.timezone || 'UTC'}</div>
          <p className="text-xs text-slate-500 mt-2">
            App times render in your current system timezone. Habit vesting follows the server preset timezone.
          </p>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400 mb-2">Next weekly cutoff</div>
          <div className="text-2xl font-semibold">{countdown(dashboard.nextCutoff)}</div>
          <p className="text-sm text-slate-400 mt-1">{new Date(dashboard.nextCutoff).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Habit bonuses (pending)</h2>
            <Link href="/habits" className="text-sm text-cyan-200 hover:text-cyan-100">
              Manage habits
            </Link>
          </div>
          <p className="text-sm text-slate-300">Raw pending: {fmtMinutes(dashboard.potentialHabits.rawPending)}</p>
          <p className="text-sm text-slate-300">Vesting cap: {fmtMinutes(dashboard.potentialHabits.potentialVested)}</p>
          <p className="text-sm text-slate-400">Excess if unchanged: {fmtMinutes(dashboard.potentialHabits.potentialExcess)}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Decay guardrail</h2>
            <Link href="/settings" className="text-sm text-cyan-200 hover:text-cyan-100">
              Tune caps
            </Link>
          </div>
          <p className="text-sm text-slate-300">Soft cap: {fmtMinutes(dashboard.settings.softCapMinutes)}</p>
          <p className="text-sm text-slate-300">Hard cap: {fmtMinutes(dashboard.settings.hardCapMinutes)}</p>
          <p className="text-sm text-slate-400">If applied today: -{dashboard.decayPreview} min</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Link href="/time-blocks" className="text-sm text-cyan-200 hover:text-cyan-100">
            Log time
          </Link>
        </div>
        <DashboardClient recentBlocks={dashboard.recentBlocks} />
      </div>
    </main>
  )
}
