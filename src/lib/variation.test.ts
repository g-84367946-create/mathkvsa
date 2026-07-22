import { describe, expect, it } from 'vitest'
import { parseWorkingText } from './parseWorking'
import {
  checkPaperWorking,
  computeK,
  evaluateAsked,
  summarizeChecks,
  type PaperProblem,
} from './variation'
import { PRACTICE_EXAMPLES } from './examples'

describe('worksheet-style variation', () => {
  it('solves direct baju kurung problem', () => {
    const problem = PRACTICE_EXAMPLES[0]!.problem
    expect(computeK(problem)).toBe(3.5)
    expect(evaluateAsked(problem, 3.5)).toBe(32)
  })

  it('solves inverse with square root', () => {
    const problem = PRACTICE_EXAMPLES[1]!.problem
    expect(computeK(problem)).toBe(24)
  })

  it('solves joint E ∝ f/g', () => {
    const problem = PRACTICE_EXAMPLES[2]!.problem
    expect(computeK(problem)).toBe(3)
    expect(evaluateAsked(problem, 3)).toBe(5)
  })

  it('marks correct paper working for direct', () => {
    const ex = PRACTICE_EXAMPLES[0]!
    const parsed = parseWorkingText(ex.sampleWorking)
    const checks = checkPaperWorking(ex.problem, parsed)
    expect(summarizeChecks(checks).verdict).toBe('Jalan kerja nampak betul')
  })

  it('marks wrong power on inverse', () => {
    const ex = PRACTICE_EXAMPLES[1]!
    const parsed = parseWorkingText(ex.commonMistake)
    const checks = checkPaperWorking(ex.problem, parsed)
    expect(checks.find((c) => c.id === 'step-proportion')?.status).toBe('salah')
    expect(checks.find((c) => c.id === 'step-k')?.status).toBe('salah')
  })

  it('parses joint working steps from paper', () => {
    const parsed = parseWorkingText(PRACTICE_EXAMPLES[2]!.sampleWorking)
    expect(parsed.proportionText?.toLowerCase()).toContain('f/g')
    expect(parsed.k).toBe(3)
    expect(parsed.answer).toBe(5)
  })
})

describe('computeK edge', () => {
  it('handles plain inverse', () => {
    const problem: PaperProblem = {
      kind: 'songsang',
      dependent: 'y',
      independent: 'x',
      inversePower: 1,
      given: { y: 6, x: 4 },
      expectedProportion: 'y ∝ 1/x',
    }
    expect(computeK(problem)).toBe(24)
  })
})
