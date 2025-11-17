import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'
import { DetailScreen } from './DetailScreen'

const buildRow = (): FullDebateAnalysisRow =>
  ({
    configuration: {
      raw_name: 'config-1',
      task_type: 'quality',
      debater_name: 'Debater',
      debater_training_round: 'ROUND_ONE',
      judge_name: 'Judge',
      judge_training_round: 'ROUND_ONE',
    },
    stats: {
      judge_accuracy: 0.9,
      debater_a_win_skew: 1.2,
    },
    lengths: {
      debater_a_lengths: [10n, 20n],
    },
    emptiness: {
      unique_empty_files: ['file'],
    },
    distribution: {
      transcript_count: 2n,
    },
  }) as unknown as FullDebateAnalysisRow

describe('DetailScreen', () => {
  it('renders summary cards and detail sections for the row', () => {
    const row = buildRow()
    const html = renderToStaticMarkup(<DetailScreen row={row} onBack={vi.fn()} />)
    expect(html).toContain('Configuration Detail')
    expect(html).toContain('Back to datasets')
    expect(html).toContain('Debater')
    expect(html).toContain('config-1')
    expect(html).toContain('0.9')
    expect(html).toContain('[10, 20]')
  })
})
