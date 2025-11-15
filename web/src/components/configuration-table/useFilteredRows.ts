import { useMemo } from 'react'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

export type TaskFilter = 'quality' | 'lojban'

export function useFilteredRows(rows: FullDebateAnalysisRow[], filter: TaskFilter): FullDebateAnalysisRow[] {
  return useMemo(() => {
    const normalizedFilter = filter.toLowerCase()

    return rows.filter((row) => {
      const taskType = row.configuration?.task_type?.trim().toLowerCase()
      return taskType === normalizedFilter
    })
  }, [filter, rows])
}
