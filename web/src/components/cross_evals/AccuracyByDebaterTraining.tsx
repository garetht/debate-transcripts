import {useCallback} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {SymbolType} from '@observablehq/plot'
import type {DebateDataset} from '../../parquetLoader'
import type {FullDebateAnalysisRow as DataT} from '../../fullDebateAnalysis.generated.ts'
import {ResponsivePlot, type PlotRenderer} from '../ResponsivePlot'


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

      const uniqueTaskTypes = Array.from(
        new Set(
          points
            .map((point) => point.configuration.task_type?.trim().toLowerCase())
            .filter((taskType): taskType is string => Boolean(taskType)),
        ),
      )
      const taskTypeLabel =
        uniqueTaskTypes.length === 1
          ? uniqueTaskTypes[0]
          : uniqueTaskTypes.length > 1
          ? uniqueTaskTypes.join(' / ')
          : 'unknown task'

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
        judgeBaseModel: point.configuration.judge_base_model,
      }))

      const errorBarCaps = pointsWithError.flatMap((point) => [
        {
          x: point.configuration.debater_training_round,
          y: point.lower,
          debaterModelType: point.configuration.debater_model_type,
          judgeBaseModel: point.configuration.judge_base_model,
        },
        {
          x: point.configuration.debater_training_round,
          y: point.upper,
          debaterModelType: point.configuration.debater_model_type,
          judgeBaseModel: point.configuration.judge_base_model,
        },
      ])

      const trainings = Array.from(
        new Set(
          points
            .map((point) => point.configuration.debater_training_round)
        ),
      )
      const trainingDomain = [...trainings]

      type ConnectionAccumulator = {
        fromPoint?: DataT
        toPoint?: DataT
        debaterModelType?: DataT['configuration']['debater_model_type']
        judgeBaseModel?: DataT['configuration']['judge_base_model']
      }

      const connectionPairs: Array<{
        fromRound: DataT['configuration']['debater_training_round']
        toRound: DataT['configuration']['debater_training_round']
      }> = [
        {fromRound: 'SFT_ONLY', toRound: 'ROUND_TWO_DPO'},
        {fromRound: 'UNTRAINED', toRound: 'RFT'},
      ]

      const connections = connectionPairs.flatMap(({fromRound, toRound}) => {
        const map = new Map<string, ConnectionAccumulator>()

        for (const point of points) {
          const {
            debater_training_round,
            debater_base_model,
            judge_base_model,
            judge_training_round,
            debater_model_type,
          } = point.configuration
          if (debater_training_round !== fromRound && debater_training_round !== toRound) continue

          const key = [fromRound, toRound, debater_base_model, judge_base_model, judge_training_round].join('::')
          const existing = map.get(key) ?? {}
          if (debater_training_round === fromRound) {
            existing.fromPoint = point
          } else {
            existing.toPoint = point
          }
          if (!existing.debaterModelType) {
            existing.debaterModelType = debater_model_type
          }
          if (!existing.judgeBaseModel) {
            existing.judgeBaseModel = point.configuration.judge_base_model
          }
          map.set(key, existing)
        }

        return Array.from(map.values())
          .filter(({fromPoint, toPoint}) => fromPoint && toPoint)
          .map(({fromPoint, toPoint, debaterModelType, judgeBaseModel}) => ({
            x1: fromRound,
            y1: fromPoint!.stats.judge_accuracy,
            x2: toRound,
            y2: toPoint!.stats.judge_accuracy,
            debaterModelType: debaterModelType ?? fromPoint!.configuration.debater_model_type,
            judgeBaseModel: judgeBaseModel ?? fromPoint!.configuration.judge_base_model,
          }))
      })

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
          domain: [0.45, 0.95],
        },
        color: {
          label: 'Judge Model',
          legend: true,
        },
        marks: [
          Plot.text([null], {
            frameAnchor: 'top',
            text: () => `Judge accuracy by debater training (${taskTypeLabel})`,
            fontSize: 16,
            dy: -12,
          }),
          Plot.ruleY([0.45, 0.95], {strokeOpacity: 0.3}),
          Plot.link(errorBarSegments, {
            x1: 'x1',
            y1: 'y1',
            x2: 'x2',
            y2: 'y2',
            stroke: 'judgeBaseModel',
            strokeWidth: 1.5,
            strokeOpacity: 0.6,
          }),
          Plot.dot(errorBarCaps, {
            x: 'x',
            y: 'y',
            symbol: ERROR_BAR_CAP_SYMBOL,
            stroke: 'judgeBaseModel',
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
                    stroke: 'judgeBaseModel',
                    strokeWidth: 1.5,
                    strokeOpacity: 0.6,
                  }),
                ]
              : []
          ),
          Plot.dot(pointsWithError, {
            x: (d: PointWithError) => d.configuration.debater_training_round,
            y: (d: PointWithError) => d.accuracy,
            fill: (d: PointWithError) => d.configuration.judge_base_model,
            stroke: (d: PointWithError) => d.configuration.judge_base_model,
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
