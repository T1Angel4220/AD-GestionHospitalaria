# Script para configurar el archivo .env
Write-Host "🔧 Configurando archivo .env..." -ForegroundColor Green

# Solicitar contraseña de MySQL
$mysqlPassword = Read-Host "🔐 Ingresa la contraseña de MySQL (root)" -AsSecureString
$mysqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword))

# Contenido del archivo .env
$envContent = @"
# Configuración de Microservicios - Sistema Hospitalario
# =====================================================

# JWT Secret (cambiar en producción)
JWT_SECRET=hospital_microservices_secret_key_2024_very_secure

# Base de datos Central (Quito)
CENTRAL_DB_HOST=localhost
CENTRAL_DB_USER=root
CENTRAL_DB_PASSWORD=$mysqlPassword
CENTRAL_DB_NAME=hospital_central
CENTRAL_DB_PORT=3306

# Base de datos Guayaquil
GUAYAQUIL_DB_HOST=localhost
GUAYAQUIL_DB_USER=root
GUAYAQUIL_DB_PASSWORD=$mysqlPassword
GUAYAQUIL_DB_NAME=hospital_guayaquil
GUAYAQUIL_DB_PORT=3306

# Base de datos Cuenca
CUENCA_DB_HOST=localhost
CUENCA_DB_USER=root
CUENCA_DB_PASSWORD=$mysqlPassword
CUENCA_DB_NAME=hospital_cuenca
CUENCA_DB_PORT=3306

# URLs de servicios (para desarrollo local)
AUTH_SERVICE_URL=http://localhost:3001
ADMIN_SERVICE_URL=http://localhost:3002
MEDICO_SERVICE_URL=http://localhost:3003

# Frontend
FRONTEND_URL=http://localhost:5173

# Configuración de puertos
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
ADMIN_SERVICE_PORT=3002
MEDICO_SERVICE_PORT=3003

# Configuración de desarrollo
NODE_ENV=development
LOG_LEVEL=info

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173

# Configuración de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

# Escribir el archivo .env
try {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Archivo .env creado correctamente" -ForegroundColor Green
    Write-Host "📁 Ubicación: $(Get-Location)\.env" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Configuración aplicada:" -ForegroundColor Yellow
    Write-Host "  - JWT Secret: Configurado" -ForegroundColor White
    Write-Host "  - Bases de datos: localhost:3306" -ForegroundColor White
    Write-Host "  - Contraseña MySQL: Configurada" -ForegroundColor White
    Write-Host "  - Puertos: 3000-3003" -ForegroundColor White
    Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Ahora puedes ejecutar: npm run start:all" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creando archivo .env: $($_.Exception.Message)" -ForegroundColor Red
}
