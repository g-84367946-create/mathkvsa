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

/** Kuasa pada pemboleh ubah songsang: 1 = 1/x, 0.5 = 1/√x, 2 = 1/x² */
export type InversePower = 1 | 0.5 | 2

export type PaperProblem = {
  kind: VariationKind
  /** Label paparan, contoh: y, G, E */
  dependent: string
  /** Pemboleh ubah utama (langsung/songsang) atau pembilang pertama (bergabung) */
  independent: string
  /** Untuk bergabung: pembilang kedua (contoh z). Kosong jika tiada. */
  jointNumerator2?: string
  /** Untuk bergabung: penyebut (contoh g / w). */
  jointDenominator?: string
  /** Untuk songsang: kuasa pada independent. */
  inversePower?: InversePower
  /** Pasangan nilai diberi untuk cari k */
  given: Record<string, number>
  /** Nilai baharu untuk ganti (jika soalan minta nilai) */
  ask?: Record<string, number>
  /** Pemboleh ubah yang perlu dicari (jika ada) */
  findVar?: string
  /** Jawapan akhir dijangka */
  expectedAnswer?: number
  /** Bentuk ∝ dijangka, contoh: "y ∝ x", "G ∝ 1/√h", "E ∝ f/g" */
  expectedProportion: string
}

export type StudentPaperWorking = {
  raw: string
  hasProportion?: boolean
  proportionText?: string
  hasEquationWithK?: boolean
  equationWithK?: string
  k?: number
  finalEquation?: string
  answer?: number
  substitutions: string[]
}

export function nearlyEqual(a: number, b: number, tol = 1e-4): boolean {
  return Math.abs(a - b) <= tol + Math.abs(b) * 1e-9
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const rounded = Math.round(n * 10000) / 10000
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

export function normalizeMath(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/√\s*/g, 'sqrt')
    .replace(/punca\s*kuasa\s*dua/g, 'sqrt')
    .replace(/propto|berkadar|berubah\s*secara/g, 'propto')
    .replace(/∝/g, 'propto')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '')
}

function powerLabel(power: InversePower, variable: string): string {
  if (power === 0.5) return `√${variable}`
  if (power === 2) return `${variable}²`
  return variable
}

export function expectedProportionText(problem: PaperProblem): string {
  return problem.expectedProportion
}

export function computeK(problem: PaperProblem): number | null {
  const dep = problem.given[problem.dependent]
  if (dep == null) return null

  if (problem.kind === 'langsung') {
    const x = problem.given[problem.independent]
    if (x == null || x === 0) return null
    return dep / x
  }

  if (problem.kind === 'songsang') {
    const x = problem.given[problem.independent]
    if (x == null) return null
    const power = problem.inversePower ?? 1
    const base = power === 0.5 ? Math.sqrt(x) : power === 2 ? x * x : x
    if (base === 0) return null
    return dep * base
  }

  // bergabung: dep ∝ n1 * n2 / d  (n2 dan d opsyenal)
  const n1 = problem.given[problem.independent]
  if (n1 == null || n1 === 0) return null
  const n2Name = problem.jointNumerator2
  const dName = problem.jointDenominator
  const n2 = n2Name ? problem.given[n2Name] : 1
  const d = dName ? problem.given[dName] : 1
  if (n2 == null || d == null || n2 === 0) return null
  return (dep * d) / (n1 * n2)
}

export function evaluateAsked(problem: PaperProblem, k: number): number | null {
  if (!problem.ask && problem.findVar == null) return null

  if (problem.kind === 'langsung') {
    const find = problem.findVar ?? problem.dependent
    if (find === problem.dependent) {
      const x = problem.ask?.[problem.independent]
      if (x == null) return null
      return k * x
    }
    // cari independent: y = kx ⇒ x = y/k
    const yVal = problem.ask?.[problem.dependent]
    if (yVal == null || k === 0) return null
    return yVal / k
  }

  if (problem.kind === 'songsang') {
    const x = problem.ask?.[problem.independent]
    if (x == null) return null
    const power = problem.inversePower ?? 1
    const base = power === 0.5 ? Math.sqrt(x) : power === 2 ? x * x : x
    if (base === 0) return null
    return k / base
  }

  // bergabung
  const n1 = problem.ask?.[problem.independent]
  if (n1 == null) return null
  const n2Name = problem.jointNumerator2
  const dName = problem.jointDenominator
  const n2 = n2Name ? problem.ask?.[n2Name] ?? 1 : 1
  const d = dName ? problem.ask?.[dName] ?? 1 : 1
  if (d === 0) return null
  return (k * n1 * n2) / d
}

