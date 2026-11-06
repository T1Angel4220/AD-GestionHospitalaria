# 🏥 Microservicios - Sistema de Gestión Hospitalaria

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 📋 Descripción General

Este directorio contiene la **arquitectura de microservicios** del sistema HospitalApp, implementando una solución distribuida con múltiples servicios especializados que se comunican a través de un **API Gateway** centralizado. Cada microservicio tiene su propia responsabilidad específica y puede escalarse independientemente.

## 🏗️ Arquitectura de Microservicios

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                 │
│                    http://localhost:5173                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                             │
│                    http://localhost:3000                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Enrutamiento y Proxy                            │   │
│  │  • Autenticación Centralizada                     │   │
│  │  • Rate Limiting                                  │   │
│  │  • Logging Centralizado                           │   │
│  │  • CORS y Seguridad                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MICROSERVICIOS                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Auth Service│  │Admin Service │  │Consultas Svc│        │
│  │   :3001     │  │   :3002     │  │   :3003     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐                        │
│  │Users Service │  │Reports Svc  │                        │
│  │   :3004      │  │   :3005     │                        │
│  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                BASES DE DATOS DISTRIBUIDAS                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │Central DB   │  │Guayaquil DB │  │  Cuenca DB  │        │
│  │   :3307     │  │   :3308     │  │   :3309     │        │
│  │   Quito     │  │ Guayaquil   │  │   Cuenca    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Microservicios Implementados

### 1. **API Gateway** (Puerto 3000)
**Responsabilidad**: Punto de entrada único y enrutamiento

**Características**:
- ✅ **Proxy HTTP** a todos los microservicios
- ✅ **Autenticación centralizada** con JWT
- ✅ **Rate limiting** para protección DDoS
- ✅ **CORS** configurado para frontend
- ✅ **Logging centralizado** con Winston
- ✅ **Helmet** para headers de seguridad
- ✅ **Health checks** para todos los servicios

**Endpoints**:
```
GET  /health                    # Estado del gateway
GET  /info                      # Información del sistema
GET  /api/test-services         # Verificar conectividad
POST /api/auth/*                # Proxy a Auth Service
GET  /api/admin/*               # Proxy a Admin Service
GET  /api/consultas/*           # Proxy a Consultas Service
GET  /api/users/*               # Proxy a Users Service
GET  /api/reports/*             # Proxy a Reports Service
```

### 2. **Auth Service** (Puerto 3001)
**Responsabilidad**: Autenticación y gestión de usuarios

**Características**:
- ✅ **Login/Logout** con JWT
- ✅ **Registro de usuarios** con validaciones
- ✅ **Encriptación de contraseñas** con bcryptjs
- ✅ **Validación de tokens** JWT
- ✅ **Gestión de sesiones**
- ✅ **Validaciones** con express-validator
- ✅ **Logging** específico de autenticación

**Endpoints**:
```
POST /login                     # Iniciar sesión
POST /register                  # Registrar usuario
POST /verify-token              # Verificar token JWT
GET  /usuarios                  # Listar usuarios
POST /usuarios                  # Crear usuario
PUT  /usuarios/:id              # Actualizar usuario
DELETE /usuarios/:id            # Eliminar usuario
GET  /health                    # Estado del servicio
```

### 3. **Admin Service** (Puerto 3002)
**Responsabilidad**: Gestión administrativa del sistema

**Características**:
- ✅ **CRUD de médicos** con especialidades
- ✅ **CRUD de centros médicos**
- ✅ **CRUD de especialidades**
- ✅ **CRUD de empleados**
- ✅ **CRUD de pacientes**
- ✅ **Validaciones** específicas por entidad
- ✅ **Rate limiting** (1000 req/15min)
- ✅ **Acceso a múltiples bases de datos**

**Endpoints**:
```
# Médicos
GET    /medicos                 # Listar médicos
POST   /medicos                 # Crear médico
PUT    /medicos/:id             # Actualizar médico
DELETE /medicos/:id             # Eliminar médico
GET    /medicos/centro/:id      # Médicos por centro

# Centros Médicos
GET    /centros                 # Listar centros
POST   /centros                 # Crear centro
PUT    /centros/:id             # Actualizar centro
DELETE /centros/:id             # Eliminar centro

# Especialidades
GET    /especialidades          # Listar especialidades
POST   /especialidades          # Crear especialidad
PUT    /especialidades/:id      # Actualizar especialidad
DELETE /especialidades/:id      # Eliminar especialidad

# Empleados
GET    /empleados               # Listar empleados
POST   /empleados               # Crear empleado
PUT    /empleados/:id           # Actualizar empleado
DELETE /empleados/:id           # Eliminar empleado

# Pacientes
GET    /pacientes               # Listar pacientes
POST   /pacientes               # Crear paciente
PUT    /pacientes/:id          # Actualizar paciente
DELETE /pacientes/:id           # Eliminar paciente
```

