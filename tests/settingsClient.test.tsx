import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SettingsClient from '@/app/settings/SettingsClient'
import { defaultSettings } from '@/domain/settings'

const baseSettings = {
  ...defaultSettings,
  timezone: 'UTC'
}

describe('SettingsClient percent mapping', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.restoreAllMocks()
    global.fetch = originalFetch as typeof fetch
  })

  it('renders percent values for decay and habit cap', () => {
    render(
      <SettingsClient
        settings={{
          ...baseSettings,
          dailyDecayRate: 0.02,
          habitBonusCapPercent: 0.5
        }}
      />
    )

    const decayInput = screen.getByLabelText(/Daily decay rate/i) as HTMLInputElement
    const capInput = screen.getByLabelText(/Habit bonus cap/i) as HTMLInputElement

    expect(decayInput.value).toBe('2')
    expect(capInput.value).toBe('50')
  })

  it('submits decimal values when UI shows percents', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ settings: {} }) })
    global.fetch = fetchMock as unknown as typeof fetch

    render(
      <SettingsClient
        settings={{
          ...baseSettings,
          dailyDecayRate: 0.02,
          habitBonusCapPercent: 0.5
        }}
      />
    )

    const decayInput = screen.getByLabelText(/Daily decay rate/i) as HTMLInputElement
    const capInput = screen.getByLabelText(/Habit bonus cap/i) as HTMLInputElement

    fireEvent.change(decayInput, { target: { value: '1' } })
    fireEvent.change(capInput, { target: { value: '80' } })

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [, requestInit] = fetchMock.mock.calls[0]
    const payload = JSON.parse((requestInit as RequestInit).body as string)

    expect(payload.dailyDecayRate).toBeCloseTo(0.01)
    expect(payload.habitBonusCapPercent).toBeCloseTo(0.8)
  })
})
