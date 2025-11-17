import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'

type MockRow = {
  id: string
  original: FullDebateAnalysisRow
  getVisibleCells: () => Array<{
    id: string
    column: { id: string; columnDef: { cell: () => string } }
    getContext: () => Record<string, unknown>
  }>
  getValue: () => string
}

const tableRows: MockRow[] = []
const setGlobalFilterMock = vi.fn()
const getToggleSortingHandlerMock = vi.fn()

const tableMock = {
  getRowModel: () => ({ rows: tableRows }),
  getHeaderGroups: () => [
    {
      id: 'headerGroup',
      headers: [
        {
          id: 'header',
          isPlaceholder: false,
          column: {
            id: 'col',
            columnDef: { header: () => 'Header', cell: () => 'Cell' },
            getCanSort: () => false,
            getToggleSortingHandler: () => getToggleSortingHandlerMock,
            getIsSorted: () => false,
          },
          getContext: () => ({}),
        },
      ],
    },
  ],
  setGlobalFilter: setGlobalFilterMock,
  getState: () => ({ globalFilter: '' }),
}

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()] as const,
}))

const controlsMock = vi.fn()
vi.mock('./configuration-table/ConfigurationTableControls', () => ({
  ConfigurationTableControls: (props: unknown) => {
    controlsMock(props)
    return <div data-testid="controls" />
  },
}))

const filteredRowsReporterMock = vi.fn()
vi.mock('./configuration-table/useFilteredRowsReporter', () => ({
  useFilteredRowsReporter: filteredRowsReporterMock,
}))

const useFilteredRowsMock = vi.fn()
vi.mock('./configuration-table/useFilteredRows', () => ({
  useFilteredRows: useFilteredRowsMock,
}))

vi.mock('./configuration-table/useConfigurationColumns', () => ({
  useConfigurationColumns: () => [
    {
      id: 'col',
      columnDef: {
        header: () => 'Header',
        cell: () => 'Cell',
      },
    },
  ],
  cellClassNameMap: { col: 'cell-class' },
  defaultCellClassName: 'cell-class',
  headerClassName: 'header-class',
}))

vi.mock('./configuration-table/domains', () => ({
  useJudgeAccuracyDomain: () => [0, 1] as [number, number],
  useWinSkewDomain: () => [-1, 1] as [number, number],
}))

const clipboardHandleMock = vi.fn()
vi.mock('./configuration-table/useClipboardExporter', () => ({
  useClipboardExporter: () => ({ copyStatus: 'idle', handleCopyTable: clipboardHandleMock }),
}))

vi.mock('./configuration-table/filters', () => ({
  stringIncludesCaseInsensitive: vi.fn(),
}))

vi.mock('@tanstack/react-table', () => ({
  useReactTable: () => tableMock,
  flexRender: (component: unknown) =>
    typeof component === 'function' ? component({}) : component,
  getCoreRowModel: () => vi.fn(),
  getFilteredRowModel: () => vi.fn(),
  getSortedRowModel: () => vi.fn(),
}))

const { ConfigurationTable } = await import('./ConfigurationTable')

const baseRow = {
  configuration: {
    raw_name: 'config',
  },
} as unknown as FullDebateAnalysisRow

const createTableRow = (id: string, value: string): MockRow => ({
  id,
  original: baseRow,
  getVisibleCells: () => [
    {
      id: `${id}_cell`,
      column: { id: 'col', columnDef: { cell: () => value } },
      getContext: () => ({}),
    },
  ],
  getValue: () => value,
})

describe('ConfigurationTable', () => {
  beforeEach(() => {
    tableRows.length = 0
    useFilteredRowsMock.mockReset()
    controlsMock.mockClear()
    filteredRowsReporterMock.mockReset()
  })

  it('renders a table when rows are available', () => {
    const rowList = [baseRow]
    useFilteredRowsMock.mockReturnValue(rowList)
    tableRows.push(createTableRow('row1', 'Value'))

    const html = renderToStaticMarkup(
      <ConfigurationTable rows={rowList} onSelectRow={vi.fn()} onFilteredRowsChange={vi.fn()} />,
    )

    expect(html).toContain('Value')
    expect(controlsMock).toHaveBeenCalled()
    expect(filteredRowsReporterMock).toHaveBeenCalledWith(tableRows, expect.any(Function))
  })

  it('shows an empty state when the table has no rows', () => {
    useFilteredRowsMock.mockReturnValue([])

    const html = renderToStaticMarkup(
      <ConfigurationTable rows={[]} onSelectRow={vi.fn()} onFilteredRowsChange={vi.fn()} />,
    )

    expect(html).toContain('No rows match the current filters.')
  })
})