### 4. **Consultas Service** (Puerto 3003)
**Responsabilidad**: Gestión de consultas médicas

**Características**:
- ✅ **CRUD de consultas médicas**
- ✅ **Estados de consulta** (pendiente, programada, completada, cancelada)
- ✅ **Validaciones** de duración y fechas
- ✅ **Gestión de pacientes** por centro
- ✅ **Asignación de médicos** a consultas
- ✅ **Historial médico** por paciente
- ✅ **Acceso a múltiples bases de datos**

**Endpoints**:
```
# Consultas
GET    /consultas               # Listar consultas
POST   /consultas               # Crear consulta
PUT    /consultas/:id           # Actualizar consulta
DELETE /consultas/:id           # Eliminar consulta

# Pacientes
GET    /pacientes               # Listar pacientes
POST   /pacientes               # Crear paciente
PUT    /pacientes/:id           # Actualizar paciente
DELETE /pacientes/:id           # Eliminar paciente

# Médicos y Centros
GET    /medicos-por-centro/:id  # Médicos por centro
GET    /pacientes-por-centro/:id # Pacientes por centro
GET    /centros                 # Listar centros médicos
```

### 5. **Users Service** (Puerto 3004)
**Responsabilidad**: Gestión de usuarios del sistema

**Características**:
- ✅ **CRUD de usuarios** del sistema
- ✅ **Asignación de roles** (admin, médico)
- ✅ **Gestión de permisos** por centro
- ✅ **Validaciones** de seguridad
- ✅ **Encriptación** de contraseñas
- ✅ **Acceso a múltiples bases de datos**

**Endpoints**:
```
GET    /usuarios                # Listar usuarios
POST   /usuarios                # Crear usuario
PUT    /usuarios/:id            # Actualizar usuario
DELETE /usuarios/:id            # Eliminar usuario
GET    /usuarios/centro/:id     # Usuarios por centro
GET    /usuarios/rol/:rol       # Usuarios por rol
GET    /health                  # Estado del servicio
```

### 6. **Reports Service** (Puerto 3005)
**Responsabilidad**: Generación de reportes y estadísticas

**Características**:
- ✅ **Reportes por médico**
- ✅ **Estadísticas generales** del centro
- ✅ **Pacientes más frecuentes**
- ✅ **Consultas por especialidad**
- ✅ **Exportación a PDF** con PDFKit
- ✅ **Filtros por fecha** y centro
- ✅ **Acceso a múltiples bases de datos**

**Endpoints**:
```
GET    /reports/estadisticas           # Estadísticas generales
GET    /reports/consultas-medico       # Consultas por médico
GET    /reports/consultas-especialidad # Consultas por especialidad
GET    /reports/consultas-centro      # Consultas por centro
GET    /reports/pacientes-frecuentes   # Pacientes más frecuentes
GET    /consultas/medico/:id           # Detalle por médico
GET    /health                         # Estado del servicio
```

## 🗄️ Bases de Datos Distribuidas

### Configuración de Bases de Datos

| Base de Datos | Puerto | Ubicación | Propósito |
|---------------|--------|-----------|-----------|
| **Central** | 3307 | Quito | Datos administrativos centrales, usuarios admin |
| **Guayaquil** | 3308 | Guayaquil | Datos específicos del hospital de Guayaquil |
| **Cuenca** | 3309 | Cuenca | Datos específicos del hospital de Cuenca |

### Estructura de Datos

```sql
-- Entidades principales en cada base de datos
centros_medicos     # Centros médicos por región
especialidades      # Especialidades médicas
medicos            # Médicos asignados por centro
empleados          # Empleados administrativos
pacientes          # Pacientes por centro
consultas          # Consultas médicas
usuarios           # Usuarios del sistema
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Docker** v24+ y **Docker Compose** v2.0+
- **Node.js** v18+ (para desarrollo local)
- **MySQL** v8.0+ (para desarrollo local)

### 1. Instalación con Docker (Recomendado)

```bash
# Navegar al directorio de microservicios
cd hospital-app/microservices

# Ejecutar todos los servicios
docker-compose up -d

# Verificar que todos los contenedores estén ejecutándose
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f
```

### 2. Instalación Manual (Desarrollo)

```bash
# Instalar dependencias para todos los servicios
npm install

