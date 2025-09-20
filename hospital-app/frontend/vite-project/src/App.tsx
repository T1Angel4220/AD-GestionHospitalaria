import { useEffect, useRef } from 'react'
import { ConsultasPage } from './pages/ConsultasPage'
import './App.css'
import './styles/consultas.css'

function App() {
  const consultasContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (consultasContainerRef.current) {
      const consultasPage = new ConsultasPage(consultasContainerRef.current)
      // Hacer la instancia global para los event listeners
      ;(window as any).consultasPage = consultasPage
    }
  }, [])

  return (
    <div className="app">
      <div ref={consultasContainerRef}></div>
    </div>
  )
}

export default App
