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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
