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

async function crearConsultasGuayaquil() {
  console.log('🏥 CREANDO CONSULTAS DE PRUEBA EN GUAYAQUIL');
  console.log('===========================================\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos de Guayaquil'.success);
    
    // Verificar pacientes disponibles
    console.log('\n📋 Verificando pacientes disponibles...'.info);
    const [pacientes] = await connection.query('SELECT id, nombres, apellidos, cedula FROM pacientes LIMIT 5');
    console.log(`   Pacientes encontrados: ${pacientes.length}`);
    pacientes.forEach(p => {
      console.log(`   - ID: ${p.id}, Nombre: ${p.nombres} ${p.apellidos}, Cédula: ${p.cedula}`);
    });
    
    // Verificar médicos disponibles
    console.log('\n👨‍⚕️ Verificando médicos disponibles...'.info);
    const [medicos] = await connection.query('SELECT id, nombres, apellidos, id_especialidad FROM medicos LIMIT 5');
    console.log(`   Médicos encontrados: ${medicos.length}`);
    medicos.forEach(m => {
      console.log(`   - ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Especialidad: ${m.id_especialidad}`);
    });
    
    if (pacientes.length === 0 || medicos.length === 0) {
      console.log('\n❌ No hay suficientes pacientes o médicos para crear consultas'.error);
      console.log('💡 Necesitas crear pacientes y médicos primero'.warning);
      await connection.end();
      return;
    }
    
    // Crear consultas de prueba
    console.log('\n🔧 Creando consultas de prueba...'.info);
    
    const consultasPrueba = [
      {
        fecha: new Date('2024-12-01T10:00:00'),
        motivo: 'Dolor de cabeza persistente',
        diagnostico: 'Cefalea tensional',
        tratamiento: 'Reposo y analgésicos',
        estado: 'completada',
        duracion_minutos: 30,
        id_medico: medicos[0].id,
        id_paciente: pacientes[0].id,
        paciente_nombre: pacientes[0].nombres,
        paciente_apellido: pacientes[0].apellidos,
        id_centro: 2
      },
      {
        fecha: new Date('2024-12-02T14:30:00'),
        motivo: 'Control de presión arterial',
        diagnostico: 'Hipertensión controlada',
        tratamiento: 'Continuar medicación actual',
        estado: 'completada',
        duracion_minutos: 20,
        id_medico: medicos[0].id,
        id_paciente: pacientes[0].id,
        paciente_nombre: pacientes[0].nombres,
        paciente_apellido: pacientes[0].apellidos,
        id_centro: 2
      },
      {
        fecha: new Date('2024-12-03T09:15:00'),
        motivo: 'Revisión de síntomas respiratorios',
        diagnostico: 'Pendiente de resultados de laboratorio',
        tratamiento: 'Pendiente',
        estado: 'pendiente',
        duracion_minutos: 0,
        id_medico: medicos[0].id,
        id_paciente: pacientes[0].id,
        paciente_nombre: pacientes[0].nombres,
        paciente_apellido: pacientes[0].apellidos,
        id_centro: 2
      }
    ];
    
    for (const consulta of consultasPrueba) {
      try {
        const [result] = await connection.execute(`
          INSERT INTO consultas (fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos, id_medico, id_paciente, paciente_nombre, paciente_apellido, id_centro)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          consulta.fecha,
          consulta.motivo,
          consulta.diagnostico,
          consulta.tratamiento,
          consulta.estado,
          consulta.duracion_minutos,
          consulta.id_medico,
          consulta.id_paciente,
          consulta.paciente_nombre,
          consulta.paciente_apellido,
          consulta.id_centro
        ]);
        
        console.log(`✅ Consulta creada - ID: ${result.insertId}, Estado: ${consulta.estado}, Fecha: ${consulta.fecha.toLocaleDateString()}`.success);
      } catch (error) {
        console.log(`❌ Error creando consulta: ${error.message}`.error);
      }
    }
    
    // Verificar consultas creadas
    console.log('\n📊 Verificando consultas creadas...'.info);
    const [consultasCreadas] = await connection.query('SELECT COUNT(*) as total FROM consultas');
    console.log(`   Total de consultas en Guayaquil: ${consultasCreadas[0].total}`.info);
    
    await connection.end();
    console.log('\n🎉 Proceso completado'.success);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`.error);
  }
}

crearConsultasGuayaquil();

