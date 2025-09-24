# API de Administración - Documentación

Esta documentación describe los endpoints de administración para gestionar médicos, empleados, centros médicos, especialidades y usuarios.

## Base URL
```
http://localhost:3000/api/admin
```

## Endpoints Disponibles

### 1. Médicos (`/medicos`)

#### GET `/medicos`
Obtiene la lista de todos los médicos con información de especialidad y centro.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "id_especialidad": 1,
    "id_centro": 1,
    "especialidad_nombre": "Cardiología",
    "centro_nombre": "Hospital Central",
    "centro_ciudad": "Bogotá"
  }
]
```

#### GET `/medicos/:id`
Obtiene un médico específico por ID.

#### POST `/medicos`
Crea un nuevo médico.

**Body:**
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "id_especialidad": 1,
  "id_centro": 1
}
```

#### PUT `/medicos/:id`
Actualiza un médico existente.

#### DELETE `/medicos/:id`
Elimina un médico.

---

### 2. Empleados (`/empleados`)

#### GET `/empleados`
Obtiene la lista de todos los empleados con información del centro.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombres": "María",
    "apellidos": "González",
    "cargo": "Enfermera",
    "id_centro": 1,
    "centro_nombre": "Hospital Central",
    "centro_ciudad": "Bogotá"
  }
]
```

#### GET `/empleados/:id`
Obtiene un empleado específico por ID.

#### POST `/empleados`
Crea un nuevo empleado.

**Body:**
```json
{
  "nombres": "María",
  "apellidos": "González",
  "cargo": "Enfermera",
  "id_centro": 1
}
```

#### PUT `/empleados/:id`
Actualiza un empleado existente (actualización parcial permitida).

#### DELETE `/empleados/:id`
Elimina un empleado.

---

### 3. Centros Médicos (`/centros`)

#### GET `/centros`
Obtiene la lista de todos los centros médicos.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Hospital Central",
    "ciudad": "Bogotá",
    "direccion": "Calle 123 #45-67"
  }
]
```

#### GET `/centros/:id`
Obtiene un centro específico por ID.

#### POST `/centros`
Crea un nuevo centro médico.

**Body:**
```json
{
  "nombre": "Hospital Central",
  "ciudad": "Bogotá",
  "direccion": "Calle 123 #45-67"
}
```

#### PUT `/centros/:id`
Actualiza un centro existente (actualización parcial permitida).

#### DELETE `/centros/:id`
Elimina un centro médico.

---

### 4. Especialidades (`/especialidades`)

#### GET `/especialidades`
Obtiene la lista de todas las especialidades.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Cardiología"
  }
]
```

#### GET `/especialidades/:id`
Obtiene una especialidad específica por ID.

#### POST `/especialidades`
Crea una nueva especialidad.

**Body:**
```json
{
  "nombre": "Cardiología"
}
```

#### PUT `/especialidades/:id`
Actualiza una especialidad existente.

#### DELETE `/especialidades/:id`
Elimina una especialidad.

---

### 5. Usuarios (`/usuarios`)

#### GET `/usuarios`
Obtiene la lista de todos los usuarios con información del centro y médico asociado.

**Respuesta:**
```json
[
  {
    "id": 1,
    "email": "admin@hospital.com",
    "rol": "admin",
    "id_centro": 1,
    "id_medico": null,
    "centro_nombre": "Hospital Central",
    "centro_ciudad": "Bogotá",
    "medico_nombres": null,
    "medico_apellidos": null
  }
]
```

#### GET `/usuarios/:id`
Obtiene un usuario específico por ID.

#### POST `/usuarios`
Crea un nuevo usuario.

**Body:**
```json
{
  "email": "medico@hospital.com",
  "password": "password123",
  "rol": "medico",
  "id_centro": 1,
  "id_medico": 1
}
```

**Roles válidos:** `admin`, `medico`

#### PUT `/usuarios/:id`
Actualiza un usuario existente (actualización parcial permitida).

#### DELETE `/usuarios/:id`
Elimina un usuario.

---

## Códigos de Estado HTTP

- `200` - OK
- `201` - Creado
- `204` - Sin contenido (para DELETE exitoso)
- `400` - Solicitud incorrecta
- `404` - No encontrado
- `409` - Conflicto (email duplicado, nombre de especialidad duplicado)
- `500` - Error interno del servidor

## Validaciones

### Médicos
- `nombres`, `apellidos`, `id_especialidad`, `id_centro` son obligatorios
- El centro y especialidad deben existir

### Empleados
- `nombres`, `apellidos`, `cargo`, `id_centro` son obligatorios
- El centro debe existir

### Centros Médicos
- `nombre` y `ciudad` son obligatorios

### Especialidades
- `nombre` es obligatorio y debe ser único

### Usuarios
- `email`, `password`, `rol`, `id_centro` son obligatorios
- `email` debe ser único
- `rol` debe ser 'admin' o 'medico'
- Si `rol` es 'medico', `id_medico` es opcional pero debe existir si se proporciona
- El centro debe existir

## Base de Datos

Las tablas necesarias están definidas en `sql.txt`. Asegúrate de ejecutar ese script en tu base de datos MySQL antes de usar la API.

## Configuración

La API usa la configuración del archivo `.env`:
- `DB_HOST`: IP del servidor de base de datos
- `DB_PORT`: Puerto de MySQL (3306)
- `DB_USER`: Usuario de la base de datos
- `DB_PASS`: Contraseña de la base de datos
- `DB_NAME`: Nombre de la base de datos (hospital_central)
