import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import type { Table } from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'
import { HookHarness } from '../../test-utils/hookHarness'

const harness = new HookHarness()

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: <T>(factory: () => T) => harness.useMemo(factory),
    useRef: <T>(value: T) => harness.useRef(value),
    useEffect: (effect: () => void | (() => void)) => harness.registerEffect(effect),
    useState: <T>(initial: T | (() => T)) => harness.useState(initial),
    useCallback: <T extends (...args: unknown[]) => unknown>(callback: T) =>
      harness.useCallback(callback),
  }
})

const { useClipboardExporter } = await import('./useClipboardExporter')

type MockColumn = {
  id: string
  columnDef: {
    header: string
    meta?: {
      exportLabel?: string
      exportValue?: (row: FullDebateAnalysisRow) => unknown
    }
  }
}

const createTable = (): Table<FullDebateAnalysisRow> =>
  ({
    getVisibleLeafColumns: () =>
      [
        {
          id: 'task',
          columnDef: { header: 'Task', meta: { exportLabel: 'Task Label' } },
        },
        {
          id: 'custom',
          columnDef: {
            header: 'Custom',
            meta: {
              exportValue: () => ({ text: 'Link', href: 'https://example.com' }),
            },
          },
        },
      ] as MockColumn[],
    getRowModel: () => ({
      rows: [
        {
          original: {
            configuration: { task_type: 'Quality' },
            stats: { judge_accuracy: 0.9 },
          } as unknown as FullDebateAnalysisRow,
          getValue: (columnId: string) =>
            columnId === 'task' ? 'Quality' : { text: 'View', href: 'https://fallback.example' },
        },
      ],
    }),
  }) as unknown as Table<FullDebateAnalysisRow>

const setNavigator = (value: Navigator) => {
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  })
}

const setWindow = (value: Window & typeof globalThis) => {
  Object.defineProperty(globalThis, 'window', {
    value,
    configurable: true,
    writable: true,
  })
}

const renderHook = (table: Table<FullDebateAnalysisRow>) => {
  harness.beginRender()
  const result = useClipboardExporter(table)
  harness.runEffects()
  return result
}

describe('useClipboardExporter', () => {
  beforeEach(() => {
    harness.reset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete (globalThis as { window?: unknown }).window
    delete (globalThis as { navigator?: unknown }).navigator
  })

  it('copies table data using ClipboardItem when available', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined)
    class FakeClipboardItem {
      data: Record<string, Blob>
      constructor(data: Record<string, Blob>) {
        this.data = data
      }
    }
    setNavigator({
      clipboard: {
        write: writeMock,
      },
    } as unknown as Navigator)
    setWindow({
      ClipboardItem: FakeClipboardItem,
    } as unknown as Window & typeof globalThis)

    const table = createTable()
    let hookResult = renderHook(table)

    await hookResult.handleCopyTable()
    expect(writeMock).toHaveBeenCalledTimes(1)
    const clipboardItem = writeMock.mock.calls[0][0][0] as FakeClipboardItem
    expect(clipboardItem).toBeInstanceOf(FakeClipboardItem)

    hookResult = renderHook(table)
    expect(hookResult.copyStatus).toBe('copied')

    await vi.runAllTimersAsync()
    hookResult = renderHook(table)
    expect(hookResult.copyStatus).toBe('idle')
  })

  it('falls back to writeText when ClipboardItem is not available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    setNavigator({
      clipboard: {
        writeText: writeTextMock,
      },
    } as unknown as Navigator)
    setWindow({} as unknown as Window & typeof globalThis)

    const table = createTable()
    let hookResult = renderHook(table)
    await hookResult.handleCopyTable()
    expect(writeTextMock).toHaveBeenCalledTimes(1)

    hookResult = renderHook(table)
    expect(hookResult.copyStatus).toBe('copied')
  })

  it('sets error status when clipboard interaction fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('no clipboard'))
    setNavigator({
      clipboard: {
        writeText: writeTextMock,
      },
    } as unknown as Navigator)
    setWindow({} as unknown as Window & typeof globalThis)

    const table = createTable()
    let hookResult = renderHook(table)
    await hookResult.handleCopyTable()
    hookResult = renderHook(table)
    expect(hookResult.copyStatus).toBe('error')
  })
})
