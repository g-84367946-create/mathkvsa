export type ParsedWorking = {
  raw: string
  scaleFactor?: number
  areaScaleFactor?: number
  objectArea?: number
  imageArea?: number
  imagePoint?: { x: number; y: number }
  notes: string[]
}

function toNumber(raw: string): number | undefined {
  const normalized = raw.replace(',', '.').replace(/[^\d.+-]/g, '')
  if (!normalized || normalized === '+' || normalized === '-' || normalized === '.') return undefined
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

function firstMatch(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    const value = toNumber(match[1] ?? '')
    if (value != null) return value
  }
  return undefined
}

/**
 * Parse common Malay/English student working for enlargement + area scale.
 * Designed to be tolerant of OCR noise.
 */
export function parseWorkingText(rawInput: string): ParsedWorking {
  const raw = rawInput.trim()
  const text = raw
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/\bk2\b/g, 'k^2')
    .replace(/\s+/g, ' ')

  const notes: string[] = []

  const scaleFactor = firstMatch(text, [
    /faktor\s*skala(?:\s*linear)?(?:\s*,?\s*k)?\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /\bk\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /scale\s*factor\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /k\s*=\s*√?\(?\s*\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?\s*\)?\s*=\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  const areaScaleFactor = firstMatch(text, [
    /faktor\s*skala\s*luas(?:\s*,?\s*k\^?2)?\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /k\^?2\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /area\s*scale\s*factor\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /luas\s*imej\s*\/\s*luas\s*objek\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  const objectArea = firstMatch(text, [
    /luas\s*objek(?:\s*asal)?\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /object\s*area\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /luas\s*asal\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  const imageArea = firstMatch(text, [
    /luas\s*imej\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /image\s*area\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /luas\s*(?:baharu|baru)\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  let imagePoint: { x: number; y: number } | undefined
  const pointMatch = text.match(
    /(?:imej|image|titik'?)\s*[a-z']*\s*[=:]\s*\(\s*([+-]?\d+(?:[.,]\d+)?)\s*,\s*([+-]?\d+(?:[.,]\d+)?)\s*\)/i,
  )
  if (pointMatch) {
    const x = toNumber(pointMatch[1] ?? '')
    const y = toNumber(pointMatch[2] ?? '')
    if (x != null && y != null) imagePoint = { x, y }
  }

  if (scaleFactor != null) notes.push(`Dijumpai k = ${scaleFactor}`)
  if (areaScaleFactor != null) notes.push(`Dijumpai k² = ${areaScaleFactor}`)
  if (objectArea != null) notes.push(`Dijumpai luas objek = ${objectArea}`)
  if (imageArea != null) notes.push(`Dijumpai luas imej = ${imageArea}`)
  if (imagePoint) notes.push(`Dijumpai koordinat imej = (${imagePoint.x}, ${imagePoint.y})`)
  if (notes.length === 0) {
    notes.push('OCR tidak menemui nilai jelas. Sila isi secara manual.')
  }

  return {
    raw,
    scaleFactor,
    areaScaleFactor,
    objectArea,
    imageArea,
    imagePoint,
    notes,
  }
}
