import type { JSX } from 'react'
import type { DebateDataset } from '../parquetLoader'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { ConfigurationTable } from './ConfigurationTable'

export function DatasetCard({
  dataset,
  onSelectRow,
}: {
  dataset: DebateDataset
  onSelectRow: (row: FullDebateAnalysisRow, dataset: DebateDataset) => void
}): JSX.Element {
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
        <ConfigurationTable rows={rows} onSelectRow={(row) => onSelectRow(row, dataset)} />
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          No rows available for this dataset.
        </p>
      )}
    </article>
  )
}
