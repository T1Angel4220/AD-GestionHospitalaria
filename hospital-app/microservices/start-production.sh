#!/bin/bash

echo "🚀 INICIANDO SISTEMA HOSPITALARIO EN PRODUCCIÓN"
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
echo "🐳 Iniciando contenedores..."
docker-compose -f docker-compose.production.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose -f docker-compose.production.yml ps

# Verificar salud de los servicios
echo "🏥 Verificando salud de los servicios..."
curl -f http://localhost:3001/health || echo "❌ API Gateway no responde"
curl -f http://localhost:3002/health || echo "❌ Auth Service no responde"
curl -f http://localhost:3003/health || echo "❌ Admin Service no responde"
curl -f http://localhost:3004/health || echo "❌ Consultas Service no responde"
curl -f http://localhost:3005/health || echo "❌ Users Service no responde"
curl -f http://localhost:3006/health || echo "❌ Reports Service no responde"

echo "================================================"
echo "✅ SISTEMA INICIADO CORRECTAMENTE"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 API Gateway: http://localhost:3001"
echo "📊 Monitoreo: docker-compose logs -f"
echo "================================================"
