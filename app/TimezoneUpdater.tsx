'use client'

import { useEffect } from 'react'

type Props = {
  timezone: string
}

export default function TimezoneUpdater({ timezone }: Props) {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone === detected || !detected) return
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: detected })
    })
  }, [timezone])

  return null
}
