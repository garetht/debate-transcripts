import type { JSX } from 'react'
import type { DebateDataset } from '../../parquetLoader'
import { AccuracyByDebaterTraining } from './AccuracyByDebaterTraining'
import { AccuracyByJudgeSetup } from './AccuracyByJudgeSetup'

interface AllDebatesGraphsProps {
  datasets?: DebateDataset[]
  filteredDatasets?: DebateDataset[]
}

type TaskType = 'quality' | 'lojban'

const TASK_ORDER: TaskType[] = ['quality', 'lojban']

export function AllEvaluationsGraphs({
  datasets,
  filteredDatasets,
}: AllDebatesGraphsProps): JSX.Element {
  const fallbackDatasetsByTask: Record<TaskType, DebateDataset[]> = {
    quality: filterDatasetsByTask(datasets, 'quality'),
    lojban: filterDatasetsByTask(datasets, 'lojban'),
  }

  const filteredDatasetsByTask: Record<TaskType, DebateDataset[]> = {
    quality: filterDatasetsByTask(filteredDatasets ?? datasets, 'quality'),
    lojban: filterDatasetsByTask(filteredDatasets ?? datasets, 'lojban'),
  }

  const datasetsByTask: Record<TaskType, DebateDataset[]> = {
    quality: filteredDatasetsByTask.quality.length > 0
      ? filteredDatasetsByTask.quality
      : fallbackDatasetsByTask.quality,
    lojban: filteredDatasetsByTask.lojban.length > 0
      ? filteredDatasetsByTask.lojban
      : fallbackDatasetsByTask.lojban,
  }

  const llamaDatasetsByTask: Record<TaskType, DebateDataset[]> = {
    quality: filterDatasetsByDebaterModel(datasetsByTask.quality, 'LLAMA3'),
    lojban: filterDatasetsByDebaterModel(datasetsByTask.lojban, 'LLAMA3'),
  }

  const openaiDatasetsByTask: Record<TaskType, DebateDataset[]> = {
    quality: filterDatasetsByDebaterModel(datasetsByTask.quality, 'OPENAI'),
    lojban: filterDatasetsByDebaterModel(datasetsByTask.lojban, 'OPENAI'),
  }

  return (
    <div className="mt-12 flex flex-col gap-12">
      <div className="grid gap-12 lg:grid-cols-2">
        {TASK_ORDER.map((task) => (
          <div key={`llama-${task}`} className="flex flex-col">
            <AccuracyByDebaterTraining datasets={llamaDatasetsByTask[task]} />
          </div>
        ))}
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        {TASK_ORDER.map((task) => (
          <div key={`openai-${task}`} className="flex flex-col">
            <AccuracyByDebaterTraining datasets={openaiDatasetsByTask[task]} />
          </div>
        ))}
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        {TASK_ORDER.map((task) => (
          <div key={`judge-${task}`} className="flex flex-col">
            <AccuracyByJudgeSetup datasets={datasetsByTask[task]} />
          </div>
        ))}
      </div>
    </div>
  )
}

function filterDatasetsByTask(
  datasets: DebateDataset[] | undefined,
  task: TaskType,
): DebateDataset[] {
  if (!datasets) {
    return []
  }
  return datasets
    .map((dataset) => ({
      ...dataset,
      rows: dataset.rows.filter(
        (row) => normalizeTaskType(row.configuration.task_type) === task,
      ),
    }))
    .filter((dataset) => dataset.rows.length > 0)
}

function filterDatasetsByDebaterModel(
  datasets: DebateDataset[],
  modelType: string,
): DebateDataset[] {
  return datasets
    .map((dataset) => ({
      ...dataset,
      rows: dataset.rows.filter(
        (row) => row.configuration.debater_model_type === modelType,
      ),
    }))
    .filter((dataset) => dataset.rows.length > 0)
}

function normalizeTaskType(value: string | undefined | null): string | undefined {
  if (!value) {
    return undefined
  }
  const normalized = value.trim().toLowerCase()
  return normalized === '' ? undefined : normalized
}
