#!/bin/bash

# EQUIPO 1 - Infraestructura y Base
echo "🚀 Desplegando Equipo 1 - Infraestructura y Base"

# Crear directorio del equipo
mkdir -p team1
cd team1

# Copiar servicios del equipo
cp -r ../api-gateway .
cp -r ../auth-service .
cp -r ../sql/central.sql .

# Crear docker-compose para el equipo
cat > docker-compose.yml << EOF
version: '3.8'

services:
  mysql-central:
    image: mysql:8.0
    container_name: hospital-mysql-central
    environment:
      MYSQL_ROOT_PASSWORD: SuperRootPassword123!
      MYSQL_DATABASE: hospital_central
      MYSQL_USER: admin_central
      MYSQL_PASSWORD: SuperPasswordCentral123!
    ports:
      - "3307:3306"
    volumes:
      - mysql_central_data:/var/lib/mysql
      - ./central.sql:/docker-entrypoint-initdb.d/01-central.sql
    networks:
      - hospital-network
    restart: unless-stopped

  api-gateway:
    build: ./api-gateway
    container_name: hospital-api-gateway
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=SuperJWTSecret123!
      - AUTH_SERVICE_URL=http://auth-service:3002
      - ADMIN_SERVICE_URL=http://admin-service:3003
      - CONSULTAS_SERVICE_URL=http://consultas-service:3004
      - USERS_SERVICE_URL=http://users-service:3005
      - REPORTS_SERVICE_URL=http://reports-service:3006
    depends_on:
      - auth-service
    networks:
      - hospital-network
    restart: unless-stopped

  auth-service:
    build: ./auth-service
    container_name: hospital-auth-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - JWT_SECRET=SuperJWTSecret123!
      - DB_HOST=mysql-central
      - DB_USER=admin_central
      - DB_PASSWORD=SuperPasswordCentral123!
      - DB_PORT=3306
      - DB_NAME=hospital_central
    depends_on:
      - mysql-central
    networks:
      - hospital-network
    restart: unless-stopped

volumes:
  mysql_central_data:

networks:
  hospital-network:
    driver: bridge
EOF

echo "✅ Equipo 1 configurado"
echo "📋 Para desplegar: docker-compose up -d"
echo "📋 Para detener: docker-compose down"
