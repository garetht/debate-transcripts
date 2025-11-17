import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

const scatterMock = vi.fn()
const skewMock = vi.fn()
const heatmapMock = vi.fn()

vi.mock('./JudgeProbabilityScatter', () => ({
  JudgeProbabilityScatter: (props: { row: FullDebateAnalysisRow }) => {
    scatterMock(props.row)
    return <div data-testid="scatter" />
  },
}))

vi.mock('./DebaterWinSkew', () => ({
  DebaterWinSkew: (props: { row: FullDebateAnalysisRow }) => {
    skewMock(props.row)
    return <div data-testid="skew" />
  },
}))

vi.mock('./DebateIdentifierHeatmap', () => ({
  DebateIdentifierHeatmap: (props: { row: FullDebateAnalysisRow }) => {
    heatmapMock(props.row)
    return <div data-testid="heatmap" />
  },
}))

const { SingleEvaluationGraph } = await import('./SingleEvaluationGraph')

describe('SingleEvaluationGraph', () => {
  it('renders child plots with the provided row', () => {
    const row = { stats: {}, distribution: {} } as FullDebateAnalysisRow
    const html = renderToStaticMarkup(<SingleEvaluationGraph row={row} />)
    expect(html).toContain('data-testid="scatter"')
    expect(html).toContain('data-testid="skew"')
    expect(html).toContain('data-testid="heatmap"')
    expect(scatterMock).toHaveBeenCalledWith(row)
    expect(skewMock).toHaveBeenCalledWith(row)
    expect(heatmapMock).toHaveBeenCalledWith(row)
  })
})
