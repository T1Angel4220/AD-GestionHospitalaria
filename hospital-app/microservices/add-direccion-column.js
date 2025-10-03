const mysql = require('mysql2/promise');

async function addDireccionColumn() {
  const dbConfigs = {
    central: {
      host: 'localhost',
      port: 3307,
      user: 'admin_central',
      password: 'SuperPasswordCentral123!',
      database: 'hospital_central'
    },
    guayaquil: {
      host: 'localhost',
      port: 3308,
      user: 'admin_guayaquil',
      password: 'SuperPasswordGye123!',
      database: 'hospital_guayaquil'
    },
    cuenca: {
      host: 'localhost',
      port: 3309,
      user: 'admin_cuenca',
      password: 'SuperPasswordCuenca123!',
      database: 'hospital_cuenca'
    }
  };

  for (const [centro, config] of Object.entries(dbConfigs)) {
    try {
      console.log(`\n🔧 Agregando columna 'direccion' a tabla pacientes en ${centro}...`);
      
      const connection = await mysql.createConnection(config);
      
      // Verificar si la columna ya existe
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pacientes' AND COLUMN_NAME = 'direccion'
      `, [config.database]);
      
      if (columns.length > 0) {
        console.log(`✅ La columna 'direccion' ya existe en ${centro}`);
      } else {
        // Agregar la columna
        await connection.execute(`
          ALTER TABLE pacientes 
          ADD COLUMN direccion TEXT AFTER genero
        `);
        console.log(`✅ Columna 'direccion' agregada exitosamente en ${centro}`);
      }
      
      await connection.end();
      
    } catch (error) {
      console.error(`❌ Error en ${centro}:`, error.message);
    }
  }
  
  console.log('\n🎉 Proceso completado!');
}

addDireccionColumn();


