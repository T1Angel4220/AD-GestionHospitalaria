#!/bin/bash

echo "🛑 DETENIENDO SISTEMA HOSPITALARIO"
echo "⏰ Fecha: $(date)"
echo "================================================"

# Detener servicios
echo "🐳 Deteniendo contenedores..."
docker-compose -f docker-compose.production.yml down

# Limpiar contenedores huérfanos
echo "🧹 Limpiando contenedores huérfanos..."
docker-compose -f docker-compose.production.yml down --remove-orphans

# Mostrar estado
echo "📊 Estado actual:"
docker-compose -f docker-compose.production.yml ps

echo "================================================"
echo "✅ SISTEMA DETENIDO CORRECTAMENTE"
echo "================================================"
