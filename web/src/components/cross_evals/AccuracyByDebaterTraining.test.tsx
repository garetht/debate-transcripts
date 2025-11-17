import { describe, expect, it, vi } from 'vitest'
import type { PlotRenderer } from '../ResponsivePlot'
import type { DebateDataset } from '../../parquetLoader'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useCallback: <T extends (...args: unknown[]) => unknown>(callback: T) => callback,
  }
})

const { AccuracyByDebaterTraining } = await import('./AccuracyByDebaterTraining')

const buildRow = (overrides: Partial<FullDebateAnalysisRow>): FullDebateAnalysisRow => {
  const { configuration, stats, distribution, ...rest } = overrides
  return {
    stats: {
      judge_accuracy: 0.7,
      judge_standard_error: 0.04,
      ...(stats ?? {}),
    },
    configuration: {
      raw_name: 'config',
      config_type: 'type',
      task_type: 'quality',
      debater_name: 'debater',
      debater_base_model: 'base',
      debater_training_round: 'ROUND_ONE',
      debater_is_reasoning: false,
      debater_model_type: 'LLAMA3',
      debater_max_new_tokens: 0n,
      judge_base_model: 'model',
      judge_name: 'judge',
      judge_training_round: 'train',
      judge_model_type: 'judge',
      judge_max_new_tokens: 0n,
      ...(configuration ?? {}),
    },
    distribution: {
      transcript_count: 10n,
      ...(distribution ?? {}),
    },
    emptiness: {},
    lengths: {},
    ...(rest as Record<string, unknown>),
  } as FullDebateAnalysisRow
}

const buildDataset = (rows: FullDebateAnalysisRow[]): DebateDataset => ({
  virtualPath: 'path',
  url: 'url',
  rows,
})

describe('AccuracyByDebaterTraining', () => {
  it('creates plot options when datasets have rows', () => {
    const row = buildRow({})
    row.configuration.debater_training_round = 'ROUND_TWO'
    const dataset = buildDataset([row])

    const element = AccuracyByDebaterTraining({ datasets: [dataset] })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    const options = render(640)
    expect(options?.marks?.length ?? 0).toBeGreaterThan(0)
    expect(options?.x?.label).toContain('Debater Training')
  })

  it('returns null when datasets are missing', () => {
    const element = AccuracyByDebaterTraining({ datasets: [] })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    expect(render(640)).toBeNull()
  })
})
