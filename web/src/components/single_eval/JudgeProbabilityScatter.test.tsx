import { describe, expect, it, vi } from 'vitest'
import type { PlotRenderer } from '../ResponsivePlot'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useCallback: <T extends (...args: unknown[]) => unknown>(callback: T) => callback,
  }
})

const { JudgeProbabilityScatter } = await import('./JudgeProbabilityScatter')

const buildRow = (overrides: Partial<FullDebateAnalysisRow['stats']>): FullDebateAnalysisRow =>
  ({
    stats: {
      debater_a_probs: [],
      debater_b_probs: [],
      ...overrides,
    },
  }) as FullDebateAnalysisRow

describe('JudgeProbabilityScatter', () => {
  it('creates plot marks when probability data is present', () => {
    const element = JudgeProbabilityScatter({
      row: buildRow({
        debater_a_probs: [0.1, 0.2],
        debater_b_probs: [0.9],
      }),
    })
    const render = (element as unknown as { props: { render: PlotRenderer } }).props.render
    const options = render(600)
    expect(options?.marks?.length ?? 0).toBeGreaterThan(0)
    expect(options?.x?.domain).toEqual([0, 1])
  })

  it('returns null plot options when both arrays are empty', () => {
    const element = JudgeProbabilityScatter({ row: buildRow({}) })
    const render = (element as unknown as { props: { render: PlotRenderer } }).props.render
    const options = render(600)
    expect(options).toBeNull()
  })
})
