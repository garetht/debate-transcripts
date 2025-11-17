type JudgeAccuracySource = {
  stats: {
    judge_accuracy: number
  }
}

export function formatJudgeAccuracy(row: JudgeAccuracySource): string {
  return `${(row.stats.judge_accuracy).toFixed(3)}`
}
