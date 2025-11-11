import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import './style.css'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'
import { loadAllDebateDatasets, type DebateDataset } from './parquetLoader'

type LoadingState =
  | { status: 'loading'; message: string }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

const columnHelper = createColumnHelper<FullDebateAnalysisRow>()

function App(): JSX.Element {
  const [datasets, setDatasets] = useState<DebateDataset[]>([])
  const [state, setState] = useState<LoadingState>({
    status: 'loading',
    message: 'Loading parquet datasets…',
  })

  useEffect(() => {
    let isActive = true

    loadAllDebateDatasets()
      .then((loadedDatasets) => {
        if (!isActive) return
        if (!loadedDatasets.length) {
          setState({
            status: 'empty',
            message: 'No parquet datasets matched the glob pattern.',
          })
          setDatasets([])
          return
        }
        setDatasets(loadedDatasets)
        setState({
          status: 'success',
          message: `Loaded ${loadedDatasets.length} dataset${
            loadedDatasets.length === 1 ? '' : 's'
          }.`,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) return
        console.error(error)
        setState({
          status: 'error',
          message: 'Failed to load parquet datasets. Check console for details.',
        })
      })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <main className="flex flex-col gap-6 text-left">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Parquet Schema Preview
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{state.message}</p>
      </header>
      <section id="dataset-list" className="flex flex-col gap-5">
        {state.status === 'success' ? (
          datasets.map((dataset) => <DatasetCard key={dataset.virtualPath} dataset={dataset} />)
        ) : state.status === 'loading' ? (
          <PlaceholderCard message="Fetching datasets…" />
        ) : state.status === 'empty' ? (
          <PlaceholderCard message="No datasets available to display." />
        ) : (
          <PlaceholderCard message="Unable to display datasets." tone="error" />
        )}
      </section>
    </main>
  )
}

function DatasetCard({ dataset }: { dataset: DebateDataset }): JSX.Element {
  const { virtualPath, url, rows } = dataset
  return (
    <article className="group w-full rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-card ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:border-indigo-400/40 hover:shadow-xl dark:border-indigo-400/25 dark:bg-slate-900/60 dark:ring-white/5">
      <h2 className="text-lg font-semibold text-indigo-700 transition-colors dark:text-indigo-200">
        {virtualPath}
      </h2>
      <p className="text-sm text-slate-600 transition-colors dark:text-slate-300">{`${rows.length} row${
        rows.length === 1 ? '' : 's'
      } • ${url}`}</p>
      {rows.length > 0 ? (
        <ConfigurationTable rows={rows} />
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          No rows available for this dataset.
        </p>
      )}
    </article>
  )
}

function getJudgeAccuracyValue(row: FullDebateAnalysisRow): number | null {
  const totalDebates = row.stats?.total_debates
  const judgeCorrect = row.stats?.judge_correct
  if (
    typeof totalDebates !== 'bigint' ||
    typeof judgeCorrect !== 'bigint' ||
    totalDebates === 0n
  ) {
    return null
  }
  const total = Number(totalDebates)
  const correct = Number(judgeCorrect)
  if (!Number.isFinite(total) || total === 0 || !Number.isFinite(correct)) {
    return null
  }
  return (correct / total) * 100
}

function formatJudgeAccuracy(row: FullDebateAnalysisRow): string {
  const accuracy = getJudgeAccuracyValue(row)
  if (accuracy === null) {
    return '—'
  }
  return `${accuracy.toFixed(1)}%`
}

const tableColumns: ColumnDef<FullDebateAnalysisRow, any>[] = [
  columnHelper.accessor(
    (row) => row.configuration?.task_type?.trim() ?? '',
    {
      id: 'taskType',
      header: () => 'Task Type',
      cell: (info) => info.getValue() || '—',
      filterFn: 'includesString',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.debater_name?.trim() ?? '',
    {
      id: 'debater',
      header: () => 'Debater Name',
      cell: (info) => info.getValue() || '—',
      filterFn: 'includesString',
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.debater_training_round?.trim() ?? '',
    {
      id: 'debaterTrainingRound',
      header: () => 'Debater Training Round',
      cell: (info) => info.getValue() || '—',
      filterFn: 'includesString',
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.judge_name?.trim() ?? '',
    {
      id: 'judge',
      header: () => 'Judge Name',
      cell: (info) => info.getValue() || '—',
      filterFn: 'includesString',
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.judge_training_round?.trim() ?? '',
    {
      id: 'judgeTrainingRound',
      header: () => 'Judge Training Round',
      cell: (info) => info.getValue() || '—',
      filterFn: 'includesString',
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => getJudgeAccuracyValue(row),
    {
      id: 'judgeAccuracy',
      header: () => 'Judge Accuracy',
      cell: (info) => formatJudgeAccuracy(info.row.original),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => {
        const valueA = a.getValue<number | null>(columnId)
        const valueB = b.getValue<number | null>(columnId)
        if (valueA === null && valueB === null) return 0
        if (valueA === null) return 1
        if (valueB === null) return -1
        return valueA - valueB
      },
    }
  ),
]

const headerClassName = 'px-4 py-3'
const defaultCellClassName = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-200'
const cellClassNameMap: Record<string, string> = {
  taskType: defaultCellClassName,
  debater: defaultCellClassName,
  debaterTrainingRound: 'px-4 py-3 text-xs text-slate-600 dark:text-slate-300',
  judge: defaultCellClassName,
  judgeTrainingRound: 'px-4 py-3 text-xs text-slate-600 dark:text-slate-300',
  judgeAccuracy: 'px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-300',
}

function ConfigurationTable({ rows }: { rows: FullDebateAnalysisRow[] }): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
  })

  const tableRows = table.getRowModel().rows
  const currentFilter =
    typeof table.getState().globalFilter === 'string' ? table.getState().globalFilter : ''

  return (
    <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/70 shadow-inner transition-colors dark:border-slate-700/60 dark:bg-slate-950/40">
      <div className="flex items-center gap-2 border-b border-slate-200/60 bg-slate-100/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
        <span>Filter</span>
        <input
          value={currentFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder="Search configuration…"
          aria-label="Filter configuration rows"
          className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-normal text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/40"
        />
      </div>
      <div className="max-h-96 overflow-auto">
        {tableRows.length > 0 ? (
          <table className="min-w-full table-auto divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} scope="col" className={headerClassName}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 text-left text-slate-600 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-200 dark:focus-visible:text-indigo-200"
                        >
                          <span className="uppercase tracking-wide">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {header.column.getIsSorted() === 'asc'
                              ? '^'
                              : header.column.getIsSorted() === 'desc'
                              ? 'v'
                              : ''}
                          </span>
                        </button>
                      ) : (
                        <span className="uppercase tracking-wide">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tableRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-500/20"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cellClassNameMap[cell.column.id] ?? defaultCellClassName}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
            No rows match the current filters.
          </p>
        )}
      </div>
    </div>
  )
}

function PlaceholderCard({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'neutral' | 'error'
}): JSX.Element {
  const toneClass =
    tone === 'error'
      ? 'border-red-200/70 bg-red-50/80 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200'
      : 'border-slate-200/60 bg-white/60 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200'

  return (
    <article
      className={`rounded-2xl border p-5 text-sm shadow-card ring-1 ring-black/5 transition duration-200 ${toneClass}`}
    >
      {message}
    </article>
  )
}

const rootElement = document.getElementById('app')
if (!rootElement) {
  throw new Error('Missing #app root element')
}

createRoot(rootElement).render(<App />)
