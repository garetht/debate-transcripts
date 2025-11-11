import { useEffect, useState } from 'react'
import { loadAllDebateDatasets, type DebateDataset } from '../parquetLoader'

export type LoadingState =
  | { status: 'loading'; message: string }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

export function useDebateDatasets(): {
  datasets: DebateDataset[]
  state: LoadingState
} {
  const [datasets, setDatasets] = useState<DebateDataset[]>([])
  const [state, setState] = useState<LoadingState>({
    status: 'loading',
    message: 'Loading parquet datasets…',
  })

  useEffect(() => {
    let isActive = true

    loadAllDebateDatasets()
      .then((loadedDatasets) => {
        if (!isActive) return
        if (!loadedDatasets.length) {
          setState({
            status: 'empty',
            message: 'No parquet datasets matched the glob pattern.',
          })
          setDatasets([])
          return
        }
        setDatasets(loadedDatasets)
        setState({
          status: 'success',
          message: `Loaded ${loadedDatasets.length} dataset${
            loadedDatasets.length === 1 ? '' : 's'
          }.`,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) return
        console.error(error)
        setState({
          status: 'error',
          message: 'Failed to load parquet datasets. Check console for details.',
        })
      })

    return () => {
      isActive = false
    }
  }, [])

  return { datasets, state }
}
