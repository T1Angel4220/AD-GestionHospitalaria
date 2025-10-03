#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

// Configuración adicional por centro
const centroConfig = {
  central: { centroId: 1, ciudad: 'Quito' },
  guayaquil: { centroId: 2, ciudad: 'Guayaquil' },
  cuenca: { centroId: 3, ciudad: 'Cuenca' }
};

// Datos de ejemplo para cada centro
const sampleData = {
  centros_medicos: [
    {
      id: 1,
      nombre: 'Hospital Central Quito',
      ciudad: 'Quito',
      direccion: 'Av. 6 de Diciembre 1234',
      telefono: '02-2222-2222'
    },
    {
      id: 2,
      nombre: 'Hospital Guayaquil',
      ciudad: 'Guayaquil',
      direccion: 'Av. 9 de Octubre 5678',
      telefono: '04-3333-3333'
    },
    {
      id: 3,
      nombre: 'Hospital Cuenca',
      ciudad: 'Cuenca',
      direccion: 'Av. Solano 9012',
      telefono: '07-4444-4444'
    }
  ],
  especialidades: [
    { nombre: 'Medicina General', descripcion: 'Atención médica general y preventiva' },
    { nombre: 'Cardiología', descripcion: 'Especialidad en enfermedades del corazón y sistema cardiovascular' },
    { nombre: 'Pediatría', descripcion: 'Especialidad en medicina infantil y adolescente' },
    { nombre: 'Ginecología', descripcion: 'Especialidad en salud reproductiva femenina' },
    { nombre: 'Traumatología', descripcion: 'Especialidad en lesiones del sistema musculoesquelético' },
    { nombre: 'Neurología', descripcion: 'Especialidad en enfermedades del sistema nervioso' },
    { nombre: 'Dermatología', descripcion: 'Especialidad en enfermedades de la piel' },
    { nombre: 'Oftalmología', descripcion: 'Especialidad en enfermedades de los ojos' }
  ],
  medicos: [
    { nombres: 'Dr. Juan Carlos', apellidos: 'Pérez González', cedula: '1234567890', telefono: '0987654321', email: 'juan.perez@hospital.com', especialidad: 1 },
    { nombres: 'Dra. María Elena', apellidos: 'Rodríguez Silva', cedula: '2345678901', telefono: '0987654322', email: 'maria.rodriguez@hospital.com', especialidad: 2 },
    { nombres: 'Dr. Carlos Alberto', apellidos: 'Mendoza López', cedula: '3456789012', telefono: '0987654323', email: 'carlos.mendoza@hospital.com', especialidad: 3 },
    { nombres: 'Dra. Ana Lucía', apellidos: 'Fernández Castro', cedula: '4567890123', telefono: '0987654324', email: 'ana.fernandez@hospital.com', especialidad: 4 },
    { nombres: 'Dr. Luis Miguel', apellidos: 'Herrera Vega', cedula: '5678901234', telefono: '0987654325', email: 'luis.herrera@hospital.com', especialidad: 5 },
    { nombres: 'Dra. Sofía', apellidos: 'Morales Jiménez', cedula: '6789012345', telefono: '0987654326', email: 'sofia.morales@hospital.com', especialidad: 6 }
  ],
  pacientes: [
    { nombres: 'María', apellidos: 'González Pérez', cedula: '0987654321', telefono: '0998765432', email: 'maria.gonzalez@email.com', fecha_nacimiento: '1990-05-15', genero: 'F', direccion: 'Calle Principal 123' },
    { nombres: 'Pedro', apellidos: 'Martínez Silva', cedula: '1987654321', telefono: '0998765433', email: 'pedro.martinez@email.com', fecha_nacimiento: '1985-03-20', genero: 'M', direccion: 'Av. Secundaria 456' },
    { nombres: 'Ana', apellidos: 'Rodríguez López', cedula: '2987654321', telefono: '0998765434', email: 'ana.rodriguez@email.com', fecha_nacimiento: '1992-07-10', genero: 'F', direccion: 'Calle Terciaria 789' },
    { nombres: 'Carlos', apellidos: 'Fernández Castro', cedula: '3987654321', telefono: '0998765435', email: 'carlos.fernandez@email.com', fecha_nacimiento: '1988-11-25', genero: 'M', direccion: 'Av. Cuaternaria 012' },
    { nombres: 'Laura', apellidos: 'Herrera Vega', cedula: '4987654321', telefono: '0998765436', email: 'laura.herrera@email.com', fecha_nacimiento: '1995-01-08', genero: 'F', direccion: 'Calle Quinta 345' },
    { nombres: 'Roberto', apellidos: 'Morales Jiménez', cedula: '5987654321', telefono: '0998765437', email: 'roberto.morales@email.com', fecha_nacimiento: '1987-09-12', genero: 'M', direccion: 'Av. Sexta 678' },
    { nombres: 'Carmen', apellidos: 'Silva Mendoza', cedula: '6987654321', telefono: '0998765438', email: 'carmen.silva@email.com', fecha_nacimiento: '1993-04-18', genero: 'F', direccion: 'Calle Séptima 901' },
    { nombres: 'Diego', apellidos: 'Castro Herrera', cedula: '7987654321', telefono: '0998765439', email: 'diego.castro@email.com', fecha_nacimiento: '1989-12-03', genero: 'M', direccion: 'Av. Octava 234' }
  ],
  empleados: [
    { nombres: 'Ana', apellidos: 'Rodríguez', cedula: '1111111111', telefono: '0991111111', email: 'ana.rodriguez@hospital.com', cargo: 'Enfermera Jefe', salario: 1200.00, fecha_ingreso: '2023-01-15' },
    { nombres: 'Carlos', apellidos: 'Mendoza', cedula: '2222222222', telefono: '0992222222', email: 'carlos.mendoza@hospital.com', cargo: 'Técnico de Laboratorio', salario: 800.00, fecha_ingreso: '2023-02-20' },
    { nombres: 'Laura', apellidos: 'Vega', cedula: '3333333333', telefono: '0993333333', email: 'laura.vega@hospital.com', cargo: 'Recepcionista', salario: 600.00, fecha_ingreso: '2023-03-10' },
    { nombres: 'Pedro', apellidos: 'Silva', cedula: '4444444444', telefono: '0994444444', email: 'pedro.silva@hospital.com', cargo: 'Enfermero', salario: 1000.00, fecha_ingreso: '2023-04-15' },
    { nombres: 'María', apellidos: 'Castro', cedula: '5555555555', telefono: '0995555555', email: 'maria.castro@hospital.com', cargo: 'Técnico de Rayos X', salario: 900.00, fecha_ingreso: '2023-05-20' },
    { nombres: 'Roberto', apellidos: 'Herrera', cedula: '6666666666', telefono: '0996666666', email: 'roberto.herrera@hospital.com', cargo: 'Farmacéutico', salario: 1100.00, fecha_ingreso: '2023-06-15' },
    { nombres: 'Sofia', apellidos: 'Morales', cedula: '7777777777', telefono: '0997777777', email: 'sofia.morales@hospital.com', cargo: 'Técnico de Farmacia', salario: 750.00, fecha_ingreso: '2023-07-20' },
    { nombres: 'Luis', apellidos: 'Jiménez', cedula: '8888888888', telefono: '0998888888', email: 'luis.jimenez@hospital.com', cargo: 'Auxiliar de Enfermería', salario: 650.00, fecha_ingreso: '2023-08-10' }
  ]
};

