## Despliegue en Azure (4 VMs) – Paso a Paso

Este documento te guía para desplegar tu proyecto tal cual está (sin modificar código), separando por VMs: Bases de Datos, Servicios, Perímetro API (Gateway + Auth) y Frontend. Solo ajustarás variables de entorno (URLs/IPs).

### Topología
- VM1 (DB): 3 contenedores MySQL (central, guayaquil, cuenca) con volumen persistente
- VM2 (Servicios): admin-service, consultas-service, users-service, reports-service
- VM3 (Perímetro API): api-gateway, auth-service + Nginx con HTTPS
- VM4 (Frontend): Nginx sirviendo el `dist/` de Vite con HTTPS

### Requisitos
- Azure CLI instalado localmente o usar Azure Cloud Shell
- Dominio opcional para HTTPS (ej.: api.tu-dominio.com, app.tu-dominio.com)

---
## 1) Crear recursos en Azure (CLI)

1. Iniciar sesión y seleccionar suscripción
```bash
az login
az account set --subscription "<SUBSCRIPTION_NAME_OR_ID>"
```

2. Grupo de recursos y red
```bash
RG=hospital-rg
LOC=eastus2
VNET=hospital-vnet
SUBNET=hospital-subnet

az group create -n $RG -l $LOC
az network vnet create -g $RG -n $VNET --address-prefix 10.10.0.0/16 \
  --subnet-name $SUBNET --subnet-prefix 10.10.1.0/24
```

3. Crear 4 VMs Ubuntu 22.04 LTS
```bash
IMG=Ubuntu2204
SIZE=Standard_B1ms
ADMIN=azureuser

# VM1 (DB) – sin IP pública (recomendado)
az vm create -g $RG -n vm-db --image $IMG --size $SIZE \
  --admin-username $ADMIN --generate-ssh-keys \
  --vnet-name $VNET --subnet $SUBNET --public-ip-address "" \
  --nsg ""

# VM2 (Servicios) – sin IP pública (recomendado)
az vm create -g $RG -n vm-svcs --image $IMG --size $SIZE \
  --admin-username $ADMIN --generate-ssh-keys \
  --vnet-name $VNET --subnet $SUBNET --public-ip-address "" \
  --nsg ""

# VM3 (API) – con IP pública
az vm create -g $RG -n vm-api --image $IMG --size $SIZE \
  --admin-username $ADMIN --generate-ssh-keys \
  --vnet-name $VNET --subnet $SUBNET

# VM4 (Frontend) – con IP pública
az vm create -g $RG -n vm-frontend --image $IMG --size $SIZE \
  --admin-username $ADMIN --generate-ssh-keys \
  --vnet-name $VNET --subnet $SUBNET
```

4. Abrir puertos (NSG) solo donde aplica
```bash
# VM3 (API): 80/443 y SSH
az vm open-port -g $RG -n vm-api --port 80 --priority 300
az vm open-port -g $RG -n vm-api --port 443 --priority 310
az vm open-port -g $RG -n vm-api --port 22 --priority 320

# VM4 (Frontend): 80/443 y SSH
az vm open-port -g $RG -n vm-frontend --port 80 --priority 330
az vm open-port -g $RG -n vm-frontend --port 443 --priority 340
az vm open-port -g $RG -n vm-frontend --port 22 --priority 350

# SSH a VM1/VM2: entra por jump (API/Frontend) o usa Azure Bastion
```

5. Obtener IPs
```bash
API_IP=$(az vm list-ip-addresses -g $RG -n vm-api --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" -o tsv)
FRONT_IP=$(az vm list-ip-addresses -g $RG -n vm-frontend --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" -o tsv)
echo API: $API_IP  FRONTEND: $FRONT_IP

# IPs privadas (para configurar servicios ↔ DB)
DB_PRIV=$(az vm list-ip-addresses -g $RG -n vm-db --query "[0].virtualMachine.network.privateIpAddresses[0]" -o tsv)
SVCS_PRIV=$(az vm list-ip-addresses -g $RG -n vm-svcs --query "[0].virtualMachine.network.privateIpAddresses[0]" -o tsv)
echo DB_PRIV: $DB_PRIV  SVCS_PRIV: $SVCS_PRIV
```

