import { useEffect, useMemo, useState } from 'react'
import { AI_PROVIDER_DEFINITIONS, SUPPORTED_AI_PROVIDER_ID } from '@/infrastructure/aiProviders'
import { aiProviderSettingsRepository } from '@/infrastructure/aiProviderSettingsRepository'
import type { AiProviderModel } from '@/infrastructure/db'
import { fetchOpenRouterModels, OpenRouterModelsError } from '@/infrastructure/openRouterModelsClient'
import { sessionCredentials } from '@/infrastructure/sessionCredentials'

type LoadState = 'idle' | 'loading' | 'success' | 'validation-error' | 'provider-error'

export function ApiModelsSettingsView() {
  const [selectedProviderId, setSelectedProviderId] = useState(SUPPORTED_AI_PROVIDER_ID)
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState<AiProviderModel[]>([])
  const [enabledModelIds, setEnabledModelIds] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [message, setMessage] = useState('Load models with your session-only OpenRouter key.')

  const selectedProvider = AI_PROVIDER_DEFINITIONS.find((provider) => provider.id === selectedProviderId)

  useEffect(() => {
    let cancelled = false
    async function restoreProviderSettings() {
      const [cachedModels, enabledIds] = await Promise.all([
        aiProviderSettingsRepository.listProviderModels(selectedProviderId),
        aiProviderSettingsRepository.getEnabledModelIds(selectedProviderId),
      ])
      if (cancelled) return
      setModels(cachedModels)
      setEnabledModelIds(enabledIds)
      if (cachedModels.length > 0) {
        setMessage(`${cachedModels.length} cached model${cachedModels.length !== 1 ? 's' : ''} available locally.`)
      }

      // Restore API key from session credentials (vault or in-memory cache)
      const restoredKey = sessionCredentials.getApiKey(selectedProviderId)
      if (restoredKey && !cancelled) {
        setApiKey(restoredKey)
        // Update message to indicate key was restored from vault
        if (loadState === 'idle') {
          setMessage('API key restored from vault. Load models to refresh the catalog.')
        }
      }
    }
    void restoreProviderSettings()
    return () => {
      cancelled = true
    }
  }, [selectedProviderId])

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return models
    return models.filter((model) => model.name.toLowerCase().includes(normalizedQuery))
  }, [models, query])

  async function handleLoadModels() {
    if (!apiKey.trim()) {
      setLoadState('validation-error')
      setMessage('Enter an OpenRouter API key before loading models.')
      return
    }

    setLoadState('loading')
    setMessage('Loading OpenRouter models...')
    try {
      sessionCredentials.setApiKey('openrouter', apiKey)
      const fetchedModels = await fetchOpenRouterModels(apiKey)
      await aiProviderSettingsRepository.replaceProviderModels(selectedProviderId, fetchedModels, new Date().toISOString())
      const enabledIds = await aiProviderSettingsRepository.getEnabledModelIds(selectedProviderId)
      setModels(fetchedModels)
      setEnabledModelIds(enabledIds)
      setLoadState('success')
      setMessage(`${fetchedModels.length} model${fetchedModels.length !== 1 ? 's' : ''} loaded from OpenRouter.`)
    } catch (error) {
      setLoadState(error instanceof OpenRouterModelsError && error.kind === 'missing-key' ? 'validation-error' : 'provider-error')
      setMessage(error instanceof Error ? error.message : 'OpenRouter model loading failed.')
    }
  }

  async function toggleModel(modelId: string) {
    const next = new Set(enabledModelIds)
    if (next.has(modelId)) {
      next.delete(modelId)
    } else {
      next.add(modelId)
    }
    setEnabledModelIds(next)
    await aiProviderSettingsRepository.setEnabledModels(selectedProviderId, [...next])
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-sm font-medium text-text-heading">Provider</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {AI_PROVIDER_DEFINITIONS.map((provider) => {
            const supported = provider.status === 'supported'
            return (
              <label
                key={provider.id}
                className={`rounded-lg border p-3 text-sm ${
                  selectedProviderId === provider.id ? 'border-primary bg-surface-muted' : 'border-border'
                } ${supported ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              >
                <input
                  type="radio"
                  name="ai-provider"
                  value={provider.id}
                  checked={selectedProviderId === provider.id}
                  disabled={!supported}
                  onChange={() => setSelectedProviderId(provider.id)}
                  className="mr-2"
                />
                <span className="font-medium text-text-heading">{provider.label}</span>
                <span className="mt-1 block text-xs text-text">{supported ? 'Available' : 'Planned'}</span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-text-heading">OpenRouter key</h3>
            <p className="mt-1 text-xs text-text">The key stays in memory for this browser session only and is cleared on reload.</p>
          </div>
          {selectedProvider?.apiKeyUrl && (
            <a className="text-xs font-medium text-primary hover:underline" href={selectedProvider.apiKeyUrl} target="_blank" rel="noreferrer">
              Get key
            </a>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-1 text-sm text-text-heading">
            API key
            <input
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value)
                sessionCredentials.setApiKey('openrouter', event.target.value)
              }}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              placeholder="sk-or-..."
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            onClick={handleLoadModels}
            disabled={loadState === 'loading'}
            className="self-end rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50"
          >
            {loadState === 'loading' ? 'Loading...' : 'Load models'}
          </button>
        </div>
        <p className={`mt-3 text-xs ${loadState === 'validation-error' || loadState === 'provider-error' ? 'text-red-600' : 'text-text'}`}>
          {message}
        </p>
      </section>

      <section className="rounded-lg border border-border p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-text-heading">Models</h3>
            <p className="mt-1 text-xs text-text">{enabledModelIds.size} enabled model{enabledModelIds.size !== 1 ? 's' : ''}</p>
          </div>
          <label className="grid min-w-56 gap-1 text-sm text-text-heading">
            Search models
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              placeholder="Filter by name"
            />
          </label>
        </div>

        <div className="max-h-72 overflow-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-surface-muted text-xs uppercase text-text">
              <tr>
                <th className="w-12 px-3 py-2">Use</th>
                <th className="px-3 py-2">Model name</th>
                <th className="px-3 py-2">Origin</th>
                <th className="px-3 py-2">Token cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => (
                <tr key={model.id} className="border-t border-border">
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={enabledModelIds.has(model.id)}
                      onChange={() => void toggleModel(model.id)}
                      aria-label={`Enable ${model.name}`}
                    />
                  </td>
                  <td className="px-3 py-2 align-top text-text-heading">{model.name}</td>
                  <td className="px-3 py-2 align-top text-text">{model.originProvider}</td>
                  <td className="px-3 py-2 align-top text-text">Reserved</td>
                </tr>
              ))}
              {filteredModels.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-text">
                    {models.length === 0 ? 'No cached models yet.' : 'No models match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

