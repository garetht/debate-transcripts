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

const { DebaterWinSkew } = await import('./DebaterWinSkew')

const buildRow = (overrides: Partial<FullDebateAnalysisRow['stats']> = {}): FullDebateAnalysisRow =>
  ({
    stats: {
      debater_a_divergence_from_uniform: 4n,
      debater_b_divergence_from_uniform: -2n,
      judge_accuracy: 0.6,
      ...overrides,
    },
    distribution: {
      transcript_count: 20n,
    },
  }) as unknown as FullDebateAnalysisRow

describe('DebaterWinSkew', () => {
  it('returns plot options highlighting divergences', () => {
    const element = DebaterWinSkew({ row: buildRow() })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    const options = render(640)
    expect(options?.marks?.length ?? 0).toBeGreaterThan(0)
    expect(options?.x?.domain).toEqual([-5, 5])
  })

  it('returns null when divergences are zero', () => {
    const element = DebaterWinSkew({
      row: buildRow({
        debater_a_divergence_from_uniform: 0n,
        debater_b_divergence_from_uniform: 0n,
      }),
    })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    expect(render(640)).toBeNull()
  })
})
