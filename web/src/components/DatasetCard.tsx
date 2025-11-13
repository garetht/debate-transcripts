import type { JSX } from 'react'
import type { DebateDataset } from '../parquetLoader'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { ConfigurationTable } from './ConfigurationTable'

export function DatasetCard({
  dataset,
  onSelectRow,
  onFilteredRowsChange,
}: {
  dataset: DebateDataset
  onSelectRow: (row: FullDebateAnalysisRow, dataset: DebateDataset) => void
  onFilteredRowsChange?: (rows: FullDebateAnalysisRow[], dataset: DebateDataset) => void
}): JSX.Element {
  const { rows } = dataset

  return (
    <article className="group w-full bg-white/80 shadow-card duration-200 dark:bg-slate-900/60">
      <p className="text-sm text-slate-600 transition-colors dark:text-slate-300">{`${rows.length} evaluation${
        rows.length === 1 ? '' : 's'
      }.`}</p>
      {rows.length > 0 ? (
        <ConfigurationTable
          rows={rows}
          onSelectRow={(row) => onSelectRow(row, dataset)}
          onFilteredRowsChange={(filteredRows) =>
            onFilteredRowsChange?.(filteredRows, dataset)
          }
        />
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          No rows available for this dataset.
        </p>
      )}
    </article>
  )
}
