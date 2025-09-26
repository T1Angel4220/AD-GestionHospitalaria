# 🏥 Frontend - Sistema de Gestión Hospitalaria

## 📋 Descripción General

El frontend del sistema HospitalApp está desarrollado con **React 19**, **TypeScript** y **Vite**, implementando dos interfaces diferenciadas: una **interfaz administrativa** para la gestión global del sistema y una **interfaz de hospital** para la gestión de consultas médicas por centro.

## 🏗️ Arquitectura del Frontend

### Estructura del Proyecto

```
frontend/vite-project/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── hooks/           # Custom hooks
│   ├── services/        # Servicios de API
│   ├── context/         # Context API
│   ├── types/           # Definiciones de tipos
│   ├── utils/           # Utilidades
│   └── config/          # Configuración
├── public/              # Archivos estáticos
└── dist/               # Build de producción
```

### Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.1.1 | Framework de UI |
| **TypeScript** | 5.9.2 | Tipado estático |
| **Vite** | 6.0.1 | Build tool y dev server |
| **Tailwind CSS** | 3.4+ | Framework de estilos |
| **React Router** | 6.26+ | Enrutamiento |
| **Axios** | 1.7+ | Cliente HTTP |
| **React Query** | 5.0+ | Gestión de estado del servidor |
| **Chart.js** | 4.4+ | Gráficos y visualizaciones |
| **React Hook Form** | 7.0+ | Formularios |
| **React Hot Toast** | 2.4+ | Notificaciones |

## 🎨 Interfaces del Sistema

### 1. Interfaz Administrativa

**Propósito**: Gestión global del sistema para administradores

**Características**:
- Dashboard con estadísticas generales
- Gestión de centros médicos
- Gestión de médicos y empleados
- Gestión de especialidades
- Gestión de usuarios
- Reportes y visualizaciones
- Exportación de datos

**Páginas Principales**:
- `DashboardPage`: Estadísticas generales
- `CentrosPage`: Gestión de centros médicos
- `MedicosPage`: Gestión de médicos
- `EmpleadosPage`: Gestión de empleados
- `EspecialidadesPage`: Gestión de especialidades
- `UsuariosPage`: Gestión de usuarios
- `ReportesPage`: Reportes y estadísticas

### 2. Interfaz de Hospital

**Propósito**: Gestión de consultas médicas por centro

**Características**:
- Gestión de consultas médicas
- Calendario de citas
- Gestión de pacientes
- Reportes por centro
- Acceso restringido por rol

**Páginas Principales**:
- `ConsultasPage`: Gestión de consultas
- `CalendarPage`: Calendario de citas
- `PacientesPage`: Gestión de pacientes
- `ReportesPage`: Reportes del centro

## 🔧 Configuración del Proyecto

### Variables de Entorno

```env
# API Backend
VITE_API_URL=http://localhost:3000/api
VITE_FRONTEND_URL=http://localhost:5173

# Configuración de la app
VITE_APP_NAME=HospitalApp
VITE_APP_VERSION=1.0.0
```

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🔐 Sistema de Autenticación

### Context de Autenticación

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMedico: boolean;
}
```

### Flujo de Autenticación

1. **Login**: Formulario de autenticación
2. **Validación**: Verificación de credenciales
3. **Token**: Almacenamiento del JWT
4. **Context**: Actualización del estado global
5. **Redirección**: Navegación según rol

### Protección de Rutas

```typescript
// Componente de protección de rutas
const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

## 🎯 Componentes Principales

### 1. Layout Components

#### `AppLayout`
- Layout principal de la aplicación
- Sidebar de navegación
- Header con información del usuario
- Área de contenido principal

#### `AdminLayout`
- Layout específico para administradores
- Navegación administrativa
- Breadcrumbs
- Acceso a todas las funcionalidades

#### `HospitalLayout`
- Layout específico para hospitales
- Navegación limitada por centro
- Información del centro médico
- Acceso restringido por rol

### 2. Form Components

#### `FormInput`
```typescript
interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}
```

#### `FormSelect`
```typescript
interface FormSelectProps {
  label: string;
  name: string;
  options: Option[];
  required?: boolean;
  error?: string;
  placeholder?: string;
}
```

#### `FormTextarea`
```typescript
interface FormTextareaProps {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
  error?: string;
  placeholder?: string;
}
```

### 3. Data Components

#### `DataTable`
- Tabla de datos con paginación
- Filtros y búsqueda
- Ordenamiento por columnas
- Acciones por fila

