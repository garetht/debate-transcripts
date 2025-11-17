import { describe, expect, it, vi } from 'vitest'
import type { PlotRenderer } from '../ResponsivePlot'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: function <T>(factory: () => T) {
      return factory()
    },
    useCallback: <T extends (...args: unknown[]) => unknown>(callback: T) => callback,
  }
})

const { DebateIdentifierHeatmap } = await import('./DebateIdentifierHeatmap')

const buildRow = (counts: Record<string, number>): FullDebateAnalysisRow =>
  ({
    distribution: {
      identifier_counts: counts,
    },
    stats: {},
  }) as unknown as FullDebateAnalysisRow

describe('DebateIdentifierHeatmap', () => {
  it('produces heatmap plot options when identifiers exist', () => {
    const element = DebateIdentifierHeatmap({
      row: buildRow({ alpha: 3, beta: 1 }),
    })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    const options = render(640)
    expect(options?.marks?.length ?? 0).toBeGreaterThan(0)
    expect(options?.color?.legend).toBe(true)
  })

  it('returns null when no identifiers are available', () => {
    const element = DebateIdentifierHeatmap({ row: buildRow({}) })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    expect(render(640)).toBeNull()
  })
})
