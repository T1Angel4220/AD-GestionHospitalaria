# 🏥 Sistema Hospitalario - Microservicios

Sistema de gestión hospitalaria con arquitectura de microservicios, diseñado para manejar múltiples centros médicos de forma distribuida.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    API GATEWAY                                  │
│              (Puerto 3000)                                      │
│  - Enrutamiento de peticiones                                  │
│  - Autenticación centralizada                                  │
│  - Rate limiting                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│ AUTH    │    │    ADMIN    │    │   MÉDICO    │
│ SERVICE │    │   SERVICE   │    │   SERVICE   │
│ :3001   │    │   :3002     │    │   :3003     │
└─────────┘    └─────────────┘    └─────────────┘
```

## 🚀 Servicios

### 1. **API Gateway** (Puerto 3000)
- Punto de entrada único para todas las peticiones
- Enrutamiento inteligente a microservicios
- Autenticación y autorización centralizada
- Rate limiting y seguridad

### 2. **Auth Service** (Puerto 3001)
- Autenticación de usuarios
- Generación y validación de JWT
- Login y registro
- Gestión de sesiones

### 3. **Admin Service** (Puerto 3002)
- Gestión completa del sistema (solo administradores)
- Usuarios, médicos, pacientes, centros, especialidades
- Empleados y reportes
- Acceso a todas las bases de datos

### 4. **Medico Service** (Puerto 3003)
- Funcionalidades específicas para médicos
- Gestión de consultas médicas
- Calendario de citas
- Perfil del médico
- Estadísticas personales

## 🗄️ Bases de Datos

El sistema utiliza múltiples bases de datos MySQL:

- **Central** (Quito): Base de datos principal
- **Guayaquil**: Base de datos regional
- **Cuenca**: Base de datos regional

Cada servicio se conecta a las bases de datos según el centro médico.

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+
- MySQL 8.0+

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd hospital-app/microservices

# Instalar dependencias
npm run install:all

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Iniciar todos los servicios
npm run start:all
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro

# Base de datos Central (Quito)
CENTRAL_DB_HOST=localhost
CENTRAL_DB_USER=root
CENTRAL_DB_PASSWORD=tu_password
CENTRAL_DB_NAME=hospital_central
CENTRAL_DB_PORT=3306

# Base de datos Guayaquil
GUAYAQUIL_DB_HOST=localhost
GUAYAQUIL_DB_USER=root
GUAYAQUIL_DB_PASSWORD=tu_password
GUAYAQUIL_DB_NAME=hospital_guayaquil
GUAYAQUIL_DB_PORT=3306

# Base de datos Cuenca
CUENCA_DB_HOST=localhost
CUENCA_DB_USER=root
CUENCA_DB_PASSWORD=tu_password
CUENCA_DB_NAME=hospital_cuenca
CUENCA_DB_PORT=3306

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📚 Uso

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de usuarios
- `GET /api/auth/profile` - Perfil del usuario

#### Administración
- `GET /api/admin/usuarios` - Listar usuarios
- `POST /api/admin/usuarios` - Crear usuario
- `GET /api/admin/medicos` - Listar médicos
- `POST /api/admin/medicos` - Crear médico
- `GET /api/admin/pacientes` - Listar pacientes
- `GET /api/admin/centros` - Listar centros
- `GET /api/admin/especialidades` - Listar especialidades
- `GET /api/admin/empleados` - Listar empleados
- `GET /api/admin/reportes/estadisticas` - Estadísticas

#### Médico
- `GET /api/medico/consultas` - Consultas del médico
- `POST /api/medico/consultas` - Crear consulta
- `PUT /api/medico/consultas/:id` - Actualizar consulta
- `DELETE /api/medico/consultas/:id` - Eliminar consulta
- `GET /api/medico/pacientes` - Pacientes del centro
- `GET /api/medico/perfil` - Perfil del médico
- `GET /api/medico/calendario` - Calendario de citas
- `GET /api/medico/estadisticas` - Estadísticas del médico

### Ejemplo de Uso

```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@hospital.com',
    password: 'password123'
  })
});

const { token } = await response.json();

// Usar token para peticiones autenticadas
const consultas = await fetch('http://localhost:3000/api/medico/consultas', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🧪 Testing

```bash
# Verificar que todos los servicios estén funcionando
curl http://localhost:3000/health

# Verificar servicios individuales
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Admin Service
curl http://localhost:3003/health  # Medico Service
```

## 📊 Monitoreo

### Health Checks

Cada servicio expone un endpoint de health check:

- API Gateway: `GET /health`
- Auth Service: `GET /health`
- Admin Service: `GET /health`
- Medico Service: `GET /health`

### Logs

Los logs se almacenan en:
- `logs/error.log` - Errores
- `logs/combined.log` - Todos los logs

## 🔒 Seguridad

- Autenticación JWT
- Rate limiting por IP
- Validación de entrada
- CORS configurado
- Headers de seguridad (Helmet)

## 🚀 Despliegue

### Producción

1. Configurar variables de entorno de producción
2. Usar PM2 para gestión de procesos
3. Configurar balanceador de carga
4. Implementar monitoreo y alertas

### PM2 (Recomendado para producción)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar todos los servicios
pm2 start start-all.js --name "hospital-microservices"

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Detener servicios
pm2 stop hospital-microservices
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico, contactar a:
- Email: soporte@hospital.com
- Documentación: [Wiki del proyecto]

## 🔄 Migración desde Monolito

Para migrar desde la versión monolítica:

```bash
# Ejecutar script de migración
node migrate-frontend.js

# Esto actualizará automáticamente:
# - URLs de API en el frontend
# - Configuración de endpoints
# - Variables de entorno
```

---

**Desarrollado con ❤️ para el sistema hospitalario**