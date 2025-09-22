# Frontend - Sistema de Gestión Hospitalaria

Frontend desarrollado en React + TypeScript + Vite + Tailwind CSS para el sistema de gestión hospitalaria.

## Características

- 🔐 **Autenticación JWT** con roles (admin, médico)
- 🏥 **Gestión de consultas médicas** por centro
- 👨‍⚕️ **Gestión de médicos** (solo admin)
- 👥 **Gestión de usuarios** (solo admin)
- 📱 **Diseño responsive** con Tailwind CSS
- 🎨 **Interfaz moderna** con Lucide React icons
- 🔒 **Rutas protegidas** por rol de usuario

## Tecnologías

- **React 19** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS
- **React Router** - Enrutamiento
- **Lucide React** - Iconos
- **Context API** - Estado global

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

## Estructura del Proyecto

```
src/
├── api/
│   ├── authApi.ts          # API de autenticación
│   └── consultasApi.ts     # API de consultas
├── components/
│   └── ProtectedRoute.tsx  # Componente de protección de rutas
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación
├── pages/
│   ├── LoginPage.tsx       # Página de login
│   ├── RegisterPage.tsx    # Página de registro
│   ├── ConsultasPage.tsx   # Página de consultas
│   └── AdminPage.tsx       # Página de administración
├── types/
│   ├── auth.ts             # Tipos de autenticación
│   └── consultas.ts        # Tipos de consultas
└── utils/
    └── statusUtils.ts      # Utilidades de estado
```

## Rutas

### Públicas
- `/login` - Iniciar sesión
- `/register` - Registrar usuario (solo admin)

### Protegidas
- `/consultas` - Gestión de consultas (médicos y admin)
- `/admin` - Panel de administración (solo admin)

## Funcionalidades

### Login
- Autenticación con email y contraseña
- Redirección automática según rol
- Credenciales de prueba incluidas

### Registro (Solo Admin)
- Crear usuarios médicos
- Asignar médicos existentes
- Selección de centro médico

### Consultas
- Listar consultas del centro
- Crear/editar/eliminar consultas
- Filtros y búsqueda
- Estadísticas en tiempo real

### Administración (Solo Admin)
- Crear médicos
- Crear usuarios
- Gestión de centros médicos

## Configuración

El frontend se conecta automáticamente al backend en `http://localhost:3000/api`.

### Variables de Entorno

Crea un archivo `.env.local` si necesitas configurar:

```env
VITE_API_URL=http://localhost:3000/api
```

## Uso

1. **Iniciar el backend** en el puerto 3000
2. **Iniciar el frontend** con `npm run dev`
3. **Acceder** a `http://localhost:5173`
4. **Login** con las credenciales de prueba

### Credenciales de Prueba

- **Admin:** admin@hospital.com / admin123
- **Médico:** juan.garcia@hospital.com / admin123

## Desarrollo

### Estructura de Componentes

- **Páginas:** Componentes principales de cada ruta
- **Contextos:** Estado global de la aplicación
- **APIs:** Servicios para comunicación con el backend
- **Tipos:** Definiciones de TypeScript

### Estilos

- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Diseño responsive** mobile-first
- **Tema consistente** con colores del sistema hospitalario

## Build y Deploy

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

Los archivos se generan en la carpeta `dist/` y están listos para deploy.