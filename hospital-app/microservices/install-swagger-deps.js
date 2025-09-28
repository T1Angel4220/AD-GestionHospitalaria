#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Instalando dependencias de Swagger para microservicios...\n');

const services = [
  'api-gateway',
  'auth-service', 
  'admin-service',
  'medico-service'
];

services.forEach(service => {
  console.log(`📦 Instalando dependencias para ${service}...`);
  try {
    execSync('npm install', { 
      cwd: path.join(__dirname, service),
      stdio: 'inherit'
    });
    console.log(`✅ ${service} - Dependencias instaladas correctamente\n`);
  } catch (error) {
    console.error(`❌ Error instalando dependencias para ${service}:`, error.message);
  }
});

console.log('🎉 Instalación completada!');
console.log('\n📚 URLs de documentación Swagger:');
console.log('• API Gateway: http://localhost:3000/api-docs');
console.log('• Auth Service: http://localhost:3001/api-docs');
console.log('• Admin Service: http://localhost:3002/api-docs');
console.log('• Medico Service: http://localhost:3003/api-docs');
console.log('\n🚀 Para iniciar todos los servicios: npm run start:all');
