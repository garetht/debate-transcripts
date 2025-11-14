import { scaleLinear } from 'd3-scale'
import type { JSX } from 'react'

type Domain = [number, number]

const DEFAULT_NULL_DISPLAY = '—'

function expandDomain(domain: Domain): Domain {
  const [start, end] = domain
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return [0, 1]
  }
  if (start === end) {
    const padding = Math.max(Math.abs(start) * 0.1, 1)
    return [start - padding, end + padding]
  }
  return start < end ? domain : [end, start]
}

function parseColor(color: string): [number, number, number] | null {
  const trimmed = color.trim()
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed)
  if (hexMatch) {
    const hex = hexMatch[1]
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return [r, g, b]
    }
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return [r, g, b]
  }

  const rgbMatch =
    /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)(?:\s*,\s*(?:[0-9.]+))?\s*\)$/.exec(trimmed)
  if (rgbMatch) {
    const r = Number(rgbMatch[1])
    const g = Number(rgbMatch[2])
    const b = Number(rgbMatch[3])
    if ([r, g, b].every((component) => Number.isFinite(component))) {
      return [r, g, b]
    }
  }

  return null
}

function getTextColor(backgroundColor: string): string {
  const rgb = parseColor(backgroundColor)
  if (!rgb) {
    return '#0f172a'
  }
  const [r, g, b] = rgb.map((component) => {
    const channel = component / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.5 ? '#0f172a' : '#f8fafc'
}

export interface DomainColorCellProps {
  value: number | null | undefined
  domain: Domain
  interpolator: (normalizedValue: number) => string
  displayValue?: string
  nullDisplay?: string
  className?: string
}

export function DomainColorCell({
  value,
  domain,
  interpolator,
  displayValue,
  nullDisplay = DEFAULT_NULL_DISPLAY,
  className,
}: DomainColorCellProps): JSX.Element {
  const normalizedDomain = expandDomain(domain)

  if (value == null || Number.isNaN(value)) {
    return (
      <span
        className={`inline-flex min-w-[4.5rem] justify-end rounded px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-300 ${className ?? ''}`}
      >
        {nullDisplay}
      </span>
    )
  }

  const scale = scaleLinear().domain(normalizedDomain).range([0, 1]).clamp(true)
  const backgroundColor = interpolator(scale(value))
  const textColor = getTextColor(backgroundColor)

  return (
    <span
      className={`inline-flex min-w-[4.5rem] justify-end rounded px-2 py-1 text-xs font-semibold shadow-sm ring-1 ring-black/5 ${className ?? ''}`}
      style={{
        backgroundColor,
        color: textColor,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {displayValue ?? value.toLocaleString()}
    </span>
  )
}
