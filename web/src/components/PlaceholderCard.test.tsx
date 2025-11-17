import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { PlaceholderCard } from './PlaceholderCard'

describe('PlaceholderCard', () => {
  it('renders the provided message with the default tone', () => {
    const html = renderToStaticMarkup(<PlaceholderCard message="Loading data…" />)
    expect(html).toContain('Loading data…')
    expect(html).toContain('border-slate-200/60')
  })

  it('uses error styling when tone is error', () => {
    const html = renderToStaticMarkup(
      <PlaceholderCard message="Something went wrong" tone="error" />,
    )
    expect(html).toContain('Something went wrong')
    expect(html).toContain('border-red-200/70')
  })
})
