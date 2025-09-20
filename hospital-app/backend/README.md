# Hospital Central - Backend (Sistema de Gestión Hospitalaria)

Servicio web en Node.js + Express + MySQL (mysql2) con autenticación JWT y gestión completa de médicos, usuarios y consultas médicas por centro hospitalario.

## Características

- 🔐 **Autenticación JWT** con roles (admin, médico)
- 🏥 **Gestión de consultas médicas** por centro
- 👨‍⚕️ **Gestión de médicos** (crear, listar)
- 👥 **Control de acceso** basado en roles y centros médicos
- 🔒 **Seguridad** con bcrypt y validaciones
- 📋 **Flujo completo** admin → médicos → usuarios → consultas

## Requisitos
- Node.js 18+
- MySQL/MariaDB 10+

## Configuración
1. Instala dependencias:
```bash
npm install
```

2. Crea `.env` en `backend/`:
```ini
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASS=tu_password
DB_NAME=hospital_central

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# URLs
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## Base de Datos

1. **Ejecuta el esquema principal:**
```bash
# Ejecuta sql.txt en tu base de datos MySQL
mysql -u tu_usuario -p hospital_central < sql.txt
```

2. **Ejecuta las actualizaciones de autenticación:**
```bash
# Ejecuta sql_auth_update.txt para agregar campos de autenticación
mysql -u tu_usuario -p hospital_central < sql_auth_update.txt
```

Esto creará:
- Tablas de centros médicos, especialidades, médicos, empleados
- Tabla de usuarios con autenticación
- Tabla de consultas médicas
- Datos de ejemplo para testing

## Ejecutar
```bash
npm start
```

## Pruebas
```bash
# Ejecutar script de pruebas de autenticación
node test_auth.js
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario médico (solo admin)
- `GET /api/auth/profile` - Obtener perfil
- `POST /api/auth/change-password` - Cambiar contraseña

### Consultas (Protegidas)
Todas requieren headers: `Authorization: Bearer <token>` y `X-Centro-Id: <id>`

Base URL: `http://localhost:3000/api/consultas`

- Crear médico (solo admin)
  - `POST /medicos`
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
  - Body ejemplo:
```json
{
  "nombres": "Dr. Juan",
  "apellidos": "Pérez",
  "id_especialidad": 1,
  "id_centro": 1
}
```

- Listar médicos del centro
  - `GET /medicos`
  - Headers: `Authorization: Bearer <token>`, `X-Centro-Id: <id>`

- Crear consulta
  - `POST /`
  - Headers: `Content-Type: application/json`, `X-Centro-Id: <id>`
  - Body ejemplo:
```json
{
  "id_medico": 1,
  "paciente_nombre": "Juan",
  "paciente_apellido": "Pérez",
  "fecha": "2025-09-19 10:30:00",
  "motivo": "Dolor de cabeza",
  "diagnostico": "Migraña",
  "tratamiento": "Analgésicos"
}
```

- Listar consultas (filtros opcionales)
  - `GET /?medico=1&desde=2025-09-01&hasta=2025-09-30&q=Dolor`

- Obtener por id
  - `GET /:id`

- Actualizar
  - `PUT /:id`
  - Body parcial con los campos a modificar

- Eliminar
  - `DELETE /:id`

### Aislamiento por hospital
- Todas las operaciones exigen `X-Centro-Id` y filtran por `id_centro`.
- Se valida que `id_medico` pertenezca al mismo `id_centro` al crear/actualizar.
- FKs garantizan integridad y borrado en cascada por centro.

## Postman
Importa el collection: [`src/docs/consultas.postman_collection.json`](./src/docs/consultas.postman_collection.json)
- Variables: `baseUrl` (ej. `http://localhost:3000`) y `centroId` (ej. `1`).
- Incluye: Ping, Crear, Listar, Obtener, Actualizar, Eliminar.

## Usuarios de Prueba

- **Admin:** admin@hospital.com / admin123
- **Médicos:** Ver `sql_auth_update.txt` para más usuarios

## Documentación

Ver `API_DOCUMENTATION.md` para detalles completos de la API.

## Estructura del Proyecto

```
src/
├── config/
│   └── db.js          # Configuración de base de datos
├── middlewares/
│   └── auth.js        # Middleware de autenticación JWT
├── routes/
│   ├── auth.ts        # Rutas de autenticación (login, register)
│   └── consultas.ts   # Rutas de consultas y médicos
└── index.ts           # Punto de entrada
```

## Flujo de Trabajo

### 1. Admin crea médicos
```
POST /api/consultas/medicos
```
- Solo administradores pueden crear médicos
- Se asigna especialidad y centro médico

### 2. Admin registra usuarios médicos
```
POST /api/auth/register
```
- Asigna email y contraseña a médicos existentes
- Vincula usuario con médico específico

### 3. Médicos hacen login
```
POST /api/auth/login
```
- Acceden con sus credenciales asignadas
- Solo pueden ver su centro médico

### 4. Gestión de consultas
- Médicos crean/editan consultas de su centro
- Control de acceso por centro médico

## Roles y Permisos

### Admin
- ✅ Crear médicos
- ✅ Crear usuarios médicos
- ✅ Acceso a todos los centros
- ✅ Gestión completa del sistema

### Médico
- ❌ No puede crear médicos
- ❌ No puede crear usuarios
- ✅ Solo su centro médico
- ✅ Gestionar consultas de su centro
