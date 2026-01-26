'use client'

import { useEffect } from 'react'

type Props = {
  timezone: string
}

export default function TimezoneUpdater({ timezone }: Props) {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Only attempt to set when server has none; never override a user-set timezone.
    if (timezone || !detected) return
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: detected })
    }).catch((err) => {
      console.error('Failed to set timezone', err)
    })
  }, [timezone])

  return null
}
