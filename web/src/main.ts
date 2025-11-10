import './style.css'
import { loadAllDebateDatasets, previewRow } from './parquetLoader'

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) {
  throw new Error('Missing #app root element')
}

appRoot.innerHTML = `
  <main class="container">
    <h1>Parquet Schema Preview</h1>
    <p id="status">Loading parquet datasets…</p>
    <section id="dataset-list" class="dataset-list"></section>
  </main>
`

const statusEl = appRoot.querySelector<HTMLParagraphElement>('#status')!
const listEl = appRoot.querySelector<HTMLDivElement>('#dataset-list')!

void displayDatasets()

async function displayDatasets(): Promise<void> {
  try {
    const datasets = await loadAllDebateDatasets()
    if (!datasets.length) {
      statusEl.textContent = 'No parquet datasets matched the glob pattern.'
      return
    }

    statusEl.textContent = `Loaded ${datasets.length} dataset${datasets.length === 1 ? '' : 's'}.`
    for (const { virtualPath, url, rows } of datasets) {
      const card = document.createElement('article')
      card.className = 'dataset'

      const title = document.createElement('h2')
      title.textContent = virtualPath
      card.appendChild(title)

      const meta = document.createElement('p')
      meta.className = 'dataset-meta'
      meta.textContent = `${rows.length} row${rows.length === 1 ? '' : 's'} • ${url}`
      card.appendChild(meta)

      const snippet = document.createElement('pre')
      snippet.className = 'dataset-snippet'
      const preview = rows[0] ? previewRow(rows[0]) : {}
      snippet.textContent = JSON.stringify(preview, null, 2)
      card.appendChild(snippet)

      listEl.appendChild(card)
    }
  } catch (error) {
    console.error(error)
    statusEl.textContent = 'Failed to load parquet datasets. Check console for details.'
  }
}