API:       135.119.152.120
FRONTEND:  20.1.147.26
DB_PRIV:   10.10.1.4
SVCS_PRIV: 10.10.1.5


6. DNS (opcional): omitir si usarás IPs directamente
   - Usaremos tus IPs públicas sin dominio:
     - API_URL:    http://135.119.152.120
     - FRONTEND:   http://20.1.147.26

---
## 2) Instalar Docker en cada VM

En cada VM ejecuta (SSH):
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose v2 (si no viene)
sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin
docker compose version
```

O copia el script del repo y ejecútalo:
```bash
curl -sL https://raw.githubusercontent.com/<TU_REPO>/azure/scripts/install-docker.sh | bash
```

---
## 3) Despliegue por VM

### VM1 (DB)
1. (Opción recomendada) Clona el repositorio en la VM
2. (Opcional) ajusta contraseñas en `azure/env/db.env.sample` y exporta variables
3. Levanta bases de datos:
```bash
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps
```

Comandos rápidos (clonar repo en VM1 y desplegar):
```bash
# Conéctate por SSH a VM1 (DB)
ssh azureuser@10.10.1.4

# Clonar el repositorio
git clone https://github.com/T1Angel4220/AD-GestionHospitalaria.git
cd AD-GestionHospitalaria/hospital-app/azure/compose

# Levantar MySQL (usa env ya preparado)
docker compose -f docker-compose.db.yml --env-file ../env/db.env up -d
docker compose -f docker-compose.db.yml ps
```

Notas:
- En producción, lo ideal es NO publicar puertos MySQL a internet. Este compose expone 3307/3308/3309; puedes restringirlos en NSG a la subred o quitarlos si conectas servicios con red privada avanzada.

### VM2 (Servicios)
1. Clona el repositorio si aún no lo hiciste
2. Edita variables: apunta `DB_HOST`, `DB_GUAYAQUIL_HOST`, `DB_CUENCA_HOST` a la IP privada de VM1 (`$DB_PRIV`) y usa puertos 3306 internos de MySQL en contenedor (por defecto dentro del contenedor es 3306)
3. Levanta servicios:
```bash
docker compose -f docker-compose.services.yml up -d
docker compose -f docker-compose.services.yml ps
```

Comandos rápidos (clonar repo en VM2 y desplegar):
```bash
# Conéctate por SSH a VM2 (Servicios)
ssh azureuser@10.10.1.5

# Clonar el repositorio
git clone https://github.com/T1Angel4220/AD-GestionHospitalaria.git
cd AD-GestionHospitalaria/hospital-app/azure/compose

# Levantar servicios (usa env ya preparado)
docker compose -f docker-compose.services.yml --env-file ../env/services.env up -d --build
docker compose -f docker-compose.services.yml ps
```

### VM3 (API)
1. Clona el repositorio si aún no lo hiciste
2. Edita variables en el compose: URLs de servicios hacia VM2 (`$SVCS_PRIV`) y `FRONTEND_URL`
   - Ejemplo con tus IPs (sin dominio):
```bash
# .env para docker-compose.edge.yml
JWT_SECRET=SuperJWTSecret123!
SERVICES_HOST=10.10.1.5
DB_CENTRAL_HOST=10.10.1.4
DB_CENTRAL_PASSWORD=SuperPasswordCentral123!
FRONTEND_URL=http://20.1.147.26
```
3. Levanta gateway + auth:
```bash
docker compose -f docker-compose.edge.yml up -d
```
4. Nginx (host) sin dominio (HTTP). Si luego tienes dominio, aplica Certbot.
```bash
sudo apt-get update -y && sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/api.conf >/dev/null < api.conf
sudo ln -s /etc/nginx/sites-available/api.conf /etc/nginx/sites-enabled/api.conf || true
sudo nginx -t && sudo systemctl reload nginx
# Opcional HTTPS con dominio más adelante usando certbot
```

Comandos rápidos (clonar repo en VM3 y desplegar):
```bash
# Conéctate por SSH a VM3 (API)
ssh azureuser@135.119.152.120

