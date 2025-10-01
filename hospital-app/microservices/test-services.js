const axios = require('axios');

// URLs de los microservicios
const services = {
  auth: 'http://localhost:3001',
  admin: 'http://localhost:3002',
  users: 'http://localhost:3004'
};

async function testService(name, url) {
  try {
    console.log(`\n🔍 Probando ${name} en ${url}...`);
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    console.log(`✅ ${name}: OK - ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return false;
  }
}

async function testAllServices() {
  console.log('🚀 VERIFICANDO SERVICIOS');
  console.log('========================\n');
  
  const results = [];
  
  for (const [name, url] of Object.entries(services)) {
    const result = await testService(name, url);
    results.push({ name, url, status: result });
  }
  
  console.log('\n📋 RESUMEN:');
  console.log('============');
  
  results.forEach(({ name, url, status }) => {
    const icon = status ? '✅' : '❌';
    console.log(`${icon} ${name}: ${url} - ${status ? 'FUNCIONANDO' : 'NO DISPONIBLE'}`);
  });
  
  const workingServices = results.filter(r => r.status).length;
  const totalServices = results.length;
  
  console.log(`\n📊 Servicios funcionando: ${workingServices}/${totalServices}`);
  
  if (workingServices === totalServices) {
    console.log('🎉 ¡Todos los servicios están funcionando!');
  } else {
    console.log('⚠️ Algunos servicios necesitan atención');
    console.log('\n💡 Para iniciar los servicios, ejecuta:');
    console.log('   docker-compose up -d');
  }
}

testAllServices();
