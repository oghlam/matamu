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

function isStandalone() {
  try { return window.matchMedia('(display-mode: standalone)').matches } catch { return false }
}
const start = performance.now()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
function scheduleHide() {
  const minDelay = isStandalone() ? 80 : 400
  const delay = Math.max(0, minDelay - (performance.now() - start))
  setTimeout(hidePreload, delay)
}
requestAnimationFrame(scheduleHide)
// fallback: window load (covers slow chunk)
window.addEventListener('load', () => setTimeout(hidePreload, 300), { once: true })
