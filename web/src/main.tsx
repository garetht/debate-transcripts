import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './style.css'

const rootElement = document.getElementById('app')
if (!rootElement) {
  throw new Error('Missing #app root element')
}

createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
