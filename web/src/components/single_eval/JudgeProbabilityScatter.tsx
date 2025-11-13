import type {FullDebateAnalysisRow} from "../../fullDebateAnalysis.generated.ts";
import {type JSX, useCallback} from "react";
import {type PlotRenderer, ResponsivePlot} from "../ResponsivePlot.tsx";
import * as Plot from "@observablehq/plot";

export function JudgeProbabilityScatter({row}: { row: FullDebateAnalysisRow }): JSX.Element {
  const render = useCallback<PlotRenderer>(
      (width) => {
        const {debater_a_probs: a, debater_b_probs: b} = row.stats
        if ((!a || a.length === 0) && (!b || b.length === 0)) return null

        const data = [
          ...(a ?? []).map((value) => ({side: 'Debater A', value})),
          ...(b ?? []).map((value) => ({side: 'Debater B', value})),
        ]

        return {
          width,
          height: 260,
          marginBottom: 52,
          marginLeft: 72,
          style: {
            fontSize: '13px',
          },
          x: {
            label: 'Judge-assigned win probability',
            domain: [0, 1],
            ticks: 10,
            grid: true,
          },
          y: {
            label: 'Count',
            grid: true,
          },
          color: {
            label: 'Debater',
            legend: true,
          },
          marks: [
            Plot.axisY({label: 'Debater'}),
            Plot.text([null], {
              frameAnchor: 'top',
              text: () => 'Judged win probabilities per debater',
              dy: -20,
              fontSize: 16,
              fontWeight: 'bold',
            }),
            Plot.dot(data, {
              x: 'value',
              y: 'side',
              fill: 'side',
              r: 5,
              opacity: 0.8,
              tip: {
                format: {
                  x: (value: number) => value.toFixed(3),
                  y: false,
                  fill: false,
                },
              },
            }),
          ],
        }
      },
      [row.stats],
  )

  return <ResponsivePlot render={render}/>
}
