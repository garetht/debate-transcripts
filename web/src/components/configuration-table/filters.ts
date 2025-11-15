import type { FilterFn } from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

export const stringIncludesCaseInsensitive: FilterFn<FullDebateAnalysisRow> = (
  row,
  columnId,
  filterValue,
) => {
  if (typeof filterValue !== 'string') {
    return true
  }

  const normalizedFilter = filterValue.trim().toLowerCase()
  if (normalizedFilter === '') {
    return true
  }

  const rawValue = row.getValue<unknown>(columnId)
  if (rawValue == null) {
    return false
  }

  return String(rawValue).toLowerCase().includes(normalizedFilter)
}

stringIncludesCaseInsensitive.autoRemove = (value) =>
  typeof value !== 'string' || value.trim() === ''
