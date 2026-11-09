import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PlacesProvider } from './context/PlacesContext'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlacesProvider>
      <App />
    </PlacesProvider>
  </StrictMode>,
)
