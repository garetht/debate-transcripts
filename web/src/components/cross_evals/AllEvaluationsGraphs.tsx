import type { JSX } from 'react'
import type { DebateDataset } from '../../parquetLoader'
import { AccuracyByDebaterTraining } from './AccuracyByDebaterTraining'
import { AccuracyByJudgeSetup } from './AccuracyByJudgeSetup'

interface AllDebatesGraphsProps {
  datasets?: DebateDataset[]
}

export function AllEvaluationsGraphs({ datasets }: AllDebatesGraphsProps): JSX.Element {
  return (
    <div className="mt-12 flex flex-col gap-12">
      <AccuracyByDebaterTraining datasets={datasets} />
      <AccuracyByJudgeSetup datasets={datasets} />
    </div>
  )
}
