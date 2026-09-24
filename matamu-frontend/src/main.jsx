import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

function hidePreload() {
  const el = document.getElementById('preload')
  if (!el || el.classList.contains('out')) return
  el.classList.add('out')
  el.setAttribute('aria-hidden', 'true')
  setTimeout(() => el.remove(), 400)
}

// ponytail: real preload — hide only after React mount + first paint, min 500ms so not flash
const start = performance.now()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
requestAnimationFrame(() => {
  const elapsed = performance.now() - start
  const delay = Math.max(0, 500 - elapsed)
  setTimeout(hidePreload, delay)
})
// fallback: window load (covers slow chunk)
window.addEventListener('load', () => setTimeout(hidePreload, 300), { once: true })
