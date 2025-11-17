import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const drawMock = vi.fn()
const plotRemoveMock = vi.fn()
const plotMock = vi.fn().mockReturnValue({ remove: plotRemoveMock })

vi.mock('@observablehq/plot', () => ({
  plot: plotMock,
}))

const effects: Array<() => void | (() => void)> = []
const containerStub = {
  clientWidth: 600,
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

const { ResponsivePlot } = await import('./ResponsivePlot')

class MockResizeObserver {
  private callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.created = this
  }
  observe(): void {}
  disconnect(): void {}
  trigger(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
  static created: MockResizeObserver | null = null
}

describe('ResponsivePlot', () => {
  beforeEach(() => {
    effects.length = 0
    plotMock.mockClear()
    plotRemoveMock.mockClear()
    containerStub.replaceChildren = vi.fn()
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    })
  })

  afterEach(() => {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
  })

  it('draws a plot on mount and responds to resize events', () => {
    const render = vi.fn().mockImplementation((width: number) => {
      drawMock(width)
      return { mark: 'config' }
    })

    const element = ResponsivePlot({ render })
    expect(element).toBeTruthy()

    const cleanup = effects[0]?.()
    expect(render).toHaveBeenCalledWith(600)
    expect(containerStub.replaceChildren).toHaveBeenCalled()
    expect(plotMock).toHaveBeenCalled()

    MockResizeObserver.created?.trigger()
    expect(render).toHaveBeenCalledTimes(2)

    cleanup?.()
    expect(plotRemoveMock).toHaveBeenCalled()
  })

  it('skips drawing when the render callback returns null', () => {
    const render = vi.fn().mockReturnValue(null)
    ResponsivePlot({ render })
    effects[0]?.()
    expect(plotMock).not.toHaveBeenCalled()
  })
})
