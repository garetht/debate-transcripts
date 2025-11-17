import { describe, expect, it, vi } from 'vitest'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'
import { HookHarness } from '../../test-utils/hookHarness'

const harness = new HookHarness()

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: function <T>(factory: () => T) {
      return harness.useMemo(factory)
    },
  }
})

const { useConfigurationColumns } = await import('./useConfigurationColumns')

const renderHook = (domains: { judge: [number, number]; win: [number, number] }) => {
  harness.beginRender()
  const result = useConfigurationColumns({
    judgeAccuracyDomain: domains.judge,
    winSkewDomain: domains.win,
  })
  return result
}

const sampleRow = {
  stats: {
    judge_accuracy: 0.9,
    judge_standard_error: 0.05,
    debater_a_win_skew: 1.5,
  },
  distribution: {
    transcript_count: 3,
  },
  emptiness: {
    unique_empty_files: ['a'],
  },
  configuration: {
    task_type: 'Quality ',
    debater_name: 'Alice ',
    debater_training_round: 'Round1',
    judge_name: 'Judge Judy',
    judge_training_round: 'Round2',
    raw_name: 'dataset/run',
  },
} as unknown as FullDebateAnalysisRow

describe('useConfigurationColumns', () => {
  it('returns the expected column identifiers', () => {
    const columns = renderHook({ judge: [0, 1], win: [-2, 2] })
    const ids = columns.map((column) => column.id)
    expect(ids).toEqual([
      'taskType',
      'debater',
      'debaterTrainingRound',
      'judge',
      'judgeTrainingRound',
      'judgeAccuracy',
      'judgeStandardError',
      'winSkew',
      'totalTranscripts',
      'emptyDebates',
      'github',
    ])
  })

  it('formats export values for numeric columns', () => {
    const columns = renderHook({ judge: [0, 1], win: [-2, 2] })
    const accuracyColumn = columns.find((column) => column.id === 'judgeAccuracy')
    const winColumn = columns.find((column) => column.id === 'winSkew')
    const githubColumn = columns.find((column) => column.id === 'github')
    const accuracyMeta = accuracyColumn?.meta as {
      exportValue?: (row: FullDebateAnalysisRow) => string
    }
    const winMeta = winColumn?.meta as {
      exportValue?: (row: FullDebateAnalysisRow) => string
    }
    const githubMeta = githubColumn?.meta as {
      exportValue?: (row: FullDebateAnalysisRow) => { text: string; href: string }
    }

    expect(accuracyMeta?.exportValue?.(sampleRow)).toBe('0.900')
    expect(winMeta?.exportValue?.(sampleRow)).toBe('1.5')
    expect(githubMeta?.exportValue?.(sampleRow)).toEqual({
      text: 'Link',
      href: expect.stringContaining('dataset/run/outputs'),
    })
  })
})
