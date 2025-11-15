import { useState } from 'react'
import type { JSX } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { ConfigurationTableControls } from './configuration-table/ConfigurationTableControls'
import { useClipboardExporter } from './configuration-table/useClipboardExporter'
import {
  cellClassNameMap,
  defaultCellClassName,
  headerClassName,
  useConfigurationColumns,
} from './configuration-table/useConfigurationColumns'
import { useFilteredRows, type TaskFilter } from './configuration-table/useFilteredRows'
import { useFilteredRowsReporter } from './configuration-table/useFilteredRowsReporter'
import { useJudgeAccuracyDomain, useWinSkewDomain } from './configuration-table/domains'
import { stringIncludesCaseInsensitive } from './configuration-table/filters'

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
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('quality')

  const filteredRows = useFilteredRows(rows, taskFilter)
  const judgeAccuracyDomain = useJudgeAccuracyDomain(rows)
  const winSkewDomain = useWinSkewDomain(rows)
  const tableColumns = useConfigurationColumns({ judgeAccuracyDomain, winSkewDomain })

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
  useFilteredRowsReporter(tableRows, onFilteredRowsChange)
  const { copyStatus, handleCopyTable } = useClipboardExporter(table)

  const currentFilter =
    typeof table.getState().globalFilter === 'string' ? table.getState().globalFilter : ''

  return (
    <div className="mt-2 space-y-3">
      <ConfigurationTableControls
        taskFilter={taskFilter}
        onTaskFilterChange={setTaskFilter}
        currentFilter={currentFilter}
        onFilterChange={(value) => table.setGlobalFilter(value)}
        onCopyTable={handleCopyTable}
        copyStatus={copyStatus}
        disableCopy={tableRows.length === 0}
      />
      <div className="w-full">
        {tableRows.length > 0 ? (
          <div className="rounded-xl border border-slate-200/70 bg-white/80 shadow-card ring-1 ring-black/5 dark:border-slate-700/60 dark:bg-slate-900/60">
            <div className="overflow-x-auto md:overflow-visible">
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
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-600 shadow-card ring-1 ring-black/5 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
            No rows match the current filters.
          </div>
        )}
      </div>
    </div>
  )
}
