import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'

export function formatJudgeAccuracy(row: FullDebateAnalysisRow): string {
  return `${(row.stats.judge_accuracy * 100).toFixed(1)}%`
}
