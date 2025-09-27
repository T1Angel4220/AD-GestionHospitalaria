const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando migración del frontend para microservicios...');

// Configuración de la nueva API
const newApiConfig = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    auth: '/auth',
    admin: '/admin',
    medico: '/medico'
  }
};

// Función para actualizar archivos de API
const updateApiFiles = () => {
  const apiDir = path.join(__dirname, '../frontend/vite-project/src/api');
  
  console.log('📁 Actualizando archivos de API...');
  
  // Actualizar authApi.ts
  const authApiPath = path.join(apiDir, 'authApi.ts');
  if (fs.existsSync(authApiPath)) {
    let content = fs.readFileSync(authApiPath, 'utf8');
    
    // Actualizar URL base
    content = content.replace(
      /const API_BASE_URL = ['"`][^'"`]*['"`]/g,
      `const API_BASE_URL = '${newApiConfig.baseUrl}${newApiConfig.endpoints.auth}'`
    );
    
    fs.writeFileSync(authApiPath, content);
    console.log('✅ authApi.ts actualizado');
  }
  
  // Actualizar adminApi.ts
  const adminApiPath = path.join(apiDir, 'adminApi.ts');
  if (fs.existsSync(adminApiPath)) {
    let content = fs.readFileSync(adminApiPath, 'utf8');
    
    // Actualizar URL base
    content = content.replace(
      /const API_BASE_URL = ['"`][^'"`]*['"`]/g,
      `const API_BASE_URL = '${newApiConfig.baseUrl}${newApiConfig.endpoints.admin}'`
    );
    
    // Actualizar endpoints específicos
    content = content.replace(/\/medicos/g, '/medicos');
    content = content.replace(/\/empleados/g, '/empleados');
    content = content.replace(/\/centros/g, '/centros');
    content = content.replace(/\/especialidades/g, '/especialidades');
    content = content.replace(/\/usuarios/g, '/usuarios');
    content = content.replace(/\/pacientes/g, '/pacientes');
    content = content.replace(/\/reportes/g, '/reportes/estadisticas');
    
    fs.writeFileSync(adminApiPath, content);
    console.log('✅ adminApi.ts actualizado');
  }
  
  // Actualizar consultasApi.ts
  const consultasApiPath = path.join(apiDir, 'consultasApi.ts');
  if (fs.existsSync(consultasApiPath)) {
    let content = fs.readFileSync(consultasApiPath, 'utf8');
    
    // Actualizar URL base para médico
    content = content.replace(
      /const API_BASE_URL = ['"`][^'"`]*['"`]/g,
      `const API_BASE_URL = '${newApiConfig.baseUrl}${newApiConfig.endpoints.medico}'`
    );
    
    // Actualizar endpoints
    content = content.replace(/\/consultas/g, '/consultas');
    content = content.replace(/\/medicos/g, '/medicos');
    content = content.replace(/\/especialidades/g, '/especialidades');
    content = content.replace(/\/centros/g, '/centros');
    content = content.replace(/\/pacientes/g, '/pacientes');
    content = content.replace(/\/usuarios/g, '/usuarios');
    
    fs.writeFileSync(consultasApiPath, content);
    console.log('✅ consultasApi.ts actualizado');
  }
  
  // Actualizar pacientesApi.ts
  const pacientesApiPath = path.join(apiDir, 'pacientesApi.ts');
  if (fs.existsSync(pacientesApiPath)) {
    let content = fs.readFileSync(pacientesApiPath, 'utf8');
    
    // Determinar si es para admin o médico
    if (content.includes('adminApi')) {
      // Es para admin
      content = content.replace(
        /const API_BASE_URL = ['"`][^'"`]*['"`]/g,
        `const API_BASE_URL = '${newApiConfig.baseUrl}${newApiConfig.endpoints.admin}'`
      );
      content = content.replace(/\/pacientes/g, '/pacientes');
    } else {
      // Es para médico
      content = content.replace(
        /const API_BASE_URL = ['"`][^'"`]*['"`]/g,
        `const API_BASE_URL = '${newApiConfig.baseUrl}${newApiConfig.endpoints.medico}'`
      );
      content = content.replace(/\/pacientes/g, '/pacientes');
    }
    
    fs.writeFileSync(pacientesApiPath, content);
    console.log('✅ pacientesApi.ts actualizado');
  }
  
  // Actualizar reportsApi.ts
  const reportsApiPath = path.join(apiDir, 'reportsApi.ts');
  if (fs.existsSync(reportsApiPath)) {
    let content = fs.readFileSync(reportsApiPath, 'utf8');
    
    // Actualizar URL base para admin
    content = content.replace(
      /const API_BASE_URL = ['"`][^'"`]*['"`]/g,
      `const API_BASE_URL = '${newApiConfig.baseUrl}${newApiConfig.endpoints.admin}'`
    );
    
    // Actualizar endpoints
    content = content.replace(/\/reports/g, '/reportes');
    
    fs.writeFileSync(reportsApiPath, content);
    console.log('✅ reportsApi.ts actualizado');
  }
};

// Función para crear archivo de configuración de entorno
const createEnvFile = () => {
  const envPath = path.join(__dirname, '../frontend/vite-project/.env');
  const envContent = `# Configuración de Microservicios
VITE_API_BASE_URL=${newApiConfig.baseUrl}
VITE_AUTH_ENDPOINT=${newApiConfig.endpoints.auth}
VITE_ADMIN_ENDPOINT=${newApiConfig.endpoints.admin}
VITE_MEDICO_ENDPOINT=${newApiConfig.endpoints.medico}

# Configuración de desarrollo
VITE_NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado');
};

// Función para actualizar config/env.ts
const updateEnvConfig = () => {
  const envConfigPath = path.join(__dirname, '../frontend/vite-project/src/config/env.ts');
  
  if (fs.existsSync(envConfigPath)) {
    let content = fs.readFileSync(envConfigPath, 'utf8');
    
    // Actualizar configuración
    content = content.replace(
      /export const API_BASE_URL = ['"`][^'"`]*['"`]/g,
      `export const API_BASE_URL = '${newApiConfig.baseUrl}'`
    );
    
    // Agregar nuevos endpoints
    if (!content.includes('ADMIN_ENDPOINT')) {
      content += `
export const ADMIN_ENDPOINT = '${newApiConfig.endpoints.admin}';
export const MEDICO_ENDPOINT = '${newApiConfig.endpoints.medico}';
export const AUTH_ENDPOINT = '${newApiConfig.endpoints.auth}';
`;
    }
    
    fs.writeFileSync(envConfigPath, content);
    console.log('✅ config/env.ts actualizado');
  }
};

// Función para actualizar package.json del frontend
const updatePackageJson = () => {
  const packageJsonPath = path.join(__dirname, '../frontend/vite-project/package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Agregar script para microservicios
    if (!packageJson.scripts['dev:microservices']) {
      packageJson.scripts['dev:microservices'] = 'vite --host 0.0.0.0';
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json actualizado');
  }
};

// Función principal
const main = () => {
  try {
    console.log('🚀 Iniciando migración a microservicios...');
    
    // Crear directorio de logs si no existe
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    
    // Ejecutar migraciones
    updateApiFiles();
    createEnvFile();
    updateEnvConfig();
    updatePackageJson();
    
    console.log('✅ Migración completada exitosamente!');
    console.log('');
    console.log('📋 Resumen de cambios:');
    console.log('  - API Gateway: http://localhost:3000');
    console.log('  - Auth Service: http://localhost:3001');
    console.log('  - Admin Service: http://localhost:3002');
    console.log('  - Medico Service: http://localhost:3003');
    console.log('');
    console.log('🔧 Para iniciar los microservicios:');
    console.log('  cd hospital-app/microservices');
    console.log('  npm install');
    console.log('  npm run start:all');
    console.log('');
    console.log('🌐 Para iniciar el frontend:');
    console.log('  cd hospital-app/frontend/vite-project');
    console.log('  npm install');
    console.log('  npm run dev');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración
main();