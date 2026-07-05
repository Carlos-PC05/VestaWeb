import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ padding: '2rem' }}>
      <h1>Vesta Web</h1>
      <p className="num">1.234,56 €</p>
    </div>
  </StrictMode>,
)
