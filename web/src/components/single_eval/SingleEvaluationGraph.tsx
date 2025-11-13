import type {JSX} from 'react'
import type {FullDebateAnalysisRow} from '../../fullDebateAnalysis.generated'
import {JudgeProbabilityScatter} from "./JudgeProbabilityScatter.tsx";

export function SingleEvaluationGraph({row}: {row: FullDebateAnalysisRow}): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <JudgeProbabilityScatter row={row} />
    </div>
  )
}
