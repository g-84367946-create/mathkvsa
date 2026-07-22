export type PracticeExample = {
  id: string
  title: string
  topic: 'luas' | 'koordinat'
  prompt: string
  objectArea?: number
  imageArea?: number
  object?: { x: number; y: number }
  image?: { x: number; y: number }
  center?: { x: number; y: number }
  sampleWorking: string
  commonMistake: string
}

export const PRACTICE_EXAMPLES: PracticeExample[] = [
  {
    id: 'luas-1',
    title: 'Luas selepas pembesaran k = 3',
    topic: 'luas',
    prompt:
      'Suatu segitiga mempunyai luas 12 cm². Ia dibesarkan dengan faktor skala 3. Cari luas imej.',
    objectArea: 12,
    imageArea: 108,
    sampleWorking: `Luas objek = 12
k = 3
k^2 = 9
Luas imej = 9 × 12 = 108`,
    commonMistake: `Luas objek = 12
k = 3
Luas imej = 3 × 12 = 36`,
  },
  {
    id: 'luas-2',
    title: 'Cari k daripada luas',
    topic: 'luas',
    prompt:
      'Luas objek ialah 20 cm² dan luas imej ialah 180 cm². Cari faktor skala pembesaran.',
    objectArea: 20,
    imageArea: 180,
    sampleWorking: `Luas objek = 20
Luas imej = 180
k^2 = 180 / 20 = 9
k = 3`,
    commonMistake: `Luas objek = 20
Luas imej = 180
k = 180 / 20 = 9`,
  },
  {
    id: 'koordinat-1',
    title: 'Pembesaran dari pusat (0, 0)',
    topic: 'koordinat',
    prompt: 'Titik A(2, 3) dibesarkan dengan faktor 2 dari pusat (0, 0). Cari imej A′.',
    object: { x: 2, y: 3 },
    image: { x: 4, y: 6 },
    center: { x: 0, y: 0 },
    sampleWorking: `k = 2
Imej A' = (2×2, 2×3) = (4, 6)`,
    commonMistake: `k = 2
Imej A' = (2+2, 3+2) = (4, 5)`,
  },
  {
    id: 'koordinat-2',
    title: 'Pembesaran dari pusat (1, 2)',
    topic: 'koordinat',
    prompt: 'Titik P(3, 4) dibesarkan dengan faktor 3 dari pusat C(1, 2). Cari P′.',
    object: { x: 3, y: 4 },
    image: { x: 7, y: 8 },
    center: { x: 1, y: 2 },
    sampleWorking: `k = 3
P' = (1, 2) + 3((3, 4) − (1, 2))
   = (1, 2) + 3(2, 2)
   = (1, 2) + (6, 6)
   = (7, 8)`,
    commonMistake: `k = 3
P' = 3(3, 4) = (9, 12)`,
  },
]
