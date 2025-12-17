import { LedgerEntryType } from '../domain/types'
import { weekWindow } from '../domain/time'
import { ledgerChronological } from '../data/ledgerRepo'

export type LedgerState = {
  balance: number
  debtEpisodeStart: number | null
}

export type WeeklyFocusSummary = {
  focusEarned: number
}

export function computeLedgerState(): LedgerState {
  const entries = ledgerChronological()
  let balance = 0
  let debtEpisodeStart: number | null = null
  for (const entry of entries) {
    const previous = balance
    balance += entry.amount_minutes
    if (previous >= 0 && balance < 0) {
      debtEpisodeStart = entry.created_at
    } else if (previous < 0 && balance >= 0) {
      debtEpisodeStart = null
    }
  }
  return { balance, debtEpisodeStart }
}

export function focusEarnedDuringWeek(target: Date, timezone: string): number {
  const { start, end } = weekWindow(target, timezone)
  const startMs = start.getTime()
  const endMs = end.getTime()
  const entries = ledgerChronological()
  let total = 0
  for (const entry of entries) {
    if (entry.created_at < startMs || entry.created_at > endMs) continue
    if (entry.type === LedgerEntryType.FOCUS_EARN) {
      total += entry.amount_minutes
    }
    if (entry.type === LedgerEntryType.ADJUSTMENT && entry.metadata && typeof entry.metadata === 'object') {
      const meta = entry.metadata as Record<string, unknown>
      if (meta.focusEarnDelta !== undefined) {
        total += Number(meta.focusEarnDelta) || 0
      }
    }
  }
  return total
}
