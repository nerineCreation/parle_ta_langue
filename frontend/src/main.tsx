import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const root = createRoot(rootElement)

try {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  console.error('Error rendering the app:', error)
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <h1 style="color: #f4a6aa; font-size: 2rem; margin-bottom: 1rem;">
        Oups ! Une erreur est survenue
      </h1>
      <p style="color: #666; margin-bottom: 1rem;">
        Veuillez rafraîchir la page ou réessayer plus tard.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          background-color: #f4a6aa;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-weight: 600;
          cursor: pointer;
        "
      >
        Rafraîchir la page
      </button>
    </div>
  `
}