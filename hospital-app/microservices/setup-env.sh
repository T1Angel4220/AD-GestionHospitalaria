#!/bin/bash

# Script para configurar archivos .env en todos los microservicios

echo "🔧 Configurando archivos .env para microservicios..."

# Función para copiar archivo .env
setup_env() {
    local service=$1
    local env_file="$service/env.local"
    local target_file="$service/.env"
    
    if [ -f "$env_file" ]; then
        cp "$env_file" "$target_file"
        echo "✅ Configurado .env para $service"
    else
        echo "❌ No se encontró $env_file"
    fi
}

# Configurar cada microservicio
setup_env "api-gateway"
setup_env "auth-service"
setup_env "admin-service"
setup_env "consultas-service"
setup_env "users-service"
setup_env "reports-service"

echo ""
echo "🎉 Configuración de .env completada!"
echo ""
echo "📝 Archivos .env creados en:"
echo "  - api-gateway/.env"
echo "  - auth-service/.env"
echo "  - admin-service/.env"
echo "  - consultas-service/.env"
echo "  - users-service/.env"
echo "  - reports-service/.env"
echo ""
echo "💡 Recuerda:"
echo "  - Verificar que las bases de datos estén ejecutándose"
echo "  - Ajustar las credenciales si es necesario"
echo "  - Los puertos de las BDs son: 3306 (Central), 3307 (Guayaquil), 3308 (Cuenca)"