# Configurar variables de entorno
cp api-gateway/env.example api-gateway/.env
cp auth-service/env.example auth-service/.env
cp admin-service/env.example admin-service/.env
cp consultas-service/env.example consultas-service/.env
cp users-service/env.example users-service/.env
cp reports-service/env.example reports-service/.env

# Iniciar cada servicio en terminal separado
cd api-gateway && npm start &
cd auth-service && npm start &
cd admin-service && npm start &
cd consultas-service && npm start &
cd users-service && npm start &
cd reports-service && npm start &
```

### 3. Configuración de Bases de Datos

#### Con Docker (Automático)
```bash
# Las bases de datos se configuran automáticamente
# con los scripts SQL en el directorio /sql
```

#### Manual
```bash
# Crear bases de datos
mysql -u root -p -e "CREATE DATABASE hospital_central;"
mysql -u root -p -e "CREATE DATABASE hospital_guayaquil;"
mysql -u root -p -e "CREATE DATABASE hospital_cuenca;"

# Ejecutar scripts de configuración
mysql -u root -p hospital_central < sql/setup-central.sql
mysql -u root -p hospital_guayaquil < sql/setup-guayaquil.sql
mysql -u root -p hospital_cuenca < sql/setup-cuenca.sql

# Ejecutar scripts de estructura
mysql -u root -p hospital_central < sql/central.sql
mysql -u root -p hospital_guayaquil < sql/guayaquil.sql
mysql -u root -p hospital_cuenca < sql/cuenca.sql
```

## 🔧 Variables de Entorno

### API Gateway (.env)
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=tu_clave_jwt_secreta_minimo_32_caracteres
AUTH_SERVICE_URL=http://auth-service:3001
ADMIN_SERVICE_URL=http://admin-service:3002
CONSULTAS_SERVICE_URL=http://consultas-service:3003
USERS_SERVICE_URL=http://users-service:3004
REPORTS_SERVICE_URL=http://reports-service:3005
FRONTEND_URL=http://localhost:5173
```

### Auth Service (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=tu_clave_jwt_secreta_minimo_32_caracteres
DB_HOST=mysql-central
DB_USER=admin_central
DB_PASSWORD=tu_password_db_central
DB_PORT=3306
DB_NAME=hospital_central
```

### Admin Service (.env)
```env
NODE_ENV=development
PORT=3002
JWT_SECRET=tu_clave_jwt_secreta_minimo_32_caracteres
DB_HOST=mysql-central
DB_USER=admin_central
DB_PASSWORD=tu_password_db_central
DB_PORT=3306
DB_NAME=hospital_central
DB_GUAYAQUIL_HOST=mysql-guayaquil
DB_GUAYAQUIL_USER=admin_guayaquil
DB_GUAYAQUIL_PASSWORD=tu_password_db_guayaquil
DB_GUAYAQUIL_PORT=3306
DB_GUAYAQUIL_NAME=hospital_guayaquil
DB_CUENCA_HOST=mysql-cuenca
DB_CUENCA_USER=admin_cuenca
DB_CUENCA_PASSWORD=tu_password_db_cuenca
DB_CUENCA_PORT=3306
DB_CUENCA_NAME=hospital_cuenca
```

## 🧪 Testing y Verificación

### Verificar Servicios

```bash
# Verificar API Gateway
curl http://localhost:3000/health

# Verificar microservicios individuales
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Admin Service
curl http://localhost:3003/health  # Consultas Service
curl http://localhost:3004/health  # Users Service
curl http://localhost:3005/health  # Reports Service

# Verificar conectividad entre servicios
curl http://localhost:3000/api/test-services
```

### Testing con Docker

```bash
# Test de contenedores
docker-compose up --build
docker-compose down

# Test de conectividad interna
docker-compose exec api-gateway curl http://auth-service:3001/health
docker-compose exec api-gateway curl http://admin-service:3002/health
```

## 📊 Monitoreo y Logging

### Logs por Servicio

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de servicio específico
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f admin-service
docker-compose logs -f consultas-service
docker-compose logs -f users-service
docker-compose logs -f reports-service

# Logs de archivo
tail -f logs/gateway.log
tail -f logs/auth.log
tail -f logs/admin.log
tail -f logs/consultas.log
tail -f logs/users.log
tail -f logs/reports.log
```

### Métricas de Rendimiento

```bash
# Verificar uso de recursos
docker stats

# Verificar estado de contenedores
docker-compose ps

# Verificar redes
docker network ls
docker network inspect microservices_hospital-network
```

## 🔐 Seguridad Implementada

### Medidas de Seguridad por Servicio

#### API Gateway
- ✅ **Helmet** para headers de seguridad
- ✅ **CORS** configurado correctamente
- ✅ **Rate limiting** para protección DDoS
- ✅ **Validación de tokens** JWT
- ✅ **Proxy seguro** a servicios internos

