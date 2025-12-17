import { effectiveDebtRate } from '../domain/debt'
import { computeDecay } from '../domain/decay'
import { localDateKey, weekCutoffFor, weekWindow, daysBetween } from '../domain/time'
import { getHabitCheckinsForRange, listHabits } from '../data/habitsRepo'
import { listTimeBlocks } from '../data/timeBlocksRepo'
import { ensureDatabase } from '../lib/bootstrap'
import { runMaintenance } from './maintenanceService'
import { getSettings } from './settingsService'
import { computeLedgerState, focusEarnedDuringWeek } from './ledgerState'

export function getDashboard(now = new Date()) {
  ensureDatabase()
  runMaintenance(now)
  const settings = getSettings()
  const timezone = settings.timezone || 'UTC'
  const state = computeLedgerState()
  const balance = state.balance
  const debtMinutes = Math.max(0, -balance)
  const debtDay =
    debtMinutes > 0 && state.debtEpisodeStart ? daysBetween(state.debtEpisodeStart, now, timezone) + 1 : 0
  const effectiveRate = debtMinutes > 0 ? effectiveDebtRate(settings, debtDay) : settings.baseRateFocusPerGaming
  const nextCutoff = weekCutoffFor(now, timezone).getTime()

  const { start, end } = weekWindow(now, timezone)
  const startKey = localDateKey(start, timezone)
  const todayKey = localDateKey(now, timezone)
  const habits = listHabits().filter((h) => h.active)
  const rewardByHabit = habits.reduce<Record<string, number>>((acc, h) => {
    acc[h.id] = h.reward_minutes
    return acc
  }, {})
  const checkins = getHabitCheckinsForRange(startKey, todayKey)
  const rawPending = checkins.reduce((sum, c) => {
    if (c.checked && rewardByHabit[c.habit_id]) {
      return sum + rewardByHabit[c.habit_id]
    }
    return sum
  }, 0)
  const focusEarnWeek = focusEarnedDuringWeek(now, timezone)
  const vestCap = Math.floor(focusEarnWeek * settings.habitBonusCapPercent)
  const potentialVested = Math.min(rawPending, vestCap)
  const potentialExcess = Math.max(rawPending - potentialVested, 0)

  const decayPreview = computeDecay(balance, settings)
  const todayBlocks = listTimeBlocks(100).filter(
    (b) => localDateKey(b.start_ts, timezone) === todayKey
  )

  return {
    settings,
    balance,
    debtMinutes,
    debtDay,
    effectiveRate,
    nextCutoff,
    decayPreview,
    potentialHabits: {
      rawPending,
      potentialVested,
      potentialExcess,
      focusEarnWeek
    },
    todayBlocks,
    weekRange: { start: start.getTime(), end: end.getTime() }
  }
}
