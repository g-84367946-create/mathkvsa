import { createWorker } from 'tesseract.js'

export async function recognizeMathText(
  source: File | Blob | string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  // eng covers digits/symbols well; Malay labels can still be typed/edited manually.
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') {
        onProgress?.(message.progress)
      }
    },
  })

  try {
    const result = await worker.recognize(source)
    return result.data.text.trim()
  } finally {
    await worker.terminate()
  }
}
