import type { JSX } from 'react'
import type { CopyStatus } from './useClipboardExporter'

export function ConfigurationTableControls({
  hideLojbanTasks,
  onToggleHideLojbanTasks,
  currentFilter,
  onFilterChange,
  onCopyTable,
  copyStatus,
  disableCopy,
}: {
  hideLojbanTasks: boolean
  onToggleHideLojbanTasks: () => void
  currentFilter: string
  onFilterChange: (value: string) => void
  onCopyTable: () => void
  copyStatus: CopyStatus
  disableCopy: boolean
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-200">
      <div className="flex flex-wrap items-center gap-2 uppercase">
        <span>Filter</span>
        <button
          type="button"
          onClick={onToggleHideLojbanTasks}
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
        onChange={(event) => onFilterChange(event.target.value)}
        placeholder="Search configuration…"
        aria-label="Filter configuration rows"
        className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/40"
      />
      <div className="ml-auto">
        <button
          type="button"
          onClick={onCopyTable}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          disabled={disableCopy}
        >
          {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Copy Failed' : 'Copy Table'}
        </button>
      </div>
    </div>
  )
}
