import type { StudentPaperWorking, VariationKind } from './variation'

export type ParsedWorking = StudentPaperWorking & {
  kind?: VariationKind
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

function cleanLine(line: string): string {
  return line
    .replace(/[↑↓→←]/g, ' ')
    .replace(/#{1,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse OCR / typed working in KVSA paper style, e.g.:
 *   y ∝ x
 *   y = kx
 *   7 = k(2)
 *   k = 3.5
 *   y = 3.5x
 *   112 = 3.5x
 *   x = 32
 */
export function parseWorkingText(rawInput: string): ParsedWorking {
  const raw = rawInput.trim()
  const lines = raw
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)

  const joined = lines.join('\n')
  const notes: string[] = []
  const substitutions: string[] = []

  let kind: VariationKind | undefined
  let proportionText: string | undefined
  let equationWithK: string | undefined
  let finalEquation: string | undefined
  let k: number | undefined
  let answer: number | undefined

  const proportionRe =
    /([A-Za-z])\s*(?:∝|propto)\s*(1\s*\/\s*√\s*[A-Za-z]|1\s*\/\s*sqrt\s*[A-Za-z]|1\s*\/\s*[A-Za-z](?:\^2|²)?|[A-Za-z]\s*\/\s*[A-Za-z]|[A-Za-z])/i
  const eqWithKRe =
    /([A-Za-z])\s*=\s*k\s*([A-Za-z])\s*\/\s*([A-Za-z])|([A-Za-z])\s*=\s*k\s*\/\s*√\s*([A-Za-z])|([A-Za-z])\s*=\s*k\s*\/\s*sqrt\s*([A-Za-z])|([A-Za-z])\s*=\s*k\s*\/\s*([A-Za-z])|([A-Za-z])\s*=\s*k\s*([A-Za-z])/i

  for (const line of lines) {
    const prop = line.match(proportionRe)
    if (prop && !proportionText) {
      proportionText = prop[0].replace(/\s+/g, ' ')
    }

    const eqK = line.match(eqWithKRe)
    if (eqK && !equationWithK) {
      equationWithK = eqK[0].replace(/\s+/g, ' ')
    }

    const kMatch = line.match(/(?:^|\s)k\s*=\s*([+-]?\d+(?:[.,]\d+)?)/i)
    if (kMatch) {
      const value = toNumber(kMatch[1] ?? '')
      if (value != null) k = value
    }

    // Substitution lines like 7 = k(2), 6 = k/√16, 4 = k(8)/6
    if (
      /=\s*k/.test(line) &&
      !/^[A-Za-z]\s*=\s*k/.test(line) &&
      !/^k\s*=/.test(line)
    ) {
      substitutions.push(line)
    }

    // Final equation with numeric k: G = 24/√h , y = 3.5x , E = 3f/g
    const finalEq = line.match(
      /^([A-Za-z])\s*=\s*([+-]?\d+(?:[.,]\d+)?)\s*(?:\/\s*√\s*[A-Za-z]|\/\s*sqrt\s*[A-Za-z]|\/\s*[A-Za-z]|[A-Za-z](?:\s*\/\s*[A-Za-z])?)/i,
    )
    if (finalEq) {
      finalEquation = line
    }

    // Answer patterns: x = 32, E = 5, jadi y = 35, or last "var = number"
    const ans = line.match(
      /(?:jadi\s*)?([A-Za-z])\s*=\s*([+-]?\d+(?:[.,]\d+)?)\s*$/i,
    )
    if (ans) {
      const varName = (ans[1] ?? '').toLowerCase()
      const value = toNumber(ans[2] ?? '')
      if (value != null && varName !== 'k') {
        // Prefer later answers; skip if this looks like intermediate y = 3.5x style without pure number end - already handled by $
        answer = value
      }
    }
  }

  // Detect kind
  const lower = joined.toLowerCase()
  if (
    /∝\s*1\s*\/|propto\s*1\s*\/|\/\s*√|\/\s*sqrt|songsang/.test(lower)
  ) {
    kind = 'songsang'
  } else if (
    /∝\s*[a-z]\s*\/\s*[a-z]|=?\s*k\s*[a-z]\s*\/\s*[a-z]|bergabung/.test(lower)
  ) {
    kind = 'bergabung'
  } else if (/∝|langsung|=\s*k\s*[a-z]/.test(lower)) {
    kind = 'langsung'
  }

  // If relationship-only (songsang express relation), answer may be absent; finalEquation matters
  if (proportionText) notes.push(`Kenyataan: ${proportionText}`)
  if (equationWithK) notes.push(`Persamaan: ${equationWithK}`)
  if (k != null) notes.push(`k = ${k}`)
  if (finalEquation) notes.push(`Persamaan akhir: ${finalEquation}`)
  if (answer != null) notes.push(`Jawapan dikesan: ${answer}`)
  if (substitutions.length) notes.push(`Gantian: ${substitutions.join(' ; ')}`)
  if (notes.length === 0) {
    notes.push('OCR tidak menemui langkah jelas. Taip semula seperti di kertas.')
  }

  return {
    raw,
    kind,
    hasProportion: Boolean(proportionText),
    proportionText,
    hasEquationWithK: Boolean(equationWithK),
    equationWithK,
    k,
    finalEquation,
    answer,
    substitutions,
    notes,
  }
}
