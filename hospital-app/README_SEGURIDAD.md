# 🔐 Documentación de Seguridad - Sistema Hospitalario

## 📋 Resumen de Seguridad Implementada

Este documento describe las medidas de seguridad implementadas en el sistema hospitalario con **arquitectura de microservicios** para proteger tanto el frontend como los múltiples servicios backend distribuidos.

## 🔐 Autenticación y Autorización

### Frontend

#### 1. **Validación de JWT en Tiempo Real**
- **Archivo**: `frontend/src/api/authApi.ts`
- **Funcionalidad**: 
  - Decodificación de JWT sin verificar para obtener datos del usuario
  - Verificación de expiración del token
  - Limpieza automática de datos cuando el token expira
  - Redirección automática al login cuando la sesión expira

#### 2. **Protección de Rutas**
- **Archivo**: `frontend/src/routes/AppRouter.tsx`
- **Funcionalidad**:
  - Componente `ProtectedRoute` que verifica autenticación y roles
  - Redirección automática según el rol del usuario
  - Pantalla de carga mientras se verifica la autenticación
  - Página de "No autorizado" para accesos denegados

#### 3. **Hook de Seguridad de Rutas**
- **Archivo**: `frontend/src/hooks/useRouteSecurity.ts`
- **Funcionalidad**:
  - Verificación automática de tokens válidos
  - Redirección automática según el estado de autenticación
  - Protección de rutas específicas por rol

#### 4. **Hook de Permisos**
- **Archivo**: `frontend/src/hooks/usePermissions.ts`
- **Funcionalidad**:
  - Verificación de roles específicos
  - Verificación de permisos de acceso a centros
  - Verificación de permisos de gestión de entidades
  - Funciones helper para verificar roles (admin, médico)

#### 5. **Componentes de Protección**
- **Archivo**: `frontend/src/components/ProtectedComponent.tsx`
- **Funcionalidad**:
  - Componente `ProtectedComponent` para mostrar contenido condicional
  - Componentes específicos: `AdminOnly`, `MedicoOnly`, `AdminOrMedico`
  - Verificación de permisos específicos

#### 6. **Interceptor de API**
- **Archivo**: `frontend/src/api/apiInterceptor.ts`
- **Funcionalidad**:
  - Interceptación automática de todas las peticiones HTTP
  - Agregado automático de tokens de autorización
  - Manejo automático de respuestas 401/403
  - Limpieza automática de datos y redirección en caso de token expirado

### Backend (Microservicios)

#### 1. **API Gateway - Punto de Entrada Seguro**
- **Archivo**: `microservices/api-gateway/index.js`
- **Funcionalidad**:
  - Enrutamiento seguro a microservicios
  - Validación de tokens JWT centralizada
  - Rate limiting y protección DDoS
  - Logging de todas las peticiones
  - Proxy seguro a servicios internos

#### 2. **Auth Service - Autenticación Centralizada**
- **Archivo**: `microservices/auth-service/index.js`
- **Funcionalidad**:
  - Generación y validación de tokens JWT
  - Encriptación de contraseñas con bcryptjs
  - Gestión de sesiones de usuario
  - Validación de credenciales
  - Middleware de autenticación distribuido

#### 3. **Middleware de Seguridad por Servicio**
- **Archivos**: `microservices/*/index.js`
- **Funcionalidad**:
  - Verificación de tokens JWT en cada servicio
  - Verificación de roles específicos por servicio
  - Verificación de acceso a centros médicos
  - Validación de permisos por entidad
  - Logging de accesos y acciones

#### 4. **Protección por Roles y Servicios**
- **ADMIN**: Acceso completo a todos los servicios
- **MÉDICO**: Acceso limitado según servicio:
  - Auth Service: Login/logout
  - Consultas Service: Solo sus consultas
  - Reports Service: Solo reportes de su centro
  - Admin Service: Sin acceso
  - Users Service: Sin acceso

## 🛡️ Medidas de Seguridad Implementadas

### 1. **Arquitectura de Microservicios Segura**
- **API Gateway** como punto de entrada único
- **Servicios independientes** con sus propias validaciones
- **Comunicación interna** entre servicios protegida
- **Aislamiento de fallos** por servicio
- **Escalabilidad independiente** por servicio

### 2. **Validación de Tokens Distribuida**
- Verificación de firma JWT en cada servicio
- Verificación de expiración centralizada
- Limpieza automática de datos expirados
- Redirección automática al login
- Tokens compartidos entre servicios

### 3. **Protección de Rutas y Servicios**
- Verificación de autenticación en API Gateway
- Verificación de roles específicos por servicio
- Redirección automática según el estado de autenticación
- Pantallas de carga durante la verificación
- Protección de endpoints internos

### 4. **Interceptación de API Mejorada**
- Agregado automático de tokens de autorización
- Manejo automático de respuestas de error
- Limpieza automática de datos en caso de error
- Retry automático en fallos de red
- Circuit breaker para servicios no disponibles

### 5. **Verificación de Permisos por Servicio**
- Verificación de roles específicos por microservicio
- Verificación de acceso a entidades específicas
- Verificación de permisos de gestión
- Validación de centro médico por servicio
- Logging de accesos por servicio

