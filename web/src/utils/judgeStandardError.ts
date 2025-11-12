import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'

export function formatJudgeStandardError(row: FullDebateAnalysisRow): string {
  return `${(row.stats.judge_standard_error / 100).toFixed(3)}`
}
