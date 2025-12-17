'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Habit = {
  id: string
  name: string
  reward_minutes: number
  active: number
}

type Checkin = {
  id: string
  habit_id: string
  local_date: string
  checked: number
}

type Props = {
  habits: Habit[]
  checkins: Checkin[]
  startKey: string
  endKey: string
}

function dateKeys(startKey: string, endKey: string) {
  const start = new Date(startKey)
  const end = new Date(endKey)
  const keys: string[] = []
  let cursor = start
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10)
    keys.push(key)
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return keys
}

export default function HabitsClient({ habits, checkins, startKey, endKey }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', reward: 5 })
  const keys = useMemo(() => dateKeys(startKey, endKey), [startKey, endKey])
  const checkinMap = useMemo(() => {
    const map = new Map<string, Checkin>()
    checkins.forEach((c) => {
      map.set(`${c.habit_id}-${c.local_date}`, c)
    })
    return map
  }, [checkins])
  const [status, setStatus] = useState<string | null>(null)

  async function addHabit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Creating...')
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, rewardMinutes: form.reward })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setStatus(data.error || 'Failed')
      return
    }
    setStatus('Added')
    setForm({ name: '', reward: 5 })
    router.refresh()
  }

  async function toggleCheck(habitId: string, dateKey: string, checked: boolean) {
    await fetch(`/api/habits/${habitId}/checkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateKey, checked })
    })
    router.refresh()
  }

  async function toggleActive(habit: Habit) {
    await fetch(`/api/habits/${habit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !habit.active })
    })
    router.refresh()
  }

  async function removeHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <form onSubmit={addHabit} className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Habits</div>
            <p className="text-sm text-slate-400">Weekly vesting happens Sunday night.</p>
          </div>
          {status ? <div className="text-sm text-slate-300">{status}</div> : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Reward minutes
            <input
              type="number"
              min={0}
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })}
            />
          </label>
        </div>
        <button type="submit">Add habit</button>
      </form>

      <div className="card overflow-auto">
        <table className="table min-w-full text-sm">
          <thead>
            <tr>
              <th>Habit</th>
              {keys.map((key) => (
                <th key={key} className="text-center">
                  {key.slice(5)}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 ? (
              <tr>
                <td className="text-slate-400" colSpan={keys.length + 2}>
                  No habits yet.
                </td>
              </tr>
            ) : (
              habits.map((habit) => (
                <tr key={habit.id} className="border-b border-slate-800">
                  <td className="font-semibold">
                    {habit.name}
                    <div className="text-xs text-slate-500">{habit.reward_minutes} min</div>
                  </td>
                  {keys.map((key) => {
                    const ck = checkinMap.get(`${habit.id}-${key}`)
                    const checked = ck?.checked === 1
                    return (
                      <td key={key} className="text-center">
                        <button
                          type="button"
                          className={`px-3 py-1 rounded-lg text-xs ${checked ? 'bg-emerald-400 text-slate-900' : 'bg-slate-800 text-slate-300'}`}
                          onClick={() => toggleCheck(habit.id, key, !checked)}
                        >
                          {checked ? '✔' : '—'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="flex gap-2 items-center">
                    <button
                      type="button"
                      className="bg-slate-700 text-slate-100 px-3 py-1 rounded-lg"
                      onClick={() => toggleActive(habit)}
                    >
                      {habit.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      type="button"
                      className="bg-red-500 text-white px-3 py-1 rounded-lg"
                      onClick={() => removeHabit(habit.id)}
                    >
                      Delete
                    </button>
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
