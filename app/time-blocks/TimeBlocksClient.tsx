'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TimeBlockType } from '@/domain/types'

type TimeBlock = {
  id: string
  title: string
  type: TimeBlockType
  start_ts: number
  end_ts: number
  duration_minutes: number
  counts_for_focus: number
  tags: string | null
  note: string | null
}

type Props = {
  initialBlocks: TimeBlock[]
}

function formatLocalInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

function freshTimes() {
  const end = new Date()
  const start = new Date(end.getTime() - 30 * 60 * 1000)
  return {
    start: formatLocalInput(start),
    end: formatLocalInput(end)
  }
}

export default function TimeBlocksClient({ initialBlocks }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    type: TimeBlockType.FOCUS,
    ...freshTimes(),
    countsForFocus: true,
    tags: '',
    note: ''
  })
  const [status, setStatus] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Saving...')
    const payload = {
      ...form,
      countsForFocus: form.type === TimeBlockType.FOCUS ? form.countsForFocus : false
    }
    const url = editingId ? `/api/time-blocks/${editingId}` : '/api/time-blocks'
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setStatus(data.error || 'Failed to save')
      return
    }
    setStatus(editingId ? 'Updated' : 'Logged')
    setEditingId(null)
    setForm((prev) => ({
      ...prev,
      ...freshTimes(),
      title: '',
      note: ''
    }))
    router.refresh()
  }

  function startEdit(block: TimeBlock) {
    setEditingId(block.id)
    setForm({
      title: block.title,
      type: block.type,
      start: formatLocalInput(new Date(block.start_ts)),
      end: formatLocalInput(new Date(block.end_ts)),
      countsForFocus: block.counts_for_focus === 1,
      tags: block.tags ?? '',
      note: block.note ?? ''
    })
  }

  async function handleDelete(id: string) {
    setStatus('Deleting...')
    await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' })
    setStatus('Deleted')
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Log time</div>
            <p className="text-sm text-slate-400">Focus earns, games spend, habits track.</p>
          </div>
          {status ? <div className="text-sm text-slate-300">{status}</div> : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as TimeBlockType
                setForm({ ...form, type, countsForFocus: type === TimeBlockType.FOCUS ? form.countsForFocus : false })
              }}
            >
              {Object.values(TimeBlockType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Start
            <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            End
            <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tags
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma separated" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Note
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </label>
        </div>
        {form.type === TimeBlockType.FOCUS ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.countsForFocus}
              onChange={(e) => setForm({ ...form, countsForFocus: e.target.checked })}
            />
            Counts for focus earnings
          </label>
        ) : null}
        <div className="flex gap-2">
          <button type="submit">{editingId ? 'Save changes' : 'Add block'}</button>
          {editingId ? (
            <button
              type="button"
              className="bg-slate-700 text-slate-100 px-3 py-2 rounded-lg"
              onClick={() => {
                setEditingId(null)
                setStatus(null)
                setForm((prev) => ({
                  ...prev,
                  ...freshTimes(),
                  title: '',
                  note: ''
                }))
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Recent blocks</div>
        </div>
        <div className="space-y-2">
          {initialBlocks.length === 0 ? (
            <p className="text-slate-400 text-sm">Nothing logged yet.</p>
          ) : (
            initialBlocks.map((block) => (
              <div key={block.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2">
                <div>
                  <div className="font-semibold">{block.title}</div>
                  <p className="text-xs text-slate-400">
                    {new Date(block.start_ts).toLocaleString()} → {new Date(block.end_ts).toLocaleString()} ({block.duration_minutes} min)
                  </p>
                  <p className="text-xs text-slate-500">Note: {block.note || '—'}</p>
                  <p className="text-xs text-slate-500">Tags: {block.tags || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-slate-700 text-slate-100">{block.type}</span>
                  <button type="button" className="bg-slate-700 text-slate-100 px-3 py-2 rounded-lg" onClick={() => startEdit(block)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={editingId === block.id}
                    onClick={() => handleDelete(block.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
