import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './style.css'

function resolveBasePath(): string {
  const { pathname } = new URL(document.baseURI)
  if (pathname === '/' || pathname === '') {
    return '/'
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

const rootElement = document.getElementById('app')
if (!rootElement) {
  throw new Error('Missing #app root element')
}

const basename = resolveBasePath()

createRoot(rootElement).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>,
)
