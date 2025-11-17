import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DomainColorCell } from './DomainColorCell'

const mockInterpolator = (value: number) => {
  const channel = Math.max(0, Math.min(255, Math.round(value * 255)))
  const hex = channel.toString(16).padStart(2, '0')
  return `#${hex}${hex}${hex}`
}

describe('DomainColorCell', () => {
  it('shows the null display when value is null', () => {
    const html = renderToStaticMarkup(
      <DomainColorCell value={null} domain={[0, 1]} interpolator={mockInterpolator} />,
    )
    expect(html).toContain('—')
    expect(html).not.toContain('background-color')
  })

  it('renders a span with background color when value is within the domain', () => {
    const html = renderToStaticMarkup(
      <DomainColorCell value={0.5} domain={[0, 1]} interpolator={mockInterpolator} />,
    )
    expect(html).toContain('style="background-color')
    expect(html).toContain('0.5')
  })

  it('expands zero-width domains to provide padding', () => {
    const html = renderToStaticMarkup(
      <DomainColorCell value={2} domain={[2, 2]} interpolator={mockInterpolator} />,
    )
    expect(html).toContain('2')
    expect(html).toContain('background-color')
  })
})
