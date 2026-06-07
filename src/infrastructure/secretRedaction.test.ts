import { describe, expect, it } from 'vitest'
import { redactApiSecrets } from './secretRedaction'

describe('redactApiSecrets', () => {
  it('redacts OpenRouter and generic secret key patterns', () => {
    expect(redactApiSecrets('failed with sk-or-secret_value and sk-test123')).toBe(
      'failed with [redacted-api-key] and [redacted-api-key]',
    )
  })
})