import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { apiInterceptor } from './api/apiInterceptor'
import './utils/securityTest'

// Inicializar el interceptor de API
// apiInterceptor.intercept(); // Deshabilitado para debugging

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
