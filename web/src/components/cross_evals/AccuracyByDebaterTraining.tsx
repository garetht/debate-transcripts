import {useCallback} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {DebateDataset} from '../../parquetLoader'
import type {FullDebateAnalysisRow as DataT} from '../../fullDebateAnalysis.generated.ts'
import {ResponsivePlot, type PlotRenderer} from '../ResponsivePlot'

const TRAINING_DOMAIN = ['SFT_ONLY', 'ROUND_TWO_DPO', 'RFT'] as const

export interface AccuracyByDebaterTrainingProps {
  datasets?: DebateDataset[]
}

export function AccuracyByDebaterTraining({datasets}: AccuracyByDebaterTrainingProps): JSX.Element {
  const render = useCallback<PlotRenderer>(
    (width) => {
      if (!datasets || datasets.length === 0) return null

      const points = datasets.flatMap((dataset) => dataset.rows)
      if (points.length === 0) return null

      const extras = Array.from(
        new Set(
          points
            .map((point) => point.configuration.debater_training_round)
            .filter(
              (round) => !TRAINING_DOMAIN.includes(round as (typeof TRAINING_DOMAIN)[number]),
            ),
        ),
      )
      const trainingDomain = [...TRAINING_DOMAIN, ...extras]

      return {
        height: 360,
        width: Math.max(width, 640),
        inset: 12,
        marginBottom: 64,
        style: {
          fontSize: '14px',
        },
        x: {
          label: 'Amount of Debater Training',
          domain: trainingDomain,
          grid: true,
        },
        y: {
          label: 'Judge Accuracy',
          labelOffset: 36,
          grid: true,
          domain: [0.45, 0.85],
        },
        color: {
          label: 'Debater Model Type',
          legend: true,
        },
        marks: [
          Plot.text([null], {
            frameAnchor: 'top',
            text: () => 'Judge accuracy by debater training round',
            fontSize: 16,
            dy: -12,
          }),
          Plot.ruleY([0.45, 0.85], {strokeOpacity: 0.3}),
          Plot.dot(points, {
            x: (d: DataT) => d.configuration.debater_training_round,
            y: (d: DataT) => d.stats.judge_accuracy,
            fill: (d: DataT) => d.configuration.debater_model_type,
            r: 4,
            tip: {
              fontSize: 13,
              lineHeight: 1.25,
              textOverflow: 'ellipsis-end',
              format: {
                x: false,
                y: false,
                fill: false,
              },
            },
            channels: {
              Task: (d: DataT) => d.configuration.task_type,
              'Debater Model': (d: DataT) => d.configuration.debater_base_model,
              'Debater Training': (d: DataT) => d.configuration.debater_training_round,
              'Judge Model': (d: DataT) => d.configuration.judge_base_model,
              'Judge Training': (d: DataT) => d.configuration.judge_training_round,
              'Judge Accuracy': (d: DataT) => d.stats.judge_accuracy,
            },
          }),
        ],
      }
    },
    [datasets],
  )

  return <ResponsivePlot render={render} className="w-full" />
}
