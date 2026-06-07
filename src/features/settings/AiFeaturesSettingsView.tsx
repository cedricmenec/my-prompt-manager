import { useEffect, useMemo, useState } from 'react'
import { SUPPORTED_AI_PROVIDER_ID } from '@/infrastructure/aiProviders'
import { aiProviderSettingsRepository } from '@/infrastructure/aiProviderSettingsRepository'
import type { AiProviderModel } from '@/infrastructure/db'

const PROMPT_INPUT_ASSISTANT_FEATURE_ID = 'prompt-input-assistant'

function isEligibleAssistantModel(model: AiProviderModel): boolean {
  return model.modality === 'text' || model.modality === 'multimodal'
}

export function AiFeaturesSettingsView() {
  const [enabledModels, setEnabledModels] = useState<AiProviderModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [statusMessage, setStatusMessage] = useState('Choose the enabled model used by prompt title and description generation.')

  const eligibleModels = useMemo(() => enabledModels.filter(isEligibleAssistantModel), [enabledModels])

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      const [models, settings] = await Promise.all([
        aiProviderSettingsRepository.listEnabledProviderModels(SUPPORTED_AI_PROVIDER_ID),
        aiProviderSettingsRepository.getFeatureSettings(PROMPT_INPUT_ASSISTANT_FEATURE_ID),
      ])
      if (cancelled) return
      setEnabledModels(models)
      const eligibleIds = new Set(models.filter(isEligibleAssistantModel).map((model) => model.id))
      setSelectedModelId(settings && eligibleIds.has(settings.modelId) ? settings.modelId : '')
      if (settings && !eligibleIds.has(settings.modelId)) {
        setStatusMessage('The previously selected assistant model is no longer enabled. Choose another enabled text model.')
      }
    }
    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSelectionChange(modelId: string) {
    setSelectedModelId(modelId)
    if (!modelId) {
      await aiProviderSettingsRepository.deleteFeatureSettings(PROMPT_INPUT_ASSISTANT_FEATURE_ID)
      setStatusMessage('Prompt input assistant selection cleared.')
      return
    }
    await aiProviderSettingsRepository.saveFeatureSettings(PROMPT_INPUT_ASSISTANT_FEATURE_ID, {
      providerId: SUPPORTED_AI_PROVIDER_ID,
      modelId,
    })
    setStatusMessage('Prompt input assistant model saved.')
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-border p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-text-heading">Prompt input assistant</h3>
          <p className="mt-1 text-xs text-text">Generates prompt titles and descriptions from the current prompt content.</p>
        </div>

        <label className="grid gap-1 text-sm text-text-heading">
          AI Assistant
          <select
            value={selectedModelId}
            onChange={(event) => void handleSelectionChange(event.target.value)}
            disabled={eligibleModels.length === 0}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select an enabled text model</option>
            {eligibleModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>

        {eligibleModels.length === 0 ? (
          <p className="mt-3 rounded-md bg-surface-muted p-3 text-xs text-text">
            No enabled text-capable model is available. Open API & Models, load OpenRouter models, then enable a text or multimodal model.
          </p>
        ) : (
          <p className="mt-3 text-xs text-text">{statusMessage}</p>
        )}
      </section>
    </div>
  )
}