import {useCallback} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {DebateDataset} from '../../parquetLoader'
import type {FullDebateAnalysisRow as DataT} from '../../fullDebateAnalysis.generated.ts'
import {ResponsivePlot, type PlotRenderer} from '../ResponsivePlot'

export interface AccuracyByJudgeSetupProps {
  datasets?: DebateDataset[]
}

export function AccuracyByJudgeSetup({datasets}: AccuracyByJudgeSetupProps): JSX.Element {
  const render = useCallback<PlotRenderer>(
    (width) => {
      if (!datasets || datasets.length === 0) return null

      const points = datasets.flatMap((dataset) => dataset.rows)
      if (points.length === 0) return null

      const data = points.map((row: DataT) => {
        const totalDebates = Number(row.stats.total_debates ?? 0n)
        const accuracy = row.stats.judge_accuracy ?? 0
        const se = row.stats.judge_standard_error ?? 0
        const lower = Math.max(0, accuracy - se)
        const upper = Math.min(1, accuracy + se)
        const label = `${row.configuration.judge_base_model} · ${row.configuration.judge_training_round}`

        return {
          label,
          judgeBaseModel: row.configuration.judge_base_model,
          judgeTrainingRound: row.configuration.judge_training_round,
          accuracy,
          lower,
          upper,
          totalDebates,
          debaterModelType: row.configuration.debater_model_type,
          debaterName: row.configuration.debater_name,
          taskType: row.configuration.task_type,
        }
      })

      const xDomain = Array.from(new Set(data.map((d) => d.label))).sort((a, b) =>
        a.localeCompare(b),
      )

      const uniqueTaskTypes = Array.from(
        new Set(
          data
            .map((point) => point.taskType?.trim().toLowerCase())
            .filter((taskType): taskType is string => Boolean(taskType)),
        ),
      )
      const taskTypeLabel =
        uniqueTaskTypes.length === 1
          ? uniqueTaskTypes[0]
          : uniqueTaskTypes.length > 1
          ? uniqueTaskTypes.join(' / ')
          : 'unknown task'

      return {
        height: 420,
        width: Math.max(width, 640),
        inset: 12,
        marginBottom: 150,
        style: {fontSize: '14px'},
        color: {label: 'Judge Training Round', legend: true, scheme: 'RdGy'},
        x: {
          label: 'Judge Model · Training Round',
          domain: xDomain,
          tickRotate: -30,
        },
        y: {
          label: 'Judge Accuracy',
          labelOffset: 36,
          grid: true,
          domain: [0, 1],
        },
        marks: [
          Plot.text([null], {
            frameAnchor: 'top',
            text: () => `Judge accuracy by judge setup (${taskTypeLabel})`,
            fontSize: 16,
            dy: -12,
          }),
          Plot.ruleY([0, 1], {strokeOpacity: 0.25}),
          Plot.ruleY(data, {
            x: 'label',
            // y1: 'lower',
            // y2: 'upper',
            stroke: (d) => d.judgeTrainingRound,
            strokeWidth: 3,
            strokeOpacity: 0.6,
          }),
          Plot.dot(data, {
            x: 'label',
            y: 'accuracy',
            fill: (d) => d.judgeTrainingRound,
            r: 3,
            tip: {
              fontSize: 13,
              lineHeight: 1.25,
              textOverflow: 'ellipsis-end',
              format: {
                x: false,
                y: (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`,
                fill: false,
              },
            },
            channels: {
              'Judge Base Model': (d) => d.judgeBaseModel,
              'Judge Training': (d) => d.judgeTrainingRound,
              'Judge Accuracy': (d) => `${(d.accuracy * 100).toFixed(1)}%`,
              'Standard Error': (d) => `${((d.upper - d.lower) / 2 * 100).toFixed(1)}%`,
              'Debater Model': (d) => d.debaterModelType,
              'Debater Name': (d) => d.debaterName,
              Task: (d) => d.taskType,
              'Total Debates': (d) => d.totalDebates,
            },
          }),
        ],
      }
    },
    [datasets],
  )

  return <ResponsivePlot render={render} className="w-full" />
}
