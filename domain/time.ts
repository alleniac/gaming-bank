import { DateTime } from 'luxon'

const DEFAULT_ZONE = 'UTC'

export function toZonedDateTime(date: Date | number, timezone: string): DateTime {
  const zone = timezone || DEFAULT_ZONE
  return typeof date === 'number'
    ? DateTime.fromMillis(date, { zone })
    : DateTime.fromJSDate(date, { zone })
}

export function startOfDay(date: Date | number, timezone: string): Date {
  return toZonedDateTime(date, timezone).startOf('day').toJSDate()
}

export function localDateKey(date: Date | number, timezone: string): string {
  return toZonedDateTime(date, timezone).toFormat('yyyy-LL-dd')
}

export function weekWindow(date: Date | number, timezone: string): { start: Date; end: Date } {
  const dt = toZonedDateTime(date, timezone)
  const start = dt.startOf('week') // ISO weeks start Monday which aligns with Sunday cutoff
  const end = start.plus({ weeks: 1 }).minus({ seconds: 1 })
  return { start: start.toJSDate(), end: end.toJSDate() }
}

export function weekCutoffFor(date: Date | number, timezone: string): Date {
  return weekWindow(date, timezone).end
}

export function nextWeekCutoff(date: Date | number, timezone: string): Date {
  const dt = toZonedDateTime(date, timezone)
  return dt
    .startOf('week')
    .plus({ weeks: 1 })
    .minus({ seconds: 1 })
    .toJSDate()
}

export function addDays(date: Date | number, days: number, timezone: string): Date {
  return toZonedDateTime(date, timezone).plus({ days }).toJSDate()
}

export function daysBetween(from: Date | number, to: Date | number, timezone: string): number {
  const fromDt = toZonedDateTime(from, timezone).startOf('day')
  const toDt = toZonedDateTime(to, timezone).startOf('day')
  return Math.floor(toDt.diff(fromDt, 'days').days)
}
