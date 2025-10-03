# Configuración UTF-8 para Sistema Hospitalario

Este documento explica cómo configurar y verificar la compatibilidad UTF-8 en el sistema hospitalario para manejar correctamente caracteres especiales en español.

## 🎯 Objetivo

Asegurar que todas las tablas de la base de datos puedan manejar caracteres especiales en español como:
- **Vocales acentuadas**: á, é, í, ó, ú
- **Caracteres especiales**: ñ, ü, ç
- **Símbolos**: ¿, ¡, etc.

## 🔧 Configuración Automática

### Opción 1: Inicio completo con UTF-8
```bash
# En Windows (PowerShell)
./start-with-utf8.sh

# En Linux/Mac
chmod +x start-with-utf8.sh
./start-with-utf8.sh
```

### Opción 2: Configuración manual paso a paso

1. **Iniciar servicios Docker:**
```bash
docker-compose up -d --build
```

2. **Esperar a que las bases de datos estén listas:**
```bash
# Esperar aproximadamente 30 segundos
```

3. **Aplicar configuración UTF-8:**
```bash
node configure-utf8.js
```

4. **Verificar configuración:**
```bash
node verify-utf8.js
```

## 📋 Scripts Disponibles

### `configure-utf8.js`
- Aplica configuración UTF-8 básica a todas las bases de datos
- Convierte tablas existentes a `utf8mb4_unicode_ci`
- Configura campos de texto específicos

### `apply-utf8-complete.js`
- Aplica configuración UTF-8 completa y avanzada
- Incluye verificación de configuración
- Prueba inserción de caracteres especiales

### `verify-utf8.js`
- Verifica que la configuración UTF-8 esté funcionando
- Muestra estado de todas las tablas
- Prueba inserción de caracteres especiales

## 🗄️ Configuración de Bases de Datos

### Docker Compose
El archivo `docker-compose.yml` está configurado con:
```yaml
command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --init-connect="SET NAMES utf8mb4"
```

### Scripts SQL
- `sql/configure-utf8.sql`: Script SQL para configuración UTF-8
- Se ejecuta automáticamente al inicializar contenedores Docker

## 🔍 Verificación

### Verificar configuración de tablas:
```sql
SELECT 
  TABLE_NAME,
  TABLE_COLLATION,
  CHARACTER_SET_NAME
FROM information_schema.TABLES t
JOIN information_schema.COLLATIONS c ON t.TABLE_COLLATION = c.COLLATION_NAME
WHERE t.TABLE_SCHEMA = 'hospital_central'
ORDER BY TABLE_NAME;
```

### Probar caracteres especiales:
```sql
INSERT INTO pacientes (nombres, apellidos, cedula) 
VALUES ('José María', 'Niño', '1234567890');
```

## 🚨 Solución de Problemas

### Error: "Unknown collation"
```bash
# Verificar versión de MySQL
docker exec hospital-mysql-central mysql --version

# Debe ser MySQL 8.0 o superior
```

### Error: "Connection refused"
```bash
# Verificar que los contenedores estén ejecutándose
docker ps

# Reiniciar servicios si es necesario
docker-compose restart
```

### Caracteres no se muestran correctamente
```bash
# Re-aplicar configuración UTF-8
node apply-utf8-complete.js

# Verificar configuración
node verify-utf8.js
```

## 📊 Estado de Configuración

### Bases de Datos Configuradas:
- ✅ **hospital_central** (Puerto 3307)
- ✅ **hospital_guayaquil** (Puerto 3308)  
- ✅ **hospital_cuenca** (Puerto 3309)

### Tablas con UTF-8:
- ✅ usuarios
- ✅ centros_medicos
- ✅ especialidades
- ✅ medicos
- ✅ empleados
- ✅ pacientes
- ✅ consultas

### Campos de Texto Configurados:
- ✅ nombres, apellidos
- ✅ email, direccion
- ✅ motivo, diagnostico, tratamiento
- ✅ nombre, ciudad, descripcion

## 🎉 Resultado Final

Después de aplicar la configuración UTF-8:

1. **Todas las tablas** usan `utf8mb4_unicode_ci`
2. **Todos los campos de texto** pueden manejar caracteres especiales
3. **Inserción y consulta** de datos con acentos funciona correctamente
4. **Frontend y backend** manejan caracteres especiales sin problemas

## 📝 Notas Importantes

- La configuración se aplica automáticamente en nuevas instalaciones
- Para bases de datos existentes, ejecutar `configure-utf8.js`
- La configuración es compatible con MySQL 8.0+
- No afecta datos existentes, solo mejora la compatibilidad
