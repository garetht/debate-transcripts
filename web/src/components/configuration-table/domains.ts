import { useMemo } from 'react'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

export function useJudgeAccuracyDomain(rows: FullDebateAnalysisRow[]): [number, number] {
  return useMemo(() => {
    const values = rows
      .map((row) => {
        const value = row.stats.judge_accuracy
        return value === undefined || value === null ? null : Number(value)
      })
      .filter((value): value is number => value != null && Number.isFinite(value))

    if (values.length === 0) {
      return [0, 1]
    }

    const min = Math.min(...values)
    const max = Math.max(...values)
    const lowerBound = Math.min(0, min)
    const upperBound = Math.max(1, max)

    if (lowerBound === upperBound) {
      const padding = Math.max(Math.abs(lowerBound) * 0.1, 0.1)
      return [lowerBound - padding, upperBound + padding]
    }

    return [lowerBound, upperBound]
  }, [rows])
}

export function useWinSkewDomain(rows: FullDebateAnalysisRow[]): [number, number] {
  return useMemo(() => {
    const values = rows
      .map((row) => {
        const value = row.stats.debater_a_win_skew
        if (value === undefined || value === null) {
          return null
        }
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : null
      })
      .filter((value): value is number => value != null)

    if (values.length === 0) {
      return [0, 1]
    }

    const min = Math.min(...values)
    const max = Math.max(...values)

    if (min === max) {
      const padding = Math.max(Math.abs(min) * 0.1, 1)
      return [min - padding, max + padding]
    }

    return [min, max]
  }, [rows])
}
