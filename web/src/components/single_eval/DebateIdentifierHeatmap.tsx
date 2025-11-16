import {useCallback, useMemo, type JSX} from "react";
import type {FullDebateAnalysisRow} from "../../fullDebateAnalysis.generated.ts";
import {ResponsivePlot, type PlotRenderer} from "../ResponsivePlot.tsx";
import * as Plot from "@observablehq/plot";

interface IdentifierDatum {
  identifier: string;
  count: number;
  row: number;
  column: number;
  displayIndex: number;
}

export function DebateIdentifierHeatmap({row}: {row: FullDebateAnalysisRow}): JSX.Element {
  const data = useMemo<IdentifierDatum[]>(() => {
    const counts = row.distribution.identifier_counts ?? {};
    const identifiers = Object.entries(counts)
      .map(([identifier, count]) => ({
        identifier,
        count: Number(count),
      }))
      .filter((datum) => Number.isFinite(datum.count) && datum.count > 0)
      .sort((a, b) => b.count - a.count || a.identifier.localeCompare(b.identifier));

    const columnCount = Math.ceil(Math.sqrt(identifiers.length)) || 1;

    return identifiers.map((datum, index) => ({
      ...datum,
      row: Math.floor(index / columnCount),
      column: index % columnCount,
      displayIndex: index + 1,
    }));
  }, [row.distribution.identifier_counts]);

  const render = useCallback<PlotRenderer>(
    (width) => {
      if (data.length === 0) return null;

      const columnCount = Math.max(...data.map((datum) => datum.column)) + 1;
      const rowCount = Math.max(...data.map((datum) => datum.row)) + 1;
      const availableWidth = Math.max(width - 120, 320);
      const cellSize = Math.max(8, Math.min(14, Math.floor(availableWidth / columnCount)));
      const heatmapWidth = cellSize * columnCount;
      const heatmapHeight = cellSize * rowCount;
      const maxIdentifierLength = Math.max(...data.map(datum => datum.identifier.length))

      return {
        width: Math.max(width, heatmapWidth + 80),
        height: heatmapHeight + 140,
        marginTop: 70,
        marginBottom: 60,
        marginLeft: 70,
        marginRight: 40,
        style: {
          fontSize: "13px",
        },
        x: {
          type: "band",
          domain: Array.from({length: columnCount}, (_, index) => index),
          label: "Identifier index",
          tickFormat: () => "",
          inset: 0,
          padding: 0,
        },
        y: {
          type: "band",
          domain: Array.from({length: rowCount}, (_, index) => index),
          label: "Identifier index",
          tickFormat: () => "",
          reverse: true,
          inset: 0,
          padding: 0,
        },
        color: {
          type: "linear" as const,
          scheme: "YlGnBu",
          label: "Transcript count",
          legend: true,
        },
        marks: [
          Plot.text([null], {
            frameAnchor: "top",
            text: () => "Transcript distribution by debate identifier",
            dy: -30,
            fontSize: 16,
            fontWeight: "bold",
          }),
          Plot.cell(data, {
            x: "column",
            y: "row",
            fill: "count",
            inset: 0,
            tip: {
              lineWidth: maxIdentifierLength > 550 ? 20 : Infinity,
              textOverflow: maxIdentifierLength > 550 ? "ellipsis-end" : null,
              format: {
                x: false,
                y: false,
                fill: (value: number) => `${value} transcript${value === 1 ? "" : "s"}`,
              },
              channels: {
                identifier: "identifier",
                count: "count",
                position: (datum: IdentifierDatum) => `#${datum.displayIndex}`,
              },
            },
          }),
        ],
      };
    },
    [data],
  );

  return <ResponsivePlot render={render} />;
}
