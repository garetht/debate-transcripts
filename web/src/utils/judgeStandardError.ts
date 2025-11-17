type JudgeStandardErrorSource = {
  stats: {
    judge_standard_error: number
  }
}

export function formatJudgeStandardError(row: JudgeStandardErrorSource): string {
  return `${row.stats.judge_standard_error.toFixed(3)}`
}
