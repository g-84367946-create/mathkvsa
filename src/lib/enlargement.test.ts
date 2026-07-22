import { describe, expect, it } from 'vitest'
import {
  areaScaleFactor,
  checkAreaWorking,
  checkPointWorking,
  enlargePoint,
  imageAreaFromObject,
  scaleFactorFromAreas,
  scaleFactorFromPoints,
  summarizeChecks,
} from './enlargement'
import { parseWorkingText } from './parseWorking'

describe('enlargement math', () => {
  it('computes area scale factor as k squared', () => {
    expect(areaScaleFactor(3)).toBe(9)
    expect(imageAreaFromObject(12, 3)).toBe(108)
    expect(scaleFactorFromAreas(20, 180)).toBe(3)
  })

  it('enlarges points from a centre', () => {
    expect(enlargePoint({ x: 3, y: 4 }, { x: 1, y: 2 }, 3)).toEqual({ x: 7, y: 8 })
    expect(scaleFactorFromPoints({ x: 2, y: 3 }, { x: 4, y: 6 }, { x: 0, y: 0 })).toBe(2)
  })

  it('flags common area mistake of using k instead of k^2', () => {
    const checks = checkAreaWorking({
      objectArea: 12,
      imageArea: 108,
      studentScaleFactor: 3,
      studentAreaScaleFactor: 3,
      studentObjectArea: 12,
      studentImageArea: 36,
    })
    const areaScale = checks.find((c) => c.id === 'area-scale')
    expect(areaScale?.status).toBe('salah')
    expect(areaScale?.tip).toMatch(/k²/)
  })

  it('accepts correct area working', () => {
    const checks = checkAreaWorking({
      objectArea: 12,
      imageArea: 108,
      studentScaleFactor: 3,
      studentAreaScaleFactor: 9,
      studentObjectArea: 12,
      studentImageArea: 108,
    })
    const summary = summarizeChecks(checks)
    expect(summary.score).toBe(summary.total)
    expect(summary.verdict).toBe('Jalan kerja nampak betul')
  })

  it('checks image coordinates', () => {
    const checks = checkPointWorking({
      object: { x: 3, y: 4 },
      image: { x: 7, y: 8 },
      center: { x: 1, y: 2 },
      studentScaleFactor: 3,
      studentImage: { x: 9, y: 12 },
    })
    const image = checks.find((c) => c.id === 'image-point')
    expect(image?.status).toBe('salah')
    expect(image?.expected).toBe('(7, 8)')
  })
})

describe('parseWorkingText', () => {
  it('parses Malay student working', () => {
    const parsed = parseWorkingText(`
      Luas objek = 20
      Luas imej = 180
      k^2 = 9
      k = 3
    `)
    expect(parsed.objectArea).toBe(20)
    expect(parsed.imageArea).toBe(180)
    expect(parsed.areaScaleFactor).toBe(9)
    expect(parsed.scaleFactor).toBe(3)
  })
})
