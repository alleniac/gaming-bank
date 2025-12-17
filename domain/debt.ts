import { Settings } from './types'

export function effectiveDebtRate(settings: Settings, debtDay: number): number {
  if (debtDay < 1) return settings.baseRateFocusPerGaming
  const surcharge = settings.surchargeDay1 + (debtDay - 1) * settings.surchargeDailyIncrease
  const capped = Math.min(settings.surchargeCap, surcharge)
  return settings.baseRateFocusPerGaming + capped
}

export function applyFocusToDebtAndEarnings(params: {
  focusMinutes: number
  debtMinutes: number
  settings: Settings
  debtDay: number
}): { debtPayment: number; earned: number; remainingFocus: number; effectiveRate: number } {
  const { focusMinutes, debtMinutes, settings, debtDay } = params
  const effectiveRate = effectiveDebtRate(settings, debtDay)
  if (focusMinutes <= 0) {
    return { debtPayment: 0, earned: 0, remainingFocus: 0, effectiveRate }
  }
  const maxDebtPayable = Math.min(debtMinutes, Math.floor(focusMinutes / effectiveRate))
  const remainingAfterDebt = focusMinutes - maxDebtPayable * effectiveRate
  const earned = Math.floor(remainingAfterDebt / settings.baseRateFocusPerGaming)
  return {
    debtPayment: maxDebtPayable,
    earned,
    remainingFocus: remainingAfterDebt,
    effectiveRate
  }
}
