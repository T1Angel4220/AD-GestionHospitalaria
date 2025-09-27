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

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: 3307
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3308
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3309
  }
};

// SQL para crear la tabla empleados (exactamente como en tu sql.txt)
const createEmpleadosTable = `
-- Tabla Empleados
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    id_centro INT NOT NULL,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);
`;

// SQL para insertar datos de prueba
const insertEmpleadosData = `
INSERT INTO empleados (nombres, apellidos, cargo, id_centro) VALUES
('Ana', 'García', 'Enfermera Jefe', 1),
('Carlos', 'López', 'Técnico de Laboratorio', 1),
('María', 'Rodríguez', 'Recepcionista', 1),
('Luis', 'Martínez', 'Auxiliar de Enfermería', 1),
('Elena', 'Fernández', 'Farmacéutica', 1);
`;

async function addEmpleadosTable(dbName, config) {
  console.log(`\n🔧 Agregando tabla empleados: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Verificar si la tabla ya existe
    const [tables] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'empleados'
    `, [config.database]);
    
    if (tables[0].count > 0) {
      console.log(`✅ Tabla 'empleados' ya existe`.success);
      
      // Verificar si tiene datos
      const [count] = await connection.query('SELECT COUNT(*) as count FROM empleados');
      console.log(`📊 Empleados existentes: ${count[0].count}`.info);
      
      if (count[0].count === 0) {
        console.log(`📝 Insertando datos de prueba...`.info);
        await connection.query(insertEmpleadosData);
        console.log(`✅ Datos de prueba insertados`.success);
      }
    } else {
      // Crear la tabla empleados
      console.log(`🔨 Creando tabla 'empleados'...`.info);
      await connection.query(createEmpleadosTable);
      console.log(`✅ Tabla 'empleados' creada exitosamente`.success);
      
      // Insertar datos de prueba
      console.log(`📝 Insertando datos de prueba...`.info);
      await connection.query(insertEmpleadosData);
      console.log(`✅ Datos de prueba insertados exitosamente`.success);
    }
    
    // Verificar que la tabla existe y tiene datos
    const [count] = await connection.query('SELECT COUNT(*) as count FROM empleados');
    console.log(`📈 Total empleados: ${count[0].count}`.info);
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error en ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runAddEmpleados() {
  console.log(`\n🚀 AGREGANDO TABLA EMPLEADOS`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  console.log(`📋 SQL: ${createEmpleadosTable.trim()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await addEmpleadosTable(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos actualizadas: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡TABLA EMPLEADOS AGREGADA A TODAS LAS BASES DE DATOS!`.success);
    console.log(`\n🔍 Ahora puedes probar el Reports Service sin errores`.info);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención manual`.warning);
  }
}

runAddEmpleados();
