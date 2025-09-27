# 🐳 Despliegue con Docker - Sistema Hospitalario

## 📋 Resumen

Sistema de gestión hospitalaria implementado con **arquitectura de microservicios** usando **Docker** para el despliegue.

## 🏗️ Arquitectura

### **Frontend Único (React + Vite)**
- **Puerto**: 3000
- **URL**: http://localhost:3000
- **Tecnología**: React + Vite + TypeScript
- **Funcionalidades**: 
  - Login de usuarios
  - Gestión de médicos, pacientes, empleados
  - Consultas médicas
  - Reportes y estadísticas

### **API Gateway**
- **Puerto**: 3001
- **URL**: http://localhost:3001
- **Función**: Punto de entrada único para todos los microservicios

### **Microservicios**
1. **Auth Service** (Puerto 3002) - Autenticación
2. **Admin Service** (Puerto 3003) - Gestión administrativa
3. **Consultas Service** (Puerto 3004) - Consultas médicas
4. **Users Service** (Puerto 3005) - Gestión de usuarios
5. **Reports Service** (Puerto 3006) - Reportes

### **Bases de Datos Distribuidas**
1. **Central (Quito)** - Puerto 3307
2. **Guayaquil** - Puerto 3308
3. **Cuenca** - Puerto 3309

## 🚀 Cómo Usar

### **1. Iniciar el Sistema Completo**
```bash
# Opción 1: Script automático
./start-docker.sh

# Opción 2: Comando directo
docker-compose -f docker-compose.frontend-unified.yml up -d
```

### **2. Verificar Estado**
```bash
# Ver contenedores
docker-compose -f docker-compose.frontend-unified.yml ps

# Ver logs
docker-compose -f docker-compose.frontend-unified.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.frontend-unified.yml logs -f admin-service
```

### **3. Detener el Sistema**
```bash
# Detener servicios
docker-compose -f docker-compose.frontend-unified.yml down

# Detener y eliminar volúmenes
docker-compose -f docker-compose.frontend-unified.yml down -v
```

## 🔧 Comandos Útiles

### **Gestión de Contenedores**
```bash
# Ver todos los contenedores
docker ps -a

# Ver logs en tiempo real
docker logs -f hospital-frontend

# Entrar a un contenedor
docker exec -it hospital-admin-service sh

# Reiniciar un servicio
docker-compose -f docker-compose.frontend-unified.yml restart admin-service
```

### **Gestión de Base de Datos**
```bash
# Conectar a base de datos Central
docker exec -it hospital-mysql-central mysql -u admin_central -p

# Conectar a base de datos Guayaquil
docker exec -it hospital-mysql-guayaquil mysql -u admin_guayaquil -p

# Conectar a base de datos Cuenca
docker exec -it hospital-mysql-cuenca mysql -u admin_cuenca -p
```

## 📊 Monitoreo

### **Verificar Salud de Servicios**
```bash
# API Gateway
curl http://localhost:3001/health

# Auth Service
curl http://localhost:3002/health

# Admin Service
curl http://localhost:3003/health

# Consultas Service
curl http://localhost:3004/health

# Users Service
curl http://localhost:3005/health

# Reports Service
curl http://localhost:3006/health
```

### **Verificar Frontend**
- Abrir navegador en: http://localhost:3000
- Usuario admin: admin@hospital.com
- Contraseña: admin123

## 🛠️ Desarrollo

### **Estructura del Proyecto**
```
microservices/
├── api-gateway/           # API Gateway
├── auth-service/          # Servicio de autenticación
├── admin-service/         # Servicio de administración
├── consultas-service/     # Servicio de consultas
├── users-service/         # Servicio de usuarios
├── reports-service/       # Servicio de reportes
├── sql/                   # Scripts de base de datos
├── docker-compose.frontend-unified.yml  # Configuración Docker
└── start-docker.sh        # Script de inicio
```

### **Modificar Servicios**
1. Editar código en el directorio del servicio
2. Reconstruir contenedor: `docker-compose -f docker-compose.frontend-unified.yml build admin-service`
3. Reiniciar servicio: `docker-compose -f docker-compose.frontend-unified.yml up -d admin-service`

## 🎯 Ventajas de esta Arquitectura

### **✅ Para el Desarrollo**
- **Frontend único**: Más fácil de mantener
- **Microservicios independientes**: Cada equipo puede trabajar por separado
- **Docker**: Entorno consistente en cualquier máquina
- **Escalabilidad**: Fácil de escalar horizontalmente

### **✅ Para la Producción**
- **Alta disponibilidad**: Si un servicio falla, los otros siguen funcionando
- **Despliegue independiente**: Cada servicio se puede actualizar por separado
- **Monitoreo**: Fácil de monitorear cada servicio
- **Escalabilidad**: Cada servicio se puede escalar según la demanda

## 🚨 Solución de Problemas

### **Problema: Puerto ya en uso**
```bash
# Ver qué está usando el puerto
netstat -tulpn | grep :3000

# Detener todos los contenedores
docker-compose -f docker-compose.frontend-unified.yml down
```

### **Problema: Base de datos no conecta**
```bash
# Ver logs de la base de datos
docker logs hospital-mysql-central

# Reiniciar base de datos
docker-compose -f docker-compose.frontend-unified.yml restart mysql-central
```

### **Problema: Frontend no carga**
```bash
# Ver logs del frontend
docker logs hospital-frontend

# Reconstruir frontend
docker-compose -f docker-compose.frontend-unified.yml build frontend
docker-compose -f docker-compose.frontend-unified.yml up -d frontend
```

## 📞 Soporte

Si tienes problemas:
1. Verificar logs: `docker-compose -f docker-compose.frontend-unified.yml logs -f`
2. Verificar estado: `docker-compose -f docker-compose.frontend-unified.yml ps`
3. Reiniciar servicios: `docker-compose -f docker-compose.frontend-unified.yml restart`

---

**🎉 ¡Sistema listo para usar con Docker!**
