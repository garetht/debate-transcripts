import type {JSX} from 'react'
import type {FullDebateAnalysisRow} from '../../fullDebateAnalysis.generated'
import {JudgeProbabilityScatter} from "./JudgeProbabilityScatter.tsx";
import {DebateIdentifierHeatmap} from "./DebateIdentifierHeatmap.tsx";
import {DebaterWinSkew} from "./DebaterWinSkew.tsx";

export function SingleEvaluationGraph({row}: {row: FullDebateAnalysisRow}): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <JudgeProbabilityScatter row={row} />
      <DebaterWinSkew row={row} />
      <DebateIdentifierHeatmap row={row} />
    </div>
  )
}
