# 📚 Documentación Swagger - Microservicios

## 🎯 Resumen

Se ha configurado Swagger/OpenAPI para todos los microservicios del sistema hospitalario, proporcionando documentación interactiva y pruebas de API.

## 🏗️ Arquitectura de Microservicios

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Auth Service   │    │ Admin Service   │    │ Medico Service  │
│   Puerto 3000   │    │   Puerto 3001   │    │   Puerto 3002   │    │   Puerto 3003   │
│                 │    │                 │    │                 │    │                 │
│ • Proxy central │    │ • Login/Logout  │    │ • Gestión admin │    │ • Consultas     │
│ • Swagger UI    │    │ • Registro      │    │ • Usuarios      │    │ • Pacientes     │
│ • Documentación │    │ • JWT tokens    │    │ • Médicos       │    │ • Perfil        │
│   completa      │    │ • Swagger UI    │    │ • Centros       │    │ • Calendario    │
│                 │    │                 │    │ • Swagger UI    │    │ • Estadísticas  │
│                 │    │                 │    │                 │    │ • Swagger UI    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 URLs de Documentación

### 🌐 API Gateway (Punto de entrada)
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json
- **Descripción**: Documentación completa de todos los microservicios

### 🔐 Auth Service
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json
- **Descripción**: Autenticación y autorización

### 👑 Admin Service
- **Swagger UI**: http://localhost:3002/api-docs
- **OpenAPI JSON**: http://localhost:3002/api-docs.json
- **Descripción**: Gestión administrativa completa

### 👨‍⚕️ Medico Service
- **Swagger UI**: http://localhost:3003/api-docs
- **OpenAPI JSON**: http://localhost:3003/api-docs.json
- **Descripción**: Funcionalidades específicas para médicos

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias de Swagger

```bash
# Instalar dependencias para todos los servicios
npm run install:swagger

# O instalar manualmente en cada servicio
cd api-gateway && npm install
cd ../auth-service && npm install
cd ../admin-service && npm install
cd ../medico-service && npm install
```

### 2. Iniciar Servicios

```bash
# Iniciar todos los servicios
npm run start:all

# O iniciar individualmente
npm run start:gateway  # Puerto 3000
npm run start:auth     # Puerto 3001
npm run start:admin    # Puerto 3002
npm run start:medico   # Puerto 3003
```

## 🔧 Características de Swagger

### ✨ Funcionalidades Implementadas

1. **Documentación Interactiva**
   - Interfaz web intuitiva
   - Pruebas de API en tiempo real
   - Ejemplos de request/response

2. **Autenticación JWT**
   - Botón "Authorize" en Swagger UI
   - Configuración de Bearer tokens
   - Validación automática de tokens

3. **Esquemas Completos**
   - Modelos de datos detallados
   - Validaciones de entrada
   - Códigos de respuesta HTTP

4. **Filtros y Búsquedas**
   - Parámetros de consulta documentados
   - Filtros por fecha, estado, etc.
   - Búsquedas de texto

### 🎨 Personalización Visual

- **Tema personalizado**: Colores del sistema hospitalario
- **Logo y favicon**: Branding consistente
- **CSS personalizado**: Interfaz limpia y profesional

## 📖 Guía de Uso

### 1. Acceder a la Documentación

1. Inicia todos los microservicios
2. Abre http://localhost:3000/api-docs en tu navegador
3. Explora la documentación completa

### 2. Probar Endpoints

1. **Autenticación**:
   - Usa `/auth/login` para obtener un token JWT
   - Copia el token de la respuesta
   - Haz clic en "Authorize" y pega el token

2. **Endpoints Protegidos**:
   - Los endpoints marcados con 🔒 requieren autenticación
   - Usa el token JWT en el header Authorization
   - Formato: `Bearer tu_token_aqui`

3. **Pruebas de API**:
   - Haz clic en cualquier endpoint
   - Completa los parámetros requeridos
   - Haz clic en "Execute"
   - Revisa la respuesta

### 3. Ejemplos de Uso

#### Login de Administrador
```json
POST /auth/login
{
  "email": "admin@hospital.com",
  "password": "password123"
}
```

#### Crear Médico (Admin)
```json
POST /admin/medicos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "id_especialidad": 1,
  "id_centro": 1
}
```

#### Crear Consulta (Médico)
```json
POST /medico/consultas
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
{
  "paciente_nombre": "María",
  "paciente_apellido": "González",
  "fecha": "2024-01-15T10:30:00Z",
  "motivo": "Dolor de cabeza",
  "estado": "pendiente"
}
```

## 🔒 Seguridad

### Autenticación JWT
- **Expiración**: 24 horas
- **Algoritmo**: HS256
- **Header**: Authorization: Bearer {token}

### Rate Limiting
- **Login**: 5 intentos por IP cada 15 minutos
- **API Gateway**: 100 requests por IP cada 15 minutos

### Permisos por Rol
- **Admin**: Acceso completo a todos los endpoints
- **Médico**: Acceso limitado a sus consultas y pacientes

## 🗄️ Bases de Datos

### Distribución por Centro
- **Central (Quito)**: Puerto 3306
- **Guayaquil**: Puerto 3307
- **Cuenca**: Puerto 3308

### Conexiones
- Cada servicio se conecta a múltiples bases de datos
- El centro médico determina la base de datos a usar
- Búsquedas distribuidas para usuarios

## 🐛 Solución de Problemas

### Error: "Cannot find module 'swagger-ui-express'"
```bash
# Instalar dependencias
npm run install:swagger
```

### Error: "Port already in use"
```bash
# Verificar puertos en uso
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3003

# Terminar procesos si es necesario
taskkill /PID <PID> /F
```

### Error: "Database connection failed"
1. Verificar que MySQL esté ejecutándose
2. Revisar variables de entorno en `.env`
3. Comprobar credenciales de base de datos

### Swagger UI no carga
1. Verificar que el servicio esté ejecutándose
2. Comprobar que el puerto esté disponible
3. Revisar logs del servicio

## 📝 Logs y Monitoreo

### Logs de Servicios
- **Ubicación**: `logs/combined.log` y `logs/error.log`
- **Formato**: JSON estructurado
- **Niveles**: info, warn, error

### Health Checks
- **API Gateway**: http://localhost:3000/health
- **Auth Service**: http://localhost:3001/health
- **Admin Service**: http://localhost:3002/health
- **Medico Service**: http://localhost:3003/health

## 🔄 Actualizaciones

### Agregar Nuevos Endpoints
1. Actualizar el archivo `swagger.yaml` del servicio
2. Reiniciar el servicio
3. La documentación se actualiza automáticamente

### Modificar Esquemas
1. Editar los schemas en `swagger.yaml`
2. Reiniciar el servicio
3. Verificar en Swagger UI

## 📞 Soporte

Para problemas o preguntas sobre la documentación Swagger:

1. **Revisar logs**: `logs/error.log`
2. **Verificar configuración**: Variables de entorno
3. **Probar endpoints**: Usar Swagger UI
4. **Consultar documentación**: Este archivo

---

## 🎉 ¡Listo para Usar!

La documentación Swagger está completamente configurada y lista para usar. Explora los endpoints, prueba las funcionalidades y desarrolla con confianza usando la documentación interactiva.

**¡Happy coding! 🚀**
