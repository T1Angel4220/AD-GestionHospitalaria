# API de Autenticación - Sistema Hospitalario

## Endpoints de Autenticación

### 1. Login
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "usuario@hospital.com",
  "password": "contraseña"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "token": "jwt_token_aqui",
  "user": {
    "id": 1,
    "email": "usuario@hospital.com",
    "rol": "medico",
    "id_centro": 1,
    "id_medico": 1,
    "centro": {
      "id": 1,
      "nombre": "Hospital Central",
      "ciudad": "Bogotá"
    },
    "medico": {
      "id": 1,
      "nombres": "Juan Carlos",
      "apellidos": "García López",
      "especialidad": "Medicina General"
    }
  }
}
```

### 2. Register (Solo Admin)
**POST** `/api/auth/register`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "nuevo@hospital.com",
  "password": "contraseña123",
  "rol": "medico",
  "id_centro": 1,
  "id_medico": 1
}
```

### 3. Solicitar Recuperación de Contraseña
**POST** `/api/auth/forgot-password`

**Body:**
```json
{
  "email": "usuario@hospital.com"
}
```

**Respuesta:**
```json
{
  "message": "Si el email existe, se enviará un enlace de recuperación"
}
```

### 4. Resetear Contraseña
**POST** `/api/auth/reset-password`

**Body:**
```json
{
  "token": "token_de_recuperacion",
  "newPassword": "nueva_contraseña123"
}
```

### 5. Verificar Token de Recuperación
**GET** `/api/auth/verify-reset-token/:token`

### 6. Obtener Perfil
**GET** `/api/auth/profile`

**Headers:** `Authorization: Bearer <token>`

### 7. Cambiar Contraseña
**POST** `/api/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña123"
}
```

## Endpoints de Consultas (Protegidos)

Todas las rutas de consultas requieren autenticación y acceso al centro médico.

**Headers requeridos:**
- `Authorization: Bearer <token>`
- `X-Centro-Id: <id_del_centro>`

### Endpoints disponibles:
- `GET /api/consultas` - Listar consultas
- `POST /api/consultas` - Crear consulta
- `GET /api/consultas/:id` - Obtener consulta
- `PUT /api/consultas/:id` - Actualizar consulta
- `DELETE /api/consultas/:id` - Eliminar consulta
- `GET /api/consultas/medicos` - Listar médicos del centro
- `GET /api/consultas/especialidades` - Listar especialidades
- `GET /api/consultas/centros` - Listar centros médicos

## Configuración

### Variables de Entorno (.env)
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

### Configuración de Gmail para Nodemailer
1. Habilitar autenticación de 2 factores en tu cuenta de Gmail
2. Generar una "Contraseña de aplicación" específica para esta app
3. Usar esa contraseña en `SMTP_PASS`

## Roles y Permisos

### Admin
- Puede crear usuarios (register)
- Acceso a todos los centros médicos
- Gestión completa del sistema

### Médico
- Solo puede acceder a su centro médico asignado
- No puede crear usuarios
- Acceso limitado a sus propias consultas

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Tokens JWT con expiración de 24 horas
- Tokens de recuperación con expiración de 1 hora
- Validación de acceso por centro médico
- Headers CORS configurados para el frontend
