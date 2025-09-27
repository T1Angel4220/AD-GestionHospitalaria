#!/bin/bash

echo "🔧 CONFIGURANDO FRONTEND DISTRIBUIDO POR EQUIPOS"
echo "================================================"

# Crear estructura de directorios
mkdir -p team-frontend/{admin,consultas,reports,shared}

echo "📁 Creando estructura de directorios..."

# ===== EQUIPO ADMIN =====
echo "👥 Configurando Equipo Admin..."
mkdir -p team-frontend/admin/{pages,components,api}

# Copiar páginas de administración
cp -r ../frontend/vite-project/src/pages/MedicosPage.tsx team-frontend/admin/pages/
cp -r ../frontend/vite-project/src/pages/PacientesPage.tsx team-frontend/admin/pages/
cp -r ../frontend/vite-project/src/pages/EmpleadosPage.tsx team-frontend/admin/pages/
cp -r ../frontend/vite-project/src/pages/EspecialidadesPage.tsx team-frontend/admin/pages/
cp -r ../frontend/vite-project/src/pages/CentrosPage.tsx team-frontend/admin/pages/
cp -r ../frontend/vite-project/src/pages/UsuariosPage.tsx team-frontend/admin/pages/

# Copiar componentes de administración
cp -r ../frontend/vite-project/src/components/AdminBanner.tsx team-frontend/admin/components/
cp -r ../frontend/vite-project/src/components/MedicoModals.tsx team-frontend/admin/components/
cp -r ../frontend/vite-project/src/components/UsuarioModals.tsx team-frontend/admin/components/

# Copiar API de administración
cp -r ../frontend/vite-project/src/api/adminApi.ts team-frontend/admin/api/

# ===== EQUIPO CONSULTAS =====
echo "👥 Configurando Equipo Consultas..."
mkdir -p team-frontend/consultas/{pages,components,api}

# Copiar páginas de consultas
cp -r ../frontend/vite-project/src/pages/ConsultasPage.tsx team-frontend/consultas/pages/
cp -r ../frontend/vite-project/src/pages/CalendarPage.tsx team-frontend/consultas/pages/

# Copiar componentes de consultas
cp -r ../frontend/vite-project/src/components/ConsultaCard.tsx team-frontend/consultas/components/
cp -r ../frontend/vite-project/src/components/ConsultaModal.tsx team-frontend/consultas/components/
cp -r ../frontend/vite-project/src/components/ConsultasList.tsx team-frontend/consultas/components/
cp -r ../frontend/vite-project/src/components/Calendar/ team-frontend/consultas/components/

# Copiar API de consultas
cp -r ../frontend/vite-project/src/api/consultasApi.ts team-frontend/consultas/api/

# ===== EQUIPO REPORTS =====
echo "👥 Configurando Equipo Reports..."
mkdir -p team-frontend/reports/{pages,components,api}

# Copiar páginas de reportes
cp -r ../frontend/vite-project/src/pages/ReportesPage.tsx team-frontend/reports/pages/

# Copiar componentes de reportes
cp -r ../frontend/vite-project/src/components/reports/ team-frontend/reports/components/

# Copiar API de reportes
cp -r ../frontend/vite-project/src/api/reportsApi.ts team-frontend/reports/api/

# ===== COMPARTIDO =====
echo "👥 Configurando Componentes Compartidos..."
mkdir -p team-frontend/shared/{components,api,contexts,hooks,utils,types}

# Copiar componentes compartidos
cp -r ../frontend/vite-project/src/components/Header.tsx team-frontend/shared/components/
cp -r ../frontend/vite-project/src/components/Sidebar.tsx team-frontend/shared/components/
cp -r ../frontend/vite-project/src/components/ProtectedRoute.tsx team-frontend/shared/components/
cp -r ../frontend/vite-project/src/components/ProtectedComponent.tsx team-frontend/shared/components/
cp -r ../frontend/vite-project/src/components/ui/ team-frontend/shared/components/

# Copiar API compartida
cp -r ../frontend/vite-project/src/api/authApi.ts team-frontend/shared/api/
cp -r ../frontend/vite-project/src/api/apiInterceptor.ts team-frontend/shared/api/

# Copiar contextos
cp -r ../frontend/vite-project/src/contexts/ team-frontend/shared/

# Copiar hooks
cp -r ../frontend/vite-project/src/hooks/ team-frontend/shared/

# Copiar utils
cp -r ../frontend/vite-project/src/utils/ team-frontend/shared/

# Copiar types
cp -r ../frontend/vite-project/src/types/ team-frontend/shared/

# ===== CREAR DOCKERFILES POR EQUIPO =====

# Dockerfile para Equipo Admin
cat > team-frontend/admin/Dockerfile << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos del equipo
COPY . .

# Instalar dependencias
RUN npm install

# Construir
RUN npm run build

# Etapa de producción
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
EOF

# Dockerfile para Equipo Consultas
cat > team-frontend/consultas/Dockerfile << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos del equipo
COPY . .

# Instalar dependencias
RUN npm install

# Construir
RUN npm run build

# Etapa de producción
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
EOF

# Dockerfile para Equipo Reports
cat > team-frontend/reports/Dockerfile << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos del equipo
COPY . .

# Instalar dependencias
RUN npm install

# Construir
RUN npm run build

# Etapa de producción
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
EOF

echo "✅ Frontend distribuido configurado"
echo "📁 Estructura creada en: team-frontend/"
echo "👥 Equipos: admin, consultas, reports, shared"
echo "================================================"
