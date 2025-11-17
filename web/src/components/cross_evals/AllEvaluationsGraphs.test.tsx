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

const buildDataset = (modelType: string, size: number): DebateDataset => ({
  virtualPath: modelType,
  url: '',
  rows: Array.from({ length: size }, (_, index) => ({
    configuration: {
      debater_model_type: modelType,
      debater_training_round: `ROUND_${index}`,
    },
  })) as unknown as FullDebateAnalysisRow[],
})

describe('AllEvaluationsGraphs', () => {
  it('filters datasets by model type for debater training charts', () => {
    const datasets = [buildDataset('LLAMA3', 2), buildDataset('OPENAI', 1)]
    const html = renderToStaticMarkup(<AllEvaluationsGraphs datasets={datasets} />)
    expect(html).toContain('data-testid="debater-training"')
    expect(html).toContain('data-testid="judge-setup"')
    expect(debaterTrainingMock).toHaveBeenCalledTimes(2)
    const llamaRows = debaterTrainingMock.mock.calls[0][0]?.[0].rows as FullDebateAnalysisRow[]
    const openaiRows = debaterTrainingMock.mock.calls[1][0]?.[0].rows as FullDebateAnalysisRow[]
    expect(llamaRows.every((row) => row.configuration.debater_model_type === 'LLAMA3')).toBe(true)
    expect(openaiRows.every((row) => row.configuration.debater_model_type === 'OPENAI')).toBe(true)
    expect(judgeSetupMock).toHaveBeenCalledWith(datasets)
  })
})
