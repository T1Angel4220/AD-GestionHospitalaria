# 🏥 Módulo de Código Fuente — HospitalApp

Este directorio (`hospital-app/`) contiene el código fuente completo del sistema distribuido de gestión hospitalaria, organizado en tres dominios arquitectónicos principales: **Frontend**, **Microservicios Backend** y **Configuración de Despliegue en la Nube (Azure)**.

---

## 📁 Estructura del Directorio

```
hospital-app/
├── 📁 frontend/                  # Cliente Web (Single Page Application)
│   ├── 📄 FRONTEND_DOCUMENTATION.md # Documentación detallada del frontend
│   └── 📁 vite-project/          # Aplicación React 19 + TypeScript + Vite + Tailwind CSS
│
├── 📁 microservices/             # Ecosistema de Microservicios Backend
│   ├── 📄 README_MICROSERVICES.md   # Especificación de puertos, rutas y servicios
│   ├── 📁 api-gateway/           # Puerta de enlace perimetral (Puerto 3000)
│   ├── 📁 auth-service/          # Microservicio de Autenticación y JWT (Puerto 3001)
│   ├── 📁 admin-service/         # Microservicio de Administración y Catálogos (Puerto 3002)
│   ├── 📁 consultas-service/     # Microservicio de Consultas y Pacientes (Puerto 3003)
│   ├── 📁 users-service/         # Microservicio de Cuentas de Usuario (Puerto 3004)
│   ├── 📁 reports-service/       # Microservicio de Reportes y PDF (Puerto 3005)
│   ├── 📁 sql/                   # Esquemas DDL y semillas para MySQL 8.0
│   └── 📄 docker-compose.yml     # Orquestador Docker Compose para entorno local
│
├── 📁 azure/                     # Infraestructura y Despliegue en la Nube
│   ├── 📄 README_AZURE_DEPLOY.md # Guía paso a paso para desplegar en Microsoft Azure
│   ├── 📁 compose/               # Manifiestos Docker Compose segmentados por VM
│   ├── 📁 env/                   # Plantillas de variables de entorno (.sample)
│   ├── 📁 nginx/                 # Archivos de configuración de proxy inverso Nginx
│   └── 📁 scripts/               # Scripts de instalación de runtime en Linux
│
├── 📄 README_SEGURIDAD.md        # Documentación de seguridad, JWT, RBAC y permisos
└── 📄 README_VALIDACIONES.md     # Especificación de validaciones de negocio y datos
```

---

## 📚 Documentación Técnica Específica

Para consultar las especificaciones técnicas de cada área del sistema:

1. 🎨 **[Documentación del Frontend](frontend/FRONTEND_DOCUMENTATION.md):**  
   Arquitectura de componentes React, manejo de estado reactivo con Zustand, sistema de diseño con Tailwind CSS y generación de gráficos en tiempo real con Recharts.

2. ⚙️ **[Documentación de Microservicios](microservices/README_MICROSERVICES.md):**  
   Detalle de endpoints de cada microservicio, puertos de escucha, interacción con bases de datos distribuidas y variables de configuración.

3. 🛡️ **[Guía de Seguridad y Permisos](README_SEGURIDAD.md):**  
   Políticas de autenticación con JSON Web Tokens (JWT), roles de usuario (`admin` y `medico`), protección de rutas en el cliente y validación en API Gateway.

4. 📋 **[Catálogo de Validaciones](README_VALIDACIONES.md):**  
   Reglas de validación implementadas tanto en formularios de usuario como en los controladores backend (algoritmo Módulo 10 para cédulas ecuatorianas, rangos de duración de consultas, etc.).

5. ☁️ **[Despliegue en Azure Multi-VM](azure/README_AZURE_DEPLOY.md):**  
   Topología recomendada de producción con 4 Máquinas Virtuales en red privada (VNet), balanceo perimetral y certificados SSL con Nginx.

---

## ⚡ Comandos Rápidos de Desarrollo

### Iniciar todos los servicios con Docker Compose:
```bash
cd microservices
docker compose up -d
```

### Iniciar el Frontend en modo desarrollo:
```bash
cd frontend/vite-project
npm install
npm run dev
```

> Para consultar la guía principal del proyecto, visita el [README Principal](../README.md) o [PROYECTO_EXPLICACION.md](../PROYECTO_EXPLICACION.md).
