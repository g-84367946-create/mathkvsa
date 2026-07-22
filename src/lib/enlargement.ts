export type Point = { x: number; y: number }

export type CheckStatus = 'betul' | 'salah' | 'separa' | 'tiada'

export type CheckItem = {
  id: string
  label: string
  status: CheckStatus
  expected?: string
  found?: string
  tip?: string
}

export type AreaCheckInput = {
  objectArea: number
  imageArea: number
  studentScaleFactor?: number
  studentAreaScaleFactor?: number
  studentImageArea?: number
  studentObjectArea?: number
}

export type PointCheckInput = {
  object: Point
  image: Point
  center: Point
  studentScaleFactor?: number
  studentImage?: Point
}

export function nearlyEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol + Math.abs(b) * 1e-9
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const rounded = Math.round(n * 1000) / 1000
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

/** Faktor skala linear k dari pusat pembesaran. */
export function scaleFactorFromPoints(
  object: Point,
  image: Point,
  center: Point,
): number | null {
  const ox = object.x - center.x
  const oy = object.y - center.y
  const ix = image.x - center.x
  const iy = image.y - center.y

  const objectDist = Math.hypot(ox, oy)
  if (objectDist === 0) return null

  // Prefer signed scale using the more significant component.
  if (Math.abs(ox) >= Math.abs(oy) && ox !== 0) {
    return ix / ox
  }
  if (oy !== 0) {
    return iy / oy
  }
  return null
}

export function enlargePoint(object: Point, center: Point, k: number): Point {
  return {
    x: center.x + k * (object.x - center.x),
    y: center.y + k * (object.y - center.y),
  }
}

export function areaScaleFactor(k: number): number {
  return k * k
}

export function imageAreaFromObject(objectArea: number, k: number): number {
  return objectArea * k * k
}

export function scaleFactorFromAreas(objectArea: number, imageArea: number): number | null {
  if (objectArea <= 0 || imageArea < 0) return null
  return Math.sqrt(imageArea / objectArea)
}

export function checkAreaWorking(input: AreaCheckInput): CheckItem[] {
  const {
    objectArea,
    imageArea,
    studentScaleFactor,
    studentAreaScaleFactor,
    studentImageArea,
    studentObjectArea,
  } = input

  const expectedK = scaleFactorFromAreas(objectArea, imageArea)
  const expectedK2 = expectedK == null ? null : areaScaleFactor(expectedK)
  const items: CheckItem[] = []

  if (studentObjectArea != null) {
    items.push({
      id: 'object-area',
      label: 'Luas objek asal',
      status: nearlyEqual(studentObjectArea, objectArea) ? 'betul' : 'salah',
      expected: formatNumber(objectArea),
      found: formatNumber(studentObjectArea),
      tip: nearlyEqual(studentObjectArea, objectArea)
        ? undefined
        : 'Pastikan luas objek dibaca dengan betul daripada soalan.',
    })
  }

  if (studentImageArea != null) {
    items.push({
      id: 'image-area',
      label: 'Luas imej',
      status: nearlyEqual(studentImageArea, imageArea) ? 'betul' : 'salah',
      expected: formatNumber(imageArea),
      found: formatNumber(studentImageArea),
    })
  }

  if (studentScaleFactor != null && expectedK != null) {
    const usedLinearAsArea = nearlyEqual(studentScaleFactor, expectedK2 ?? NaN)
    const correct = nearlyEqual(studentScaleFactor, expectedK)
    items.push({
      id: 'scale-factor',
      label: 'Faktor skala linear, k',
      status: correct ? 'betul' : 'salah',
      expected: formatNumber(expectedK),
      found: formatNumber(studentScaleFactor),
      tip: correct
        ? undefined
        : usedLinearAsArea
          ? 'Anda nampaknya menggunakan faktor skala luas sebagai k. Ingat: k = √(luas imej ÷ luas objek).'
          : 'Gunakan k = √(luas imej ÷ luas objek).',
    })
  }

  if (studentAreaScaleFactor != null && expectedK2 != null) {
    const usedLinear = expectedK != null && nearlyEqual(studentAreaScaleFactor, expectedK)
    const correct = nearlyEqual(studentAreaScaleFactor, expectedK2)
    items.push({
      id: 'area-scale',
      label: 'Faktor skala luas, k²',
      status: correct ? 'betul' : 'salah',
      expected: formatNumber(expectedK2),
      found: formatNumber(studentAreaScaleFactor),
      tip: correct
        ? undefined
        : usedLinear
          ? 'Kesilapan biasa: faktor skala luas ialah k², bukan k. Contoh: jika k = 3, luas × 9.'
          : 'Faktor skala luas = k² = luas imej ÷ luas objek.',
    })
  }

  // If student gave image area as derived from k, verify that relationship too.
  if (
    studentScaleFactor != null &&
    studentImageArea != null &&
    studentObjectArea != null
  ) {
    const derived = imageAreaFromObject(studentObjectArea, studentScaleFactor)
    const relationOk = nearlyEqual(derived, studentImageArea)
    items.push({
      id: 'area-relation',
      label: 'Hubungan luas: luas imej = k² × luas objek',
      status: relationOk ? 'betul' : 'salah',
      expected: `${formatNumber(studentObjectArea)} × (${formatNumber(studentScaleFactor)})² = ${formatNumber(derived)}`,
      found: formatNumber(studentImageArea),
      tip: relationOk
        ? undefined
        : 'Semak: kuadratkan faktor skala dahulu, kemudian darab dengan luas objek.',
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'empty',
      label: 'Tiada langkah dijumpai untuk disemak',
      status: 'tiada',
      tip: 'Masukkan nilai k, k², atau luas daripada jalan kerja pelajar.',
    })
  }

  return items
}

export function checkPointWorking(input: PointCheckInput): CheckItem[] {
  const { object, image, center, studentScaleFactor, studentImage } = input
  const expectedK = scaleFactorFromPoints(object, image, center)
  const expectedImage = expectedK == null ? null : enlargePoint(object, center, expectedK)
  const items: CheckItem[] = []

  if (studentScaleFactor != null && expectedK != null) {
    items.push({
      id: 'point-k',
      label: 'Faktor skala daripada titik',
      status: nearlyEqual(studentScaleFactor, expectedK) ? 'betul' : 'salah',
      expected: formatNumber(expectedK),
      found: formatNumber(studentScaleFactor),
      tip: nearlyEqual(studentScaleFactor, expectedK)
        ? undefined
        : 'k = jarak pusat→imej ÷ jarak pusat→objek (bertanda).',
    })
  }

  if (studentImage != null && expectedImage != null) {
    const ok =
      nearlyEqual(studentImage.x, expectedImage.x) &&
      nearlyEqual(studentImage.y, expectedImage.y)
    items.push({
      id: 'image-point',
      label: 'Koordinat imej',
      status: ok ? 'betul' : 'salah',
      expected: `(${formatNumber(expectedImage.x)}, ${formatNumber(expectedImage.y)})`,
      found: `(${formatNumber(studentImage.x)}, ${formatNumber(studentImage.y)})`,
      tip: ok
        ? undefined
        : 'Gunakan I = C + k(O − C). Pastikan pusat pembesaran betul.',
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'empty-point',
      label: 'Tiada koordinat/skala dijumpai untuk disemak',
      status: 'tiada',
      tip: 'Isi faktor skala atau koordinat imej pelajar.',
    })
  }

  return items
}

export function summarizeChecks(items: CheckItem[]): {
  score: number
  total: number
  verdict: string
} {
  const countable = items.filter((i) => i.status === 'betul' || i.status === 'salah' || i.status === 'separa')
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
