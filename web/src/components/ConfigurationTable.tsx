import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { interpolateRdBu, interpolateRdYlGn } from 'd3-scale-chromatic'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { formatJudgeAccuracy } from '../utils/judgeAccuracy'
import { formatJudgeStandardError } from '../utils/judgeStandardError.ts'
import { DomainColorCell } from './DomainColorCell'

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

const headerClassName = 'px-3 py-2'
const defaultCellClassName = 'px-3 py-2 text-sm text-slate-700 dark:text-slate-200'
const cellClassNameMap: Record<string, string> = {
  taskType: defaultCellClassName,
  debater: defaultCellClassName,
  debaterTrainingRound: 'px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300',
  judge: defaultCellClassName,
  judgeTrainingRound: 'px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300',
  totalTranscripts: 'px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300',
  judgeAccuracy: 'px-3 py-2 text-xs font-medium text-right',
  judgeStandardError: 'px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-300',
  winSkew: 'px-3 py-2 text-xs font-medium text-right',
  github: defaultCellClassName,
}

type TableExportCell = {
  text: string
  href?: string
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

  const judgeAccuracyDomain = useMemo<[number, number]>(() => {
    const values = rows
      .map((row) => {
        const value = row.stats.judge_accuracy
        return value === undefined || value === null ? null : Number(value)
      })
      .filter((value): value is number => value != null && Number.isFinite(value))

    if (values.length === 0) {
      return [0, 1]
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const lowerBound = Math.min(0, min)
    const upperBound = Math.max(1, max)

    if (lowerBound === upperBound) {
      const padding = Math.max(Math.abs(lowerBound) * 0.1, 0.1)
      return [lowerBound - padding, upperBound + padding]
    }

    return [lowerBound, upperBound]
  }, [rows])

  const winSkewDomain = useMemo<[number, number]>(() => {
    const values = rows
      .map((row) => {
        const value = row.stats.debater_a_win_skew
        if (value === undefined || value === null) {
          return null
        }
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : null
      })
      .filter((value): value is number => value != null)

    if (values.length === 0) {
      return [0, 1]
    }

    const min = Math.min(...values)
    const max = Math.max(...values)

    if (min === max) {
      const padding = Math.max(Math.abs(min) * 0.1, 1)
      return [min - padding, max + padding]
    }

    return [min, max]
  }, [rows])

  const tableColumns = useMemo<ColumnDef<FullDebateAnalysisRow, any>[]>(
    () => [
      columnHelper.accessor(
        (row) => row.configuration?.task_type?.trim() ?? '',
        {
          id: 'taskType',
          header: () => 'Task Type',
          cell: (info) => info.getValue() || '—',
          filterFn: stringIncludesCaseInsensitive,
          meta: {
            exportLabel: 'Task Type',
            exportValue: (row: FullDebateAnalysisRow) => row.configuration?.task_type?.trim() ?? '',
          },
        },
      ),
      columnHelper.accessor(
        (row) => row.configuration?.debater_name?.trim() ?? '',
        {
          id: 'debater',
          header: () => 'Debater Name',
          cell: (info) => info.getValue() || '—',
          filterFn: stringIncludesCaseInsensitive,
          sortingFn: 'alphanumeric',
          meta: {
            exportLabel: 'Debater Name',
            exportValue: (row: FullDebateAnalysisRow) => row.configuration?.debater_name?.trim() ?? '',
          },
        },
      ),
      columnHelper.accessor(
        (row) => row.configuration?.debater_training_round?.trim() ?? '',
        {
          id: 'debaterTrainingRound',
          header: () => 'Debater Training',
          cell: (info) => info.getValue() || '—',
          filterFn: stringIncludesCaseInsensitive,
          sortingFn: 'alphanumeric',
          meta: {
            exportLabel: 'Debater Training',
            exportValue: (row: FullDebateAnalysisRow) =>
              row.configuration?.debater_training_round?.trim() ?? '',
          },
        },
      ),
      columnHelper.accessor(
        (row) => row.configuration?.judge_name?.trim() ?? '',
        {
          id: 'judge',
          header: () => 'Judge Name',
          cell: (info) => info.getValue() || '—',
          filterFn: stringIncludesCaseInsensitive,
          sortingFn: 'alphanumeric',
          meta: {
            exportLabel: 'Judge Name',
            exportValue: (row: FullDebateAnalysisRow) => row.configuration?.judge_name?.trim() ?? '',
          },
        },
      ),
      columnHelper.accessor(
        (row) => row.configuration?.judge_training_round?.trim() ?? '',
        {
          id: 'judgeTrainingRound',
          header: () => 'Judge Training',
          cell: (info) => info.getValue() || '—',
          filterFn: stringIncludesCaseInsensitive,
          sortingFn: 'alphanumeric',
          meta: {
            exportLabel: 'Judge Training',
            exportValue: (row: FullDebateAnalysisRow) =>
              row.configuration?.judge_training_round?.trim() ?? '',
          },
        },
      ),
      columnHelper.accessor(
        (row) => row.stats.judge_accuracy ?? null,
        {
          id: 'judgeAccuracy',
          header: () => 'Judge Accuracy',
          cell: (info) => {
            const value = info.getValue<number | null>()
            const displayValue =
              value == null ? undefined : formatJudgeAccuracy(info.row.original)
            return (
              <DomainColorCell
                value={value}
                domain={judgeAccuracyDomain}
                interpolator={interpolateRdYlGn}
                displayValue={displayValue}
              />
            )
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
          meta: {
            exportLabel: 'Judge Accuracy',
            exportValue: (row: FullDebateAnalysisRow) => {
              const value = row.stats.judge_accuracy
              if (value === undefined || value === null) {
                return ''
              }
              return formatJudgeAccuracy(row)
            },
          },
        },
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
          meta: {
            exportLabel: 'Judge Stderr',
            exportValue: (row: FullDebateAnalysisRow) => {
              const value = row.stats.judge_standard_error
              if (value === undefined || value === null) {
                return ''
              }
              return formatJudgeStandardError(row)
            },
          },
        },
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
            const displayValue =
              value == null
                ? undefined
                : value.toLocaleString(undefined, {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 0,
                  })
            return (
              <DomainColorCell
                value={value}
                domain={winSkewDomain}
                interpolator={interpolateRdBu}
                displayValue={displayValue}
              />
            )
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
          meta: {
            exportLabel: 'Win Skew',
            exportValue: (row: FullDebateAnalysisRow) => {
              const value = row.stats.debater_a_win_skew
              if (value === undefined || value === null) {
                return ''
              }
              const numeric = Number(value)
              if (!Number.isFinite(numeric)) {
                return ''
              }
              return numeric.toLocaleString(undefined, {
                maximumFractionDigits: 3,
                minimumFractionDigits: 0,
              })
            },
          },
        },
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
          meta: {
            exportLabel: '#',
            exportValue: (row: FullDebateAnalysisRow) => {
              const count = row.distribution?.transcript_count
              if (count === undefined || count === null) {
                return ''
              }
              const numeric = Number(count)
              if (!Number.isFinite(numeric)) {
                return ''
              }
              return numeric.toLocaleString()
            },
          },
        },
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
          meta: {
            exportLabel: 'Github',
            exportValue: (row: FullDebateAnalysisRow) => {
              const rawName = row.configuration?.raw_name?.trim()
              if (!rawName) {
                return ''
              }
              return {
                text: 'Link',
                href: `https://github.com/garetht/debate-transcripts/tree/main/transcripts/${rawName}/outputs`,
              }
            },
          },
        },
      ),
    ],
    [judgeAccuracyDomain, winSkewDomain],
  )

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
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopyTable = useCallback(async () => {
    try {
      const visibleColumns = table.getVisibleLeafColumns()
      const headers = visibleColumns.map((column) => {
        const meta = column.columnDef.meta as
          | { exportLabel?: string }
          | undefined
        if (meta?.exportLabel) {
          return meta.exportLabel
        }
        const headerDef = column.columnDef.header
        if (typeof headerDef === 'string') {
          return headerDef
        }
        return column.id
      })

      const toExportCell = (input: unknown): TableExportCell => {
        if (input === null || input === undefined) {
          return { text: '' }
        }
        if (typeof input === 'string') {
          return { text: input }
        }
        if (typeof input === 'number' || typeof input === 'boolean') {
          return { text: String(input) }
        }
        if (typeof input === 'object') {
          const candidate = input as { text?: unknown; href?: unknown }
          const text =
            typeof candidate.text === 'string'
              ? candidate.text
              : candidate.text === undefined
              ? ''
              : String(candidate.text)
          const href = typeof candidate.href === 'string' ? candidate.href : undefined
          return { text, href }
        }
        return { text: '' }
      }

      const rowsForExport: TableExportCell[][] = table.getRowModel().rows.map((row) =>
        visibleColumns.map((column) => {
          const meta = column.columnDef.meta as
            | {
                exportValue?: (
                  originalRow: FullDebateAnalysisRow,
                ) => string | TableExportCell | number | boolean | null | undefined
              }
            | undefined
          if (meta?.exportValue) {
            return toExportCell(meta.exportValue(row.original))
          }

          const value = row.getValue<unknown>(column.id)
          return toExportCell(value)
        }),
      )

      const sanitizePlainCell = (cell: string) => cell.replace(/\t/g, ' ').replace(/\r?\n/g, ' ')
      const escapeHtml = (cell: string) =>
        cell
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')

      const plainRows = rowsForExport.map((row) => row.map((cell) => cell.text))

      const tableText = [headers, ...plainRows]
        .map((row) => row.map((cell) => sanitizePlainCell(cell)).join('\t'))
        .join('\n')

      const htmlTable = (() => {
        const headerRow = headers
          .map((header) => `<th>${escapeHtml(header)}</th>`)
          .join('')
        const bodyRows = rowsForExport
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => {
                  const text = escapeHtml(cell.text).replace(/\r?\n/g, '<br>')
                  if (cell.href) {
                    const href = escapeHtml(cell.href)
                    return `<td><a href="${href}">${text || 'Link'}</a></td>`
                  }
                  return `<td>${text}</td>`
                })
                .join('')}</tr>`,
          )
          .join('')
        return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`
      })()

      const clipboardItemCtor =
        typeof window !== 'undefined' && 'ClipboardItem' in window
          ? (window as typeof window & { ClipboardItem: typeof ClipboardItem }).ClipboardItem
          : undefined

      if (navigator.clipboard?.write && clipboardItemCtor) {
        const clipboardItem = new clipboardItemCtor({
          'text/html': new Blob([htmlTable], { type: 'text/html' }),
          'text/plain': new Blob([tableText], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([clipboardItem])
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(tableText)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    } finally {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current)
      }
      copyResetTimeout.current = setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
    }
  }, [table])

  useEffect(
    () => () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current)
      }
    },
    [],
  )

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
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200">
        <div className="flex flex-wrap items-center gap-2 uppercase">
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
        </div>
        <input
          value={currentFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder="Search configuration…"
          aria-label="Filter configuration rows"
          className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/40"
        />
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleCopyTable}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={tableRows.length === 0}
          >
            {copyStatus === 'copied'
              ? 'Copied!'
              : copyStatus === 'error'
              ? 'Copy Failed'
              : 'Copy Table'}
          </button>
        </div>
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