#### Microservicios
- ✅ **Autenticación JWT** en cada servicio
- ✅ **Validaciones** de entrada con express-validator
- ✅ **Encriptación** de contraseñas con bcryptjs
- ✅ **CORS** configurado por servicio
- ✅ **Logging** de accesos y acciones
- ✅ **Rate limiting** en Admin Service

### Comunicación Segura

```bash
# Comunicación interna entre servicios
auth-service:3001    ←→  api-gateway:3000
admin-service:3002   ←→  api-gateway:3000
consultas-service:3003 ←→ api-gateway:3000
users-service:3004   ←→  api-gateway:3000
reports-service:3005 ←→  api-gateway:3000

# Comunicación con bases de datos
mysql-central:3307   ←→  todos los servicios
mysql-guayaquil:3308 ←→  admin, consultas, users, reports
mysql-cuenca:3309    ←→  admin, consultas, users, reports
```

## 🚀 Despliegue

### Desarrollo Local

```bash
# Opción 1: Docker (Recomendado)
docker-compose up -d

# Opción 2: Manual
# Iniciar cada servicio en terminal separado
```

### Producción

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

### Escalabilidad

```bash
# Escalar servicio específico
docker-compose up -d --scale admin-service=3

# Escalar múltiples servicios
docker-compose up -d --scale admin-service=2 --scale consultas-service=2
```

## 📦 Scripts Disponibles

### Docker Compose

```bash
# Desarrollo
docker-compose up -d              # Iniciar todos los servicios
docker-compose down               # Detener todos los servicios
docker-compose logs -f            # Ver logs en tiempo real
docker-compose restart service    # Reiniciar servicio específico

# Producción
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down

# Mantenimiento
docker-compose build --no-cache  # Rebuild sin cache
docker-compose pull              # Actualizar imágenes
docker-compose exec service bash # Acceder a contenedor
```

### Scripts de Base de Datos

```bash
# Insertar datos de prueba
node insert-sample-data.js

# Reset de bases de datos
node reset-databases.js

# Backup de bases de datos
mysqldump -u admin_central -p hospital_central > backup_central_$(date +%Y%m%d).sql
mysqldump -u admin_guayaquil -p hospital_guayaquil > backup_guayaquil_$(date +%Y%m%d).sql
mysqldump -u admin_cuenca -p hospital_cuenca > backup_cuenca_$(date +%Y%m%d).sql
```

## 🔧 Mantenimiento

### Actualizaciones

```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Fix automático
npm audit fix

# Rebuild Docker
docker-compose build --no-cache
```

### Backup y Restauración

```bash
# Backup completo
docker-compose exec mysql-central mysqldump -u admin_central -p hospital_central > backup_central.sql

# Restauración
docker-compose exec mysql-central mysql -u admin_central -p hospital_central < backup_central.sql
```

## 📚 Documentación Adicional

- [Documentación Principal](../README.md) - Guía completa del sistema
- [Documentación Frontend](../frontend/FRONTEND_DOCUMENTATION.md) - Frontend con microservicios
- [Guía de Seguridad](../README_SEGURIDAD.md) - Seguridad en microservicios
- [Guía de Validaciones](../README_VALIDACIONES.md) - Validaciones distribuidas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- **ESLint** para JavaScript
- **Conventional Commits** para mensajes de commit
- **Tests unitarios** para nuevas funcionalidades
- **Documentación** de nuevos endpoints

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Equipo de Desarrollo** - *Desarrollo completo* - [@equipo](https://github.com/equipo)

## 🙏 Agradecimientos

- Universidad Técnica de Ambato
- Facultad de Ingeniería en Sistemas, Electrónica e Industrial
- Ing. Jose Caiza, Mg - Profesor de Aplicaciones Distribuidas

## 📞 Contacto

- **Email**: dev@hospitalapp.com
- **Proyecto**: [https://github.com/equipo/hospital-app](https://github.com/equipo/hospital-app)

---

<div align="center">

**🏥 Microservicios - Sistema de Gestión Hospitalaria 🏥**

*Desarrollado con ❤️ para la gestión eficiente de centros médicos*

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green.svg)](https://nodejs.org/)
[![Built with Express](https://img.shields.io/badge/Built%20with-Express-blue.svg)](https://expressjs.com/)
[![Powered by MySQL](https://img.shields.io/badge/Powered%20by-MySQL-orange.svg)](https://www.mysql.com/)
[![Containerized with Docker](https://img.shields.io/badge/Containerized%20with-Docker-blue.svg)](https://docker.com/)

</div>
