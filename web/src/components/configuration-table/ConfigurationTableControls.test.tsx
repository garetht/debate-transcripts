import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ConfigurationTableControls } from './ConfigurationTableControls'

describe('ConfigurationTableControls', () => {
  const defaultProps = {
    taskFilter: 'quality' as const,
    onTaskFilterChange: vi.fn(),
    currentFilter: '',
    onFilterChange: vi.fn(),
    onCopyTable: vi.fn(),
    copyStatus: 'idle' as const,
    disableCopy: false,
  }

  it('renders task filter tabs and search input', () => {
    const html = renderToStaticMarkup(<ConfigurationTableControls {...defaultProps} />)
    expect(html).toContain('Quality')
    expect(html).toContain('Lojban')
    expect(html.toLowerCase()).toContain('placeholder="search configuration…')
  })

  it('shows copy feedback states', () => {
    const html = renderToStaticMarkup(
      <ConfigurationTableControls {...defaultProps} copyStatus="copied" />,
    )
    expect(html).toContain('Copied!')
  })

  it('disables the copy button when requested', () => {
    const html = renderToStaticMarkup(
      <ConfigurationTableControls {...defaultProps} disableCopy copyStatus="error" />,
    )
    expect(html).toContain('disabled')
    expect(html).toContain('Copy Failed')
  })
})
