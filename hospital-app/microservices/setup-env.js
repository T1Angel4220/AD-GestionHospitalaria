const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando archivo .env...');

// Configuración por defecto
const envConfig = `# Configuración de Microservicios - Sistema Hospitalario
# =====================================================

# JWT Secret (cambiar en producción)
JWT_SECRET=hospital_microservices_secret_key_2024_very_secure

# Base de datos Central (Quito)
CENTRAL_DB_HOST=localhost
CENTRAL_DB_USER=root
CENTRAL_DB_PASSWORD=
CENTRAL_DB_NAME=hospital_central
CENTRAL_DB_PORT=3306

# Base de datos Guayaquil
GUAYAQUIL_DB_HOST=localhost
GUAYAQUIL_DB_USER=root
GUAYAQUIL_DB_PASSWORD=
GUAYAQUIL_DB_NAME=hospital_guayaquil
GUAYAQUIL_DB_PORT=3306

# Base de datos Cuenca
CUENCA_DB_HOST=localhost
CUENCA_DB_USER=root
CUENCA_DB_PASSWORD=
CUENCA_DB_NAME=hospital_cuenca
CUENCA_DB_PORT=3306

# URLs de servicios (para desarrollo local)
AUTH_SERVICE_URL=http://localhost:3001
ADMIN_SERVICE_URL=http://localhost:3002
MEDICO_SERVICE_URL=http://localhost:3003

# Frontend
FRONTEND_URL=http://localhost:5173

# Configuración de puertos
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
ADMIN_SERVICE_PORT=3002
MEDICO_SERVICE_PORT=3003

# Configuración de desarrollo
NODE_ENV=development
LOG_LEVEL=info

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173

# Configuración de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

// Función para solicitar contraseña de MySQL
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔐 Ingresa la contraseña de MySQL (root): ', (password) => {
  // Actualizar la configuración con la contraseña
  const finalConfig = envConfig.replace(/CENTRAL_DB_PASSWORD=\nGUAYAQUIL_DB_PASSWORD=\nCUENCA_DB_PASSWORD=/g, 
    `CENTRAL_DB_PASSWORD=${password}\nGUAYAQUIL_DB_PASSWORD=${password}\nCUENCA_DB_PASSWORD=${password}`);

  // Escribir el archivo .env
  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, finalConfig);
    console.log('✅ Archivo .env creado correctamente');
    console.log('📁 Ubicación:', envPath);
    console.log('');
    console.log('🔧 Configuración aplicada:');
    console.log('  - JWT Secret: Configurado');
    console.log('  - Bases de datos: localhost:3306');
    console.log('  - Contraseña MySQL: Configurada');
    console.log('  - Puertos: 3000-3003');
    console.log('  - Frontend: http://localhost:5173');
    console.log('');
    console.log('🚀 Ahora puedes ejecutar: npm run start:all');
  } catch (error) {
    console.error('❌ Error creando archivo .env:', error.message);
  }
  
  rl.close();
});
