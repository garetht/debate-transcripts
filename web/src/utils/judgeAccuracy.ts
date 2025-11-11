import type { FullDebateAnalysisRow } from '../fullDebateAnalysis.generated'

export function getJudgeAccuracyValue(row: FullDebateAnalysisRow): number | null {
  const totalDebates = row.stats?.total_debates
  const judgeCorrect = row.stats?.judge_correct
  if (
    typeof totalDebates !== 'bigint' ||
    typeof judgeCorrect !== 'bigint' ||
    totalDebates === 0n
  ) {
    return null
  }

  const total = Number(totalDebates)
  const correct = Number(judgeCorrect)
  if (!Number.isFinite(total) || total === 0 || !Number.isFinite(correct)) {
    return null
  }

  return (correct / total) * 100
}

export function formatJudgeAccuracy(row: FullDebateAnalysisRow): string {
  const accuracy = getJudgeAccuracyValue(row)
  if (accuracy === null) {
    return '—'
  }
  return `${accuracy.toFixed(1)}%`
}
