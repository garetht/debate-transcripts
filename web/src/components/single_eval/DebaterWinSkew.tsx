import {useCallback} from "react";
import * as Plot from "@observablehq/plot";
import type {JSX} from "react";
import type {FullDebateAnalysisRow} from "../../fullDebateAnalysis.generated.ts";
import {ResponsivePlot, type PlotRenderer} from "../ResponsivePlot.tsx";

export function DebaterWinSkew({row}: {row: FullDebateAnalysisRow}): JSX.Element {
  const render = useCallback<PlotRenderer>(
    (width) => {
      const divergenceA = Number(row.stats.debater_a_divergence_from_uniform ?? 0n);
      const divergenceB = Number(row.stats.debater_b_divergence_from_uniform ?? 0n);
      const transcriptCount = Number(row.distribution.transcript_count ?? 0n);
      if (divergenceA === 0 && divergenceB === 0) return null;

      const data = [
        {side: "Debater A", divergence: divergenceA, value: divergenceA},
        {side: "Debater B", divergence: divergenceB, value: divergenceB},
      ];
      const maxMagnitude = Math.max(Math.abs(divergenceA), Math.abs(divergenceB), 1);
      const labelPadding = Math.max(1, Math.round(maxMagnitude * 0.05));
      const positiveLabels = data
        .filter((entry) => entry.value >= 0)
        .map((entry) => ({
          ...entry,
          xLabel: entry.value + labelPadding,
        }));
      const negativeLabels = data
        .filter((entry) => entry.value < 0)
        .map((entry) => ({
          ...entry,
          xLabel: entry.value - labelPadding,
        }));

      return {
        height: 220,
        width: Math.max(width, 520),
        inset: 16,
        marginBottom: 40,
        marginLeft: 120,
        style: {fontSize: "13px"},
        color: {
          legend: false,
        },
        x: {
          label: "Δ wins vs uniform",
          grid: true,
          nice: true,
          domain: [-transcriptCount / 4, transcriptCount / 4],
        },
        y: {
          label: "",
        },
        marks: [
          Plot.text([null], {
            frameAnchor: "top",
            text: () => "Win divergence by debater",
            fontSize: 16,
            dy: -20,
          }),
          Plot.ruleX([0], {stroke: "#94a3b8", strokeOpacity: 0.8}),
          Plot.barX(data, {
            y: "side",
            x: "value",
            fill: "side",
            tip: {
              fontSize: 13,
              format: {
                x: (value: number) => {
                  const formatted = Math.abs(value).toLocaleString();
                  return `${formatted} win${Math.abs(value) === 1 ? "" : "s"} from uniform`;
                },
                y: false,
                fill: false,
              },
            },
            channels: {
              Side: (d) => d.side,
              Divergence: (d) => d.divergence.toLocaleString(),
            },
          }),
          Plot.text(positiveLabels, {
            y: "side",
            x: "xLabel",
            text: (d) => (d.divergence > 0 ? `+${d.divergence.toLocaleString()}` : d.divergence.toLocaleString()),
            textAnchor: "start",
            fontWeight: "bold",
            fill: "#fff",

          }),
          Plot.text(negativeLabels, {
            y: "side",
            x: "xLabel",
            text: (d) => d.divergence.toLocaleString(),
            textAnchor: "end",
            fontWeight: "bold",
            fill: "#fff",
          }),
        ],
      };
    },
    [
      row.stats.debater_a_divergence_from_uniform,
      row.stats.debater_b_divergence_from_uniform,
      row.distribution.transcript_count,
    ],
  );

  return <ResponsivePlot render={render}/>;
}
