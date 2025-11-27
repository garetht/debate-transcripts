import { useCallback, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { DatasetCard } from './components/DatasetCard'
import { PlaceholderCard } from './components/PlaceholderCard'
import { useDebateDatasets, type LoadingState } from './hooks/useDebateDatasets'
import type { DebateDataset } from './parquetLoader'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'
import { DetailScreen } from './screens/DetailScreen'
import { AllEvaluationsGraphs } from './components/cross_evals/AllEvaluationsGraphs.tsx'

type FilteredDatasetMap = Record<string, number[]>

export function App(): JSX.Element {
  const { datasets, state } = useDebateDatasets()
  const navigate = useNavigate()
  const [filteredRowsByDataset, setFilteredRowsByDataset] = useState<FilteredDatasetMap>({})

  const handleSelectRow = useCallback(
    (row: FullDebateAnalysisRow) => {
      const rawName = row.configuration?.raw_name
      if (!rawName) {
        console.warn('Cannot navigate to detail view because row.configuration.raw_name is missing.')
        return
      }
      navigate(`/detail/${encodeURIComponent(rawName)}`)
    },
    [navigate],
  )

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleFilteredRowsChange = useCallback(
    (dataset: DebateDataset, rows: FullDebateAnalysisRow[]) => {
      setFilteredRowsByDataset((previous) => {
        const indices = rows
          .map((row) => dataset.rows.indexOf(row))
          .filter((index): index is number => index >= 0)
        const existing = previous[dataset.virtualPath]
        const hasSameRows =
          existing !== undefined &&
          existing.length === indices.length &&
          existing.every((index, position) => index === indices[position])

        if (hasSameRows) {
          return previous
        }

        return {
          ...previous,
          [dataset.virtualPath]: indices,
        }
      })
    },
    [],
  )

  const datasetsForGraphs = useMemo(() => {
    if (!datasets || datasets.length === 0) {
      return datasets
    }

    return datasets.map((dataset) => {
      const filteredIndices = filteredRowsByDataset[dataset.virtualPath]
      if (!filteredIndices) {
        return dataset
      }
      const filteredRows = filteredIndices
        .map((index) => dataset.rows[index])
        .filter((row): row is FullDebateAnalysisRow => row !== undefined)
      return {
        ...dataset,
        rows: filteredRows,
      }
    })
  }, [datasets, filteredRowsByDataset])

  return (
    <main className="flex flex-col gap-6 text-left">
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex flex-col gap-6">
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
                      onSelectRow={(row) => handleSelectRow(row)}
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

              <AllEvaluationsGraphs datasets={datasets} filteredDatasets={datasetsForGraphs} />
            </div>
          }
        />
        <Route
          path="/detail/:rawName"
          element={
            <DetailRoute datasets={datasets} state={state} onBack={handleBack} />
          }
        />
        <Route path="*" element={<PlaceholderCard message="Page not found." tone="error" />} />
      </Routes>
    </main>
  )
}

export default App

function DetailRoute({
  datasets,
  state,
  onBack,
}: {
  datasets: DebateDataset[]
  state: LoadingState
  onBack: () => void
}): JSX.Element {
  const { rawName: rawNameParam } = useParams<{ rawName: string }>()
  const decodedRawName = useMemo(() => {
    if (!rawNameParam) return ''
    try {
      return decodeURIComponent(rawNameParam)
    } catch {
      return rawNameParam
    }
  }, [rawNameParam])

  const matchingRow = useMemo(() => {
    if (!decodedRawName) {
      return undefined
    }
    for (const dataset of datasets) {
      const row = dataset.rows.find(
        (currentRow) => currentRow.configuration?.raw_name === decodedRawName,
      )
      if (row) {
        return row
      }
    }
    return undefined
  }, [datasets, decodedRawName])

  if (state.status === 'loading') {
    return <PlaceholderCard message="Fetching datasets…" />
  }

  if (state.status === 'error') {
    return <PlaceholderCard message={state.message} tone="error" />
  }

  if (state.status === 'empty') {
    return <PlaceholderCard message="No datasets available to display." />
  }

  if (!matchingRow) {
    return <PlaceholderCard message="Configuration not found." tone="error" />
  }

  const detailKey = matchingRow.configuration?.raw_name
  if (!detailKey) {
    return <PlaceholderCard message="Configuration is missing a raw name." tone="error" />
  }

  return <DetailScreen key={detailKey} row={matchingRow} onBack={onBack} />
}
