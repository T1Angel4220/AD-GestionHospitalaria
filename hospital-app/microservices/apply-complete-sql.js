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

// SQL completo de tu sql.txt
const completeSQL = `
-- Eliminar si existían (en orden inverso por foreign keys)
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS medicos;
DROP TABLE IF EXISTS empleados;
DROP TABLE IF EXISTS especialidades;
DROP TABLE IF EXISTS centros_medicos;

-- Tabla Centros Médicos
CREATE TABLE centros_medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(200)
);

-- Tabla Especialidades
CREATE TABLE especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla Médicos
CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id) ON DELETE CASCADE,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);

-- Tabla Empleados
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    id_centro INT NOT NULL,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);

-- Tabla Pacientes
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(150),
    fecha_nacimiento DATE,
    genero ENUM('M','F','O'),
    direccion TEXT,
    id_centro INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);

-- Tabla Usuarios (para login)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol ENUM('admin','medico') NOT NULL,
    id_centro INT NOT NULL,
    id_medico INT,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE SET NULL
);

-- Tabla Consultas Médicas
CREATE TABLE consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_centro INT NOT NULL,
    id_medico INT NOT NULL,
    paciente_nombre VARCHAR(100) NOT NULL,
    paciente_apellido VARCHAR(100) NOT NULL,
    fecha DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE
);

-- Agregar columnas adicionales a consultas
ALTER TABLE consultas
ADD COLUMN estado ENUM('pendiente','programada','completada','cancelada') 
DEFAULT 'pendiente';

ALTER TABLE consultas 
ADD COLUMN duracion_minutos INT DEFAULT 0 COMMENT 'Duración de la consulta en minutos';

-- Relacionar consultas con pacientes
ALTER TABLE consultas 
ADD COLUMN id_paciente INT NULL,
ADD FOREIGN KEY (id_paciente) REFERENCES pacientes(id) ON DELETE SET NULL;
`;

// Datos de prueba para cada centro
const testData = {
  central: {
    centro: { nombre: 'Hospital Central Quito', ciudad: 'Quito', direccion: 'Av. Central 123' },
    especialidades: ['Medicina General', 'Cardiología', 'Pediatría'],
    medicos: [
      { nombres: 'Dr. Juan', apellidos: 'Pérez', especialidad: 'Medicina General' },
      { nombres: 'Dra. María', apellidos: 'González', especialidad: 'Cardiología' }
    ],
    pacientes: [
      { nombres: 'Carlos', apellidos: 'López', cedula: '1234567890', telefono: '0987654321' },
      { nombres: 'Ana', apellidos: 'Martínez', cedula: '2345678901', telefono: '0987654322' }
    ],
    empleados: [
      { nombres: 'Roberto', apellidos: 'Silva', cargo: 'Enfermero Jefe' },
      { nombres: 'Carmen', apellidos: 'Vega', cargo: 'Técnica de Laboratorio' }
    ]
  },
  guayaquil: {
    centro: { nombre: 'Hospital Guayaquil', ciudad: 'Guayaquil', direccion: 'Av. 9 de Octubre 456' },
    especialidades: ['Medicina General', 'Traumatología', 'Ginecología'],
    medicos: [
      { nombres: 'Dr. Luis', apellidos: 'Fernández', especialidad: 'Medicina General' },
      { nombres: 'Dra. Patricia', apellidos: 'Castro', especialidad: 'Traumatología' }
    ],
    pacientes: [
      { nombres: 'Diego', apellidos: 'Mendoza', cedula: '3456789012', telefono: '0987654323' },
      { nombres: 'Lucía', apellidos: 'Herrera', cedula: '4567890123', telefono: '0987654324' }
    ],
    empleados: [
      { nombres: 'Fernando', apellidos: 'Rojas', cargo: 'Farmacéutico' },
      { nombres: 'Isabel', apellidos: 'Torres', cargo: 'Enfermera Jefe' }
    ]
  },
  cuenca: {
    centro: { nombre: 'Hospital Cuenca', ciudad: 'Cuenca', direccion: 'Av. Solano 789' },
    especialidades: ['Medicina General', 'Dermatología', 'Oftalmología'],
    medicos: [
      { nombres: 'Dr. Miguel', apellidos: 'Paredes', especialidad: 'Medicina General' },
      { nombres: 'Dra. Sofía', apellidos: 'Morales', especialidad: 'Dermatología' }
    ],
    pacientes: [
      { nombres: 'Andrés', apellidos: 'Jiménez', cedula: '5678901234', telefono: '0987654325' },
      { nombres: 'Elena', apellidos: 'Fernández', cedula: '6789012345', telefono: '0987654326' }
    ],
    empleados: [
      { nombres: 'Luis', apellidos: 'Martínez', cargo: 'Auxiliar de Enfermería' },
      { nombres: 'María', apellidos: 'Rodríguez', cargo: 'Recepcionista' }
    ]
  }
};

