import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { formatJudgeAccuracy } from '../utils/judgeAccuracy'
import {formatJudgeStandardError} from "../utils/judgeStandardError.ts";

const columnHelper = createColumnHelper<FullDebateAnalysisRow>()

const stringIncludesCaseInsensitive: FilterFn<FullDebateAnalysisRow> = (
  row,
  columnId,
  filterValue,
) => {
  if (typeof filterValue !== 'string') return true
  const normalizedFilter = filterValue.trim().toLowerCase()
  if (normalizedFilter === '') return true

  const rawValue = row.getValue<unknown>(columnId)
  if (rawValue == null) return false

  return String(rawValue).toLowerCase().includes(normalizedFilter)
}

stringIncludesCaseInsensitive.autoRemove = (value) =>
  typeof value !== 'string' || value.trim() === ''

const tableColumns: ColumnDef<FullDebateAnalysisRow, any>[] = [
  columnHelper.accessor(
    (row) => row.configuration?.task_type?.trim() ?? '',
    {
      id: 'taskType',
      header: () => 'Task Type',
      cell: (info) => info.getValue() || '—',
      filterFn: stringIncludesCaseInsensitive,
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.debater_name?.trim() ?? '',
    {
      id: 'debater',
      header: () => 'Debater Name',
      cell: (info) => info.getValue() || '—',
      filterFn: stringIncludesCaseInsensitive,
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.debater_training_round?.trim() ?? '',
    {
      id: 'debaterTrainingRound',
      header: () => 'Debater Training',
      cell: (info) => info.getValue() || '—',
      filterFn: stringIncludesCaseInsensitive,
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.judge_name?.trim() ?? '',
    {
      id: 'judge',
      header: () => 'Judge Name',
      cell: (info) => info.getValue() || '—',
      filterFn: stringIncludesCaseInsensitive,
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.configuration?.judge_training_round?.trim() ?? '',
    {
      id: 'judgeTrainingRound',
      header: () => 'Judge Training',
      cell: (info) => info.getValue() || '—',
      filterFn: stringIncludesCaseInsensitive,
      sortingFn: 'alphanumeric',
    }
  ),
  columnHelper.accessor(
    (row) => row.stats.judge_accuracy,
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
  columnHelper.accessor(
      (row) => row.stats.judge_standard_error,
      {
        id: 'judgeStandardError',
        header: () => 'Judge Stderr',
        cell: (info) => formatJudgeStandardError(info.row.original),
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
  columnHelper.accessor(
    (row) => {
      const value = row.stats.debater_a_win_skew
      return value === undefined || value === null ? null : Number(value)
    },
    {
      id: 'winSkew',
      header: () => 'Win Skew',
      cell: (info) => {
        const value = info.getValue<number | null>()
        return value == null ? '—' : value.toLocaleString()
      },
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
  columnHelper.accessor(
      (row) => {
        const count = row.distribution?.transcript_count
        return count === undefined || count === null ? null : Number(count)
      },
      {
        id: 'totalTranscripts',
        header: () => '#',
        cell: (info) => {
          const value = info.getValue<number | null>()
          return value == null ? '—' : value.toLocaleString()
        },
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
  columnHelper.accessor(
    (row) => row.configuration?.raw_name?.trim() ?? '',
    {
      id: 'github',
      header: () => 'Github',
      cell: (info) => {
        const rawName = info.getValue<string>()
        if (!rawName) {
          return '—'
        }
        const url = `https://github.com/garetht/debate-transcripts/tree/main/transcripts/${rawName}/outputs`
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            Link
          </a>
        )
      },
      enableGlobalFilter: false,
    }
  ),
]

const headerClassName = 'px-3 py-2'
const defaultCellClassName = 'px-3 py-2 text-sm text-slate-700 dark:text-slate-200'
const cellClassNameMap: Record<string, string> = {
  taskType: defaultCellClassName,
  debater: defaultCellClassName,
  debaterTrainingRound: 'px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300',
  judge: defaultCellClassName,
  judgeTrainingRound: 'px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300',
  totalTranscripts: 'px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300',
  judgeAccuracy: 'px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300',
  judgeStandardError: 'px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300',
  winSkew: 'px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300',
  github: defaultCellClassName,
}

export function ConfigurationTable({
  rows,
  onSelectRow,
  onFilteredRowsChange,
}: {
  rows: FullDebateAnalysisRow[]
  onSelectRow: (row: FullDebateAnalysisRow) => void
  onFilteredRowsChange?: (rows: FullDebateAnalysisRow[]) => void
}): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [hideLojbanTasks, setHideLojbanTasks] = useState(true)

  const filteredRows = useMemo(() => {
    if (!hideLojbanTasks) {
      return rows
    }
    return rows.filter((row) => {
      const taskType = row.configuration?.task_type?.trim().toLowerCase()
      return taskType !== 'lojban'
    })
  }, [hideLojbanTasks, rows])

  const table = useReactTable({
    data: filteredRows,
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
    globalFilterFn: stringIncludesCaseInsensitive,
  })


  const tableRows = table.getRowModel().rows
  const filteredRowOriginals = useMemo(
    () => tableRows.map((row) => row.original),
    [tableRows],
  )
  const lastReportedRows = useRef<FullDebateAnalysisRow[]>([])
  useEffect(() => {
    if (!onFilteredRowsChange) {
      return
    }

    const hasSameRows =
      lastReportedRows.current.length === filteredRowOriginals.length &&
      lastReportedRows.current.every((row, index) => row === filteredRowOriginals[index])

    if (hasSameRows) {
      return
    }

    lastReportedRows.current = filteredRowOriginals
    onFilteredRowsChange(filteredRowOriginals)
  }, [filteredRowOriginals, onFilteredRowsChange])
  const currentFilter =
    typeof table.getState().globalFilter === 'string' ? table.getState().globalFilter : ''

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase text-slate-600 dark:text-slate-200">
        <span>Filter</span>
        <button
          type="button"
          onClick={() => setHideLojbanTasks((current) => !current)}
          aria-pressed={hideLojbanTasks}
          className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            hideLojbanTasks
              ? 'border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400 dark:hover:bg-indigo-300'
              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {hideLojbanTasks ? 'Show Lobjan Tasks' : 'Hide Lojban Tasks'}
        </button>
        <input
          value={currentFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder="Search configuration…"
          aria-label="Filter configuration rows"
          className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/40"
        />
      </div>
      {tableRows.length > 0 ? (
        <table className="min-w-full table-auto divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-100/80 text-left text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
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
                        <span className="uppercase">
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
                      <span className="uppercase">
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
                tabIndex={0}
                role="button"
                onClick={() => onSelectRow(row.original)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectRow(row.original)
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-indigo-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:hover:bg-indigo-500/20"
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
  )
}
