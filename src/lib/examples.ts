import type { VariationKind } from './variation'

export type PracticeExample = {
  id: string
  title: string
  topic: VariationKind
  prompt: string
  x: number
  y: number
  z?: number
  w?: number
  x2?: number
  y2?: number
  z2?: number
  w2?: number
  sampleWorking: string
  commonMistake: string
}

export const PRACTICE_EXAMPLES: PracticeExample[] = [
  {
    id: 'langsung-1',
    title: 'Ubahan langsung — cari k dan y',
    topic: 'langsung',
    prompt: 'Diberi y berubah secara langsung dengan x. Jika x = 4 apabila y = 20, cari y bila x = 7.',
    x: 4,
    y: 20,
    x2: 7,
    y2: 35,
    sampleWorking: `y = kx
k = 20 / 4 = 5
y = 5x
bila x = 7
jadi y = 35`,
    commonMistake: `y = k/x
k = 20 × 4 = 80
y = 80 / 7
jadi y = 11.43`,
  },
  {
    id: 'songsang-1',
    title: 'Ubahan songsang — cari k dan y',
    topic: 'songsang',
    prompt: 'Diberi y berubah secara songsang dengan x. Jika x = 4 apabila y = 6, cari y bila x = 8.',
    x: 4,
    y: 6,
    x2: 8,
    y2: 3,
    sampleWorking: `y = k/x
k = 4 × 6 = 24
y = 24/x
bila x = 8
jadi y = 3`,
    commonMistake: `y = kx
k = 6 / 4 = 1.5
y = 1.5 × 8
jadi y = 12`,
  },
  {
    id: 'bergabung-1',
    title: 'Ubahan bergabung — y ∝ xz',
    topic: 'bergabung',
    prompt:
      'Diberi y berubah secara bergabung dengan x dan z. Jika x = 2, z = 3 dan y = 30, cari y bila x = 4 dan z = 5.',
    x: 2,
    y: 30,
    z: 3,
    x2: 4,
    z2: 5,
    y2: 100,
    sampleWorking: `y = kxz
k = 30 / (2 × 3) = 5
y = 5xz
bila x = 4, z = 5
jadi y = 100`,
    commonMistake: `y = kx
k = 30 / 2 = 15
jadi y = 15 × 4 = 60`,
  },
  {
    id: 'bergabung-2',
    title: 'Ubahan bergabung — y ∝ xz / w',
    topic: 'bergabung',
    prompt:
      'Diberi y ∝ xz / w. Jika x = 2, z = 3, w = 2 dan y = 12, cari y bila x = 4, z = 3, w = 2.',
    x: 2,
    y: 12,
    z: 3,
    w: 2,
    x2: 4,
    z2: 3,
    w2: 2,
    y2: 24,
    sampleWorking: `y = kxz / w
k = (12 × 2) / (2 × 3) = 4
y = 4xz / w
bila x = 4, z = 3, w = 2
jadi y = 24`,
    commonMistake: `y = kxz / w
k = 12 / (2 × 3) = 2
jadi y = 2 × 4 × 3 / 2 = 12`,
  },
]