async function applyCompleteSQL(dbName, config) {
  console.log(`\n🔧 Aplicando SQL completo: ${dbName.toUpperCase()}`.title);
  console.log(`📍 Host: ${config.host}:${config.port}`.info);
  console.log(`🗄️ Database: ${config.database}`.info);
  
  try {
    const connection = await mysql.createConnection(config);
    
    // Aplicar SQL completo
    console.log(`🔨 Aplicando estructura de tablas...`.info);
    const statements = completeSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    console.log(`✅ Estructura de tablas aplicada`.success);
    
    // Insertar datos de prueba
    const data = testData[dbName];
    console.log(`📝 Insertando datos de prueba...`.info);
    
    // Insertar centro
    const [centroResult] = await connection.query(`
      INSERT INTO centros_medicos (nombre, ciudad, direccion) 
      VALUES (?, ?, ?)
    `, [data.centro.nombre, data.centro.ciudad, data.centro.direccion]);
    
    const centroId = centroResult.insertId;
    console.log(`✅ Centro insertado: ID ${centroId}`.success);
    
    // Insertar especialidades
    for (const esp of data.especialidades) {
      await connection.query(`
        INSERT INTO especialidades (nombre) VALUES (?)
      `, [esp]);
    }
    console.log(`✅ ${data.especialidades.length} especialidades insertadas`.success);
    
    // Insertar médicos
    for (const medico of data.medicos) {
      const [espResult] = await connection.query(`
        SELECT id FROM especialidades WHERE nombre = ?
      `, [medico.especialidad]);
      
      if (espResult.length > 0) {
        await connection.query(`
          INSERT INTO medicos (nombres, apellidos, id_especialidad, id_centro) 
          VALUES (?, ?, ?, ?)
        `, [medico.nombres, medico.apellidos, espResult[0].id, centroId]);
      }
    }
    console.log(`✅ ${data.medicos.length} médicos insertados`.success);
    
    // Insertar pacientes
    for (const paciente of data.pacientes) {
      await connection.query(`
        INSERT INTO pacientes (nombres, apellidos, cedula, telefono, id_centro) 
        VALUES (?, ?, ?, ?, ?)
      `, [paciente.nombres, paciente.apellidos, paciente.cedula, paciente.telefono, centroId]);
    }
    console.log(`✅ ${data.pacientes.length} pacientes insertados`.success);
    
    // Insertar empleados
    for (const empleado of data.empleados) {
      await connection.query(`
        INSERT INTO empleados (nombres, apellidos, cargo, id_centro) 
        VALUES (?, ?, ?, ?)
      `, [empleado.nombres, empleado.apellidos, empleado.cargo, centroId]);
    }
    console.log(`✅ ${data.empleados.length} empleados insertados`.success);
    
    // Verificar tablas creadas
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Tablas creadas: ${tables.length}`.info);
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Error en ${dbName}: ${error.message}`.error);
    return false;
  }
}

async function runCompleteSQL() {
  console.log(`\n🚀 APLICANDO SQL COMPLETO DE TU ARCHIVO`.title);
  console.log(`⏰ Fecha: ${new Date().toLocaleString()}`.info);
  
  let successCount = 0;
  
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    const success = await applyCompleteSQL(dbName, config);
    if (success) successCount++;
  }
  
  console.log(`\n📋 RESUMEN FINAL`.title);
  console.log(`✅ Bases de datos actualizadas: ${successCount}/${Object.keys(dbConfigs).length}`.success);
  
  if (successCount === Object.keys(dbConfigs).length) {
    console.log(`\n🎉 ¡SQL COMPLETO APLICADO EN TODAS LAS BASES!`.success);
    console.log(`\n🔍 Ahora las bases de datos tienen exactamente la estructura de tu sql.txt`.info);
  } else {
    console.log(`\n⚠️ Algunas bases de datos necesitan atención manual`.warning);
  }
}

runCompleteSQL();