### 6. **Códigos de Error Específicos**
- `NO_TOKEN`: Token no proporcionado
- `TOKEN_EXPIRED`: Token expirado
- `INVALID_TOKEN`: Token inválido
- `NOT_AUTHENTICATED`: Usuario no autenticado
- `INSUFFICIENT_PERMISSIONS`: Permisos insuficientes
- `SERVICE_UNAVAILABLE`: Servicio no disponible
- `MISSING_CENTRO_ID`: ID de centro faltante
- `CENTRO_ACCESS_DENIED`: Acceso denegado al centro
- `MEDICO_ACCESS_DENIED`: Acceso denegado al médico
- `USER_ACCESS_DENIED`: Acceso denegado al usuario

## 🔒 Flujo de Seguridad

### 1. **Inicio de Sesión**
1. Usuario ingresa credenciales
2. Backend valida credenciales
3. Backend genera JWT con información del usuario
4. Frontend almacena token y datos del usuario
5. Frontend redirige según el rol del usuario

### 2. **Navegación**
1. Usuario intenta acceder a una ruta
2. `useRouteSecurity` verifica el token
3. Si el token es válido, permite el acceso
4. Si el token es inválido, redirige al login
5. Si el usuario no tiene permisos, muestra página de no autorizado

### 3. **Peticiones API**
1. Usuario realiza una acción que requiere API
2. `apiInterceptor` agrega automáticamente el token
3. Backend verifica el token y permisos
4. Si es válido, procesa la petición
5. Si es inválido, devuelve error y frontend redirige al login

### 4. **Expiración de Sesión**
1. Token expira en el backend
2. Frontend detecta token expirado
3. Frontend limpia datos locales
4. Frontend redirige automáticamente al login
5. Usuario debe iniciar sesión nuevamente

## 🚨 Prevención de Vulnerabilidades

### 1. **Acceso Directo por URL**
- ✅ **Prevenido**: Las rutas están protegidas por `ProtectedRoute`
- ✅ **Prevenido**: `useRouteSecurity` verifica tokens en cada navegación
- ✅ **Prevenido**: Redirección automática si no está autenticado

### 2. **Tokens Expirados**
- ✅ **Prevenido**: Verificación de expiración en frontend y backend
- ✅ **Prevenido**: Limpieza automática de datos expirados
- ✅ **Prevenido**: Redirección automática al login

### 3. **Acceso No Autorizado**
- ✅ **Prevenido**: Verificación de roles en frontend y backend
- ✅ **Prevenido**: Verificación de permisos específicos
- ✅ **Prevenido**: Página de "No autorizado" para accesos denegados

### 4. **Inyección de Tokens**
- ✅ **Prevenido**: Verificación de firma JWT en backend
- ✅ **Prevenido**: Validación de estructura del token
- ✅ **Prevenido**: Verificación de expiración

### 5. **Acceso a Datos de Otros Usuarios**
- ✅ **Prevenido**: Verificación de permisos específicos por entidad
- ✅ **Prevenido**: Los médicos solo pueden acceder a sus propios datos
- ✅ **Prevenido**: Los admins tienen acceso completo

## 📋 Verificación de Seguridad

### Para Verificar que las Rutas Están Protegidas:

1. **Abrir una nueva ventana de incógnito**
2. **Intentar acceder directamente a una ruta protegida**:
   - `http://localhost:3000/admin`
   - `http://localhost:3000/medico`
   - `http://localhost:3000/usuarios`
3. **Verificar que redirige automáticamente al login**

### Para Verificar la Expiración de Tokens:

1. **Iniciar sesión normalmente**
2. **Modificar el token en localStorage** (simular token expirado)
3. **Intentar navegar o realizar una acción**
4. **Verificar que redirige automáticamente al login**

### Para Verificar la Protección por Roles:

1. **Iniciar sesión como médico**
2. **Intentar acceder a rutas de admin**:
   - `http://localhost:3000/admin`
   - `http://localhost:3000/usuarios`
3. **Verificar que muestra página de "No autorizado"**

## 🔧 Configuración de Seguridad

### Variables de Entorno Requeridas:

```env
JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRES_IN=24h
```

### Configuración de CORS (si es necesario):

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## 📝 Notas Importantes

1. **Los tokens JWT contienen información sensible**, por lo que se almacenan en localStorage
2. **La verificación de tokens se hace tanto en frontend como backend** para mayor seguridad
3. **Los médicos solo pueden acceder a sus propios datos** y a su centro médico
4. **Los admins tienen acceso completo** a todas las funcionalidades
5. **La expiración de tokens se maneja automáticamente** sin intervención del usuario
6. **Todas las peticiones API incluyen automáticamente el token** de autorización

## 🚀 Mejoras Futuras Sugeridas

1. **Refresh Tokens**: Implementar sistema de refresh tokens para renovación automática
2. **Rate Limiting**: Implementar límites de velocidad para prevenir ataques de fuerza bruta
3. **Auditoría**: Implementar logging de accesos y acciones de usuarios
4. **2FA**: Implementar autenticación de dos factores
5. **Session Management**: Implementar gestión de sesiones múltiples
6. **IP Whitelisting**: Implementar lista blanca de IPs permitidas
7. **Encryption**: Implementar cifrado de datos sensibles en base de datos
