import { describe, it, expect, vi, beforeEach } from 'vitest'
import imageCompression from 'browser-image-compression'
import { optimizeReferenceImage, validateImageBlob, ImageOptimizationError } from './imageOptimization'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file: File) => new File([file], file.name, { type: 'image/webp' })),
}))

describe('imageOptimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
      width: 400,
      height: 300,
      close: vi.fn(),
    })))
  })

  it('rejects unsupported MIME types', () => {
    expect(() => validateImageBlob(new Blob(['x'], { type: 'text/plain' }))).toThrow(ImageOptimizationError)
  })

  it('outputs a WebP Blob without upscaling smaller images', async () => {
    const source = new File(['image'], 'small.png', { type: 'image/png' })
    const optimized = await optimizeReferenceImage(source)

    expect(optimized.mimeType).toBe('image/webp')
    expect(optimized.blob.type).toBe('image/webp')
    expect(optimized.width).toBe(400)
    expect(optimized.height).toBe(300)
    expect(imageCompression).toHaveBeenCalledWith(
      source,
      expect.objectContaining({
        fileType: 'image/webp',
        initialQuality: 0.78,
        useWebWorker: true,
      }),
    )
  })
})
