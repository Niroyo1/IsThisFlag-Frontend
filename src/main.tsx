import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="bg-EerieBlack">
      <h2 className="text-3xl p-3 font-bold text-center italic text-white">Is this Flag???</h2>
    </div>
    <App />
  </StrictMode>,
)
