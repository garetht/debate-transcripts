import { renderToStaticMarkup } from 'react-dom/server'
import type { JSX } from 'react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { DebateDataset } from './parquetLoader'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'

let currentPath = '/'

vi.mock('react-router-dom', () => ({
  Routes: ({ children }: { children: unknown }) => <>{children}</>,
  Route: ({ path, element }: { path: string; element: JSX.Element }) => {
    const matches = () => {
      if (path === '*') {
        return currentPath !== '/' && !currentPath.startsWith('/detail/')
      }
      if (path.includes(':')) {
        const [prefix] = path.split('/:')
        return currentPath.startsWith(`${prefix}/`)
      }
      return path === currentPath
    }
    return matches() ? element : null
  },
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()] as const,
  useParams: () =>
    currentPath.startsWith('/detail/')
      ? ({
          rawName: decodeURIComponent(currentPath.replace('/detail/', '')),
        } as Record<string, string>)
      : ({} as Record<string, string>),
}))

const datasetCardMock = vi.fn()
vi.mock('./components/DatasetCard', () => ({
  DatasetCard: (props: unknown) => {
    datasetCardMock(props)
    return <div data-testid="dataset-card" />
  },
}))

const placeholderMock = vi.fn()
vi.mock('./components/PlaceholderCard', () => ({
  PlaceholderCard: (props: unknown) => {
    placeholderMock(props)
    return <div data-testid="placeholder" />
  },
}))

const graphsMock = vi.fn()
vi.mock('./components/cross_evals/AllEvaluationsGraphs', () => ({
  AllEvaluationsGraphs: (props: unknown) => {
    graphsMock(props)
    return <div data-testid="graphs" />
  },
}))

const detailScreenMock = vi.fn()
vi.mock('./screens/DetailScreen', () => ({
  DetailScreen: (props: unknown) => {
    detailScreenMock(props)
    return <div data-testid="detail-screen" />
  },
}))

const datasetsMock = vi.fn()
vi.mock('./hooks/useDebateDatasets', () => ({
  useDebateDatasets: datasetsMock,
}))

const { App } = await import('./App')

const createDataset = (rawName: string): DebateDataset => ({
  virtualPath: rawName,
  url: '',
  rows: [
    {
      configuration: { raw_name: rawName },
    },
  ] as unknown as FullDebateAnalysisRow[],
})

describe('App', () => {
  beforeEach(() => {
    currentPath = '/'
    datasetCardMock.mockClear()
    placeholderMock.mockClear()
    graphsMock.mockClear()
    detailScreenMock.mockClear()
  })

  it('renders datasets on the root path when load succeeds', () => {
    datasetsMock.mockReturnValue({
      datasets: [createDataset('one')],
      state: { status: 'success', message: 'Loaded' },
    })

    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('data-testid="dataset-card"')
    expect(datasetCardMock).toHaveBeenCalled()
    expect(graphsMock).toHaveBeenCalled()
    expect(placeholderMock).not.toHaveBeenCalled()
  })

  it('shows a placeholder when loading', () => {
    datasetsMock.mockReturnValue({
      datasets: [],
      state: { status: 'loading', message: 'Loading parquet datasets…' },
    })

    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('data-testid="placeholder"')
    expect(placeholderMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Fetching datasets…' }),
    )
  })

  it('renders the detail screen when a matching configuration exists', () => {
    currentPath = '/detail/config%201'
    const dataset = createDataset('config 1')
    datasetsMock.mockReturnValue({
      datasets: [dataset],
      state: { status: 'success', message: 'Loaded' },
    })

    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('data-testid="detail-screen"')
    expect(detailScreenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        row: dataset.rows[0],
      }),
    )
  })
})
