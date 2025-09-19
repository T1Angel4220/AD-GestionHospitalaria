# Hospital Central - Backend (Consultas Médicas)

Servicio web en Node.js + Express + MySQL (mysql2) que permite a los hospitales crear, consultar, actualizar y eliminar registros de consultas médicas, con aislamiento por hospital mediante `id_centro`.

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
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASS=tu_password
DB_NAME=hospital_central
```

## Esquema SQL
El archivo [`sql.txt`](./sql.txt) contiene el esquema completo. Si ya tienes datos, evita los `DROP TABLE` y ejecuta solo los bloques necesarios.

Crear solo la tabla `consultas` (seguro):
```sql
USE hospital_central;

CREATE TABLE IF NOT EXISTS consultas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_centro INT NOT NULL,
  id_medico INT NOT NULL,
  paciente_nombre VARCHAR(100) NOT NULL,
  paciente_apellido VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL,
  motivo TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE,
  FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_consultas_centro_fecha ON consultas (id_centro, fecha);
CREATE INDEX IF NOT EXISTS idx_consultas_medico ON consultas (id_medico);
```

## Ejecutar
```bash
npm start
```
- Salud: `GET /ping`

## API Consultas (todas requieren header `X-Centro-Id`)
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

## Próximos pasos (opcional)
- Autenticación JWT y derivar `id_centro` del token.
- Swagger/OpenAPI.
- Paginación y reportes por centro.
