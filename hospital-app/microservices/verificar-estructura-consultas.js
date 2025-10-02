const mysql = require('mysql2/promise');
const colors = require('colors');

// Configuración de colores
colors.setTheme({
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'cyan',
  title: 'magenta',
  service: 'blue'
});

// Configuración de la base de datos de Guayaquil
const dbConfig = {
  host: 'localhost',
  user: 'admin_guayaquil',
  password: 'SuperPasswordGye123!',
  database: 'hospital_guayaquil',
  port: 3308
};

async function verificarEstructuraConsultas() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE LA TABLA CONSULTAS');
  console.log('==============================================\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos de Guayaquil'.success);
    
    // Verificar estructura de la tabla consultas
    console.log('📋 Estructura de la tabla consultas:'.title);
    const [columnas] = await connection.query('DESCRIBE consultas');
    
    console.log('\n📊 COLUMNAS DE LA TABLA CONSULTAS:'.info);
    columnas.forEach(columna => {
      console.log(`   ${columna.Field} - ${columna.Type} - ${columna.Null} - ${columna.Key} - ${columna.Default} - ${columna.Extra}`);
    });
    
    // Contar registros
    const [count] = await connection.query('SELECT COUNT(*) as total FROM consultas');
    console.log(`\n📊 Total de consultas: ${count[0].total}`.info);
    
    // Si hay consultas, mostrar algunas
    if (count[0].total > 0) {
      console.log('\n📋 PRIMERAS 5 CONSULTAS:'.title);
      const [consultas] = await connection.query('SELECT * FROM consultas LIMIT 5');
      
      consultas.forEach((consulta, index) => {
        console.log(`\n${index + 1}. CONSULTA ID: ${consulta.id}`.service);
        Object.entries(consulta).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
        console.log('   ' + '-'.repeat(40));
      });
    }
    
    await connection.end();
    console.log('\n✅ Verificación completada'.success);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`.error);
  }
}

verificarEstructuraConsultas();

