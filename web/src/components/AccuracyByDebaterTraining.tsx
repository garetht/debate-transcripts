import {useEffect, useRef} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {Plot as PlotT} from '@observablehq/plot'
import type {DebateDataset} from '../parquetLoader'
import type {FullDebateAnalysisRow as DataT} from '../fullDebateAnalysis.generated.ts'

const TRAINING_DOMAIN = ['SFT_ONLY', 'ROUND_TWO_DPO', 'RFT'] as const

export interface AccuracyByDebaterTrainingProps {
  datasets?: DebateDataset[]
}

export function AccuracyByDebaterTraining({datasets}: AccuracyByDebaterTrainingProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let currentPlot: ((SVGSVGElement & PlotT) | (HTMLElement & PlotT)) | null = null

    const renderPlot = () => {
      if (!container) return
      if (!datasets || datasets.length === 0) {
        container.replaceChildren()
        return
      }

      const points = datasets.flatMap((dataset) => dataset.rows.map((row) => row))

      if (points.length === 0) {
        container.replaceChildren()
        return
      }

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

      const width = Math.max(container.clientWidth, 640)

      const plot = Plot.plot({
        height: 360,
        width,
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
          domain: [0, 1],
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
          Plot.ruleY([0, 1], {strokeOpacity: 0.3}),
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
              'Debater Model': (d: DataT) => d.configuration.debater_name,
              'Debater Training': (d: DataT) => d.configuration.debater_training_round,
              'Judge Model': (d: DataT) => d.configuration.judge_name,
              'Judge Training': (d: DataT) => d.configuration.judge_training_round,
              'Judge Accuracy': (d: DataT) => d.stats.judge_accuracy,
            },
          }),
        ],
      })
      container.replaceChildren(plot)
      currentPlot = plot
    }

    renderPlot()
    const resizeObserver = new ResizeObserver(() => renderPlot())
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      currentPlot?.remove()
    }
  }, [datasets])

  return <div ref={containerRef} className="w-full" />
}
