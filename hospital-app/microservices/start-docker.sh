#!/bin/bash

echo "🚀 INICIANDO SISTEMA HOSPITALARIO CON DOCKER"
echo "⏰ Fecha: $(date)"
echo "================================================"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Crear directorio de logs
mkdir -p logs

# Iniciar servicios
echo "🐳 Iniciando contenedores con Frontend Único..."
docker-compose -f docker-compose.frontend-unified.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose -f docker-compose.frontend-unified.yml ps

echo "================================================"
echo "✅ SISTEMA INICIADO CORRECTAMENTE"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 API Gateway: http://localhost:3001"
echo "📊 Monitoreo: docker-compose -f docker-compose.frontend-unified.yml logs -f"
echo "🛑 Detener: docker-compose -f docker-compose.frontend-unified.yml down"
echo "================================================"
