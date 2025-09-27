# 🗄️ Configuración de Bases de Datos - Sistema Hospitalario

## 📋 Prerrequisitos

- ✅ MySQL 8.0+ instalado y funcionando
- ✅ Usuario `root` con acceso completo
- ✅ PowerShell (Windows) o Terminal (Linux/Mac)

## 🚀 Opción 1: Script Automático (Recomendado)

### En Windows (PowerShell):

```powershell
# 1. Abrir PowerShell como administrador
# 2. Navegar al directorio de microservicios
cd hospital-app\microservices

# 3. Ejecutar el script automático
.\setup-databases.ps1
```

### En Linux/Mac (Terminal):

```bash
# 1. Navegar al directorio de microservicios
cd hospital-app/microservices

# 2. Hacer el script ejecutable
chmod +x setup-databases.sh

# 3. Ejecutar el script
./setup-databases.sh
```

## 🛠️ Opción 2: Manual (Paso a Paso)

### Paso 1: Crear las Bases de Datos

```sql
-- Conectar a MySQL
mysql -u root -p

-- Crear las bases de datos
CREATE DATABASE hospital_central;
CREATE DATABASE hospital_guayaquil;
CREATE DATABASE hospital_cuenca;

-- Verificar que se crearon
SHOW DATABASES LIKE 'hospital_%';
```

### Paso 2: Ejecutar el Script SQL

```bash
# Ejecutar el script completo
mysql -u root -p < setup-databases.sql
```

### Paso 3: Verificar la Configuración

```sql
-- Verificar datos en Central
USE hospital_central;
SELECT 'CENTRAL - Centros' as info, COUNT(*) as total FROM centros_medicos
UNION ALL
SELECT 'CENTRAL - Especialidades', COUNT(*) FROM especialidades
UNION ALL
SELECT 'CENTRAL - Usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'CENTRAL - Médicos', COUNT(*) FROM medicos
UNION ALL
SELECT 'CENTRAL - Pacientes', COUNT(*) FROM pacientes
UNION ALL
SELECT 'CENTRAL - Consultas', COUNT(*) FROM consultas;
```

## 📊 Estructura de las Bases de Datos

### 🏥 hospital_central (Quito)
- **Centros Médicos**: Información de todos los centros
- **Especialidades**: Catálogo de especialidades médicas
- **Usuarios**: Usuarios del sistema (admin y médicos)
- **Médicos**: Médicos del centro central
- **Pacientes**: Pacientes del centro central
- **Consultas**: Consultas del centro central

### 🏥 hospital_guayaquil (Guayaquil)
- **Usuarios**: Usuarios del centro Guayaquil
- **Médicos**: Médicos del centro Guayaquil
- **Pacientes**: Pacientes del centro Guayaquil
- **Consultas**: Consultas del centro Guayaquil

### 🏥 hospital_cuenca (Cuenca)
- **Usuarios**: Usuarios del centro Cuenca
- **Médicos**: Médicos del centro Cuenca
- **Pacientes**: Pacientes del centro Cuenca
- **Consultas**: Consultas del centro Cuenca

## 👤 Usuarios de Prueba Creados

| Email | Contraseña | Rol | Centro | Descripción |
|-------|------------|-----|--------|-------------|
| admin@hospital.com | password | admin | 1 (Quito) | Administrador del sistema |
| medico@guayaquil.com | password | medico | 2 (Guayaquil) | Médico de Guayaquil |
| medico@cuenca.com | password | medico | 3 (Cuenca) | Médico de Cuenca |

## 🔧 Configuración de Variables de Entorno

Después de crear las bases de datos, actualiza el archivo `.env`:

```env
# JWT Secret
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui

# Base de datos Central (Quito)
CENTRAL_DB_HOST=localhost
CENTRAL_DB_USER=root
CENTRAL_DB_PASSWORD=tu_password_aqui
CENTRAL_DB_NAME=hospital_central
CENTRAL_DB_PORT=3306

# Base de datos Guayaquil
GUAYAQUIL_DB_HOST=localhost
GUAYAQUIL_DB_USER=root
GUAYAQUIL_DB_PASSWORD=tu_password_aqui
GUAYAQUIL_DB_NAME=hospital_guayaquil
GUAYAQUIL_DB_PORT=3306

# Base de datos Cuenca
CUENCA_DB_HOST=localhost
CUENCA_DB_USER=root
CUENCA_DB_PASSWORD=tu_password_aqui
CUENCA_DB_NAME=hospital_cuenca
CUENCA_DB_PORT=3306
```

## ✅ Verificación Final

Para verificar que todo está configurado correctamente:

```bash
# 1. Verificar que MySQL esté funcionando
mysql -u root -p -e "SELECT VERSION();"

# 2. Verificar que las bases de datos existen
mysql -u root -p -e "SHOW DATABASES LIKE 'hospital_%';"

# 3. Verificar datos de prueba
mysql -u root -p -e "USE hospital_central; SELECT COUNT(*) as centros FROM centros_medicos;"
```

## 🚨 Solución de Problemas

### Error: "Access denied for user 'root'"
```bash
# Verificar credenciales de MySQL
mysql -u root -p
# Si no funciona, verificar que MySQL esté ejecutándose
```

### Error: "Database already exists"
```bash
# Eliminar bases de datos existentes si es necesario
mysql -u root -p -e "DROP DATABASE IF EXISTS hospital_central; DROP DATABASE IF EXISTS hospital_guayaquil; DROP DATABASE IF EXISTS hospital_cuenca;"
```

### Error: "Table doesn't exist"
```bash
# Verificar que el script SQL se ejecutó completamente
mysql -u root -p -e "USE hospital_central; SHOW TABLES;"
```

## 🎯 Siguiente Paso

Una vez configuradas las bases de datos:

1. **Configurar variables de entorno**: `cp env.example .env`
2. **Instalar dependencias**: `npm run install:all`
3. **Iniciar microservicios**: `npm run start:all`
4. **Iniciar frontend**: `cd ../frontend/vite-project && npm run dev`

---

**¡Las bases de datos están listas para el sistema de microservicios!** 🎉
