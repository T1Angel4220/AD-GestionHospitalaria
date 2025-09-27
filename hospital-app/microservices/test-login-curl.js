const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testLoginWithCurl() {
  console.log('🔍 PROBANDO LOGIN CON CURL\n');
  
  try {
    // Probar directamente al Auth Service
    console.log('1️⃣ Probando Auth Service directamente...');
    const authResponse = await execAsync('curl -X POST http://localhost:3002/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@hospital.com\\",\\"password\\":\\"admin123\\"}" --max-time 10');
    console.log('✅ Auth Service respuesta:', authResponse.stdout);
    
  } catch (error) {
    console.error('❌ Error en Auth Service:', error.message);
  }
  
  try {
    // Probar a través del API Gateway
    console.log('\n2️⃣ Probando a través del API Gateway...');
    const gatewayResponse = await execAsync('curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@hospital.com\\",\\"password\\":\\"admin123\\"}" --max-time 10');
    console.log('✅ API Gateway respuesta:', gatewayResponse.stdout);
    
  } catch (error) {
    console.error('❌ Error en API Gateway:', error.message);
  }
}

testLoginWithCurl();
