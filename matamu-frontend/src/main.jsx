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
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  } catch { return false }
}

// ponytail: hide after mount, but wait for fonts so text doesn't pop after logo (fixes "logo saja" flash)
const start = performance.now()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
function scheduleHide() {
  const elapsed = performance.now() - start
  // standalone already showed native splash (same #F8F8F3 + icon) → hide instantly after first paint
  const minDelay = isStandalone() ? 80 : 400
  const delay = Math.max(0, minDelay - elapsed)
  const run = () => setTimeout(hidePreload, delay)
  // wait for JetBrains Mono so h1/sub don't FOIT after logo
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(run)
  } else {
    run()
  }
}
requestAnimationFrame(scheduleHide)
// fallback: window load (covers slow chunk)
window.addEventListener('load', () => setTimeout(hidePreload, 300), { once: true })
