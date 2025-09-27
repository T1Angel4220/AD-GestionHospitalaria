# 🏥 Backend - Sistema de Gestión Hospitalaria

## 📋 Descripción General

El backend del sistema HospitalApp está desarrollado con **Node.js**, **Express** y **TypeScript**, implementando una arquitectura de microservicios con bases de datos distribuidas. El sistema maneja la administración de centros médicos, personal, pacientes y consultas médicas con autenticación JWT y roles diferenciados.

## 🏗️ Arquitectura del Backend

### Componentes Principales

```
backend/
├── src/
│   ├── config/           # Configuración de base de datos y Swagger
│   ├── controllers/      # Lógica de negocio
│   ├── middleware/       # Middleware de autenticación y validación
│   ├── routes/          # Definición de rutas
│   └── utils/           # Utilidades y helpers
├── docs/                # Documentación de API
└── sql.txt             # Scripts de base de datos
```

### Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime de JavaScript |
| **Express** | 4.18+ | Framework web |
| **TypeScript** | 5.9.2 | Tipado estático |
| **MySQL2** | 3.6+ | Base de datos |
| **JWT** | 9.0+ | Autenticación |
| **bcrypt** | 5.1+ | Hash de contraseñas |
| **Swagger** | 4.6+ | Documentación API |
| **Nodemailer** | 6.9+ | Envío de emails |

## 🔧 Configuración del Proyecto

### Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=tu_password
DB_NAME=hospital_central

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# URLs
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 🔐 Sistema de Autenticación

### Roles de Usuario

#### **Admin**
- Acceso completo al sistema
- Puede crear usuarios
- Gestión de todas las entidades globales
- Acceso a todos los centros médicos

#### **Médico**
- Acceso limitado a su centro médico
- Solo puede gestionar sus propias consultas
- No puede crear usuarios

### Flujo de Autenticación

1. **Login**: `POST /api/auth/login`
   - Valida credenciales
   - Genera token JWT (24h de expiración)
   - Devuelve información del usuario

2. **Registro**: `POST /api/auth/register` (Solo Admin)
   - Crea nuevo usuario
   - Asigna rol y centro médico
   - Genera contraseña hasheada

3. **Recuperación de Contraseña**:
   - `POST /api/auth/forgot-password`: Envía email con token
   - `POST /api/auth/reset-password`: Resetea contraseña con token

### Middleware de Seguridad

```typescript
// Verificación de token JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  // Validación del token...
};

// Verificación de rol
const requireRole = (roles) => (req, res, next) => {
  // Validación de roles...
};

// Verificación de centro médico
const requireCentro = (req, res, next) => {
  const centroId = req.headers['x-centro-id'];
  // Validación de acceso al centro...
};
```

## 📊 Base de Datos

### Estructura de Tablas

#### **Entidades Globales**
- `centros_medicos`: Centros médicos del sistema
- `especialidades`: Especialidades médicas
- `usuarios`: Usuarios del sistema (admin/medico)

#### **Entidades por Centro**
- `medicos`: Médicos por centro
- `empleados`: Empleados por centro
- `pacientes`: Pacientes por centro
- `consultas`: Consultas médicas por centro

### Características de la Base de Datos

- **Distribuida**: Cada centro médico tiene sus propias tablas
- **Replicación**: Datos maestros replicados entre centros
- **Integridad**: Claves foráneas y restricciones
- **Índices**: Optimización de consultas frecuentes

## 🚀 APIs del Backend

### 1. API de Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/login` | Iniciar sesión | No |
| POST | `/register` | Registrar usuario | Admin |
| GET | `/profile` | Obtener perfil | Sí |
| POST | `/forgot-password` | Solicitar recuperación | No |
| POST | `/reset-password` | Resetear contraseña | No |

### 2. API de Administración (`/api/admin`)

#### Centros Médicos (`/centros`)
- `GET /` - Listar centros
- `POST /` - Crear centro
- `GET /:id` - Obtener centro
- `PUT /:id` - Actualizar centro
- `DELETE /:id` - Eliminar centro

#### Médicos (`/medicos`)
- `GET /` - Listar médicos
- `POST /` - Crear médico
- `GET /:id` - Obtener médico
- `PUT /:id` - Actualizar médico
- `DELETE /:id` - Eliminar médico

#### Empleados (`/empleados`)
- `GET /` - Listar empleados
- `POST /` - Crear empleado
- `GET /:id` - Obtener empleado
- `PUT /:id` - Actualizar empleado
- `DELETE /:id` - Eliminar empleado