async function insertSampleData(dbName, config) {
  console.log(`\n${'='.repeat(50)}`.service);
  console.log(`📥 INSERTANDO DATOS DE EJEMPLO: ${dbName.toUpperCase()}`.title);
  console.log(`${'='.repeat(50)}`.service);

  try {
    const connection = await mysql.createConnection(config);
    const centroInfo = centroConfig[dbName];
    console.log(`✅ Conectado a ${dbName}`.success);

    // 1. Insertar centro médico
    const centroData = sampleData.centros_medicos.find(c => c.id === centroInfo.centroId);
    if (centroData) {
      await connection.execute(
        `INSERT INTO centros_medicos (id, nombre, ciudad, direccion, telefono) VALUES (?, ?, ?, ?, ?)`,
        [centroData.id, centroData.nombre, centroData.ciudad, centroData.direccion, centroData.telefono]
      );
      console.log(`🏥 Centro médico insertado: ${centroData.nombre}`.success);
    }

    // 2. Insertar especialidades
    for (const especialidad of sampleData.especialidades) {
      await connection.execute(
        `INSERT INTO especialidades (nombre, descripcion, id_centro) VALUES (?, ?, ?)`,
        [especialidad.nombre, especialidad.descripcion, centroInfo.centroId]
      );
    }
    console.log(`📚 ${sampleData.especialidades.length} especialidades insertadas`.success);

    // 3. Insertar médicos
    for (let i = 0; i < sampleData.medicos.length; i++) {
      const medico = sampleData.medicos[i];
      const especialidadId = (i % sampleData.especialidades.length) + 1;
      await connection.execute(
        `INSERT INTO medicos (nombres, apellidos, cedula, telefono, email, id_especialidad, id_centro) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [medico.nombres, medico.apellidos, medico.cedula, medico.telefono, medico.email, especialidadId, centroInfo.centroId]
      );
    }
    console.log(`👨‍⚕️ ${sampleData.medicos.length} médicos insertados`.success);

    // 4. Insertar pacientes
    for (const paciente of sampleData.pacientes) {
      await connection.execute(
        `INSERT INTO pacientes (nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [paciente.nombres, paciente.apellidos, paciente.cedula, paciente.telefono, paciente.email, paciente.fecha_nacimiento, paciente.genero, paciente.direccion, centroInfo.centroId]
      );
    }
    console.log(`👥 ${sampleData.pacientes.length} pacientes insertados`.success);

    // 5. Insertar empleados
    for (const empleado of sampleData.empleados) {
      await connection.execute(
        `INSERT INTO empleados (nombres, apellidos, cedula, telefono, email, cargo, salario, fecha_ingreso, id_centro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [empleado.nombres, empleado.apellidos, empleado.cedula, empleado.telefono, empleado.email, empleado.cargo, empleado.salario, empleado.fecha_ingreso, centroInfo.centroId]
      );
    }
    console.log(`👷 ${sampleData.empleados.length} empleados insertados`.success);

    // 6. Insertar usuario admin específico por hospital
    const adminEmails = {
      1: 'admin.quito@hospital.com',
      2: 'admin.guayaquil@hospital.com', 
      3: 'admin.cuenca@hospital.com'
    };
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(
      `INSERT INTO usuarios (email, password_hash, rol, id_centro) VALUES (?, ?, ?, ?)`,
      [adminEmails[centroInfo.centroId], hashedPassword, 'admin', centroInfo.centroId]
    );
    console.log(`👤 Usuario admin insertado: ${adminEmails[centroInfo.centroId]}`.success);

    // 7. Insertar usuarios médicos
    const [medicos] = await connection.execute('SELECT id, nombres, apellidos, email FROM medicos WHERE id_centro = ?', [centroInfo.centroId]);
    for (const medico of medicos) {
      const hashedPassword = await bcrypt.hash('medico123', 10);
      await connection.execute(
        `INSERT INTO usuarios (email, password_hash, rol, id_medico, id_centro) VALUES (?, ?, ?, ?, ?)`,
        [medico.email, hashedPassword, 'medico', medico.id, centroInfo.centroId]
      );
    }
    console.log(`👨‍⚕️ ${medicos.length} usuarios médicos insertados`.success);

    // 8. Insertar consultas de ejemplo (más consultas y variedad)
    const [pacientes] = await connection.execute('SELECT id, nombres, apellidos FROM pacientes WHERE id_centro = ?', [centroInfo.centroId]);
    const [medicosConsultas] = await connection.execute('SELECT id FROM medicos WHERE id_centro = ?', [centroInfo.centroId]);
    
    const consultasEjemplo = [
      // Consultas completadas
      { motivo: 'Dolor de cabeza intenso', diagnostico: 'Migraña', tratamiento: 'Sumatriptán y reposo', estado: 'completada', duracion: 30 },
      { motivo: 'Dolor abdominal', diagnostico: 'Gastritis', tratamiento: 'Omeprazol y dieta blanda', estado: 'completada', duracion: 25 },
      { motivo: 'Fiebre alta', diagnostico: 'Gripe', tratamiento: 'Paracetamol y reposo', estado: 'completada', duracion: 20 },
      { motivo: 'Dolor de garganta', diagnostico: 'Faringitis bacteriana', tratamiento: 'Amoxicilina', estado: 'completada', duracion: 20 },
      { motivo: 'Dolor de rodilla', diagnostico: 'Artritis leve', tratamiento: 'Ibuprofeno y fisioterapia', estado: 'completada', duracion: 35 },
      { motivo: 'Revisión de ojos', diagnostico: 'Miopía progresiva', tratamiento: 'Lentes correctivos', estado: 'completada', duracion: 30 },
      { motivo: 'Dolor de espalda', diagnostico: 'Contractura muscular', tratamiento: 'Relajantes musculares', estado: 'completada', duracion: 25 },
      { motivo: 'Tos persistente', diagnostico: 'Bronquitis', tratamiento: 'Antibiótico y expectorante', estado: 'completada', duracion: 30 },
      { motivo: 'Dolor de oído', diagnostico: 'Otitis media', tratamiento: 'Antibiótico tópico', estado: 'completada', duracion: 20 },
      { motivo: 'Problemas digestivos', diagnostico: 'Síndrome de intestino irritable', tratamiento: 'Dieta y probióticos', estado: 'completada', duracion: 40 },
      
      // Consultas programadas
      { motivo: 'Control de presión arterial', diagnostico: 'Hipertensión controlada', tratamiento: 'Seguimiento médico', estado: 'programada', duracion: 20 },
      { motivo: 'Revisión de diabetes', diagnostico: 'Diabetes tipo 2', tratamiento: 'Control glucémico', estado: 'programada', duracion: 30 },
      { motivo: 'Consulta cardiológica', diagnostico: 'Arritmia leve', tratamiento: 'Monitoreo cardíaco', estado: 'programada', duracion: 45 },
      { motivo: 'Revisión pediátrica', diagnostico: 'Control de crecimiento', tratamiento: 'Vacunación', estado: 'programada', duracion: 25 },
      { motivo: 'Consulta ginecológica', diagnostico: 'Control anual', tratamiento: 'Papanicolaou', estado: 'programada', duracion: 30 },
      { motivo: 'Revisión traumatológica', diagnostico: 'Lesión deportiva', tratamiento: 'Fisioterapia', estado: 'programada', duracion: 40 },
      { motivo: 'Consulta neurológica', diagnostico: 'Cefaleas recurrentes', tratamiento: 'Estudio neurológico', estado: 'programada', duracion: 50 },
      { motivo: 'Revisión dermatológica', diagnostico: 'Dermatitis', tratamiento: 'Cremas tópicas', estado: 'programada', duracion: 25 },
      
      // Consultas pendientes
      { motivo: 'Control rutinario', diagnostico: 'Paciente sano', tratamiento: 'Seguimiento', estado: 'pendiente', duracion: 15 },
      { motivo: 'Consulta preventiva', diagnostico: 'Medicina preventiva', tratamiento: 'Educación sanitaria', estado: 'pendiente', duracion: 20 },
      { motivo: 'Revisión de medicamentos', diagnostico: 'Polimedicación', tratamiento: 'Optimización terapéutica', estado: 'pendiente', duracion: 30 },
      { motivo: 'Consulta nutricional', diagnostico: 'Sobrepeso', tratamiento: 'Plan alimentario', estado: 'pendiente', duracion: 35 },
      { motivo: 'Revisión psicológica', diagnostico: 'Ansiedad leve', tratamiento: 'Terapia cognitiva', estado: 'pendiente', duracion: 45 },
      { motivo: 'Consulta de seguimiento', diagnostico: 'Post-operatorio', tratamiento: 'Control de cicatrización', estado: 'pendiente', duracion: 20 },
      
      // Consultas canceladas
      { motivo: 'Consulta programada', diagnostico: 'Cancelada por paciente', tratamiento: 'Reagendar', estado: 'cancelada', duracion: 0 },
      { motivo: 'Revisión médica', diagnostico: 'Cancelada por emergencia', tratamiento: 'Reagendar', estado: 'cancelada', duracion: 0 },
      { motivo: 'Control de rutina', diagnostico: 'Cancelada por lluvia', tratamiento: 'Reagendar', estado: 'cancelada', duracion: 0 }
    ];

    // Insertar consultas de ejemplo (hasta 10 por centro)
    const numConsultas = Math.min(10, consultasEjemplo.length);
    for (let i = 0; i < numConsultas; i++) {
      const consulta = consultasEjemplo[i];
      const paciente = pacientes[i % pacientes.length];
      const medico = medicosConsultas[i % medicosConsultas.length];
      
      // Generar fechas más variadas (últimos 60 días)
      const fecha = new Date();
      const diasAtras = Math.floor(Math.random() * 60);
      fecha.setDate(fecha.getDate() - diasAtras);
      
      // Horarios más realistas (8:00 AM a 6:00 PM)
      const horaInicio = 8;
      const horaFin = 18;
      const hora = horaInicio + Math.floor(Math.random() * (horaFin - horaInicio));
      const minutos = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
      fecha.setHours(hora, minutos, 0, 0);

      await connection.execute(
        `INSERT INTO consultas (fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos, id_medico, id_paciente, paciente_nombre, paciente_apellido, id_centro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fecha, consulta.motivo, consulta.diagnostico, consulta.tratamiento, consulta.estado, consulta.duracion, medico.id, paciente.id, paciente.nombres, paciente.apellidos, centroInfo.centroId]
      );
    }
    console.log(`📋 ${numConsultas} consultas insertadas`.success);

    // Verificar datos insertados
    console.log(`\n📊 Verificando datos insertados:`.info);
    const tables = ['centros_medicos', 'especialidades', 'medicos', 'pacientes', 'empleados', 'usuarios', 'consultas'];
    for (const table of tables) {
      try {
        let query;
        if (table === 'centros_medicos') {
          query = `SELECT COUNT(*) as count FROM ${table}`;
        } else {
          query = `SELECT COUNT(*) as count FROM ${table} WHERE id_centro = ?`;
        }
        
        const params = table === 'centros_medicos' ? [] : [centroInfo.centroId];
        const [rows] = await connection.execute(query, params);
        console.log(`   ${table}: ${rows[0].count} registros`.info);
      } catch (error) {
        console.log(`   ${table}: Error verificando - ${error.message}`.warning);
      }
    }

    await connection.end();
    console.log(`✅ Datos de ejemplo insertados exitosamente en ${dbName}`.success);

  } catch (error) {
    console.error(`❌ Error insertando datos en ${dbName}: ${error.message}`.error);
    throw error;
  }
}

async function insertAllSampleData() {
  console.log(`\n🚀 INICIANDO INSERCIÓN DE DATOS DE EJEMPLO`.title);
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`.info);
  console.log(`🎯 Objetivo: Insertar datos de ejemplo en todas las bases de datos`.info);

  const results = {
    success: [],
    failed: []
  };

  for (const [dbName, config] of Object.entries(dbConfigs)) {
    try {
      await insertSampleData(dbName, config);
      results.success.push(dbName);
    } catch (error) {
      results.failed.push({ db: dbName, error: error.message });
    }
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`.service);
  console.log(`📋 RESUMEN DE INSERCIÓN`.title);
  console.log(`${'='.repeat(60)}`.service);

  if (results.success.length > 0) {
    console.log(`✅ Bases de datos con datos insertados:`.success);
    results.success.forEach(db => {
      console.log(`   - ${db}`.success);
    });
  }

  if (results.failed.length > 0) {
    console.log(`❌ Bases de datos con errores:`.error);
    results.failed.forEach(failure => {
      console.log(`   - ${failure.db}: ${failure.error}`.error);
    });
  }

  console.log(`\n🎯 Total procesadas: ${Object.keys(dbConfigs).length}`.info);
  console.log(`✅ Exitosas: ${results.success.length}`.success);
  console.log(`❌ Fallidas: ${results.failed.length}`.error);

  if (results.failed.length === 0) {
    console.log(`\n🎉 ¡INSERCIÓN COMPLETA EXITOSA!`.success);
    console.log(`💡 Todas las bases de datos tienen datos de ejemplo`.info);
    console.log(`🔑 Credenciales de acceso:`.info);
    console.log(`   - Admin Quito: admin.quito@hospital.com / admin123`.info);
    console.log(`   - Admin Guayaquil: admin.guayaquil@hospital.com / admin123`.info);
    console.log(`   - Admin Cuenca: admin.cuenca@hospital.com / admin123`.info);
    console.log(`   - Médicos: [email del médico] / medico123`.info);
  } else {
    console.log(`\n⚠️  Inserción completada con errores`.warning);
    console.log(`💡 Revisa los errores anteriores y ejecuta nuevamente si es necesario`.info);
  }
}

// Ejecutar el script
if (require.main === module) {
  insertAllSampleData()
    .then(() => {
      console.log(`\n🏁 Script finalizado`.info);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n💥 Error fatal: ${error.message}`.error);
      process.exit(1);
    });
}

module.exports = { insertAllSampleData, insertSampleData };
