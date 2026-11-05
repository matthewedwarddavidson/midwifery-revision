import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled with the site rather than loaded from Google Fonts, so visitors' IP addresses aren't sent there.
import '@fontsource-variable/inter'
import '@fontsource-variable/literata/opsz.css'
import './index.css'
import App from './App.tsx'
import { startSync } from './lib/sync'

startSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
