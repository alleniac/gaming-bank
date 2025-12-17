import { Settings } from './types'

export function calculateHabitVesting(params: {
  rawBonusMinutes: number
  focusEarnedGamingMinutes: number
  settings: Settings
}): { vested: number; excess: number } {
  const { rawBonusMinutes, focusEarnedGamingMinutes, settings } = params
  if (rawBonusMinutes <= 0) {
    return { vested: 0, excess: 0 }
  }
  const cap = Math.floor(focusEarnedGamingMinutes * settings.habitBonusCapPercent)
  const vested = Math.min(rawBonusMinutes, cap)
  const excess = Math.max(rawBonusMinutes - vested, 0)
  return { vested, excess }
}
