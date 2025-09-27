const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando microservicios del sistema hospitalario...');

// Configuración de servicios
const services = [
  {
    name: 'Auth Service',
    port: 3001,
    path: './auth-service',
    command: 'npm',
    args: ['start'],
    color: '🔐'
  },
  {
    name: 'Admin Service',
    port: 3002,
    path: './admin-service',
    command: 'npm',
    args: ['start'],
    color: '👑'
  },
  {
    name: 'Medico Service',
    port: 3003,
    path: './medico-service',
    command: 'npm',
    args: ['start'],
    color: '👨‍⚕️'
  },
  {
    name: 'API Gateway',
    port: 3000,
    path: './api-gateway',
    command: 'npm',
    args: ['start'],
    color: '🚀'
  }
];

// Función para verificar si un puerto está en uso
const checkPort = (port) => {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Puerto disponible
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Puerto en uso
    });
  });
};

// Función para iniciar un servicio
const startService = (service) => {
  return new Promise((resolve, reject) => {
    console.log(`${service.color} Iniciando ${service.name} en puerto ${service.port}...`);
    
    const child = spawn(service.command, service.args, {
      cwd: path.resolve(__dirname, service.path),
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // Mostrar logs importantes
      if (message.includes('ejecutándose') || message.includes('listening') || message.includes('started')) {
        console.log(`${service.color} ${service.name}: ${message.trim()}`);
      }
    });
    
    child.stderr.on('data', (data) => {
      const message = data.toString();
      console.error(`${service.color} ${service.name} ERROR: ${message.trim()}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${service.color} ${service.name} iniciado correctamente`);
        resolve();
      } else {
        console.error(`${service.color} ${service.name} falló con código ${code}`);
        reject(new Error(`Servicio ${service.name} falló`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`${service.color} Error iniciando ${service.name}:`, error.message);
      reject(error);
    });
    
    // Guardar referencia del proceso
    service.process = child;
  });
};

// Función para verificar que todos los servicios estén funcionando
const checkServices = async () => {
  console.log('🔍 Verificando servicios...');
  
  for (const service of services) {
    try {
      const isPortInUse = await checkPort(service.port);
      if (isPortInUse) {
        console.log(`✅ ${service.color} ${service.name} está funcionando en puerto ${service.port}`);
      } else {
        console.log(`❌ ${service.color} ${service.name} no está respondiendo en puerto ${service.port}`);
      }
    } catch (error) {
      console.log(`❌ ${service.color} Error verificando ${service.name}:`, error.message);
    }
  }
};

// Función para manejar la salida del proceso
const handleExit = () => {
  console.log('\n🛑 Deteniendo todos los servicios...');
  
  services.forEach(service => {
    if (service.process) {
      console.log(`${service.color} Deteniendo ${service.name}...`);
      service.process.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    console.log('👋 Todos los servicios han sido detenidos');
    process.exit(0);
  }, 2000);
};

// Función principal
const main = async () => {
  try {
    // Verificar que los directorios existen
    const fs = require('fs');
    for (const service of services) {
      const servicePath = path.resolve(__dirname, service.path);
      if (!fs.existsSync(servicePath)) {
        console.error(`❌ Directorio no encontrado: ${servicePath}`);
        process.exit(1);
      }
    }
    
    // Instalar dependencias si es necesario
    console.log('📦 Verificando dependencias...');
    for (const service of services) {
      const packageJsonPath = path.resolve(__dirname, service.path, 'package.json');
      const nodeModulesPath = path.resolve(__dirname, service.path, 'node_modules');
      
      if (fs.existsSync(packageJsonPath) && !fs.existsSync(nodeModulesPath)) {
        console.log(`${service.color} Instalando dependencias para ${service.name}...`);
        const installProcess = spawn('npm', ['install'], {
          cwd: path.resolve(__dirname, service.path),
          stdio: 'inherit',
          shell: true
        });
        
        await new Promise((resolve, reject) => {
          installProcess.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Error instalando dependencias para ${service.name}`));
            }
          });
        });
      }
    }
    
    // Iniciar servicios en paralelo
    console.log('🚀 Iniciando servicios...');
    const startPromises = services.map(service => startService(service));
    
    await Promise.all(startPromises);
    
    // Esperar un poco para que los servicios se estabilicen
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar servicios
    await checkServices();
    
    console.log('\n🎉 Todos los microservicios están funcionando!');
    console.log('📋 Servicios disponibles:');
    console.log('  🚀 API Gateway: http://localhost:3000');
    console.log('  🔐 Auth Service: http://localhost:3001');
    console.log('  👑 Admin Service: http://localhost:3002');
    console.log('  👨‍⚕️ Medico Service: http://localhost:3003');
    console.log('\n💡 Presiona Ctrl+C para detener todos los servicios');
    
    // Configurar manejadores de salida
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    
  } catch (error) {
    console.error('❌ Error iniciando servicios:', error.message);
    process.exit(1);
  }
};

// Ejecutar función principal
main();