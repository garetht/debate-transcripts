import {useMemo, useState} from 'react'
import type { JSX } from 'react'
import { DatasetCard } from './components/DatasetCard'
import { PlaceholderCard } from './components/PlaceholderCard'
import { useDebateDatasets } from './hooks/useDebateDatasets'
import type { DebateDataset } from './parquetLoader'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'
import { DetailScreen } from './screens/DetailScreen'
import { AllEvaluationsGraphs } from './components/cross_evals/AllEvaluationsGraphs.tsx'

export function App(): JSX.Element {
  const { datasets, state } = useDebateDatasets()
  const [selected, setSelected] = useState<{
    dataset: DebateDataset
    row: FullDebateAnalysisRow
  } | null>(null)
  const [filteredRowsByDataset, setFilteredRowsByDataset] = useState<
    Record<string, FullDebateAnalysisRow[]>
  >({})

  const handleSelectRow = (row: FullDebateAnalysisRow, dataset: DebateDataset) => {
    setSelected({ dataset, row })
  }

  const handleBack = () => {
    setSelected(null)
  }

  const handleFilteredRowsChange = (dataset: DebateDataset, rows: FullDebateAnalysisRow[]) => {
    setFilteredRowsByDataset((previous) => {
      const existing = previous[dataset.virtualPath]
      const hasSameRows =
        existing !== undefined &&
        existing.length === rows.length &&
        existing.every((row, index) => row === rows[index])

      if (hasSameRows) {
        return previous
      }

      return {
        ...previous,
        [dataset.virtualPath]: rows,
      }
    })
  }

  const datasetsForGraphs = useMemo(() => {
    if (!datasets || datasets.length === 0) {
      return datasets
    }

    return datasets.map((dataset) => {
      const filteredRows = filteredRowsByDataset[dataset.virtualPath]
      if (!filteredRows) {
        return dataset
      }
      return {
        ...dataset,
        rows: filteredRows,
      }
    })
  }, [datasets, filteredRowsByDataset])

  return (
    <main className="flex flex-col gap-6 text-left">
      <div className={selected ? 'hidden' : 'flex flex-col gap-6'}>
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Debater Evaluation Results
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{state.message}</p>
        </header>
        <section id="dataset-list" className="flex flex-col gap-5">
          {state.status === 'success' ? (
            datasets.map((dataset) => (
              <DatasetCard
                key={dataset.virtualPath}
                dataset={dataset}
                onSelectRow={handleSelectRow}
                onFilteredRowsChange={(rows, currentDataset) =>
                  handleFilteredRowsChange(currentDataset, rows)
                }
              />
            ))
          ) : state.status === 'loading' ? (
            <PlaceholderCard message="Fetching datasets…" />
          ) : state.status === 'empty' ? (
            <PlaceholderCard message="No datasets available to display." />
          ) : (
            <PlaceholderCard message="Unable to display datasets." tone="error" />
          )}
        </section>

        <AllEvaluationsGraphs datasets={datasetsForGraphs} />
      </div>

      {selected ? <DetailScreen row={selected.row} onBack={handleBack} /> : null}
    </main>
  )
}

export default App
