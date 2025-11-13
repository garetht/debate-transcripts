import {useEffect, useRef} from 'react'
import type {JSX} from 'react'
import * as Plot from '@observablehq/plot'
import type {Plot as PlotT} from '@observablehq/plot'

export type PlotRenderer = (width: number) => Plot.PlotOptions | null

interface ResponsivePlotProps {
  render: PlotRenderer
  className?: string
}

export function ResponsivePlot({
  render,
  className = 'w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/40',
}: ResponsivePlotProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let currentPlot: ((SVGSVGElement & PlotT) | (HTMLElement & PlotT)) | null = null

    const draw = () => {
      if (!container) return
      const options = render(Math.max(container.clientWidth, 480))
      container.replaceChildren()
      currentPlot?.remove()
      if (!options) return
      const plot = Plot.plot(options)
      container.replaceChildren(plot)
      currentPlot = plot
    }

    draw()
    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      currentPlot?.remove()
    }
  }, [render])

  return <div ref={containerRef} className={className} />
}