function proportionLooksCorrect(student: string, problem: PaperProblem): boolean {
  const s = normalizeMath(student)
  const dep = problem.dependent.toLowerCase()
  const ind = problem.independent.toLowerCase()

  if (problem.kind === 'langsung') {
    return (
      s.includes(`${dep}propto${ind}`) ||
      s.includes(`${dep}=k${ind}`) ||
      s.includes(`${dep}=k*${ind}`)
    )
  }

  if (problem.kind === 'songsang') {
    const power = problem.inversePower ?? 1
    if (power === 0.5) {
      return (
        s.includes(`${dep}propto1/sqrt${ind}`) ||
        s.includes(`${dep}=k/sqrt${ind}`) ||
        s.includes(`${dep}propto1/√${ind}`)
      )
    }
    if (power === 2) {
      return (
        s.includes(`${dep}propto1/${ind}^2`) ||
        s.includes(`${dep}propto1/${ind}2`) ||
        s.includes(`${dep}=k/${ind}^2`) ||
        s.includes(`${dep}=k/${ind}²`)
      )
    }
    return (
      s.includes(`${dep}propto1/${ind}`) ||
      s.includes(`${dep}=k/${ind}`) ||
      s.includes(`${ind}${dep}=k`) ||
      s.includes(`${dep}${ind}=k`)
    )
  }

  // bergabung
  const n2 = problem.jointNumerator2?.toLowerCase()
  const d = problem.jointDenominator?.toLowerCase()
  if (n2 && d) {
    return (
      s.includes(`${dep}propto${ind}${n2}/${d}`) ||
      s.includes(`${dep}=k${ind}${n2}/${d}`) ||
      s.includes(`${dep}propto${ind}*${n2}/${d}`)
    )
  }
  if (d && !n2) {
    // E ∝ f/g
    return (
      s.includes(`${dep}propto${ind}/${d}`) ||
      s.includes(`${dep}=k${ind}/${d}`) ||
      s.includes(`${dep}=(k${ind})/${d}`) ||
      s.includes(`${dep}=k*${ind}/${d}`)
    )
  }
  if (n2 && !d) {
    return (
      s.includes(`${dep}propto${ind}${n2}`) ||
      s.includes(`${dep}=k${ind}${n2}`)
    )
  }
  return false
}

function equationWithKLooksCorrect(student: string, problem: PaperProblem): boolean {
  const s = normalizeMath(student)
  const dep = problem.dependent.toLowerCase()
  const ind = problem.independent.toLowerCase()

  if (problem.kind === 'langsung') {
    return s.includes(`${dep}=k${ind}`) || s.includes(`${dep}=k*${ind}`)
  }
  if (problem.kind === 'songsang') {
    const power = problem.inversePower ?? 1
    if (power === 0.5) return s.includes(`${dep}=k/sqrt${ind}`)
    if (power === 2) return s.includes(`${dep}=k/${ind}^2`) || s.includes(`${dep}=k/${ind}²`)
    return s.includes(`${dep}=k/${ind}`)
  }
  const n2 = problem.jointNumerator2?.toLowerCase()
  const d = problem.jointDenominator?.toLowerCase()
  if (d && !n2) {
    return (
      s.includes(`${dep}=k${ind}/${d}`) ||
      s.includes(`${dep}=(k${ind})/${d}`) ||
      s.includes(`${dep}=kf/${d}`.replace('f', ind))
    )
  }
  if (n2 && d) return s.includes(`${dep}=k${ind}${n2}/${d}`)
  if (n2) return s.includes(`${dep}=k${ind}${n2}`)
  return false
}

/**
 * Semak jalan kerja bergaya kertas KVSA:
 * 1) kenyataan ∝  2) persamaan dengan k  3) nilai k  4) jawapan akhir
 */
