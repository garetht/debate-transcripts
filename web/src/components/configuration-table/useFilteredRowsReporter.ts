import { useEffect, useMemo, useRef } from 'react'
import type { Row } from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

export function useFilteredRowsReporter(
  tableRows: Row<FullDebateAnalysisRow>[],
  onFilteredRowsChange?: (rows: FullDebateAnalysisRow[]) => void,
): void {
  const filteredRowOriginals = useMemo(
    () => tableRows.map((row) => row.original),
    [tableRows],
  )
  const lastReportedRows = useRef<FullDebateAnalysisRow[]>([])

  useEffect(() => {
    if (!onFilteredRowsChange) {
      return
    }

    const hasSameRows =
      lastReportedRows.current.length === filteredRowOriginals.length &&
      lastReportedRows.current.every((row, index) => row === filteredRowOriginals[index])

    if (hasSameRows) {
      return
    }

    lastReportedRows.current = filteredRowOriginals
    onFilteredRowsChange(filteredRowOriginals)
  }, [filteredRowOriginals, onFilteredRowsChange])
}
