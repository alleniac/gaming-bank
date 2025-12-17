import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import { computeDecay } from '../domain/decay'
import { calculateHabitVesting } from '../domain/habits'
import { localDateKey, startOfDay, weekCutoffFor, weekWindow } from '../domain/time'
import { LedgerEntryType, SettlementStatus } from '../domain/types'
import { ledgerChronological, insertLedger } from '../data/ledgerRepo'
import { getState, setState } from '../data/systemStateRepo'
import { listHabits, getHabitCheckinsForRange } from '../data/habitsRepo'
import { createPenalty, getPenaltyForWeek } from '../data/settlementsRepo'
import { getSettings } from './settingsService'
import { focusEarnedDuringWeek } from './ledgerState'
import { ensureDatabase } from '../lib/bootstrap'
import { LedgerInsert } from '../data/ledgerRepo'

type MaintenanceEvent =
  | { kind: 'decay'; at: number; dateKey: string }
  | { kind: 'weekly'; at: number }

export function runMaintenance(now = new Date()): { addedEntries: number } {
  ensureDatabase()
  const settings = getSettings()
  const timezone = settings.timezone || 'UTC'
  const nowMs = now.getTime()
  const todayKey = localDateKey(now, timezone)

  const events: MaintenanceEvent[] = []

  // Daily decay catch-up
  const lastDecay = getState<string>('last_decay_date')
  if (!lastDecay) {
    setState('last_decay_date', todayKey)
  } else {
    let cursor = DateTime.fromFormat(lastDecay, 'yyyy-LL-dd', { zone: timezone }).plus({ days: 1 })
    const today = DateTime.fromFormat(todayKey, 'yyyy-LL-dd', { zone: timezone })
    while (cursor < today) {
      events.push({
        kind: 'decay',
        at: cursor.startOf('day').toMillis(),
        dateKey: cursor.toFormat('yyyy-LL-dd')
      })
      cursor = cursor.plus({ days: 1 })
    }
  }

  // Weekly cutoff catch-up
  const thisCutoff = weekCutoffFor(now, timezone).getTime()
  const baselineLastCutoff = DateTime.fromMillis(thisCutoff, { zone: timezone }).minus({ weeks: 1 }).toMillis()
  const lastProcessedCutoff = getState<number>('last_weekly_cutoff_ts') ?? baselineLastCutoff
  let cursorCutoff = lastProcessedCutoff
  let lastWeeklyProcessed = lastProcessedCutoff
  while (true) {
    const next = DateTime.fromMillis(cursorCutoff, { zone: timezone }).plus({ weeks: 1 }).toMillis()
    if (next <= nowMs) {
      events.push({ kind: 'weekly', at: next })
      cursorCutoff = next
    } else {
      break
    }
  }

  events.sort((a, b) => a.at - b.at)

  const ledger = ledgerChronological()
  let ledgerIdx = 0
  let runningBalance = 0
  const newEntries: LedgerInsert[] = []

  function advanceExisting(targetTs: number) {
    while (ledgerIdx < ledger.length && ledger[ledgerIdx].created_at <= targetTs) {
      runningBalance += ledger[ledgerIdx].amount_minutes
      ledgerIdx++
    }
  }

  for (const event of events) {
    advanceExisting(event.at)
    if (event.kind === 'decay') {
      const decayed = computeDecay(runningBalance, settings)
      if (decayed > 0) {
        const entry: LedgerInsert = {
          id: randomUUID(),
          created_at: event.at + 1000,
          type: LedgerEntryType.DECAY,
          amount_minutes: -decayed,
          note: `Decay for ${event.dateKey}`
        }
        newEntries.push(entry)
        runningBalance -= decayed
      }
      setState('last_decay_date', event.dateKey)
    } else if (event.kind === 'weekly') {
      const { start, end } = weekWindow(event.at, timezone)
      const weekStartKey = localDateKey(start, timezone)
      const weekEndKey = localDateKey(end, timezone)
      const habits = listHabits().filter((h) => h.active)
      const rewardsByHabit = habits.reduce<Record<string, number>>((acc, h) => {
        acc[h.id] = h.reward_minutes
        return acc
      }, {})
      const checkins = getHabitCheckinsForRange(weekStartKey, weekEndKey)
      const rawBonus = checkins.reduce((sum, checkin) => {
        if (checkin.checked && rewardsByHabit[checkin.habit_id]) {
          return sum + rewardsByHabit[checkin.habit_id]
        }
        return sum
      }, 0)
      const focusEarned = focusEarnedDuringWeek(event.at, timezone)
      const { vested, excess } = calculateHabitVesting({
        rawBonusMinutes: rawBonus,
        focusEarnedGamingMinutes: focusEarned,
        settings
      })

      if (vested > 0 && runningBalance < settings.hardCapMinutes) {
        const entry: LedgerInsert = {
          id: randomUUID(),
          created_at: event.at,
          type: LedgerEntryType.HABIT_VEST,
          amount_minutes: vested,
          metadata: {
            rawBonus,
            excess,
            weekStart: start.getTime()
          },
          note: `Habit vest for week starting ${weekStartKey}`
        }
        newEntries.push(entry)
        runningBalance += vested
      }
      if (excess > 0) {
        const entry: LedgerInsert = {
          id: randomUUID(),
          created_at: event.at,
          type: LedgerEntryType.HABIT_EXCESS_EXPIRED,
          amount_minutes: 0,
          metadata: {
            rawBonus,
            excess,
            weekStart: start.getTime()
          },
          note: `Habit excess expired for week starting ${weekStartKey}`
        }
        newEntries.push(entry)
      }

      if (runningBalance < 0) {
        const debtMinutes = Math.abs(runningBalance)
        const penaltyUsd = Math.round(debtMinutes * settings.penaltyRateUsdPerDebtMinute)
        const weekStart = start.getTime()
        const existing = getPenaltyForWeek(weekStart)
        if (!existing) {
          const settlement = createPenalty({
            week_start_ts: weekStart,
            penalty_minutes: debtMinutes,
            penalty_usd: penaltyUsd
          })
          const entry: LedgerInsert = {
            id: randomUUID(),
            created_at: event.at,
            type: LedgerEntryType.PENALTY_PENDING,
            amount_minutes: 0,
            metadata: {
              settlementId: settlement.id,
              penaltyUsd,
              debtMinutes
            },
            note: `Weekly penalty pending (${penaltyUsd} USD)`
          }
          newEntries.push(entry)
        }
      }

      lastWeeklyProcessed = event.at
    }
  }

  if (newEntries.length > 0) {
    insertLedger(newEntries)
  }

  setState('last_weekly_cutoff_ts', lastWeeklyProcessed)

  return { addedEntries: newEntries.length }
}
