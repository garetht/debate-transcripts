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

const { AccuracyByJudgeSetup } = await import('./AccuracyByJudgeSetup')

const buildRow = (overrides: Partial<FullDebateAnalysisRow>): FullDebateAnalysisRow => {
  const { configuration, stats, ...rest } = overrides
  return {
    stats: {
      total_debates: 10n,
      judge_accuracy: 0.8,
      judge_standard_error: 0.05,
      ...(stats ?? {}),
    },
    configuration: {
      raw_name: 'config',
      config_type: 'type',
      task_type: 'quality',
      debater_name: 'debater',
      debater_base_model: 'base',
      debater_training_round: 'round',
      debater_is_reasoning: false,
      debater_model_type: 'type',
      debater_max_new_tokens: 0n,
      judge_base_model: 'model',
      judge_name: 'judge',
      judge_training_round: 'round',
      judge_model_type: 'judge-type',
      judge_max_new_tokens: 0n,
      ...(configuration ?? {}),
    },
    emptiness: {},
    distribution: {},
    lengths: {},
    ...(rest as Record<string, unknown>),
  } as FullDebateAnalysisRow
}

const buildDataset = (rows: FullDebateAnalysisRow[]): DebateDataset => ({
  virtualPath: 'path',
  url: 'url',
  rows,
})

describe('AccuracyByJudgeSetup', () => {
  it('produces plot options when datasets are provided', () => {
    const row = buildRow({})
    row.configuration.judge_training_round = 'A'
    const dataset = buildDataset([row])
    const element = AccuracyByJudgeSetup({ datasets: [dataset] })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    const options = render(640)
    expect(options?.marks?.length ?? 0).toBeGreaterThan(0)
    expect(options?.x?.label).toContain('Judge Model')
  })

  it('returns null when no datasets exist', () => {
    const element = AccuracyByJudgeSetup({ datasets: [] })
    const render = (element as { props: { render: PlotRenderer } }).props.render
    expect(render(640)).toBeNull()
  })
})
