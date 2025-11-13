import {useCallback} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {SymbolType} from '@observablehq/plot'
import type {DebateDataset} from '../../parquetLoader'
import type {FullDebateAnalysisRow as DataT} from '../../fullDebateAnalysis.generated.ts'
import {ResponsivePlot, type PlotRenderer} from '../ResponsivePlot'

const TRAINING_DOMAIN = ['SFT_ONLY', 'ROUND_TWO_DPO', 'RFT'] as const

const ERROR_BAR_CAP_SYMBOL: SymbolType = {
  draw(context: CanvasRenderingContext2D, _size: number) {
    const halfLength = 6
    context.moveTo(-halfLength, 0)
    context.lineTo(halfLength, 0)
  },
}

export interface AccuracyByDebaterTrainingProps {
  datasets?: DebateDataset[]
}

export function AccuracyByDebaterTraining({datasets}: AccuracyByDebaterTrainingProps): JSX.Element {
  const render = useCallback<PlotRenderer>(
    (width) => {
      if (!datasets || datasets.length === 0) return null

      const points = datasets.flatMap((dataset) => dataset.rows)
      if (points.length === 0) return null

      const pointsWithError = points.map((point) => {
        const accuracy = point.stats.judge_accuracy ?? 0
        const standardError = point.stats.judge_standard_error ?? 0
        const lower = Math.max(0, accuracy - standardError)
        const upper = Math.min(1, accuracy + standardError)

        return {
          ...point,
          accuracy,
          standardError,
          lower,
          upper,
        }
      })
      type PointWithError = (typeof pointsWithError)[number]

      const errorBarSegments = pointsWithError.map((point) => ({
        x1: point.configuration.debater_training_round,
        y1: point.lower,
        x2: point.configuration.debater_training_round,
        y2: point.upper,
        debaterModelType: point.configuration.debater_model_type,
      }))

      const errorBarCaps = pointsWithError.flatMap((point) => [
        {
          x: point.configuration.debater_training_round,
          y: point.lower,
          debaterModelType: point.configuration.debater_model_type,
        },
        {
          x: point.configuration.debater_training_round,
          y: point.upper,
          debaterModelType: point.configuration.debater_model_type,
        },
      ])

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

      const connectionsMap = new Map<
        string,
        {
          sft?: DataT
          dpo?: DataT
          debaterModelType?: DataT['configuration']['debater_model_type']
        }
      >()

      for (const point of points) {
        const {debater_training_round, debater_base_model, judge_base_model, judge_training_round, debater_model_type} =
          point.configuration
        if (debater_training_round !== 'SFT_ONLY' && debater_training_round !== 'ROUND_TWO_DPO') continue
        const key = [debater_base_model, judge_base_model, judge_training_round].join('::')
        const existing = connectionsMap.get(key) ?? {}
        if (debater_training_round === 'SFT_ONLY') {
          existing.sft = point
        } else {
          existing.dpo = point
        }
        if (!existing.debaterModelType) {
          existing.debaterModelType = debater_model_type
        }
        connectionsMap.set(key, existing)
      }

      const connections = Array.from(connectionsMap.values())
        .filter(({sft, dpo}) => sft && dpo)
        .map(({sft, dpo, debaterModelType}) => ({
          x1: 'SFT_ONLY',
          y1: sft!.stats.judge_accuracy,
          x2: 'ROUND_TWO_DPO',
          y2: dpo!.stats.judge_accuracy,
          debaterModelType: debaterModelType ?? sft!.configuration.debater_model_type,
        }))

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
            text: () => 'Judge accuracy by debater training',
            fontSize: 16,
            dy: -12,
          }),
          Plot.ruleY([0.45, 0.85], {strokeOpacity: 0.3}),
          Plot.link(errorBarSegments, {
            x1: 'x1',
            y1: 'y1',
            x2: 'x2',
            y2: 'y2',
            stroke: 'debaterModelType',
            strokeWidth: 1.5,
            strokeOpacity: 0.6,
          }),
          Plot.dot(errorBarCaps, {
            x: 'x',
            y: 'y',
            symbol: ERROR_BAR_CAP_SYMBOL,
            stroke: 'debaterModelType',
            strokeWidth: 1.5,
            strokeOpacity: 0.6,
            strokeLinecap: 'round',
            fill: null,
          }),
          ...(
            connections.length > 0
              ? [
                  Plot.link(connections, {
                    x1: 'x1',
                    y1: 'y1',
                    x2: 'x2',
                    y2: 'y2',
                    stroke: 'debaterModelType',
                    strokeWidth: 1.5,
                    strokeOpacity: 0.6,
                  }),
                ]
              : []
          ),
          Plot.dot(pointsWithError, {
            x: (d: PointWithError) => d.configuration.debater_training_round,
            y: (d: PointWithError) => d.accuracy,
            fill: (d: PointWithError) => d.configuration.debater_model_type,
            r: 3,
            tip: {
              fontSize: 13,
              lineHeight: 1.25,
              textOverflow: 'ellipsis-end',
              format: {
                x: false,
                y: (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`,
                fill: false,
                'Standard Error': (value: number) => `${(value * 100).toFixed(1)}%`,
              },
            },
            channels: {
              Task: (d: PointWithError) => d.configuration.task_type,
              'Debater Model': (d: PointWithError) => d.configuration.debater_base_model,
              'Debater Training': (d: PointWithError) => d.configuration.debater_training_round,
              'Judge Model': (d: PointWithError) => d.configuration.judge_base_model,
              'Judge Training': (d: PointWithError) => d.configuration.judge_training_round,
              'Judge Accuracy': (d: PointWithError) => d.accuracy,
              'Standard Error': (d: PointWithError) => d.standardError,
            },
          }),
        ],
      }
    },
    [datasets],
  )

  return <ResponsivePlot render={render} className="w-full" />
}
