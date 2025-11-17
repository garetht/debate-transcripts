import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'
import { useJudgeAccuracyDomain, useWinSkewDomain } from './domains'

const createRow = (overrides: Partial<FullDebateAnalysisRow['stats']> = {}) =>
  ({
    stats: {
      judge_accuracy: 0.5,
      judge_standard_error: 0.1,
      debater_a_win_skew: 0,
      ...overrides,
    },
  }) as FullDebateAnalysisRow

const callJudgeDomain = (rows: FullDebateAnalysisRow[]) => {
  let result: [number, number] = [0, 0]
  const TestComponent = ({ value }: { value: FullDebateAnalysisRow[] }) => {
    result = useJudgeAccuracyDomain(value)
    return null
  }
  renderToStaticMarkup(<TestComponent value={rows} />)
  return result
}

const callWinSkewDomain = (rows: FullDebateAnalysisRow[]) => {
  let result: [number, number] = [0, 0]
  const TestComponent = ({ value }: { value: FullDebateAnalysisRow[] }) => {
    result = useWinSkewDomain(value)
    return null
  }
  renderToStaticMarkup(<TestComponent value={rows} />)
  return result
}

describe('useJudgeAccuracyDomain', () => {
  it('falls back to [0, 1] when no valid values are present', () => {
    const domain = callJudgeDomain([createRow({ judge_accuracy: null as unknown as number })])
    expect(domain).toEqual([0, 1])
  })

  it('expands the range to include the canonical 0-1 bounds', () => {
    const domain = callJudgeDomain([
      createRow({ judge_accuracy: 0.2 }),
      createRow({ judge_accuracy: 0.95 }),
    ])
    expect(domain).toEqual([0, 1])
  })

  it('adds padding when all values are identical', () => {
    const domain = callJudgeDomain([createRow({ judge_accuracy: 0.75 })])
    expect(domain[0]).toBeLessThan(0.75)
    expect(domain[1]).toBeGreaterThan(0.75)
  })
})

describe('useWinSkewDomain', () => {
  it('returns [0, 1] when no rows contain numeric values', () => {
    const domain = callWinSkewDomain([createRow({ debater_a_win_skew: null as unknown as number })])
    expect(domain).toEqual([0, 1])
  })

  it('returns min and max when values differ', () => {
    const domain = callWinSkewDomain([
      createRow({ debater_a_win_skew: -2 }),
      createRow({ debater_a_win_skew: 4 }),
    ])
    expect(domain).toEqual([-2, 4])
  })

  it('pads domains when values match exactly', () => {
    const domain = callWinSkewDomain([createRow({ debater_a_win_skew: 3 })])
    expect(domain[0]).toBeLessThan(3)
    expect(domain[1]).toBeGreaterThan(3)
  })
})
