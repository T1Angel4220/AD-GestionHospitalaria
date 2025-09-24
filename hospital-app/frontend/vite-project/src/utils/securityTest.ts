// Utilidad para probar la seguridad del sistema
// Este archivo se puede usar para verificar que las rutas están protegidas

export const SecurityTest = {
  // Simular token expirado
  simulateExpiredToken: () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbCI6ImFkbWluIiwiaWRfY2VudHJvIjoxLCJpZF9tZWRpY28iOjEsImV4cCI6MTYwOTQ1NjAwMCwiaWF0IjoxNjA5NDU2MDAwfQ.invalid_signature';
    localStorage.setItem('token', expiredToken);
    console.log('Token expirado simulado. Recarga la página para ver el efecto.');
  },

  // Simular token inválido
  simulateInvalidToken: () => {
    const invalidToken = 'invalid.token.here';
    localStorage.setItem('token', invalidToken);
    console.log('Token inválido simulado. Recarga la página para ver el efecto.');
  },

  // Limpiar datos de autenticación
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('Datos de autenticación limpiados.');
  },

  // Verificar estado actual de autenticación
  checkAuthStatus: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('=== Estado de Autenticación ===');
    console.log('Token presente:', !!token);
    console.log('Usuario presente:', !!user);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expirado:', payload.exp < Math.floor(Date.now() / 1000));
      } catch (error) {
        console.log('Token inválido:', error);
      }
    }
    
    if (user) {
      console.log('Usuario:', JSON.parse(user));
    }
  },

  // Probar acceso a rutas protegidas
  testProtectedRoutes: () => {
    const protectedRoutes = [
      '/admin',
      '/medico',
      '/usuarios',
      '/admin/centros',
      '/admin/especialidades',
      '/admin/empleados',
      '/admin/reportes'
    ];

    console.log('=== Prueba de Rutas Protegidas ===');
    console.log('Intenta acceder a estas rutas directamente:');
    protectedRoutes.forEach(route => {
      console.log(`- ${window.location.origin}${route}`);
    });
    console.log('Deberías ser redirigido al login si no estás autenticado.');
  },

  // Simular diferentes roles
  simulateRole: (role: 'admin' | 'medico') => {
    const mockUser = {
      id: 1,
      email: `${role}@example.com`,
      rol: role,
      id_centro: 1,
      id_medico: role === 'medico' ? 1 : undefined,
      nombres: `Usuario ${role}`,
      apellidos: 'Test',
      activo: true
    };

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbCI6ImFkbWluIiwiaWRfY2VudHJvIjoxLCJpZF9tZWRpY28iOjEsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjA5NDU2MDAwfQ.mock_signature';

    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    console.log(`Rol ${role} simulado. Recarga la página para ver el efecto.`);
  }
};

// Hacer disponible en la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).SecurityTest = SecurityTest;
  console.log('SecurityTest disponible en la consola. Usa SecurityTest.checkAuthStatus() para verificar el estado.');
}
