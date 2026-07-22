export type CheckStatus = 'betul' | 'salah' | 'separa' | 'tiada'

export type CheckItem = {
  id: string
  label: string
  status: CheckStatus
  expected?: string
  found?: string
  tip?: string
}

export type VariationKind = 'langsung' | 'songsang' | 'bergabung'

export type DirectInput = {
  x: number
  y: number
  /** Nilai y yang diminta pada x baharu (opsyenal). */
  x2?: number
  y2Expected?: number
  studentK?: number
  studentEquation?: string
  studentY2?: number
}

export type InverseInput = {
  x: number
  y: number
  x2?: number
  y2Expected?: number
  studentK?: number
  studentEquation?: string
  studentY2?: number
}

export type JointInput = {
  /** y ∝ x * z / w  (w boleh 1 jika tiada pembahagi). */
  x: number
  z: number
  y: number
  w?: number
  x2?: number
  z2?: number
  w2?: number
  y2Expected?: number
  studentK?: number
  studentEquation?: string
  studentY2?: number
}

export function nearlyEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol + Math.abs(b) * 1e-9
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const rounded = Math.round(n * 10000) / 10000
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

/** Ubahan langsung: y ∝ x ⇒ k = y / x */
export function directConstant(x: number, y: number): number | null {
  if (x === 0) return null
  return y / x
}

export function directY(k: number, x: number): number {
  return k * x
}

/** Ubahan songsang: y ∝ 1/x ⇒ k = x * y */
export function inverseConstant(x: number, y: number): number | null {
  return x * y
}

export function inverseY(k: number, x: number): number | null {
  if (x === 0) return null
  return k / x
}

/** Ubahan bergabung: y ∝ xz/w ⇒ k = y * w / (x * z) */
export function jointConstant(x: number, z: number, y: number, w = 1): number | null {
  if (x === 0 || z === 0) return null
  return (y * w) / (x * z)
}

export function jointY(k: number, x: number, z: number, w = 1): number | null {
  if (w === 0) return null
  return (k * x * z) / w
}

function normalizeEquation(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/∝/g, 'propto')
}

export function matchesDirectEquation(eq: string): boolean {
  const n = normalizeEquation(eq)
  return (
    /^y=k[*]?x$/.test(n) ||
    /^y=kx$/.test(n) ||
    /^ypropto x$/.test(n) ||
    /^y∝x$/.test(normalizeEquation(eq).replace('propto', '∝'))
  )
}

export function matchesInverseEquation(eq: string): boolean {
  const n = normalizeEquation(eq)
  return (
    /^y=k\/x$/.test(n) ||
    /^y=k\*1\/x$/.test(n) ||
    /^ypropto1\/x$/.test(n) ||
    /^xy=k$/.test(n)
  )
}

export function matchesJointEquation(eq: string, hasW: boolean): boolean {
  const n = normalizeEquation(eq)
  if (hasW) {
    return (
      /^y=k[*]?x[*]?z\/w$/.test(n) ||
      /^y=kx z\/w$/.test(n.replace(/\s/g, '')) ||
      /^y=kxz\/w$/.test(n) ||
      /^yproptoxz\/w$/.test(n) ||
      /^yw=kxz$/.test(n)
    )
  }
  return (
    /^y=k[*]?x[*]?z$/.test(n) ||
    /^y=kxz$/.test(n) ||
    /^yproptoxz$/.test(n) ||
    /^y=k[*]?x[*]?z$/.test(n)
  )
}

