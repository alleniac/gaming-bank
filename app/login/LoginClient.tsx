'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  firstRun: boolean
}

export default function LoginClient({ firstRun }: Props) {
  const router = useRouter()
  const [passcode, setPasscode] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Checking...')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setStatus(data.error || 'Failed')
      return
    }
    setStatus('Success')
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto card space-y-4">
      <div>
        <div className="text-lg font-semibold">{firstRun ? 'Create passcode' : 'Enter passcode'}</div>
        <p className="text-sm text-slate-400">
          {firstRun
            ? 'First time setup: create the passcode you will use on this device.'
            : 'Single-user local access protected by your passcode.'}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          Passcode
          <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} required />
        </label>
        <button type="submit">{firstRun ? 'Set passcode' : 'Login'}</button>
        {status ? <div className="text-sm text-slate-300">{status}</div> : null}
      </form>
    </div>
  )
}