#### `DataGrid`
- Grid de datos con filtros avanzados
- Exportación de datos
- Selección múltiple
- Acciones en lote

#### `DataChart`
- Gráficos interactivos
- Múltiples tipos de visualización
- Filtros de fecha
- Exportación de imágenes

## 🚀 Servicios de API

### Configuración de Axios

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Servicios por Módulo

#### `AuthService`
```typescript
class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse>;
  static async logout(): Promise<void>;
  static async getProfile(): Promise<User>;
  static async changePassword(data: ChangePasswordData): Promise<void>;
}
```

#### `CentrosService`
```typescript
class CentrosService {
  static async getCentros(): Promise<CentroMedico[]>;
  static async getCentro(id: number): Promise<CentroMedico>;
  static async createCentro(data: CentroMedicoCreate): Promise<CentroMedico>;
  static async updateCentro(id: number, data: CentroMedicoUpdate): Promise<CentroMedico>;
  static async deleteCentro(id: number): Promise<void>;
}
```

#### `ConsultasService`
```typescript
class ConsultasService {
  static async getConsultas(centroId: number, filters?: ConsultaFilters): Promise<Consulta[]>;
  static async getConsulta(id: number, centroId: number): Promise<Consulta>;
  static async createConsulta(data: ConsultaCreate, centroId: number): Promise<Consulta>;
  static async updateConsulta(id: number, data: ConsultaUpdate, centroId: number): Promise<Consulta>;
  static async deleteConsulta(id: number, centroId: number): Promise<void>;
}
```

## 🎨 Sistema de Diseño

### Paleta de Colores

```css
:root {
  /* Colores principales */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;
  
  /* Colores secundarios */
  --secondary-50: #f0fdf4;
  --secondary-500: #22c55e;
  --secondary-900: #14532d;
  
  /* Colores de estado */
  --success-500: #22c55e;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  --info-500: #3b82f6;
}
```

### Tipografía

```css
/* Fuentes principales */
.font-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
}

.font-body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

### Componentes de UI

#### Botones
```typescript
// Variantes de botones
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
```

#### Cards
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
```

#### Modales
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

## 📊 Gestión de Estado

### Context API

#### `AuthContext`
- Estado de autenticación
- Información del usuario
- Métodos de login/logout

#### `CentroContext`
- Centro médico actual
- Cambio de centro
- Validación de acceso

### React Query

```typescript
// Configuración global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Hooks personalizados
const useConsultas = (centroId: number, filters?: ConsultaFilters) => {
  return useQuery({
    queryKey: ['consultas', centroId, filters],
    queryFn: () => ConsultasService.getConsultas(centroId, filters),
    enabled: !!centroId,
  });
};
```

## 🧪 Testing

### Configuración de Testing

```typescript
// Vitest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock de servicios
vi.mock('../services/AuthService', () => ({
  AuthService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));
```

### Tests Unitarios

```typescript
describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockLogin = vi.fn();
    render(<LoginForm onLogin={mockLogin} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

## 🚀 Build y Despliegue

### Scripts de Build

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

### Configuración de Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
  },
});
```

### Variables de Producción

```env
# Producción
VITE_API_URL=https://api.hospitalapp.com/api
VITE_FRONTEND_URL=https://app.hospitalapp.com
VITE_APP_NAME=HospitalApp
VITE_APP_VERSION=1.0.0
```

## 📱 Responsive Design

### Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Componentes Responsivos

```typescript
// Hook para breakpoints
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('sm');
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1536) setBreakpoint('2xl');
      else if (window.innerWidth >= 1280) setBreakpoint('xl');
      else if (window.innerWidth >= 1024) setBreakpoint('lg');
      else if (window.innerWidth >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return breakpoint;
};
```

## 🔧 Mantenimiento

### Linting y Formateo

```bash
# ESLint
npm run lint

# Prettier
npm run format

# Type checking
npm run type-check
```

### Actualizaciones

```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Fix automático
npm audit fix
```

## 📞 Soporte

### Recursos de Desarrollo

- **React Docs**: [react.dev](https://react.dev/)
- **TypeScript Docs**: [typescriptlang.org](https://www.typescriptlang.org/)
- **Vite Docs**: [vitejs.dev](https://vitejs.dev/)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com/)

### Herramientas de Desarrollo

- **React DevTools**: Extensión del navegador
- **TypeScript Language Server**: VS Code
- **ESLint**: Linting de código
- **Prettier**: Formateo de código
