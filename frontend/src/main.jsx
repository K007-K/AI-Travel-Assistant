import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-sans';
import '@fontsource/geist-mono';
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './providers/ThemeProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="roameo-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
