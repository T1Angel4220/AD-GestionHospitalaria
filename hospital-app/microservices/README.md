# 🏥 Sistema Hospitalario - Arquitectura de Microservicios

Este proyecto implementa una arquitectura de microservicios para un sistema de gestión hospitalaria con bases de datos distribuidas.

## 🏗️ Arquitectura

### Microservicios

1. **🌐 API Gateway** (Puerto 3000)
   - Punto de entrada único para todas las peticiones
   - Enrutamiento a microservicios específicos
   - Autenticación y autorización centralizada
   - Rate limiting y logging

2. **🔐 Auth Service** (Puerto 3001)
   - Autenticación de usuarios
   - Generación y validación de JWT
   - Registro de usuarios
   - Búsqueda en múltiples bases de datos

3. **👥 Admin Service** (Puerto 3002)
   - Gestión de médicos
   - Gestión de especialidades
   - Gestión de empleados
   - Gestión de centros médicos

4. **📋 Consultas Service** (Puerto 3003)
   - Gestión de consultas médicas
   - Filtrado por centro médico
   - Control de acceso por rol

5. **👤 Users Service** (Puerto 3004)
   - Gestión de usuarios del sistema
   - Asignación de médicos a usuarios
   - Filtrado por centro médico

6. **📊 Reports Service** (Puerto 3005)
   - Generación de reportes
   - Estadísticas por centro
   - Exportación de datos

### Bases de Datos

- **Central (Quito)** - Puerto 3306
- **Guayaquil** - Puerto 3307
- **Cuenca** - Puerto 3308

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- MySQL 8.0+

### Ejecución con Docker

```bash
# Clonar el repositorio
git clone <repository-url>
cd hospital-app/microservices

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Ejecución Local (Desarrollo)

```bash
# Instalar dependencias en cada microservicio
cd api-gateway && npm install
cd ../auth-service && npm install
cd ../admin-service && npm install
cd ../consultas-service && npm install
cd ../users-service && npm install
cd ../reports-service && npm install

# Iniciar cada servicio en una terminal separada
cd api-gateway && npm run dev
cd auth-service && npm run dev
cd admin-service && npm run dev
cd consultas-service && npm run dev
cd users-service && npm run dev
cd reports-service && npm run dev
```

## 🔧 Configuración

### Variables de Entorno

Cada microservicio requiere las siguientes variables de entorno:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password123
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Servicios
AUTH_SERVICE_URL=http://localhost:3001
ADMIN_SERVICE_URL=http://localhost:3002
CONSULTAS_SERVICE_URL=http://localhost:3003
USERS_SERVICE_URL=http://localhost:3004
REPORTS_SERVICE_URL=http://localhost:3005
```

### Puertos

- **API Gateway**: 3000
- **Auth Service**: 3001
- **Admin Service**: 3002
- **Consultas Service**: 3003
- **Users Service**: 3004
- **Reports Service**: 3005
- **MySQL Central**: 3306
- **MySQL Guayaquil**: 3307
- **MySQL Cuenca**: 3308

## 📡 API Endpoints

### API Gateway (Puerto 3000)

- `GET /health` - Estado del gateway
- `GET /api/info` - Información de servicios
- `POST /api/auth/login` - Autenticación
- `POST /api/auth/register` - Registro
- `GET /api/admin/*` - Rutas de administración
- `GET /api/consultas/*` - Rutas de consultas
- `GET /api/users/*` - Rutas de usuarios
- `GET /api/reports/*` - Rutas de reportes

### Auth Service (Puerto 3001)

- `POST /login` - Iniciar sesión
- `POST /register` - Registrar usuario
- `POST /verify-token` - Verificar token
- `GET /health` - Estado del servicio

### Admin Service (Puerto 3002)

- `GET /medicos` - Obtener médicos
- `POST /medicos` - Crear médico
- `PUT /medicos/:id` - Actualizar médico
- `DELETE /medicos/:id` - Eliminar médico
- `GET /especialidades` - Obtener especialidades
- `POST /especialidades` - Crear especialidad
- `GET /health` - Estado del servicio