#### Especialidades (`/especialidades`)
- `GET /` - Listar especialidades
- `POST /` - Crear especialidad
- `GET /:id` - Obtener especialidad
- `PUT /:id` - Actualizar especialidad
- `DELETE /:id` - Eliminar especialidad

#### Usuarios (`/usuarios`)
- `GET /` - Listar usuarios
- `POST /` - Crear usuario
- `GET /:id` - Obtener usuario
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario

### 3. API de Consultas (`/api/consultas`)

| Método | Endpoint | Descripción | Headers Requeridos |
|--------|----------|-------------|-------------------|
| GET | `/` | Listar consultas | `X-Centro-Id` |
| POST | `/` | Crear consulta | `X-Centro-Id` |
| GET | `/:id` | Obtener consulta | `X-Centro-Id` |
| PUT | `/:id` | Actualizar consulta | `X-Centro-Id` |
| DELETE | `/:id` | Eliminar consulta | `X-Centro-Id` |

### 4. API de Reportes (`/api/reports`)

| Método | Endpoint | Descripción | Headers Requeridos |
|--------|----------|-------------|-------------------|
| GET | `/estadisticas` | Estadísticas generales | `X-Centro-Id` |
| GET | `/consultas` | Resumen por médico | `X-Centro-Id` |
| GET | `/pacientes-frecuentes` | Pacientes frecuentes | `X-Centro-Id` |

## 📚 Documentación de API

### Swagger UI
- **URL**: `http://localhost:3000/api-docs`
- **Especificación**: `http://localhost:3000/api-docs.json`

### Características de la Documentación

- **Interfaz interactiva** para probar endpoints
- **Esquemas completos** de request/response
- **Ejemplos de uso** para cada endpoint
- **Autenticación integrada** con JWT
- **Filtros y búsquedas** documentadas

## 🔒 Seguridad

### Medidas Implementadas

1. **Autenticación JWT**
   - Tokens con expiración de 24 horas
   - Refresh tokens para renovación
   - Validación en cada request

2. **Hash de Contraseñas**
   - bcrypt con 12 rounds
   - Salt automático
   - Resistente a ataques de fuerza bruta

3. **Validación de Datos**
   - Validación de entrada en todos los endpoints
   - Sanitización de datos
   - Prevención de inyección SQL

4. **CORS Configurado**
   - Orígenes permitidos específicos
   - Headers personalizados
   - Métodos HTTP permitidos

5. **Rate Limiting**
   - Límite de requests por IP
   - Protección contra ataques DDoS
   - Timeout de conexiones

## 🧪 Testing

### Scripts de Prueba

```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests de integración
npm run test:integration

# Coverage de tests
npm run test:coverage
```

### Colecciones Postman

- **Autenticación**: `auth.postman_collection.json`
- **Consultas**: `consultas.postman_collection.json`
- **Administración**: `admin.postman_collection.json`

## 📈 Monitoreo y Logs

### Logging

```typescript
// Logs estructurados
console.log({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Consulta creada',
  userId: req.user.id,
  centroId: req.headers['x-centro-id'],
  consultaId: consulta.id
});
```

### Métricas

- **Requests por segundo**
- **Tiempo de respuesta promedio**
- **Errores por endpoint**
- **Uso de memoria y CPU**

## 🚀 Despliegue

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Variables de Producción

```env
NODE_ENV=production
DB_HOST=mysql-server
DB_PORT=3306
DB_USER=hospital_user
DB_PASS=secure_password
JWT_SECRET=production_jwt_secret
SMTP_HOST=smtp.provider.com
SMTP_USER=noreply@hospitalapp.com
SMTP_PASS=email_password
```

## 🔧 Mantenimiento

### Tareas Regulares

1. **Backup de Base de Datos**
   - Backup diario de todas las bases
   - Retención de 30 días
   - Verificación de integridad

2. **Actualizaciones de Seguridad**
   - Revisión mensual de dependencias
   - Aplicación de parches de seguridad
   - Monitoreo de vulnerabilidades

3. **Monitoreo de Performance**
   - Análisis de logs de error
   - Optimización de consultas lentas
   - Escalado horizontal según demanda

## 📞 Soporte

### Contacto
- **Email**: desarrollo@hospitalapp.com
- **Documentación**: [Swagger UI](http://localhost:3000/api-docs)
- **Issues**: GitHub Issues

### Recursos Adicionales
- [Documentación de Express](https://expressjs.com/)
- [Documentación de MySQL2](https://github.com/sidorares/node-mysql2)
- [Documentación de JWT](https://jwt.io/)
- [Documentación de Swagger](https://swagger.io/)
