#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de bases de datos
const dbConfigs = {
  central: {
    host: 'localhost',
    user: 'admin_central',
    password: 'SuperPasswordCentral123!',
    database: 'hospital_central',
    port: 3307,
    charset: 'utf8mb4'
  },
  guayaquil: {
    host: 'localhost',
    user: 'admin_guayaquil',
    password: 'SuperPasswordGye123!',
    database: 'hospital_guayaquil',
    port: 3308,
    charset: 'utf8mb4'
  },
  cuenca: {
    host: 'localhost',
    user: 'admin_cuenca',
    password: 'SuperPasswordCuenca123!',
    database: 'hospital_cuenca',
    port: 3309,
    charset: 'utf8mb4'
  }
};

// Script SQL completo para UTF-8
const utf8Script = `
-- Configurar charset de la base de datos
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Configurar charset de las tablas principales
ALTER TABLE usuarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE centros_medicos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE especialidades CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE medicos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE empleados CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pacientes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE consultas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Configurar charset específico para campos de texto críticos
-- Campos de nombres y apellidos
ALTER TABLE medicos MODIFY nombres VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE medicos MODIFY apellidos VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE empleados MODIFY nombres VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE empleados MODIFY apellidos VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE empleados MODIFY cargo VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE pacientes MODIFY nombres VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pacientes MODIFY apellidos VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE centros_medicos MODIFY nombre VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE centros_medicos MODIFY ciudad VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE centros_medicos MODIFY direccion TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE especialidades MODIFY nombre VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE especialidades MODIFY descripcion TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE consultas MODIFY paciente_nombre VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE consultas MODIFY paciente_apellido VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE consultas MODIFY motivo TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE consultas MODIFY diagnostico TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE consultas MODIFY tratamiento TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Campos de email
ALTER TABLE usuarios MODIFY email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE pacientes MODIFY email VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Campos de dirección
ALTER TABLE pacientes MODIFY direccion TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificar configuración
SELECT 'Configuración UTF-8 aplicada correctamente' as Status;
`;

async function applyUTF8Complete() {
  console.log('🔧 Aplicando configuración UTF-8 completa a todas las bases de datos...\n');

  for (const [dbName, config] of Object.entries(dbConfigs)) {
    try {
      console.log(`📊 Configurando ${dbName}...`);
      
      const connection = await mysql.createConnection(config);
      
      // Ejecutar el script SQL completo
      await connection.execute(utf8Script);
      
      // Verificar configuración
      const [rows] = await connection.execute(`
        SELECT 
          TABLE_NAME,
          TABLE_COLLATION,
          CHARACTER_SET_NAME
        FROM information_schema.TABLES t
        JOIN information_schema.COLLATIONS c ON t.TABLE_COLLATION = c.COLLATION_NAME
        WHERE t.TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `, [config.database]);
      
      console.log(`✅ ${dbName} configurado correctamente`);
      console.log(`   Tablas configuradas: ${rows.length}`);
      
      // Mostrar algunas tablas como ejemplo
      rows.slice(0, 3).forEach(row => {
        console.log(`   - ${row.TABLE_NAME}: ${row.CHARACTER_SET_NAME}/${row.TABLE_COLLATION}`);
      });
      
      await connection.end();
    } catch (error) {
      console.error(`❌ Error configurando ${dbName}:`, error.message);
    }
  }

  console.log('\n🎉 Configuración UTF-8 completa aplicada!');
  console.log('Ahora todas las tablas pueden manejar caracteres especiales en español como ñ, á, é, í, ó, ú, ü, etc.');
  console.log('\n📝 Para verificar que funciona, puedes insertar datos con caracteres especiales:');
  console.log('   Ejemplo: "José María", "Niño", "Niña", "México", "España"');
}

// Ejecutar la configuración
applyUTF8Complete().catch(console.error);