### Consultas Service (Puerto 3003)

- `GET /consultas` - Obtener consultas
- `POST /consultas` - Crear consulta
- `PUT /consultas/:id` - Actualizar consulta
- `DELETE /consultas/:id` - Eliminar consulta
- `GET /medicos-por-centro/:centroId` - Médicos por centro
- `GET /pacientes-por-centro/:centroId` - Pacientes por centro
- `GET /health` - Estado del servicio

### Users Service (Puerto 3004)

- `GET /usuarios` - Obtener usuarios
- `POST /usuarios` - Crear usuario
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario
- `GET /medicos-por-centro/:centroId` - Médicos para asignación
- `GET /health` - Estado del servicio

### Reports Service (Puerto 3005)

- `GET /consultas` - Resumen de consultas
- `GET /estadisticas` - Estadísticas generales
- `GET /pacientes-frecuentes` - Pacientes frecuentes
- `GET /consultas/:medicoId/detalle` - Detalle de consultas
- `GET /health` - Estado del servicio

## 🔐 Autenticación

Todos los endpoints (excepto auth) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

### Headers Especiales

- `X-Centro-Id`: ID del centro médico (1, 2, o 3)
- `X-User-Id`: ID del usuario (agregado automáticamente por el gateway)
- `X-User-Role`: Rol del usuario (admin o medico)

## 🗄️ Bases de Datos Distribuidas

### Estructura

Cada base de datos contiene las mismas tablas:
- `usuarios`
- `medicos`
- `pacientes`
- `consultas`
- `especialidades`
- `empleados`
- `centros_medicos`

### IDs Únicos

Para evitar conflictos entre bases de datos, se utilizan:
- `id_frontend`: Identificador único en el frontend (ej: "central-1", "guayaquil-1")
- `origen_bd`: Base de datos de origen (central, guayaquil, cuenca)
- `id_unico`: ID único compuesto (ej: "central-1")

## 🚀 Despliegue

### Producción

```bash
# Construir imágenes
docker-compose build

# Iniciar en modo producción
docker-compose -f docker-compose.yml up -d

# Verificar estado
docker-compose ps
```

### Monitoreo

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api-gateway

# Ver estado de contenedores
docker-compose ps
```

## 🔧 Desarrollo

### Estructura de Proyecto

```
microservices/
├── api-gateway/
├── auth-service/
├── admin-service/
├── consultas-service/
├── users-service/
├── reports-service/
├── docker-compose.yml
└── README.md
```

### Agregar Nuevo Microservicio

1. Crear directorio del servicio
2. Agregar `package.json` y `index.js`
3. Crear `Dockerfile`
4. Actualizar `docker-compose.yml`
5. Actualizar API Gateway con nuevas rutas

## 📊 Monitoreo y Logs

### Logs

Cada microservicio genera logs en:
- Consola (desarrollo)
- Archivo `logs/<service>.log` (producción)

### Health Checks

Cada servicio expone un endpoint `/health` para verificar su estado.

### Métricas

- Tiempo de respuesta
- Número de requests
- Errores por servicio
- Estado de bases de datos

## 🛠️ Troubleshooting

### Problemas Comunes

1. **Servicio no inicia**: Verificar variables de entorno
2. **Error de conexión a BD**: Verificar que MySQL esté ejecutándose
3. **Token inválido**: Verificar JWT_SECRET en todos los servicios
4. **CORS errors**: Verificar configuración de CORS en el gateway

### Comandos Útiles

```bash
# Reiniciar un servicio
docker-compose restart api-gateway

# Ver logs en tiempo real
docker-compose logs -f api-gateway

# Ejecutar comando en contenedor
docker-compose exec api-gateway sh

# Limpiar contenedores y volúmenes
docker-compose down -v
```

## 📝 Notas de Desarrollo

- Cada microservicio es independiente y puede escalarse por separado
- La comunicación entre servicios se hace a través del API Gateway
- Las bases de datos están distribuidas geográficamente
- El sistema mantiene consistencia eventual entre bases de datos
- Los logs se centralizan para facilitar el debugging
