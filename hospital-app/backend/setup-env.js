const fs = require('fs');
const path = require('path');

const envContent = `# Configuración de la Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=hospital_central

# Configuración del Servidor
PORT=3000

# Configuración JWT (IMPORTANTE: Cambiar en producción)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Configuración de Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente');
  console.log('📁 Ubicación:', envPath);
} catch (error) {
  console.error('❌ Error al crear el archivo .env:', error.message);
  process.exit(1);
}
