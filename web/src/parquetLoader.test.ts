import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { FullDebateAnalysisRow } from './fullDebateAnalysis.generated'

const fetchMock =
  vi.fn<typeof import('./fullDebateAnalysis.generated')['fetchFullDebateAnalysisRows']>()

vi.mock('./fullDebateAnalysis.generated', async () => {
  const actual = await vi.importActual<typeof import('./fullDebateAnalysis.generated')>(
    './fullDebateAnalysis.generated',
  )
  return {
    ...actual,
    fetchFullDebateAnalysisRows: fetchMock,
  }
})

const { loadAllDebateDatasets, previewRow } = await import('./parquetLoader')

describe('loadAllDebateDatasets', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns a single dataset with the fetched rows', async () => {
    const sampleRows = [
      {
        configuration: { raw_name: 'example' },
        stats: { judge_accuracy: 0.9 },
      },
    ] as unknown as FullDebateAnalysisRow[]
    fetchMock.mockResolvedValue(sampleRows)

    const datasets = await loadAllDebateDatasets()

    expect(datasets).toHaveLength(1)
    const [dataset] = datasets
    expect(dataset.virtualPath).toContain('full_debate_analysis.parquet')
    expect(dataset.rows).toBe(sampleRows)
    expect(dataset.url).toContain('full_debate_analysis.parquet')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('previewRow', () => {
  it('serializes nested values for display', () => {
    const row = {
      stats: { total_debates: 5n, judge_accuracy: 0.9876 },
      configuration: {
        debater_name: 'Alpha',
        notes: ['first', 'second'],
      },
      lengths: {
        debater_a_lengths: [12n, 34n, 56n],
        debater_b_lengths: [21n],
      },
      metadata: {
        nested: {
          value: BigInt(42),
        },
      },
    } as unknown as FullDebateAnalysisRow

    const preview = previewRow(row, 3)
    expect(preview.stats).toEqual({
      total_debates: '5',
      judge_accuracy: 0.9876,
    })
    expect(preview.configuration).toEqual({
      debater_name: 'Alpha',
      notes: ['first', 'second'],
    })
    expect(preview.lengths).toEqual({
      debater_a_lengths: ['12', '34', '56'],
      debater_b_lengths: ['21'],
    })
  })
})
