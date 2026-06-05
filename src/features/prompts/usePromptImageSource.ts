import { useEffect, useState } from 'react'
import type { Prompt } from '@/domain/promptSchema'
import { promptRepository } from '@/infrastructure/promptRepository'

export interface PromptImageSource {
  src: string | undefined
  isLocal: boolean
  loading: boolean
}

export function usePromptImageSource(prompt: Prompt | undefined): PromptImageSource {
  const [localImage, setLocalImage] = useState<{ assetId: string; src: string } | null>(null)
  const [missingAssetId, setMissingAssetId] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    let objectUrl: string | undefined

    if (!prompt?.imageAssetId) {
      return undefined
    }

    const assetId = prompt.imageAssetId
    promptRepository.getImageAssetById(prompt.imageAssetId)
      .then((asset) => {
        if (!isActive) return
        if (!asset) {
          setMissingAssetId(assetId)
          return
        }
        objectUrl = URL.createObjectURL(asset.blob)
        setLocalImage({ assetId, src: objectUrl })
      })
      .catch(() => {
        if (isActive) setMissingAssetId(assetId)
      })

    return () => {
      isActive = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [prompt?.imageAssetId])

  const localSrc =
    localImage && localImage.assetId === prompt?.imageAssetId ? localImage.src : undefined
  const canUseRemoteFallback =
    !prompt?.imageAssetId || missingAssetId === prompt.imageAssetId

  return {
    src: localSrc ?? (canUseRemoteFallback ? prompt?.imageUrl : undefined),
    isLocal: Boolean(localSrc),
    loading: Boolean(prompt?.imageAssetId && !localSrc && !canUseRemoteFallback),
  }
}
