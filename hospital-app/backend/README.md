# Hospital Central - Backend (Sistema de Gestión Hospitalaria)

Servicio web en Node.js + Express + MySQL (mysql2) con autenticación JWT, recuperación de contraseña y gestión de consultas médicas por centro hospitalario.

## Características

- 🔐 **Autenticación JWT** con roles (admin, médico)
- 📧 **Recuperación de contraseña** con Nodemailer
- 🏥 **Gestión de consultas médicas** por centro
- 👥 **Control de acceso** basado en roles y centros médicos
- 🔒 **Seguridad** con bcrypt y validaciones

## Requisitos
- Node.js 18+
- MySQL/MariaDB 10+
- Gmail (para envío de emails)

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

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# URLs
FRONTEND_URL=http://localhost:5173
PORT=3000
```

3. Configura Gmail:
- Habilita autenticación de 2 factores
- Genera una "Contraseña de aplicación"
- Usa esa contraseña en `SMTP_PASS`

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
- `POST /api/auth/register` - Registrar usuario (solo admin)
- `POST /api/auth/forgot-password` - Solicitar recuperación
- `POST /api/auth/reset-password` - Resetear contraseña
- `GET /api/auth/profile` - Obtener perfil
- `POST /api/auth/change-password` - Cambiar contraseña

### Consultas (Protegidas)
Todas requieren headers: `Authorization: Bearer <token>` y `X-Centro-Id: <id>`

Base URL: `http://localhost:3000/api/consultas`

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
│   └── auth.js        # Middleware de autenticación
├── routes/
│   ├── auth.ts        # Rutas de autenticación
│   └── consultas.ts   # Rutas de consultas
├── services/
│   └── emailService.js # Servicio de emails
└── index.ts           # Punto de entrada
```

## Roles y Permisos

### Admin
- Crear usuarios
- Acceso a todos los centros
- Gestión completa

### Médico
- Solo su centro médico
- No puede crear usuarios
- Acceso limitado