export function checkDirectWorking(input: DirectInput): CheckItem[] {
  const { x, y, x2, y2Expected, studentK, studentEquation, studentY2 } = input
  const expectedK = directConstant(x, y)
  const items: CheckItem[] = []

  if (studentEquation != null && studentEquation.trim() !== '') {
    const ok = matchesDirectEquation(studentEquation)
    const looksInverse = matchesInverseEquation(studentEquation)
    items.push({
      id: 'eq-langsung',
      label: 'Bentuk persamaan ubahan langsung',
      status: ok ? 'betul' : 'salah',
      expected: 'y = kx  atau  y ∝ x',
      found: studentEquation.trim(),
      tip: ok
        ? undefined
        : looksInverse
          ? 'Ini nampak seperti ubahan songsang. Untuk langsung guna y = kx.'
          : 'Tulis y = kx (atau y ∝ x) untuk ubahan langsung.',
    })
  }

  if (studentK != null && expectedK != null) {
    const usedInverse = nearlyEqual(studentK, x * y)
    const ok = nearlyEqual(studentK, expectedK)
    items.push({
      id: 'k-langsung',
      label: 'Pemalar ubahan, k',
      status: ok ? 'betul' : 'salah',
      expected: formatNumber(expectedK),
      found: formatNumber(studentK),
      tip: ok
        ? undefined
        : usedInverse
          ? 'Kesilapan biasa: k = xy ialah untuk songsang. Untuk langsung, k = y ÷ x.'
          : 'Untuk ubahan langsung, k = y / x.',
    })
  }

  if (studentY2 != null && x2 != null && expectedK != null) {
    const expected = y2Expected ?? directY(expectedK, x2)
    const ok = nearlyEqual(studentY2, expected)
    items.push({
      id: 'y2-langsung',
      label: 'Nilai baharu y',
      status: ok ? 'betul' : 'salah',
      expected: formatNumber(expected),
      found: formatNumber(studentY2),
      tip: ok ? undefined : 'Guna y = kx dengan nilai x baharu selepas k dijumpai.',
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'empty-langsung',
      label: 'Tiada langkah dijumpai untuk disemak',
      status: 'tiada',
      tip: 'Masukkan persamaan, nilai k, atau y baharu daripada jalan kerja.',
    })
  }

  return items
}

export function checkInverseWorking(input: InverseInput): CheckItem[] {
  const { x, y, x2, y2Expected, studentK, studentEquation, studentY2 } = input
  const expectedK = inverseConstant(x, y)
  const items: CheckItem[] = []

  if (studentEquation != null && studentEquation.trim() !== '') {
    const ok = matchesInverseEquation(studentEquation)
    const looksDirect = matchesDirectEquation(studentEquation)
    items.push({
      id: 'eq-songsang',
      label: 'Bentuk persamaan ubahan songsang',
      status: ok ? 'betul' : 'salah',
      expected: 'y = k/x  atau  xy = k',
      found: studentEquation.trim(),
      tip: ok
        ? undefined
        : looksDirect
          ? 'Ini nampak seperti ubahan langsung. Untuk songsang guna y = k/x.'
          : 'Tulis y = k/x (atau xy = k) untuk ubahan songsang.',
    })
  }

  if (studentK != null && expectedK != null) {
    const usedDirect = x !== 0 && nearlyEqual(studentK, y / x)
    const ok = nearlyEqual(studentK, expectedK)
    items.push({
      id: 'k-songsang',
      label: 'Pemalar ubahan, k',
      status: ok ? 'betul' : 'salah',
      expected: formatNumber(expectedK),
      found: formatNumber(studentK),
      tip: ok
        ? undefined
        : usedDirect
          ? 'Kesilapan biasa: k = y/x ialah untuk langsung. Untuk songsang, k = x × y.'
          : 'Untuk ubahan songsang, k = x × y.',
    })
  }

  if (studentY2 != null && x2 != null && expectedK != null) {
    const expected = y2Expected ?? inverseY(expectedK, x2)
    if (expected != null) {
      const ok = nearlyEqual(studentY2, expected)
      items.push({
        id: 'y2-songsang',
        label: 'Nilai baharu y',
        status: ok ? 'betul' : 'salah',
        expected: formatNumber(expected),
        found: formatNumber(studentY2),
        tip: ok ? undefined : 'Guna y = k/x dengan nilai x baharu selepas k dijumpai.',
      })
    }
  }

  if (items.length === 0) {
    items.push({
      id: 'empty-songsang',
      label: 'Tiada langkah dijumpai untuk disemak',
      status: 'tiada',
      tip: 'Masukkan persamaan, nilai k, atau y baharu daripada jalan kerja.',
    })
  }

  return items
}