export function checkPaperWorking(
  problem: PaperProblem,
  student: StudentPaperWorking,
): CheckItem[] {
  const items: CheckItem[] = []
  const expectedK = computeK(problem)
  const expectedAns =
    problem.expectedAnswer ??
    (expectedK != null ? evaluateAsked(problem, expectedK) : null)

  // 1. Proportion
  if (student.proportionText || student.hasProportion) {
    const text = student.proportionText ?? ''
    const ok = text ? proportionLooksCorrect(text, problem) : Boolean(student.hasProportion)
    items.push({
      id: 'step-proportion',
      label: 'Kenyataan ubahan (∝)',
      status: ok ? 'betul' : 'salah',
      expected: problem.expectedProportion,
      found: text || '(ada kenyataan)',
      tip: ok
        ? undefined
        : `Tulis dulu ${problem.expectedProportion} sebelum bentukkan persamaan.`,
    })
  } else {
    items.push({
      id: 'step-proportion',
      label: 'Kenyataan ubahan (∝)',
      status: 'salah',
      expected: problem.expectedProportion,
      found: 'tiada',
      tip: 'Pada kertas, mula dengan kenyataan ∝ seperti dalam contoh bilik darjah.',
    })
  }

  // 2. Equation with k
  if (student.equationWithK || student.hasEquationWithK) {
    const text = student.equationWithK ?? ''
    const ok = text
      ? equationWithKLooksCorrect(text, problem)
      : Boolean(student.hasEquationWithK)
    items.push({
      id: 'step-equation',
      label: 'Persamaan dengan pemalar k',
      status: ok ? 'betul' : 'salah',
      expected:
        problem.kind === 'langsung'
          ? `${problem.dependent} = k${problem.independent}`
          : problem.kind === 'songsang'
            ? `${problem.dependent} = k / ${powerLabel(problem.inversePower ?? 1, problem.independent)}`
            : problem.jointDenominator && !problem.jointNumerator2
              ? `${problem.dependent} = k${problem.independent}/${problem.jointDenominator}`
              : `${problem.dependent} = k...`,
      found: text || '(ada persamaan)',
      tip: ok ? undefined : 'Tulis persamaan yang mengandungi k selepas kenyataan ∝.',
    })
  } else {
    items.push({
      id: 'step-equation',
      label: 'Persamaan dengan pemalar k',
      status: 'salah',
      expected: 'persamaan dengan k',
      found: 'tiada',
      tip: 'Contoh: y = kx  atau  G = k/√h  atau  E = kf/g.',
    })
  }

  // 3. Constant k
  if (student.k != null && expectedK != null) {
    const ok = nearlyEqual(student.k, expectedK)
    items.push({
      id: 'step-k',
      label: 'Cari pemalar k',
      status: ok ? 'betul' : 'salah',
      expected: formatNumber(expectedK),
      found: formatNumber(student.k),
      tip: ok
        ? undefined
        : 'Ganti nilai diberi ke dalam persamaan untuk dapatkan k.',
    })
  } else if (expectedK != null) {
    items.push({
      id: 'step-k',
      label: 'Cari pemalar k',
      status: 'salah',
      expected: formatNumber(expectedK),
      found: 'tiada',
      tip: 'Pastikan langkah mencari k jelas, contoh: 7 = k(2) ⇒ k = 3.5',
    })
  }

  // 4. Final answer (if problem asks for a value)
  if (expectedAns != null) {
    if (student.answer != null) {
      const ok = nearlyEqual(student.answer, expectedAns)
      items.push({
        id: 'step-answer',
        label: 'Jawapan akhir',
        status: ok ? 'betul' : 'salah',
        expected: formatNumber(expectedAns),
        found: formatNumber(student.answer),
        tip: ok
          ? undefined
          : 'Selepas dapat k, ganti nilai baharu ke dalam persamaan untuk jawapan akhir.',
      })
    } else {
      items.push({
        id: 'step-answer',
        label: 'Jawapan akhir',
        status: 'salah',
        expected: formatNumber(expectedAns),
        found: 'tiada',
        tip: 'Tandakan jawapan akhir (boleh guna # seperti dalam kelas).',
      })
    }
  } else if (student.finalEquation || student.answer == null) {
    // Relationship-only question (like express G in terms of h)
    if (student.finalEquation && expectedK != null) {
      const s = normalizeMath(student.finalEquation)
      const dep = problem.dependent.toLowerCase()
      const ind = problem.independent.toLowerCase()
      const kStr = normalizeMath(formatNumber(expectedK))
      let ok = false
      if (problem.kind === 'songsang' && (problem.inversePower ?? 1) === 0.5) {
        ok = s.includes(`${dep}=${kStr}/sqrt${ind}`) || s.includes(`${dep}=${kStr}/√${ind}`)
      } else if (problem.kind === 'langsung') {
        ok = s.includes(`${dep}=${kStr}${ind}`)
      } else if (problem.kind === 'songsang') {
        ok = s.includes(`${dep}=${kStr}/${ind}`)
      } else if (problem.jointDenominator && !problem.jointNumerator2) {
        ok =
          s.includes(`${dep}=${kStr}${problem.independent.toLowerCase()}/${problem.jointDenominator.toLowerCase()}`) ||
          s.includes(`${dep}=(${kStr}${problem.independent.toLowerCase()})/${problem.jointDenominator.toLowerCase()}`)
      }
      items.push({
        id: 'step-final-eq',
        label: 'Hubungan akhir (dengan nilai k)',
        status: ok ? 'betul' : 'salah',
        expected: `persamaan dengan k = ${formatNumber(expectedK)}`,
        found: student.finalEquation,
        tip: ok ? undefined : 'Tulis semula persamaan selepas nilai k dijumpai.',
      })
    }
  }

  if (items.length === 0) {
    items.push({
      id: 'empty',
      label: 'Tiada langkah dijumpai',
      status: 'tiada',
      tip: 'Imbas atau taip jalan kerja mengikut langkah: ∝ → persamaan k → cari k → jawapan.',
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

/** Kekalkan helper lama untuk ujian ringkas / serasi. */
export function directConstant(x: number, y: number): number | null {
  if (x === 0) return null
  return y / x
}

export function inverseConstant(x: number, y: number, power: InversePower = 1): number | null {
  const base = power === 0.5 ? Math.sqrt(x) : power === 2 ? x * x : x
  if (base === 0) return null
  return y * base
}

export function jointConstantFg(f: number, g: number, e: number): number | null {
  if (f === 0) return null
  return (e * g) / f
}
