import { describe, expect, it } from 'vitest'
import { formatJudgeAccuracy } from './judgeAccuracy'
import { formatJudgeStandardError } from './judgeStandardError'

type TestRow = {
  emptiness: {
    empty_speech_counts: Record<string, bigint>
    debater_a_empty_files: string[]
    debater_b_empty_files: string[]
    unique_empty_files: string[]
    total_debates: bigint
  }
  lengths: {
    debater_a_lengths: bigint[]
    debater_b_lengths: bigint[]
    transcript_count: bigint
  }
  distribution: {
    identifier_counts: Record<string, bigint>
    title_counts: Record<string, bigint>
    transcript_count: bigint
  }
  stats: {
    total_debates: bigint
    debater_a_wins: bigint
    debater_b_wins: bigint
    judge_correct: bigint
    first_debater_correct: bigint
    debater_a_probs: number[]
    debater_b_probs: number[]
    judge_accuracy: number
    judge_standard_error: number
    debater_a_win_skew: number
    debater_a_divergence_from_uniform: bigint
    debater_b_divergence_from_uniform: bigint
  }
  configuration: {
    raw_name: string
    config_type: string
    task_type: string
    debater_name: string
    debater_base_model: string
    debater_training_round: string
    debater_is_reasoning: boolean
    debater_model_type: string
    debater_max_new_tokens: bigint
    judge_base_model: string
    judge_name: string
    judge_training_round: string
    judge_model_type: string
    judge_max_new_tokens: bigint
  }
}

const baseRow: TestRow = {
  emptiness: {
    empty_speech_counts: {},
    debater_a_empty_files: [],
    debater_b_empty_files: [],
    unique_empty_files: [],
    total_debates: 0n,
  },
  lengths: {
    debater_a_lengths: [],
    debater_b_lengths: [],
    transcript_count: 0n,
  },
  distribution: {
    identifier_counts: {},
    title_counts: {},
    transcript_count: 0n,
  },
  stats: {
    total_debates: 0n,
    debater_a_wins: 0n,
    debater_b_wins: 0n,
    judge_correct: 0n,
    first_debater_correct: 0n,
    debater_a_probs: [],
    debater_b_probs: [],
    judge_accuracy: 0,
    judge_standard_error: 0,
    debater_a_win_skew: 0,
    debater_a_divergence_from_uniform: 0n,
    debater_b_divergence_from_uniform: 0n,
  },
  configuration: {
    raw_name: '',
    config_type: '',
    task_type: '',
    debater_name: '',
    debater_base_model: '',
    debater_training_round: '',
    debater_is_reasoning: false,
    debater_model_type: '',
    debater_max_new_tokens: 0n,
    judge_base_model: '',
    judge_name: '',
    judge_training_round: '',
    judge_model_type: '',
    judge_max_new_tokens: 0n,
  },
}

const createRow = (
  statsOverrides: Partial<TestRow['stats']> = {},
): TestRow => ({
  ...baseRow,
  stats: {
    ...baseRow.stats,
    ...statsOverrides,
  },
})

describe('judge stat formatting helpers', () => {
  it('formats judge accuracy to three decimal places', () => {
    const row = createRow({ judge_accuracy: 0.98765 })
    expect(formatJudgeAccuracy(row)).toBe('0.988')
  })

  it('formats judge standard error to three decimal places', () => {
    const row = createRow({ judge_standard_error: 0.01234 })
    expect(formatJudgeStandardError(row)).toBe('0.012')
  })
})
