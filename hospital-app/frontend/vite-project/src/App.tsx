import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ConsultasPage from './pages/ConsultasPage'
import MedicosPage from './pages/MedicosPage'
import UsuariosPage from './pages/UsuariosPage'
import PerfilPage from './pages/PerfilPage'
import CalendarPage from './pages/CalendarPage'
import { ReportesPage } from './pages/ReportesPage'
import CentrosPage from './pages/CentrosPage'
import EspecialidadesPage from './pages/EspecialidadesPage'
import EmpleadosPage from './pages/EmpleadosPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/consultas" 
              element={
                <ProtectedRoute>
                  <ConsultasPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendario" 
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={<Navigate to="/reportes" replace />} 
            />
            <Route 
              path="/reportes" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medicos" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <MedicosPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/centros" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <CentrosPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/especialidades" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <EspecialidadesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/empleados" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmpleadosPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsuariosPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/perfil" 
              element={
                <ProtectedRoute>
                  <PerfilPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
