# Script para configurar las bases de datos del sistema hospitalario
# Ejecutar como administrador en PowerShell

Write-Host "🏥 Configurando bases de datos del sistema hospitalario..." -ForegroundColor Green

# Configuración de MySQL
$mysqlUser = "root"
$mysqlPassword = ""
$mysqlHost = "localhost"
$mysqlPort = "3306"

# Solicitar contraseña de MySQL si no está configurada
if ($mysqlPassword -eq "") {
    $mysqlPassword = Read-Host "Ingresa la contraseña de MySQL (root)" -AsSecureString
    $mysqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword))
}

Write-Host "📋 Creando bases de datos..." -ForegroundColor Yellow

# Crear las bases de datos
$createDatabases = @"
CREATE DATABASE IF NOT EXISTS hospital_central;
CREATE DATABASE IF NOT EXISTS hospital_guayaquil;
CREATE DATABASE IF NOT EXISTS hospital_cuenca;
SHOW DATABASES LIKE 'hospital_%';
"@

try {
    $createDatabases | mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost -P $mysqlPort
    Write-Host "✅ Bases de datos creadas correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creando bases de datos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Configurando estructura de tablas y datos..." -ForegroundColor Yellow

# Ejecutar el script SQL completo
try {
    Get-Content "setup-databases.sql" | mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost -P $mysqlPort
    Write-Host "✅ Estructura de tablas y datos configurados correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error configurando tablas: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow

# Verificar que todo esté configurado
$verification = @"
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
"@

try {
    $verification | mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost -P $mysqlPort
    Write-Host "✅ Verificación completada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en verificación: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 ¡Configuración de bases de datos completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "  - hospital_central (Quito)" -ForegroundColor White
Write-Host "  - hospital_guayaquil (Guayaquil)" -ForegroundColor White
Write-Host "  - hospital_cuenca (Cuenca)" -ForegroundColor White
Write-Host ""
Write-Host "👤 Usuarios de prueba:" -ForegroundColor Cyan
Write-Host "  - Admin: admin@hospital.com / password" -ForegroundColor White
Write-Host "  - Médico Guayaquil: medico@guayaquil.com / password" -ForegroundColor White
Write-Host "  - Médico Cuenca: medico@cuenca.com / password" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ahora puedes ejecutar: npm run start:all" -ForegroundColor Green
