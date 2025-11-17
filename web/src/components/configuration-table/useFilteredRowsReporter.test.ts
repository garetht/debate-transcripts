import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Row } from '@tanstack/react-table'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

type Effect = () => void | (() => void)

const hookHarness = {
  effects: [] as Effect[],
  refStore: [] as Array<{ current: unknown }>,
  beginRender() {
    this.effects = []
    this.refStore = this.refStore.length ? this.refStore : []
    this.refIndex = 0
  },
  runEffects() {
    for (const effect of this.effects) {
      const cleanup = effect()
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  },
  refIndex: 0,
  useRef(initialValue: unknown) {
    const index = this.refIndex++
    if (!this.refStore[index]) {
      this.refStore[index] = { current: initialValue }
    }
    return this.refStore[index]
  },
}

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: <T>(factory: () => T) => factory(),
    useRef: <T>(initialValue: T) => hookHarness.useRef(initialValue) as { current: T },
    useEffect: (effect: Effect) => {
      hookHarness.effects.push(effect)
    },
  }
})

const { useFilteredRowsReporter } = await import('./useFilteredRowsReporter')

const createRow = (id: string): Row<FullDebateAnalysisRow> =>
  ({
    id,
    original: { configuration: { raw_name: id } } as FullDebateAnalysisRow,
  }) as Row<FullDebateAnalysisRow>

describe('useFilteredRowsReporter', () => {
  beforeEach(() => {
    hookHarness.beginRender()
  })

  it('does not throw when onFilteredRowsChange is undefined', () => {
    expect(() => {
      useFilteredRowsReporter([createRow('one')], undefined)
      hookHarness.runEffects()
    }).not.toThrow()
  })

  it('invokes the callback with the original rows when they change', () => {
    const callback = vi.fn()
    const rows = [createRow('a'), createRow('b')]
    useFilteredRowsReporter(rows, callback)
    hookHarness.runEffects()
    expect(callback).toHaveBeenCalledWith(rows.map((row) => row.original))
  })

  it('avoids calling the callback when the row order is unchanged', () => {
    const callback = vi.fn()
    const rows = [createRow('x'), createRow('y')]
    useFilteredRowsReporter(rows, callback)
    hookHarness.runEffects()

    hookHarness.beginRender()
    useFilteredRowsReporter(rows, callback)
    hookHarness.runEffects()

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
