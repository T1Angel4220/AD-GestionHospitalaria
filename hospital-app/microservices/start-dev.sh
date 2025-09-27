#!/bin/bash

# Script para iniciar todos los microservicios en modo desarrollo

echo "🚀 Iniciando microservicios del sistema hospitalario..."

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Puerto $1 está en uso"
        return 1
    else
        echo "✅ Puerto $1 disponible"
        return 0
    fi
}

# Verificar puertos
echo "🔍 Verificando puertos..."
check_port 3000 || exit 1
check_port 3001 || exit 1
check_port 3002 || exit 1
check_port 3003 || exit 1
check_port 3004 || exit 1
check_port 3005 || exit 1

# Instalar dependencias si es necesario
echo "📦 Instalando dependencias..."

for service in api-gateway auth-service admin-service consultas-service users-service reports-service; do
    echo "Instalando dependencias para $service..."
    cd $service
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd ..
done

# Crear directorios de logs
echo "📁 Creando directorios de logs..."
mkdir -p logs

# Iniciar servicios en background
echo "🚀 Iniciando servicios..."

# API Gateway
echo "Iniciando API Gateway (puerto 3000)..."
cd api-gateway
npm run dev > ../logs/api-gateway.log 2>&1 &
API_GATEWAY_PID=$!
cd ..

# Auth Service
echo "Iniciando Auth Service (puerto 3001)..."
cd auth-service
npm run dev > ../logs/auth-service.log 2>&1 &
AUTH_SERVICE_PID=$!
cd ..

# Admin Service
echo "Iniciando Admin Service (puerto 3002)..."
cd admin-service
npm run dev > ../logs/admin-service.log 2>&1 &
ADMIN_SERVICE_PID=$!
cd ..

# Consultas Service
echo "Iniciando Consultas Service (puerto 3003)..."
cd consultas-service
npm run dev > ../logs/consultas-service.log 2>&1 &
CONSULTAS_SERVICE_PID=$!
cd ..

# Users Service
echo "Iniciando Users Service (puerto 3004)..."
cd users-service
npm run dev > ../logs/users-service.log 2>&1 &
USERS_SERVICE_PID=$!
cd ..

# Reports Service
echo "Iniciando Reports Service (puerto 3005)..."
cd reports-service
npm run dev > ../logs/reports-service.log 2>&1 &
REPORTS_SERVICE_PID=$!
cd ..

# Guardar PIDs para poder detener los servicios
echo $API_GATEWAY_PID > .pids/api-gateway.pid
echo $AUTH_SERVICE_PID > .pids/auth-service.pid
echo $ADMIN_SERVICE_PID > .pids/admin-service.pid
echo $CONSULTAS_SERVICE_PID > .pids/consultas-service.pid
echo $USERS_SERVICE_PID > .pids/users-service.pid
echo $REPORTS_SERVICE_PID > .pids/reports-service.pid

echo "✅ Todos los servicios iniciados!"
echo ""
echo "📊 Servicios disponibles:"
echo "  🌐 API Gateway: http://localhost:3000"
echo "  🔐 Auth Service: http://localhost:3001"
echo "  👥 Admin Service: http://localhost:3002"
echo "  📋 Consultas Service: http://localhost:3003"
echo "  👤 Users Service: http://localhost:3004"
echo "  📊 Reports Service: http://localhost:3005"
echo ""
echo "📝 Logs disponibles en:"
echo "  - logs/api-gateway.log"
echo "  - logs/auth-service.log"
echo "  - logs/admin-service.log"
echo "  - logs/consultas-service.log"
echo "  - logs/users-service.log"
echo "  - logs/reports-service.log"
echo ""
echo "🛑 Para detener todos los servicios, ejecuta: ./stop-dev.sh"
echo "📊 Para ver logs en tiempo real: tail -f logs/*.log"
