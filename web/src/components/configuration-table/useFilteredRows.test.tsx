import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'
import { useFilteredRows } from './useFilteredRows'

const createRow = (taskType: string): FullDebateAnalysisRow =>
  ({
    configuration: {
      task_type: taskType,
    },
  }) as FullDebateAnalysisRow

const callHook = (rows: FullDebateAnalysisRow[], filter: 'quality' | 'lojban') => {
  let result: FullDebateAnalysisRow[] = []
  const TestComponent = ({
    value,
    currentFilter,
  }: {
    value: FullDebateAnalysisRow[]
    currentFilter: 'quality' | 'lojban'
  }) => {
    result = useFilteredRows(value, currentFilter)
    return null
  }
  renderToStaticMarkup(<TestComponent value={rows} currentFilter={filter} />)
  return result
}

describe('useFilteredRows', () => {
  it('filters rows by normalized task type', () => {
    const rows = [createRow('Quality'), createRow('lojban')]
    const filtered = callHook(rows, 'quality')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].configuration?.task_type).toBe('Quality')
  })

  it('returns an empty array when no rows match', () => {
    const rows = [createRow('lojban')]
    const filtered = callHook(rows, 'quality')
    expect(filtered).toHaveLength(0)
  })
})
