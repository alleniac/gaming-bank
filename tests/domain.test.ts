/// <reference types="vitest" />

import { describe, expect, it } from 'vitest'
import { effectiveDebtRate, applyFocusToDebtAndEarnings } from '@/domain/debt'
import { computeDecay } from '@/domain/decay'
import { calculateHabitVesting } from '@/domain/habits'
import { weekWindow, localDateKey } from '@/domain/time'
import { defaultSettings } from '@/domain/settings'

const settings = { ...defaultSettings }

describe('debt rate', () => {
  it('bumps rate with surcharge and caps', () => {
    expect(effectiveDebtRate(settings, 1)).toBe(8)
    expect(effectiveDebtRate(settings, 3)).toBe(10)
    expect(effectiveDebtRate(settings, 10)).toBe(12)
  })
})

describe('focus application', () => {
  it('repays debt before earning and caps to debt size', () => {
    const result = applyFocusToDebtAndEarnings({
      focusMinutes: 100,
      debtMinutes: 2,
      settings,
      debtDay: 2
    })
    expect(result.debtPayment).toBe(2)
    expect(result.earned).toBe(13)
  })
})

describe('decay', () => {
  it('decays excess above soft cap', () => {
    expect(computeDecay(700, settings)).toBe(Math.floor((700 - settings.softCapMinutes) * settings.dailyDecayRate))
    expect(computeDecay(100, settings)).toBe(0)
  })
})

describe('habits', () => {
  it('caps vesting at percent of focus earn', () => {
    const { vested, excess } = calculateHabitVesting({
      rawBonusMinutes: 100,
      focusEarnedGamingMinutes: 120,
      settings
    })
    expect(vested).toBe(60)
    expect(excess).toBe(40)
  })
})

describe('week window', () => {
  it('starts on Monday and ends Sunday night for timezone', () => {
    const target = new Date('2024-04-03T12:00:00Z')
    const { start, end } = weekWindow(target, 'UTC')
    expect(localDateKey(start, 'UTC')).toBe('2024-04-01')
    expect(localDateKey(end, 'UTC')).toBe('2024-04-07')
  })
})
