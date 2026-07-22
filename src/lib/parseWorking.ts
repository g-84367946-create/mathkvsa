export type ParsedWorking = {
  raw: string
  kind?: 'langsung' | 'songsang' | 'bergabung'
  equation?: string
  k?: number
  x?: number
  y?: number
  z?: number
  w?: number
  x2?: number
  y2?: number
  z2?: number
  w2?: number
  notes: string[]
}

function toNumber(raw: string): number | undefined {
  const normalized = raw.replace(',', '.').replace(/[^\d.+-]/g, '')
  if (!normalized || normalized === '+' || normalized === '-' || normalized === '.') {
    return undefined
  }
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

function detectKind(text: string): ParsedWorking['kind'] | undefined {
  if (
    /ubahan\s*langsung|y\s*[=:]\s*k\s*x\b|y\s*∝\s*x\b|y\s*propto\s*x\b/i.test(text)
  ) {
    return 'langsung'
  }
  if (
    /ubahan\s*songsang|y\s*[=:]\s*k\s*\/\s*x|xy\s*[=:]\s*k|y\s*∝\s*1\s*\/\s*x/i.test(
      text,
    )
  ) {
    return 'songsang'
  }
  if (
    /ubahan\s*bergabung|y\s*[=:]\s*k\s*x\s*z|y\s*[=:]\s*kxz|y\s*∝\s*x\s*z/i.test(text)
  ) {
    return 'bergabung'
  }
  return undefined
}

function detectEquation(text: string): string | undefined {
  const patterns = [
    /y\s*=\s*k\s*x\s*z\s*\/\s*w/i,
    /y\s*=\s*kxz\s*\/\s*w/i,
    /y\s*=\s*k\s*x\s*z/i,
    /y\s*=\s*kxz/i,
    /y\s*=\s*k\s*\/\s*x/i,
    /xy\s*=\s*k/i,
    /y\s*=\s*k\s*x/i,
    /y\s*∝\s*xz\s*\/\s*w/i,
    /y\s*∝\s*x\s*z/i,
    /y\s*∝\s*1\s*\/\s*x/i,
    /y\s*∝\s*x/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0].replace(/\s+/g, ' ').trim()
  }
  return undefined
}

/**
 * Parse common Malay student working for variation (ubahan).
 * Tolerant of OCR noise around k, x, y, z, w.
 */
export function parseWorkingText(rawInput: string): ParsedWorking {
  const raw = rawInput.trim()
  const text = raw
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/\s+/g, ' ')

  const notes: string[] = []
  const kind = detectKind(text)
  const equation = detectEquation(raw)

  const k = firstMatch(text, [
    /pemalar(?:\s*ubahan)?(?:\s*,?\s*k)?\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /\bk\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  const x = firstMatch(text, [
    /(?:bila|apabila|jika)?\s*x\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /\bx\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  const y = firstMatch(text, [
    /(?:bila|apabila|jika)?\s*y\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)(?!\s*[a-z])/i,
  ])

  const z = firstMatch(text, [/\bz\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i])
  const w = firstMatch(text, [/\bw\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i])

  // Second values often written as "bila x = ... , y = ..." after k found,
  // or "jadi y = ..."
  const y2 = firstMatch(text, [
    /jadi\s*y\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /y\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)\s*(?:cm|unit|m)?\s*$/im,
    /nilai\s*(?:baharu|baru)?\s*y\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  const x2 = firstMatch(text, [
    /(?:kemudian|bila|apabila)\s*x\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
    /x\s*baharu\s*[=:]\s*([+-]?\d+(?:[.,]\d+)?)/i,
  ])

  if (kind) notes.push(`Dikesan jenis: ubahan ${kind}`)
  if (equation) notes.push(`Dijumpai persamaan: ${equation}`)
  if (k != null) notes.push(`Dijumpai k = ${k}`)
  if (x != null) notes.push(`Dijumpai x = ${x}`)
  if (y != null) notes.push(`Dijumpai y = ${y}`)
  if (z != null) notes.push(`Dijumpai z = ${z}`)
  if (w != null) notes.push(`Dijumpai w = ${w}`)
  if (x2 != null) notes.push(`Dijumpai x baharu = ${x2}`)
  if (y2 != null) notes.push(`Dijumpai y baharu = ${y2}`)
  if (notes.length === 0) {
    notes.push('OCR tidak menemui nilai jelas. Sila isi secara manual.')
  }

  return {
    raw,
    kind,
    equation,
    k,
    x,
    y,
    z,
    w,
    x2,
    y2,
    notes,
  }
}
