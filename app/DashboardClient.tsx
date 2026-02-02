'use client'

import { TimeBlockType } from '@/domain/types'

type TimeBlock = {
  id: string
  title: string
  type: TimeBlockType
  start_ts: number
  end_ts: number
  duration_minutes: number
}

type Props = {
  recentBlocks: TimeBlock[]
}

const typeColors: Record<TimeBlockType, string> = {
  [TimeBlockType.FOCUS]: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30',
  [TimeBlockType.GAME]: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
  [TimeBlockType.HABIT]: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
  [TimeBlockType.MILESTONE]: 'bg-sky-500/15 text-sky-100 border border-sky-400/30',
  [TimeBlockType.OTHER]: 'bg-slate-500/15 text-slate-200 border border-slate-400/30'
}

function localDateKey(ts: number) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function DashboardClient({ recentBlocks }: Props) {
  const todayKey = localDateKey(Date.now())
  const todayBlocks = recentBlocks.filter((block) => localDateKey(block.start_ts) === todayKey)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Today&apos;s time blocks</h2>
      </div>
      {todayBlocks.length === 0 ? (
        <p className="text-slate-400 text-sm">No blocks yet today.</p>
      ) : (
        <div className="space-y-2">
          {todayBlocks.map((block) => (
            <div key={block.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2">
              <div>
                <div className="font-semibold">{block.title}</div>
                <p className="text-xs text-slate-400">
                  {new Date(block.start_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →
                  {new Date(block.end_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  · {block.duration_minutes} min
                </p>
              </div>
              <span className={`badge ${typeColors[block.type]}`}>{block.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
