#!/bin/bash

# Script para iniciar el sistema con configuración UTF-8 completa
echo "🚀 Iniciando sistema hospitalario con configuración UTF-8..."

# Verificar que Docker esté ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose. Por favor, inicia Docker primero."
    exit 1
fi

# Detener contenedores existentes si los hay
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Construir y iniciar servicios
echo "🔨 Construyendo e iniciando servicios..."
docker-compose up -d --build

# Esperar a que las bases de datos estén listas
echo "⏳ Esperando a que las bases de datos estén listas..."
sleep 30

# Verificar conexiones a las bases de datos
echo "🔍 Verificando conexiones a las bases de datos..."
node test-connections.js

# Aplicar configuración UTF-8
echo "🔧 Aplicando configuración UTF-8..."
node configure-utf8.js

# Verificar configuración UTF-8
echo "✅ Verificando configuración UTF-8..."
node verify-utf8.js

echo ""
echo "🎉 Sistema hospitalario iniciado con configuración UTF-8 completa!"
echo ""
echo "📋 Servicios disponibles:"
echo "   - API Gateway: http://localhost:3000"
echo "   - Auth Service: http://localhost:3001"
echo "   - Admin Service: http://localhost:3002"
echo "   - Consultas Service: http://localhost:3003"
echo "   - Users Service: http://localhost:3004"
echo "   - Reports Service: http://localhost:3005"
echo ""
echo "🗄️ Bases de datos:"
echo "   - Central (Quito): localhost:3307"
echo "   - Guayaquil: localhost:3308"
echo "   - Cuenca: localhost:3309"
echo ""
echo "💡 Todas las tablas están configuradas para manejar caracteres especiales en español"
echo "   como ñ, á, é, í, ó, ú, ü, ç, etc."
