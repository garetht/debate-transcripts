import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import type { DebateDataset } from '../../parquetLoader'
import type { FullDebateAnalysisRow } from '../../fullDebateAnalysis.generated'

const plotMock = vi.fn().mockReturnValue({ remove: vi.fn() })
const textMock = vi.fn()
const ruleYMock = vi.fn()
const barYMock = vi.fn()

vi.mock('@observablehq/plot', () => ({
  plot: plotMock,
  text: textMock,
  ruleY: ruleYMock,
  barY: barYMock,
}))

const effects: Array<() => void | (() => void)> = []
const containerStub = {
  clientWidth: 800,
  replaceChildren: vi.fn(),
} as unknown as HTMLDivElement

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useRef: () => ({ current: containerStub }),
    useEffect(effect: () => void | (() => void)) {
      effects.push(effect)
    },
  }
})

const { DebaterWinRateByModel } = await import('./DebaterWinRateByModel')

const buildRow = (overrides: Partial<FullDebateAnalysisRow>): FullDebateAnalysisRow => {
  const { configuration, stats, ...rest } = overrides
  return {
    stats: {
      total_debates: 10n,
      debater_a_wins: 6n,
      debater_b_wins: 4n,
      ...(stats ?? {}),
    },
    configuration: {
      raw_name: 'config',
      config_type: 'type',
      task_type: 'quality',
      debater_name: 'debater',
      debater_base_model: 'base',
      debater_training_round: 'round',
      debater_is_reasoning: false,
      debater_model_type: 'LLAMA3',
      debater_max_new_tokens: 0n,
      judge_base_model: 'model',
      judge_name: 'judge',
      judge_training_round: 'train',
      judge_model_type: 'judge',
      judge_max_new_tokens: 0n,
      ...(configuration ?? {}),
    },
    emptiness: {},
    distribution: {},
    lengths: {},
    ...(rest as Record<string, unknown>),
  } as FullDebateAnalysisRow
}

const buildDataset = (rows: FullDebateAnalysisRow[]): DebateDataset => ({
  virtualPath: 'path',
  url: 'url',
  rows,
})

describe('DebaterWinRateByModel', () => {
  beforeEach(() => {
    plotMock.mockClear()
    textMock.mockClear()
    ruleYMock.mockClear()
    barYMock.mockClear()
    containerStub.replaceChildren = vi.fn()
    effects.length = 0
    class MockResizeObserver {
      callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
      }
      observe(): void {}
      disconnect(): void {}
    }
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    })
  })

  afterEach(() => {
    effects.length = 0
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
  })

  it('renders a plot when datasets contain rows', () => {
    DebaterWinRateByModel({
      datasets: [buildDataset([buildRow({})])],
    })
    const cleanup = effects.shift()
    cleanup?.()
    expect(plotMock).toHaveBeenCalled()
    expect(containerStub.replaceChildren).toHaveBeenCalled()
  })

  it('clears the container when no data is available', () => {
    DebaterWinRateByModel({ datasets: [] })
    const cleanup = effects.shift()
    cleanup?.()
    expect(plotMock).not.toHaveBeenCalled()
    expect(containerStub.replaceChildren).toHaveBeenCalled()
  })
})
