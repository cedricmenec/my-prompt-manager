export type SessionCredentialProviderId = 'openrouter'

const credentials = new Map<string, string>()

export const sessionCredentials = {
  setApiKey(providerId: SessionCredentialProviderId, apiKey: string): void {
    const trimmed = apiKey.trim()
    if (trimmed) {
      credentials.set(providerId, trimmed)
    } else {
      credentials.delete(providerId)
    }
  },

  getApiKey(providerId: SessionCredentialProviderId): string | undefined {
    return credentials.get(providerId)
  },

  clearApiKey(providerId: SessionCredentialProviderId): void {
    credentials.delete(providerId)
  },

  clearAll(): void {
    credentials.clear()
  },
}