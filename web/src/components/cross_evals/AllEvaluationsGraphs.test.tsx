import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { DebateDataset } from '../../parquetLoader'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

const debaterTrainingMock = vi.fn()
const judgeSetupMock = vi.fn()

vi.mock('./AccuracyByDebaterTraining', () => ({
  AccuracyByDebaterTraining: (props: { datasets?: DebateDataset[] }) => {
    debaterTrainingMock(props.datasets)
    return <div data-testid="debater-training" />
  },
}))

vi.mock('./AccuracyByJudgeSetup', () => ({
  AccuracyByJudgeSetup: (props: { datasets?: DebateDataset[] }) => {
    judgeSetupMock(props.datasets)
    return <div data-testid="judge-setup" />
  },
}))

const { AllEvaluationsGraphs } = await import('./AllEvaluationsGraphs')

const buildDataset = (modelType: string, taskType: 'quality' | 'lojban', size: number): DebateDataset => ({
  virtualPath: `${modelType}-${taskType}`,
  url: '',
  rows: Array.from({ length: size }, (_, index) => ({
    configuration: {
      debater_model_type: modelType,
      debater_training_round: `ROUND_${index}`,
      task_type: taskType,
    },
  })) as unknown as FullDebateAnalysisRow[],
})

describe('AllEvaluationsGraphs', () => {
  it('filters datasets by model type for debater training charts', () => {
    debaterTrainingMock.mockClear()
    judgeSetupMock.mockClear()
    const datasets = [
      buildDataset('LLAMA3', 'quality', 2),
      buildDataset('LLAMA3', 'lojban', 1),
      buildDataset('OPENAI', 'quality', 3),
      buildDataset('OPENAI', 'lojban', 1),
    ]
    const filteredDatasets = datasets.map((dataset) => ({
      ...dataset,
      rows: dataset.rows.filter(
        (row) => row.configuration.task_type === 'quality',
      ),
    }))
    const html = renderToStaticMarkup(
      <AllEvaluationsGraphs datasets={datasets} filteredDatasets={filteredDatasets} />,
    )
    expect(html).toContain('data-testid="debater-training"')
    expect(html).toContain('data-testid="judge-setup"')
    expect(debaterTrainingMock).toHaveBeenCalledTimes(4)
    const llamaQualityRows = debaterTrainingMock.mock.calls[0][0]?.[0].rows as FullDebateAnalysisRow[]
    const llamaLojbanRows = debaterTrainingMock.mock.calls[1][0]?.[0].rows as FullDebateAnalysisRow[]
    const openaiQualityRows = debaterTrainingMock.mock.calls[2][0]?.[0].rows as FullDebateAnalysisRow[]
    const openaiLojbanRows = debaterTrainingMock.mock.calls[3][0]?.[0].rows as FullDebateAnalysisRow[]
    expect(llamaQualityRows.every((row) => row.configuration.debater_model_type === 'LLAMA3')).toBe(true)
    expect(llamaQualityRows.every((row) => row.configuration.task_type === 'quality')).toBe(true)
    expect(llamaLojbanRows.every((row) => row.configuration.debater_model_type === 'LLAMA3')).toBe(true)
    expect(llamaLojbanRows.every((row) => row.configuration.task_type === 'lojban')).toBe(true)
    expect(openaiQualityRows.every((row) => row.configuration.debater_model_type === 'OPENAI')).toBe(true)
    expect(openaiQualityRows.every((row) => row.configuration.task_type === 'quality')).toBe(true)
    expect(openaiLojbanRows.every((row) => row.configuration.debater_model_type === 'OPENAI')).toBe(true)
    expect(openaiLojbanRows.every((row) => row.configuration.task_type === 'lojban')).toBe(true)
    expect(judgeSetupMock).toHaveBeenCalledTimes(2)
    const judgeQualityRows = judgeSetupMock.mock.calls[0][0]?.[0].rows as FullDebateAnalysisRow[]
    const judgeLojbanRows = judgeSetupMock.mock.calls[1][0]?.[0].rows as FullDebateAnalysisRow[]
    expect(judgeQualityRows.every((row) => row.configuration.task_type === 'quality')).toBe(true)
    expect(judgeLojbanRows.every((row) => row.configuration.task_type === 'lojban')).toBe(true)
  })
})
