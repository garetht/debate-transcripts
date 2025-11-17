import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { DebateDataset } from '../parquetLoader'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'

vi.mock('./ConfigurationTable', () => ({
  ConfigurationTable: () => <div data-testid="configuration-table">table</div>,
}))

const { DatasetCard } = await import('./DatasetCard')

const mockDataset = (rows: FullDebateAnalysisRow[]): DebateDataset => ({
  virtualPath: 'mock/path',
  url: 'mock:url',
  rows,
})

describe('DatasetCard', () => {
  it('renders the configuration table when rows are present', () => {
    const dataset = mockDataset([{} as FullDebateAnalysisRow])
    const html = renderToStaticMarkup(
      <DatasetCard dataset={dataset} onSelectRow={vi.fn()} />,
    )
    expect(html).toContain('1 evaluation')
    expect(html).toContain('data-testid="configuration-table"')
  })

  it('shows an empty state when there are no rows', () => {
    const dataset = mockDataset([])
    const html = renderToStaticMarkup(
      <DatasetCard dataset={dataset} onSelectRow={vi.fn()} />,
    )
    expect(html).toContain('No rows available for this dataset.')
  })
})
