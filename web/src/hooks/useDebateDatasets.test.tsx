import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { HookHarness } from '../test-utils/hookHarness'
import type { DebateDataset } from '../parquetLoader'

const harness = new HookHarness()
const loadDatasetsMock = vi.fn<() => Promise<DebateDataset[]>>()

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useMemo: function <T>(factory: () => T) {
      return harness.useMemo(factory)
    },
    useRef: function <T>(value: T) {
      return harness.useRef(value)
    },
    useEffect(effect: () => void | (() => void)) {
      harness.registerEffect(effect)
    },
    useState: function <T>(initial: T | (() => T)) {
      return harness.useState(initial)
    },
  }
})

vi.mock('../parquetLoader', async () => {
  const actual = await vi.importActual<typeof import('../parquetLoader')>('../parquetLoader')
  return {
    ...actual,
    loadAllDebateDatasets: loadDatasetsMock,
  }
})

const { useDebateDatasets } = await import('./useDebateDatasets')

const renderHook = () => {
  harness.beginRender()
  const result = useDebateDatasets()
  harness.runEffects()
  return result
}

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useDebateDatasets', () => {
  beforeEach(() => {
    harness.reset()
    loadDatasetsMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads datasets successfully', async () => {
    const datasets: DebateDataset[] = [
      {
        virtualPath: 'path',
        url: 'url',
        rows: [],
      },
    ]
    loadDatasetsMock.mockResolvedValue(datasets)

    let result = renderHook()
    expect(result.state.status).toBe('loading')

    await flushPromises()
    result = renderHook()
    expect(result.state.status).toBe('success')
    expect(result.state.message).toContain('Loaded 1 dataset')
    expect(result.datasets).toBe(datasets)
  })

  it('reports empty when no datasets are returned', async () => {
    loadDatasetsMock.mockResolvedValue([])
    let result = renderHook()
    await flushPromises()
    result = renderHook()
    expect(result.state.status).toBe('empty')
    expect(result.datasets).toEqual([])
  })

  it('reports an error when loading fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    loadDatasetsMock.mockRejectedValue(new Error('boom'))

    let result = renderHook()
    await flushPromises()
    result = renderHook()
    expect(result.state.status).toBe('error')
    expect(errorSpy).toHaveBeenCalled()
  })
})