# Clonar el repositorio
git clone https://github.com/T1Angel4220/AD-GestionHospitalaria.git
cd AD-GestionHospitalaria/hospital-app/azure/compose

# Levantar gateway + auth (usa env ya preparado)
docker compose -f docker-compose.edge.yml --env-file ../env/edge.env up -d --build

# Nginx
sudo cp ../nginx/api.conf /etc/nginx/sites-available/api.conf
sudo ln -sf /etc/nginx/sites-available/api.conf /etc/nginx/sites-enabled/api.conf
sudo nginx -t && sudo systemctl reload nginx
```

### VM4 (Frontend)
1. Build local del frontend o en la VM. Si lo haces en la VM (usando IPs):
```bash
sudo apt-get install -y nodejs npm
cd frontend/vite-project
echo "VITE_API_URL=http://135.119.152.120/api" > .env.production
echo "VITE_FRONTEND_URL=http://20.1.147.26" >> .env.production
npm ci && npm run build
```
2. Instala Nginx y configura el host (HTTP). Si luego tienes dominio, agrega Certbot.
```bash
sudo apt-get update -y && sudo apt-get install -y nginx
sudo mkdir -p /var/www/hospital-frontend
sudo rsync -av dist/ /var/www/hospital-frontend/
sudo tee /etc/nginx/sites-available/frontend.conf >/dev/null < ~/frontend.conf
sudo ln -s /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/frontend.conf || true
sudo nginx -t && sudo systemctl reload nginx
# Opcional HTTPS con dominio más adelante usando certbot
```

Comandos rápidos (clonar repo en VM4 y desplegar):
```bash
# Conéctate por SSH a VM4 (Frontend)
ssh azureuser@20.1.147.26

# Clonar el repositorio
git clone https://github.com/T1Angel4220/AD-GestionHospitalaria.git

# Instalar Node y Nginx
sudo apt-get update -y && sudo apt-get install -y nodejs npm nginx

# Build del frontend con IPs
cd AD-GestionHospitalaria/hospital-app/frontend/vite-project
echo "VITE_API_URL=http://135.119.152.120/api" > .env.production
echo "VITE_FRONTEND_URL=http://20.1.147.26" >> .env.production
npm ci && npm run build

# Publicar con Nginx
sudo mkdir -p /var/www/hospital-frontend
sudo rsync -av dist/ /var/www/hospital-frontend/
sudo cp ../../azure/nginx/frontend.conf /etc/nginx/sites-available/frontend.conf
sudo ln -sf /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/frontend.conf
sudo nginx -t && sudo systemctl reload nginx
```

---
## 4) Variables de entorno (samples)
- `azure/env/api-gateway.env.sample`
- `azure/env/services.env.sample`
- `azure/env/db.env.sample`

Duplica y ajusta valores reales. No subas los .env reales al repositorio.

---
## 5) Verificación
```bash
# Gateway
curl -k https://api.tu-dominio.com/health
curl -k https://api.tu-dominio.com/api/test-services

# Frontend en navegador
https://app.tu-dominio.com
```

Si el gateway no conecta a servicios, revisa:
- IPs privadas en vars del gateway (edge compose)
- Puertos/NSG entre VM3 y VM2
- Logs: `docker compose logs -f` en cada VM

---
## 6) Datos de ejemplo
En producción, evita levantar el dev server desde `setup-hospital.js`. Para poblar datos usa tus scripts `microservices/insert-sample-data.js` o adapta las funciones de reset/insert ejecutadas desde tu máquina con acceso a MySQL de VM1 (habilitando temporalmente puertos y restringiendo por IP).

---
## 7) Mantenimiento
- Backups: `mysqldump` en VM1 a Azure Storage
- Actualizaciones: `docker compose pull && docker compose up -d`
- SSL: certbot renueva automáticamente (revisa timers)

---
## 8) Notas
- No se modificó ningún archivo de lógica. Solo configuraciones externas.
- Si necesitas reducir a 3 VMs: combina VM2+VM3 (servicios + gateway) y conserva VM1 (DB) y VM4 (Frontend).


