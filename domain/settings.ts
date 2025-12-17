import { Settings } from './types'

export const defaultSettings: Settings = {
  baseRateFocusPerGaming: 6,
  surchargeDay1: 2,
  surchargeDailyIncrease: 1,
  surchargeCap: 6,
  softCapMinutes: 600,
  hardCapMinutes: 900,
  dailyDecayRate: 0.02,
  habitBonusCapPercent: 0.5,
  penaltyRateUsdPerDebtMinute: 1,
  timezone: ''
}

export function mergeSettings(partial: Partial<Settings> | null | undefined): Settings {
  return { ...defaultSettings, ...(partial ?? {}) }
}
