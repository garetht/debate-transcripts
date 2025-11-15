import { useMemo } from 'react'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

export function useFilteredRows(
  rows: FullDebateAnalysisRow[],
  hideLojbanTasks: boolean,
): FullDebateAnalysisRow[] {
  return useMemo(() => {
    if (!hideLojbanTasks) {
      return rows
    }

    return rows.filter((row) => {
      const taskType = row.configuration?.task_type?.trim().toLowerCase()
      return taskType !== 'lojban'
    })
  }, [hideLojbanTasks, rows])
}
