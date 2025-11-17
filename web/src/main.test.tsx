import type { ReactNode } from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  createRoot: createRootMock,
}))

const browserRouterMock = vi.fn()
vi.mock('react-router-dom', () => ({
  BrowserRouter: (props: { basename: string; children: ReactNode }) => {
    browserRouterMock(props)
    return <div data-testid="router">{props.children}</div>
  },
}))

vi.mock('./App', () => ({
  __esModule: true,
  default: () => <div data-testid="app-root" />,
}))

const originalToJSON = (BigInt.prototype as { toJSON?: () => string }).toJSON
const originalDocument = global.document

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules()
    renderMock.mockClear()
    createRootMock.mockClear()
    browserRouterMock.mockClear()
    delete (BigInt.prototype as { toJSON?: () => string }).toJSON
  })

  afterEach(() => {
    global.document = originalDocument
    if (originalToJSON) {
      BigInt.prototype.toJSON = originalToJSON
    } else {
      delete (BigInt.prototype as { toJSON?: () => string }).toJSON
    }
  })

  it('mounts the app with a computed basename and bigint serializer', async () => {
    const rootElement = {} as HTMLElement
    global.document = {
      baseURI: 'https://example.com/app/',
      getElementById: vi.fn(() => rootElement),
    } as unknown as Document

    await import('./main')

    expect(createRootMock).toHaveBeenCalledWith(rootElement)
    expect(renderMock).toHaveBeenCalled()
    const renderedElement = renderMock.mock.calls[0][0] as {
      props: { basename: string }
    }
    expect(renderedElement.props.basename).toBe('/app')
    expect(typeof BigInt.prototype.toJSON).toBe('function')
  })

  it('throws when the root element is missing', async () => {
    global.document = {
      baseURI: 'https://example.com/',
      getElementById: vi.fn(() => null),
    } as unknown as Document

    await expect(import('./main')).rejects.toThrow('Missing #app root element')
  })
})
