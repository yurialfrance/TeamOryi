import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGame } from './store/game'

// HTTPS Enforcement: Service Workers & WebGPU require secure origin, prevents MITM attacks
if (
  typeof window !== 'undefined' &&
  location.protocol === 'http:' &&
  location.hostname !== 'localhost' &&
  location.hostname !== '127.0.0.1' &&
  !location.hostname.endsWith('.local')
) {
  location.href = location.href.replace('http:', 'https:')
}

if (import.meta.env.DEV) (window as unknown as { __game: typeof useGame }).__game = useGame

// Kamera ni Pipo (on-device OCR) was removed: free the ~29 MB of runtimes + handwriting model that
// phones downloaded into this cache on first camera use. No-op when it was never created.
if ('caches' in globalThis) void caches.delete('sipnayan-ocr-v1').catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
