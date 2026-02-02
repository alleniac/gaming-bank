'use client'

export default function SystemTimezone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return <span>{tz}</span>
}
