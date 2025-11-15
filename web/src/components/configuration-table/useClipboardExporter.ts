import { useCallback, useEffect, useRef, useState } from 'react'
import type { Table } from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

export type CopyStatus = 'idle' | 'copied' | 'error'

type TableExportCell = {
  text: string
  href?: string
}

export function useClipboardExporter(
  table: Table<FullDebateAnalysisRow>,
): {
  copyStatus: CopyStatus
  handleCopyTable: () => Promise<void>
} {
  const copyResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  const handleCopyTable = useCallback(async () => {
    try {
      const visibleColumns = table.getVisibleLeafColumns()
      const headers = visibleColumns.map((column) => {
        const meta = column.columnDef.meta as { exportLabel?: string } | undefined
        if (meta?.exportLabel) {
          return meta.exportLabel
        }
        const headerDef = column.columnDef.header
        if (typeof headerDef === 'string') {
          return headerDef
        }
        return column.id
      })

      const toExportCell = (input: unknown): TableExportCell => {
        if (input === null || input === undefined) {
          return { text: '' }
        }
        if (typeof input === 'string') {
          return { text: input }
        }
        if (typeof input === 'number' || typeof input === 'boolean') {
          return { text: String(input) }
        }
        if (typeof input === 'object') {
          const candidate = input as { text?: unknown; href?: unknown }
          const text =
            typeof candidate.text === 'string'
              ? candidate.text
              : candidate.text === undefined
              ? ''
              : String(candidate.text)
          const href = typeof candidate.href === 'string' ? candidate.href : undefined
          return { text, href }
        }
        return { text: '' }
      }

      const rowsForExport: TableExportCell[][] = table.getRowModel().rows.map((row) =>
        visibleColumns.map((column) => {
          const meta = column.columnDef.meta as {
            exportValue?: (
              originalRow: FullDebateAnalysisRow,
            ) => string | TableExportCell | number | boolean | null | undefined
          } | null
          if (meta?.exportValue) {
            return toExportCell(meta.exportValue(row.original))
          }

          const value = row.getValue<unknown>(column.id)
          return toExportCell(value)
        }),
      )

      const sanitizePlainCell = (cell: string) => cell.replace(/\t/g, ' ').replace(/\r?\n/g, ' ')
      const escapeHtml = (cell: string) =>
        cell
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')

      const plainRows = rowsForExport.map((row) => row.map((cell) => cell.text))

      const tableText = [headers, ...plainRows]
        .map((row) => row.map((cell) => sanitizePlainCell(cell)).join('\t'))
        .join('\n')

      const htmlTable = (() => {
        const headerRow = headers
          .map((header) => `<th>${escapeHtml(header)}</th>`)
          .join('')
        const bodyRows = rowsForExport
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => {
                  const text = escapeHtml(cell.text).replace(/\r?\n/g, '<br>')
                  if (cell.href) {
                    const href = escapeHtml(cell.href)
                    return `<td><a href="${href}">${text || 'Link'}</a></td>`
                  }
                  return `<td>${text}</td>`
                })
                .join('')}</tr>`,
          )
          .join('')
        return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`
      })()

      const clipboardItemCtor =
        typeof window !== 'undefined' && 'ClipboardItem' in window
          ? (window as typeof window & { ClipboardItem: typeof ClipboardItem }).ClipboardItem
          : undefined

      if (navigator.clipboard?.write && clipboardItemCtor) {
        const clipboardItem = new clipboardItemCtor({
          'text/html': new Blob([htmlTable], { type: 'text/html' }),
          'text/plain': new Blob([tableText], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([clipboardItem])
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(tableText)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    } finally {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current)
      }
      copyResetTimeout.current = setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
    }
  }, [table])

  useEffect(
    () => () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current)
      }
    },
    [],
  )

  return { copyStatus, handleCopyTable }
}
