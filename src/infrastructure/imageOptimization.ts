import imageCompression from 'browser-image-compression'

const MAX_WIDTH = 800
const MAX_HEIGHT = 600
const MAX_SIZE_MB = 0.2
const WEBP_MIME = 'image/webp'

export class ImageOptimizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageOptimizationError'
  }
}

export interface OptimizedImage {
  blob: Blob
  width: number
  height: number
  sizeBytes: number
  mimeType: typeof WEBP_MIME
}

export function validateImageBlob(blob: Blob): void {
  if (!blob.type.startsWith('image/')) {
    throw new ImageOptimizationError('Unsupported file type. Choose a PNG, JPEG, GIF, or WebP image.')
  }
}

export async function optimizeReferenceImage(file: Blob): Promise<OptimizedImage> {
  validateImageBlob(file)

  const normalizedFile = file instanceof File
    ? file
    : new File([file], 'reference-image', { type: file.type || 'application/octet-stream' })

  let source = normalizedFile
  const sourceSize = await measureImage(source)
  const scale = Math.min(1, MAX_WIDTH / sourceSize.width, MAX_HEIGHT / sourceSize.height)

  if (scale < 1) {
    source = await resizeImage(source, Math.round(sourceSize.width * scale), Math.round(sourceSize.height * scale))
  }

  try {
    const compressed = await imageCompression(source, {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: Math.max(MAX_WIDTH, MAX_HEIGHT),
      useWebWorker: true,
      fileType: WEBP_MIME,
      initialQuality: 0.78,
    })
    const blob = compressed.slice(0, compressed.size, WEBP_MIME)
    const dimensions = await measureImage(blob)
    return {
      blob,
      width: dimensions.width,
      height: dimensions.height,
      sizeBytes: blob.size,
      mimeType: WEBP_MIME,
    }
  } catch (error) {
    if (error instanceof ImageOptimizationError) throw error
    throw new ImageOptimizationError('Could not optimize this image. Try a smaller or different image file.')
  }
}

async function measureImage(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

async function resizeImage(file: File, width: number, height: number): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new ImageOptimizationError('Your browser could not prepare the image canvas.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, WEBP_MIME, 0.9)
  })
  if (!blob) {
    throw new ImageOptimizationError('Your browser could not resize this image.')
  }
  return new File([blob], file.name, { type: WEBP_MIME, lastModified: Date.now() })
}
