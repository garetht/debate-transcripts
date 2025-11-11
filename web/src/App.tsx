import { useState } from 'react'
import type { JSX } from 'react'
import { DatasetCard } from './components/DatasetCard'
import { PlaceholderCard } from './components/PlaceholderCard'
import { useDebateDatasets } from './hooks/useDebateDatasets'
import type { DebateDataset } from './parquetLoader'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'
import { DetailScreen } from './screens/DetailScreen'

export function App(): JSX.Element {
  const { datasets, state } = useDebateDatasets()
  const [selected, setSelected] = useState<{
    dataset: DebateDataset
    row: FullDebateAnalysisRow
  } | null>(null)

  const handleSelectRow = (row: FullDebateAnalysisRow, dataset: DebateDataset) => {
    setSelected({ dataset, row })
  }

  const handleBack = () => {
    setSelected(null)
  }

  return (
    <main className="flex flex-col gap-6 text-left">
      {selected ? (
        <DetailScreen dataset={selected.dataset} row={selected.row} onBack={handleBack} />
      ) : (
        <>
          <header className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Parquet Schema Preview
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
        </>
      )}
    </main>
  )
}

export default App
