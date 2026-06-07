import {
  isUnlocked,
  getDecryptedPayload,
  persistPayload,
} from './vault'

export type SessionCredentialProviderId = 'openrouter'

const credentials = new Map<string, string>()

export const sessionCredentials = {
  setApiKey(providerId: SessionCredentialProviderId, apiKey: string): void {
    const trimmed = apiKey.trim()
    if (trimmed) {
      credentials.set(providerId, trimmed)

      // Persist into vault when unlocked (fire-and-forget)
      if (isUnlocked()) {
        const payload = getDecryptedPayload()
        if (payload) {
          payload.apiKeys[providerId] = trimmed
          persistPayload().catch(console.error)
        }
      }
    } else {
      credentials.delete(providerId)

      // Remove from vault payload when unlocked (fire-and-forget)
      if (isUnlocked()) {
        const payload = getDecryptedPayload()
        if (payload && providerId in payload.apiKeys) {
          delete payload.apiKeys[providerId]
          persistPayload().catch(console.error)
        }
      }
    }
  },

  getApiKey(providerId: SessionCredentialProviderId): string | undefined {
    // Fast path: in-memory cache
    const cached = credentials.get(providerId)
    if (cached !== undefined) return cached

    // Fallback: restore from unlocked vault payload and cache
    if (isUnlocked()) {
      const payload = getDecryptedPayload()
      const fromVault = payload?.apiKeys[providerId]
      if (fromVault) {
        credentials.set(providerId, fromVault)
        return fromVault
      }
    }

    return undefined
  },

  clearApiKey(providerId: SessionCredentialProviderId): void {
    credentials.delete(providerId)
  },

  clearAll(): void {
    credentials.clear()
    // Do NOT delete the vault itself — just clear the in-memory cache.
  },
}