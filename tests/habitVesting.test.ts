import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { weekCutoffFor } from '@/domain/time'
import { calculateHabitVesting } from '@/domain/habits'
import { defaultSettings } from '@/domain/settings'

const TZ = 'America/Los_Angeles'

describe('habit vesting basics', () => {
  it('caps vesting against focus-earned minutes', () => {
    const settings = { ...defaultSettings }
    const result = calculateHabitVesting({
      rawBonusMinutes: 60,
      focusEarnedGamingMinutes: 100,
      settings
    })
    expect(result.vested).toBe(50)
    expect(result.excess).toBe(10)
  })

  it('handles zero raw pending bonuses', () => {
    const settings = { ...defaultSettings }
    const result = calculateHabitVesting({
      rawBonusMinutes: 0,
      focusEarnedGamingMinutes: 200,
      settings
    })
    expect(result.vested).toBe(0)
    expect(result.excess).toBe(0)
  })
})

describe('weekly cutoff timing', () => {
  it('returns Sunday 23:59:59 in the preset timezone', () => {
    const target = new Date('2026-01-15T12:00:00Z')
    const cutoff = weekCutoffFor(target, TZ)
    const dt = DateTime.fromJSDate(cutoff, { zone: TZ })
    expect(dt.weekday).toBe(7)
    expect(dt.hour).toBe(23)
    expect(dt.minute).toBe(59)
    expect(dt.second).toBe(59)
  })

  it('rolls to next Sunday after the cutoff passes', () => {
    const justBefore = DateTime.fromObject({ year: 2026, month: 1, day: 18, hour: 23, minute: 59, second: 58 }, { zone: TZ })
    const cutoffBefore = weekCutoffFor(justBefore.toJSDate(), TZ)
    const dtBefore = DateTime.fromJSDate(cutoffBefore, { zone: TZ })
    expect(dtBefore.weekday).toBe(7)
    expect(dtBefore.hour).toBe(23)

    const after = DateTime.fromObject({ year: 2026, month: 1, day: 19, hour: 0, minute: 0, second: 0 }, { zone: TZ })
    const cutoffAfter = weekCutoffFor(after.toJSDate(), TZ)
    const dtAfter = DateTime.fromJSDate(cutoffAfter, { zone: TZ })
    expect(dtAfter.weekday).toBe(7)
    expect(dtAfter > dtBefore).toBe(true)
  })
})
