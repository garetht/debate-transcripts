import { useMemo } from 'react'
import {
  createColumnHelper,
  type ColumnDef,
  type SortingFnOption,
} from '@tanstack/react-table'
import { interpolateRdBu, interpolateRdYlGn } from 'd3-scale-chromatic'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'
import { formatJudgeAccuracy } from '../../utils/judgeAccuracy'
import { formatJudgeStandardError } from '../../utils/judgeStandardError.ts'
import { DomainColorCell } from '../DomainColorCell'
import { stringIncludesCaseInsensitive } from './filters'

const columnHelper = createColumnHelper<FullDebateAnalysisRow>()

const numericSortingFn: SortingFnOption<FullDebateAnalysisRow> = (a, b, columnId) => {
  const valueA = a.getValue<number | null>(columnId)
  const valueB = b.getValue<number | null>(columnId)
  if (valueA === null && valueB === null) return 0
  if (valueA === null) return 1
  if (valueB === null) return -1
  return valueA - valueB
}

export const headerClassName = 'px-3 py-2'
export const defaultCellClassName = 'px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200'
export const cellClassNameMap: Record<string, string> = {
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

export function useConfigurationColumns({
  judgeAccuracyDomain,
  winSkewDomain,
}: {
  judgeAccuracyDomain: [number, number]
  winSkewDomain: [number, number]
}): ColumnDef<FullDebateAnalysisRow, any>[] {
  return useMemo<ColumnDef<FullDebateAnalysisRow, any>[]>(
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
          sortingFn: numericSortingFn,
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
          sortingFn: numericSortingFn,
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
          header: () => 'Bias to A',
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
          sortingFn: numericSortingFn,
          meta: {
            exportLabel: 'Bias to A',
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
          sortingFn: numericSortingFn,
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
}
