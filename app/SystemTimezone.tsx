'use client'

import { useEffect, useState } from 'react'

export default function SystemTimezone() {
  const [tz, setTz] = useState<string | null>(null)

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  if (!tz) {
    return <span className="text-slate-400">Loading…</span>
  }

  return <span>{tz}</span>
}
