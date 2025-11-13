import type { JSX } from 'react'
import type { DebateDataset } from '../parquetLoader'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { formatJudgeAccuracy } from '../utils/judgeAccuracy'
import {formatJudgeStandardError} from "../utils/judgeStandardError.ts";
import {SingleEvaluationGraph} from '../components/single_eval/SingleEvaluationGraph.tsx'

export function DetailScreen({
  dataset,
  row,
  onBack,
}: {
  dataset: DebateDataset
  row: FullDebateAnalysisRow
  onBack: () => void
}): JSX.Element {
  const sections = buildSections(row)
  const configuration = row.configuration

  const summaryItems = [
    {
      label: 'Task Type',
      value: configuration?.task_type ?? '—',
    },
    {
      label: 'Debater',
      value: configuration?.debater_name ?? '—',
    },
    {
      label: 'Debater Training Round',
      value: configuration?.debater_training_round ?? '—',
    },
    {
      label: 'Judge',
      value: configuration?.judge_name ?? '—',
    },
    {
      label: 'Judge Training Round',
      value: configuration?.judge_training_round ?? '—',
    },
    {
      label: 'Judge Accuracy',
      value: formatJudgeAccuracy(row),
    },
    {
      label: 'Judge Standard Error',
      value: formatJudgeStandardError(row),
    },
  ]

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200 dark:focus-visible:ring-indigo-300/60"
        >
          <span aria-hidden="true">←</span>
          Back to datasets
        </button>
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Configuration Detail
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Dataset: {dataset.virtualPath} • {dataset.url}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {summaryItems.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">{value}</dd>
          </div>
        ))}
      </div>

      <SingleEvaluationGraph row={row} />

      <div className="space-y-4 rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-4 text-sm text-slate-700 shadow-inner dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-slate-200">
        <h2 className="text-base font-semibold text-indigo-700 dark:text-indigo-200">
          Detail Fields
        </h2>
        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                {section.title}
              </h3>
              <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {section.entries.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 rounded-md border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-950/40"
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {label}
                    </dt>
                    <dd className="text-sm text-slate-700 dark:text-slate-100 whitespace-pre-wrap break-words">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}

type Section = {
  title: string
  entries: Array<{ label: string; value: string }>
}

function buildSections(row: FullDebateAnalysisRow): Section[] {
  return [
    {
      title: 'Configuration',
      entries: toEntries(row.configuration),
    },
    {
      title: 'Stats',
      entries: toEntries(row.stats),
    },
    {
      title: 'Distribution',
      entries: toEntries(row.distribution),
    },
    {
      title: 'Lengths',
      entries: toEntries(row.lengths),
    },
    {
      title: 'Emptiness',
      entries: toEntries(row.emptiness),
    },
  ].filter((section) => section.entries.length > 0)
}

function toEntries(value: unknown): Array<{ label: string; value: string }> {
  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.entries(value as Record<string, unknown>).map(([key, val]) => ({
    label: key.replace(/_/g, ' '),
    value: formatValue(val),
  }))
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : '—'
  if (typeof value === 'string') return value || '—'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (value.length <= 6 && value.every(isPrimitive)) {
      return `[${value.map((item) => formatValue(item)).join(', ')}]`
    }
    return `${value.length} items`
  }
  if (value instanceof Uint8Array) {
    return `Uint8Array(${value.byteLength})`
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '—' : value.toISOString()
  }

  const replacer = (_key: string, val: unknown) => {
    if (typeof val === 'bigint') return val.toString()
    return val
  }
  try {
    return JSON.stringify(value, replacer, 2)
  } catch {
    return String(value)
  }
}

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  )
}
