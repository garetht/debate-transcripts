import {useEffect, useRef} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {Plot as PlotT} from '@observablehq/plot'
import type {DebateDataset} from '../parquetLoader'
import type {FullDebateAnalysisRow as DataT} from '../fullDebateAnalysis.generated.ts'

export interface DebaterWinRateByModelProps {
  datasets?: DebateDataset[]
}

export function DebaterWinRateByModel({datasets}: DebaterWinRateByModelProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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

      const aggregates = new Map<
        string,
        {modelType: string; debaterWins: number; opponentWins: number; totalDebates: number}
      >()

      for (const row of points as DataT[]) {
        const modelType = row.configuration.debater_model_type ?? 'Unknown'
        const total = Number(row.stats.total_debates ?? 0n)
        const debaterAWins = Number(row.stats.debater_a_wins ?? 0n)
        const debaterBWins = Number(row.stats.debater_b_wins ?? 0n)

        const entry =
          aggregates.get(modelType) ??
          {modelType, debaterWins: 0, opponentWins: 0, totalDebates: 0}

        entry.debaterWins += debaterAWins
        entry.opponentWins += debaterBWins
        entry.totalDebates += total

        aggregates.set(modelType, entry)
      }

      const data: Array<{
        modelType: string
        outcome: 'Debater Wins' | 'Opponent Wins'
        rate: number
        wins: number
        totalDebates: number
      }> = []

      for (const entry of aggregates.values()) {
        if (entry.totalDebates <= 0) continue
        const debaterRate = entry.debaterWins / entry.totalDebates
        const opponentRate = entry.opponentWins / entry.totalDebates

        data.push({
          modelType: entry.modelType,
          outcome: 'Debater Wins',
          rate: debaterRate,
          wins: entry.debaterWins,
          totalDebates: entry.totalDebates,
        })
        data.push({
          modelType: entry.modelType,
          outcome: 'Opponent Wins',
          rate: Math.max(0, Math.min(1, opponentRate)),
          wins: entry.opponentWins,
          totalDebates: entry.totalDebates,
        })
      }

      const width = Math.max(container.clientWidth, 640)

      const plot = Plot.plot({
        height: 360,
        width,
        inset: 12,
        marginBottom: 64,
        style: {fontSize: '14px'},
        color: {label: 'Outcome'},
        x: {
          label: 'Debater Model Type',
          domain: Array.from(new Set(data.map((d) => d.modelType))),
        },
        y: {
          label: 'Win Rate',
          labelOffset: 36,
          grid: true,
          domain: [0, 1],
        },
        marks: [
          Plot.text([null], {
            frameAnchor: 'top',
            text: () => 'Debater win rates by model type',
            fontSize: 16,
            dy: -12,
          }),
          Plot.ruleY([0, 1], {strokeOpacity: 0.25}),
          Plot.barY(data, {
            x: 'modelType',
            y: 'rate',
            fill: 'outcome',
            tip: {
              fontSize: 13,
              lineHeight: 1.25,
              textOverflow: 'ellipsis-end',
              format: {
                y: (value: number) => `${(value * 100).toFixed(1)}%`,
              },
            },
            channels: {
              Outcome: (d) => d.outcome,
              'Win Rate': (d) => `${(d.rate * 100).toFixed(1)}%`,
              Wins: (d) => d.wins,
              'Total Debates': (d) => d.totalDebates,
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

