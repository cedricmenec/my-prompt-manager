import { beforeEach, describe, expect, it } from 'vitest'
import { sessionCredentials } from './sessionCredentials'

beforeEach(() => {
  localStorage.clear()
  sessionCredentials.clearAll()
})

describe('sessionCredentials', () => {
  it('keeps API keys in memory for the current session', () => {
    sessionCredentials.setApiKey('openrouter', ' sk-or-session ')

    expect(sessionCredentials.getApiKey('openrouter')).toBe('sk-or-session')
  })

  it('does not write API keys to localStorage', () => {
    sessionCredentials.setApiKey('openrouter', 'sk-or-session')

    expect(JSON.stringify(localStorage)).not.toContain('sk-or-session')
  })

  it('clears empty or deleted provider keys', () => {
    sessionCredentials.setApiKey('openrouter', 'sk-or-session')
    sessionCredentials.setApiKey('openrouter', ' ')

    expect(sessionCredentials.getApiKey('openrouter')).toBeUndefined()
  })
})