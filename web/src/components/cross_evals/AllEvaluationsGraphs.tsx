import type { JSX } from 'react'
import type { DebateDataset } from '../../parquetLoader'
import { AccuracyByDebaterTraining } from './AccuracyByDebaterTraining'
import { AccuracyByJudgeSetup } from './AccuracyByJudgeSetup'

interface AllDebatesGraphsProps {
  datasets?: DebateDataset[]
}

export function AllEvaluationsGraphs({ datasets }: AllDebatesGraphsProps): JSX.Element {
  const llamaOnlyDatasets =
    datasets
      ?.map((dataset) => ({
        ...dataset,
        rows: dataset.rows.filter(
          (row) => row.configuration.debater_model_type === 'LLAMA3',
        ),
      }))
      .filter((dataset) => dataset.rows.length > 0) ?? datasets
  const openaiOnlyDatasets =
      datasets
          ?.map((dataset) => ({
            ...dataset,
            rows: dataset.rows.filter(
                (row) => row.configuration.debater_model_type === 'OPENAI',
            ),
          }))
          .filter((dataset) => dataset.rows.length > 0) ?? datasets

  return (
    <div className="mt-12 flex flex-col gap-12">
      <AccuracyByDebaterTraining datasets={llamaOnlyDatasets} />
      <AccuracyByDebaterTraining datasets={openaiOnlyDatasets} />
      <AccuracyByJudgeSetup datasets={datasets} />
    </div>
  )
}
