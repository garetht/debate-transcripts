import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'
import { loadAllDebateDatasets, type DebateDataset } from './parquetLoader'

type LoadingState =
  | { status: 'loading'; message: string }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

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

function formatJudgeAccuracy(row: FullDebateAnalysisRow): string {
  const totalDebates = row.stats?.total_debates
  const judgeCorrect = row.stats?.judge_correct
  if (
    typeof totalDebates !== 'bigint' ||
    typeof judgeCorrect !== 'bigint' ||
    totalDebates === 0n
  ) {
    return '—'
  }
  const total = Number(totalDebates)
  const correct = Number(judgeCorrect)
  if (!Number.isFinite(total) || total === 0 || !Number.isFinite(correct)) {
    return '—'
  }
  const accuracy = (correct / total) * 100
  return `${accuracy.toFixed(1)}%`
}

function ConfigurationTable({ rows }: { rows: FullDebateAnalysisRow[] }): JSX.Element {
  return (
    <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-slate-200/60 bg-white/70 shadow-inner transition-colors dark:border-slate-700/60 dark:bg-slate-950/40">
      <table className="min-w-full table-auto divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-100/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
          <tr>
            <th scope="col" className="px-4 py-3">
              Task Type
            </th>
            <th scope="col" className="px-4 py-3">
              Debater Name
            </th>
            <th scope="col" className="px-4 py-3">
              Judge Name
            </th>
            <th scope="col" className="px-4 py-3">
              Judge Accuracy
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((row, index) => (
            <tr
              key={`${row.configuration?.task_type ?? 'task'}-${row.configuration?.debater_name ?? 'debater'}-${row.configuration?.judge_name ?? 'judge'}-${index}`}
              className="transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-500/20"
            >
              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                {row.configuration?.task_type ?? '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex flex-col">
                  <span>{row.configuration?.debater_name ?? '—'}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Training Round: {row.configuration?.debater_training_round ?? '—'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-300">
                {row.configuration?.judge_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-300">
                {formatJudgeAccuracy(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
