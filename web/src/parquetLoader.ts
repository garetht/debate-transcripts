import { fetchFullDebateAnalysisRows, type FullDebateAnalysisRow } from './fullDebateAnalysis.generated'

const parquetModules = import.meta.glob('./parquet/eval--*/full_debate_analysis.parquet', {
  query: 'url',
  eager: true,
})

export interface DebateDataset {
  virtualPath: string
  url: string
  rows: FullDebateAnalysisRow[]
}

export async function loadAllDebateDatasets(): Promise<DebateDataset[]> {
  const entries = Object.entries(parquetModules)
  return Promise.all(
    entries.map(async ([virtualPath, module]) => {
      const url = resolveAssetUrl(module, virtualPath)
      const rows = await fetchFullDebateAnalysisRows(url)
      return { virtualPath, url, rows }
    })
  )
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

function resolveAssetUrl(module: unknown, virtualPath: string): string {
  if (typeof module === 'string') {
    return module
  }
  if (module && typeof module === 'object' && 'default' in module) {
    const candidate = (module as { default: unknown }).default
    if (typeof candidate === 'string') {
      return candidate
    }
  }
  throw new TypeError(`Parquet asset at ${virtualPath} did not export a URL string`)
}
