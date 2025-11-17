import { describe, expect, it } from 'vitest'
import { stringIncludesCaseInsensitive } from './filters'

const createRow = (value: unknown) =>
  ({
    getValue: () => value,
  }) as unknown as Parameters<typeof stringIncludesCaseInsensitive>[0]

describe('stringIncludesCaseInsensitive', () => {
  it('allows non-string filter values', () => {
    const result = stringIncludesCaseInsensitive(createRow('value'), 'column', 123, () => {})
    expect(result).toBe(true)
  })

  it('allows empty filters', () => {
    const result = stringIncludesCaseInsensitive(createRow('value'), 'column', '   ', () => {})
    expect(result).toBe(true)
  })

  it('returns false when row value is nullish', () => {
    const result = stringIncludesCaseInsensitive(createRow(null), 'column', 'needle', () => {})
    expect(result).toBe(false)
  })

  it('matches substrings case-insensitively', () => {
    const result = stringIncludesCaseInsensitive(
      createRow('Hello World'),
      'column',
      'world',
      () => {},
    )
    expect(result).toBe(true)
  })
})