export function checkJointWorking(input: JointInput): CheckItem[] {
  const {
    x,
    z,
    y,
    w = 1,
    x2,
    z2,
    w2,
    y2Expected,
    studentK,
    studentEquation,
    studentY2,
  } = input
  const hasW = w !== 1 || (w2 != null && w2 !== 1)
  const expectedK = jointConstant(x, z, y, w)
  const items: CheckItem[] = []

  if (studentEquation != null && studentEquation.trim() !== '') {
    const ok = matchesJointEquation(studentEquation, hasW)
    items.push({
      id: 'eq-bergabung',
      label: 'Bentuk persamaan ubahan bergabung',
      status: ok ? 'betul' : 'salah',
      expected: hasW ? 'y = kxz / w' : 'y = kxz',
      found: studentEquation.trim(),
      tip: ok
        ? undefined
        : hasW
          ? 'Untuk bergabung dengan songsang terhadap w, tulis y = kxz / w.'
          : 'Untuk bergabung y ∝ xz, tulis y = kxz.',
    })
  }

  if (studentK != null && expectedK != null) {
    const forgotW = hasW && nearlyEqual(studentK, y / (x * z))
    const ok = nearlyEqual(studentK, expectedK)
    items.push({
      id: 'k-bergabung',
      label: 'Pemalar ubahan, k',
      status: ok ? 'betul' : 'salah',
      expected: formatNumber(expectedK),
      found: formatNumber(studentK),
      tip: ok
        ? undefined
        : forgotW
          ? 'Anda nampaknya terlupa pemboleh ubah w. Guna k = yw / (xz).'
          : hasW
            ? 'Untuk y = kxz / w, k = yw / (xz).'
            : 'Untuk y = kxz, k = y / (xz).',
    })
  }

  if (studentY2 != null && x2 != null && z2 != null && expectedK != null) {
    const ww = w2 ?? w
    const expected = y2Expected ?? jointY(expectedK, x2, z2, ww)
    if (expected != null) {
      const ok = nearlyEqual(studentY2, expected)
      items.push({
        id: 'y2-bergabung',
        label: 'Nilai baharu y',
        status: ok ? 'betul' : 'salah',
        expected: formatNumber(expected),
        found: formatNumber(studentY2),
        tip: ok
          ? undefined
          : 'Ganti semua nilai baharu ke dalam persamaan selepas k dijumpai.',
      })
    }
  }

  if (items.length === 0) {
    items.push({
      id: 'empty-bergabung',
      label: 'Tiada langkah dijumpai untuk disemak',
      status: 'tiada',
      tip: 'Masukkan persamaan, nilai k, atau y baharu daripada jalan kerja.',
    })
  }

  return items
}

export function summarizeChecks(items: CheckItem[]): {
  score: number
  total: number
  verdict: string
} {
  const countable = items.filter(
    (i) => i.status === 'betul' || i.status === 'salah' || i.status === 'separa',
  )
  const score = countable.reduce((acc, item) => {
    if (item.status === 'betul') return acc + 1
    if (item.status === 'separa') return acc + 0.5
    return acc
  }, 0)
  const total = countable.length
  let verdict = 'Tiada semakan'
  if (total > 0) {
    if (score === total) verdict = 'Jalan kerja nampak betul'
    else if (score === 0) verdict = 'Perlu semakan semula'
    else verdict = 'Ada langkah betul, ada yang perlu dibaiki'
  }
  return { score, total, verdict }
}
