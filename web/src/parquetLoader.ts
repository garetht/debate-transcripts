import { fetchFullDebateAnalysisRows, type FullDebateAnalysisRow } from './fullDebateAnalysis.generated'

const PARQUET_SOURCE_PATH = './parquet/full_debate_analysis.parquet'
const PARQUET_ASSET = new URL('./parquet/full_debate_analysis.parquet', import.meta.url)
const PARQUET_URL = PARQUET_ASSET.href

export interface DebateDataset {
  virtualPath: string
  url: string
  rows: FullDebateAnalysisRow[]
}

export async function loadAllDebateDatasets(): Promise<DebateDataset[]> {
  const rows = await fetchFullDebateAnalysisRows(PARQUET_URL)
  return [{ virtualPath: PARQUET_SOURCE_PATH, url: PARQUET_URL, rows }]
}

export function previewRow(row: FullDebateAnalysisRow, maxKeys = 4): Record<string, unknown> {
  const record = row as unknown as Record<string, unknown>
  const keys = Object.keys(record).slice(0, maxKeys)
  const preview: Record<string, unknown> = {}
  for (const key of keys) {
    preview[key] = serializeValue(record[key])
  }
  return preview
}

function serializeValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (Array.isArray(value)) {
    return value.slice(0, 3).map(serializeValue)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 3)
    return Object.fromEntries(entries.map(([k, v]) => [k, serializeValue(v)]))
  }
  return value
}
