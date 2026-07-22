import type { PaperProblem, VariationKind } from './variation'

export type PracticeExample = {
  id: string
  title: string
  topic: VariationKind
  prompt: string
  problem: PaperProblem
  sampleWorking: string
  commonMistake: string
}

/** Contoh sejajar format kertas KVSA (Sprint / jalan kerja tangan). */
export const PRACTICE_EXAMPLES: PracticeExample[] = [
  {
    id: 'sprint-langsung-baju',
    title: 'Ubahan langsung — baju kurung & masa',
    topic: 'langsung',
    prompt:
      'Seorang tukang jahit dapat menyiapkan 7 pasang baju kurung dalam masa 2 hari. Bilangan baju kurung berubah secara langsung dengan masa. Hitung masa untuk 112 pasang baju kurung.',
    problem: {
      kind: 'langsung',
      dependent: 'y',
      independent: 'x',
      given: { y: 7, x: 2 },
      ask: { y: 112 },
      findVar: 'x',
      expectedAnswer: 32,
      expectedProportion: 'y ∝ x',
    },
    sampleWorking: `y ∝ x
y = kx
7 = k(2)
k = 3.5
y = 3.5x
112 = 3.5x
x = 32`,
    commonMistake: `y ∝ x
y = kx
7 = k(2)
k = 3.5
y = 3.5x
x = 3.5(112)
x = 392`,
  },
  {
    id: 'sprint-songsang-sqrt',
    title: 'Ubahan songsang — G ∝ 1/√h',
    topic: 'songsang',
    prompt:
      'Jadual: G = 6,4 dan h = 16,36. Diberi G berubah secara songsang dengan punca kuasa dua h. Ungkapkan hubungan antara G dan h.',
    problem: {
      kind: 'songsang',
      dependent: 'G',
      independent: 'h',
      inversePower: 0.5,
      given: { G: 6, h: 16 },
      expectedProportion: 'G ∝ 1/√h',
    },
    sampleWorking: `G ∝ 1/√h
G = k/√h
6 = k/√16
k = 24
G = 24/√h`,
    commonMistake: `G ∝ 1/h
G = k/h
6 = k/16
k = 96
G = 96/h`,
  },
  {
    id: 'sprint-bergabung-efg',
    title: 'Ubahan bergabung — E ∝ f/g',
    topic: 'bergabung',
    prompt:
      'Diberi E ∝ f/g. Jika E = 4 apabila f = 8 dan g = 6, hitung E apabila f = 5 dan g = 3.',
    problem: {
      kind: 'bergabung',
      dependent: 'E',
      independent: 'f',
      jointDenominator: 'g',
      given: { E: 4, f: 8, g: 6 },
      ask: { f: 5, g: 3 },
      findVar: 'E',
      expectedAnswer: 5,
      expectedProportion: 'E ∝ f/g',
    },
    sampleWorking: `E ∝ f/g
E = kf/g
4 = k(8)/6
k = 3
E = 3f/g
E = 3(5)/3
E = 5`,
    commonMistake: `E ∝ f/g
E = kf/g
4 = k(8)/6
k = 3
E = 3f/g
E = 3(5)/6
E = 2.5`,
  },
]
