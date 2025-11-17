import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const parquetReadObjectsMock = vi.fn()

vi.mock('hyparquet', () => ({
  parquetReadObjects: parquetReadObjectsMock,
}))

const { fetchFullDebateAnalysisRows } = await import('./fullDebateAnalysis.generated')

describe('fetchFullDebateAnalysisRows', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    parquetReadObjectsMock.mockReset()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('fetches parquet data and returns parsed rows', async () => {
    const rows = [{ id: 1 }]
    parquetReadObjectsMock.mockResolvedValue(rows)
    const arrayBufferSpy = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: arrayBufferSpy,
    } as unknown as Response)

    const result = await fetchFullDebateAnalysisRows('/fake-path')
    expect(result).toBe(rows)
    expect(arrayBufferSpy).toHaveBeenCalledTimes(1)
    expect(parquetReadObjectsMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the response status is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response)

    await expect(fetchFullDebateAnalysisRows('/broken')).rejects.toThrow(
      'parquet fetch failed 500',
    )
  })

  it('throws if fetch is unavailable', async () => {
    // @ts-expect-error - explicitly remove fetch
    globalThis.fetch = undefined
    await expect(fetchFullDebateAnalysisRows('/nope')).rejects.toThrow(
      'fetch is not available in this environment',
    )
  })
})
