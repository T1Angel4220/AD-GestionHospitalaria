#!/bin/bash

# Script para detener todos los microservicios

echo "🛑 Deteniendo microservicios del sistema hospitalario..."

# Crear directorio de PIDs si no existe
mkdir -p .pids

# Función para detener un servicio
stop_service() {
    local service_name=$1
    local pid_file=".pids/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Deteniendo $service_name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
            echo "✅ $service_name detenido"
        else
            echo "⚠️  $service_name ya estaba detenido"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No se encontró PID para $service_name"
    fi
}

# Detener todos los servicios
stop_service "api-gateway"
stop_service "auth-service"
stop_service "admin-service"
stop_service "consultas-service"
stop_service "users-service"
stop_service "reports-service"

# Limpiar directorio de PIDs
rmdir .pids 2>/dev/null || echo "📁 Directorio .pids limpiado"

echo "✅ Todos los microservicios han sido detenidos"
echo ""
echo "💡 Para verificar que no hay procesos ejecutándose:"
echo "   ps aux | grep node"
echo ""
echo "💡 Para limpiar logs:"
echo "   rm -rf logs/*.log"
