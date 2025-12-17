'use client'

import { useState } from 'react'
import { Settings } from '@/domain/types'

type Props = {
  settings: Settings
}

export default function SettingsClient({ settings }: Props) {
  const [form, setForm] = useState(settings)
  const [status, setStatus] = useState<string | null>(null)
  const [passcodeStatus, setPasscodeStatus] = useState<string | null>(null)
  const [passcodeForm, setPasscodeForm] = useState({ current: '', next: '' })

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Saving...')
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setStatus(data.error || 'Failed')
      return
    }
    setStatus('Saved')
  }

  function detectTimezone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setForm({ ...form, timezone: tz })
    setStatus(`Detected ${tz}`)
  }

  async function changePasscode(e: React.FormEvent) {
    e.preventDefault()
    setPasscodeStatus('Saving...')
    const res = await fetch('/api/auth/passcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passcodeForm)
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setPasscodeStatus(data.error || 'Failed')
      return
    }
    setPasscodeStatus('Passcode updated')
    setPasscodeForm({ current: '', next: '' })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={saveSettings} className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Settings</div>
            <p className="text-sm text-slate-400">Changes apply going forward.</p>
          </div>
          {status ? <div className="text-sm text-slate-300">{status}</div> : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Base rate (focus → gaming)
            <input
              type="number"
              min={1}
              value={form.baseRateFocusPerGaming}
              onChange={(e) => setForm({ ...form, baseRateFocusPerGaming: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Interest day1 surcharge
            <input
              type="number"
              min={0}
              value={form.surchargeDay1}
              onChange={(e) => setForm({ ...form, surchargeDay1: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Daily interest increase
            <input
              type="number"
              min={0}
              value={form.surchargeDailyIncrease}
              onChange={(e) => setForm({ ...form, surchargeDailyIncrease: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Interest cap
            <input
              type="number"
              min={0}
              value={form.surchargeCap}
              onChange={(e) => setForm({ ...form, surchargeCap: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Soft cap (minutes)
            <input
              type="number"
              min={0}
              value={form.softCapMinutes}
              onChange={(e) => setForm({ ...form, softCapMinutes: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hard cap (minutes)
            <input
              type="number"
              min={0}
              value={form.hardCapMinutes}
              onChange={(e) => setForm({ ...form, hardCapMinutes: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Daily decay rate
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={form.dailyDecayRate}
              onChange={(e) => setForm({ ...form, dailyDecayRate: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Habit bonus cap (% of focus gaming)
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={form.habitBonusCapPercent}
              onChange={(e) => setForm({ ...form, habitBonusCapPercent: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Penalty rate ($ per debt minute)
            <input
              type="number"
              min={0}
              value={form.penaltyRateUsdPerDebtMinute}
              onChange={(e) => setForm({ ...form, penaltyRateUsdPerDebtMinute: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Timezone
            <div className="flex gap-2 items-center">
              <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              <button type="button" className="bg-slate-700 text-slate-100 px-3 py-2 rounded-lg" onClick={detectTimezone}>
                Detect
              </button>
            </div>
          </label>
        </div>
        <button type="submit">Save settings</button>
      </form>

      <form onSubmit={changePasscode} className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Passcode</div>
            <p className="text-sm text-slate-400">Single-user local access.</p>
          </div>
          {passcodeStatus ? <div className="text-sm text-slate-300">{passcodeStatus}</div> : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Current passcode
            <input
              type="password"
              value={passcodeForm.current}
              onChange={(e) => setPasscodeForm({ ...passcodeForm, current: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            New passcode
            <input
              type="password"
              value={passcodeForm.next}
              onChange={(e) => setPasscodeForm({ ...passcodeForm, next: e.target.value })}
              required
            />
          </label>
        </div>
        <button type="submit">Update passcode</button>
      </form>
    </div>
  )
}
