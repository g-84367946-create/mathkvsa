import { describe, expect, it } from 'vitest'
import {
  checkDirectWorking,
  checkInverseWorking,
  checkJointWorking,
  directConstant,
  inverseConstant,
  jointConstant,
  summarizeChecks,
} from './variation'
import { parseWorkingText } from './parseWorking'

describe('variation math', () => {
  it('computes constants for each type', () => {
    expect(directConstant(4, 20)).toBe(5)
    expect(inverseConstant(4, 6)).toBe(24)
    expect(jointConstant(2, 3, 30, 1)).toBe(5)
    expect(jointConstant(2, 3, 10, 4)).toBe(20 / 3)
  })

  it('flags inverse k used on direct variation', () => {
    const checks = checkDirectWorking({
      x: 4,
      y: 20,
      studentK: 80,
      studentEquation: 'y = k/x',
    })
    expect(checks.find((c) => c.id === 'k-langsung')?.status).toBe('salah')
    expect(checks.find((c) => c.id === 'eq-langsung')?.status).toBe('salah')
  })

  it('accepts correct inverse working', () => {
    const checks = checkInverseWorking({
      x: 4,
      y: 6,
      x2: 8,
      studentK: 24,
      studentEquation: 'y = k/x',
      studentY2: 3,
    })
    const summary = summarizeChecks(checks)
    expect(summary.score).toBe(summary.total)
  })

  it('accepts joint variation with divisor', () => {
    const checks = checkJointWorking({
      x: 2,
      z: 3,
      y: 12,
      w: 2,
      x2: 4,
      z2: 3,
      w2: 2,
      studentK: 4,
      studentEquation: 'y = kxz / w',
      studentY2: 24,
    })
    expect(summarizeChecks(checks).verdict).toBe('Jalan kerja nampak betul')
  })
})

describe('parseWorkingText', () => {
  it('parses Malay variation working', () => {
    const parsed = parseWorkingText(`
      y = kx
      k = 5
      y = 25
    `)
    expect(parsed.equation?.toLowerCase()).toContain('y')
    expect(parsed.k).toBe(5)
    expect(parsed.y2).toBe(25)
  })
})
