-- Script completo para configurar bases de datos locales (Guayaquil y Cuenca)
-- Ejecutar este script en cada base de datos local

-- ===========================================
-- CREAR TABLAS DE REFERENCIA NECESARIAS
-- ===========================================

-- Tabla Centros Médicos (referencia local)
CREATE TABLE IF NOT EXISTS centros_medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(200)
);

-- Tabla Especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla Médicos
CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id) ON DELETE CASCADE,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);

-- Tabla Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    id_centro INT NOT NULL,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);

-- Tabla Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
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

-- Tabla Consultas Médicas
CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_centro INT NOT NULL,
    id_medico INT NOT NULL,
    paciente_nombre VARCHAR(100) NOT NULL,
    paciente_apellido VARCHAR(100) NOT NULL,
    fecha DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    estado ENUM('pendiente','programada','completada','cancelada') DEFAULT 'pendiente',
    duracion_minutos INT DEFAULT 0,
    id_paciente INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id) ON DELETE SET NULL
);

-- ===========================================
-- INSERTAR DATOS DE REFERENCIA
-- ===========================================

-- Insertar centros médicos (referencia local)
INSERT IGNORE INTO centros_medicos (id, nombre, ciudad, direccion) VALUES 
(1, 'Hospital Central Quito', 'Quito', 'Av. Amazonas 123'),
(2, 'Clínica Vida Sana', 'Guayaquil', 'Malecón 456'),
(3, 'Hospital Metropolitano', 'Cuenca', 'Calle Larga 9012');

-- Insertar especialidades
INSERT IGNORE INTO especialidades (id, nombre) VALUES 
(1, 'Cardiología'),
(2, 'Neurología'),
(3, 'Pediatría'),
(4, 'Ginecología'),
(5, 'Traumatología');

-- ===========================================
-- DATOS ESPECÍFICOS PARA GUAYAQUIL (ID: 2)
-- ===========================================

-- Insertar médicos para Guayaquil
INSERT IGNORE INTO medicos (id, nombres, apellidos, id_especialidad, id_centro) VALUES 
(1, 'Dr. Carlos', 'Mendoza', 1, 2),
(2, 'Dra. Ana', 'Vega', 2, 2),
(3, 'Dr. Luis', 'Ramirez', 3, 2);

-- Insertar empleados para Guayaquil
INSERT IGNORE INTO empleados (id, nombres, apellidos, cargo, id_centro) VALUES 
(1, 'María', 'González', 'Enfermera Jefe', 2),
(2, 'Pedro', 'Martínez', 'Técnico', 2),
(3, 'Laura', 'Silva', 'Recepcionista', 2);

-- Insertar pacientes para Guayaquil
INSERT IGNORE INTO pacientes (id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro) VALUES 
(1, 'Juan', 'Pérez', '1234567890', '0987654321', 'juan@email.com', '1985-05-15', 'M', 'Av. 9 de Octubre 123', 2),
(2, 'María', 'López', '0987654321', '0987654322', 'maria@email.com', '1990-08-20', 'F', 'Calle 10 456', 2),
(3, 'Carlos', 'García', '1122334455', '0987654323', 'carlos@email.com', '1978-12-10', 'M', 'Malecón 789', 2);

-- Insertar consultas para Guayaquil
INSERT IGNORE INTO consultas (id, id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos) VALUES 
(1, 2, 1, 'Juan', 'Pérez', 1, '2024-01-15 10:00:00', 'Dolor en el pecho', 'Angina de pecho', 'Nitroglicerina', 'completada', 30),
(2, 2, 2, 'María', 'López', 2, '2024-01-16 14:30:00', 'Dolor de cabeza', 'Migraña', 'Analgésicos', 'completada', 25),
(3, 2, 3, 'Carlos', 'García', 3, '2024-01-17 09:15:00', 'Fiebre alta', 'Infección viral', 'Antibióticos', 'completada', 20);

-- ===========================================
-- DATOS ESPECÍFICOS PARA CUENCA (ID: 3)
-- ===========================================

-- Insertar médicos para Cuenca
INSERT IGNORE INTO medicos (id, nombres, apellidos, id_especialidad, id_centro) VALUES 
(1, 'Dr. Roberto', 'Herrera', 1, 3),
(2, 'Dra. Carmen', 'Morales', 4, 3),
(3, 'Dr. Diego', 'Castillo', 5, 3);

-- Insertar empleados para Cuenca
INSERT IGNORE INTO empleados (id, nombres, apellidos, cargo, id_centro) VALUES 
(1, 'Elena', 'Ruiz', 'Enfermera', 3),
(2, 'Miguel', 'Torres', 'Técnico', 3),
(3, 'Sofia', 'Mendoza', 'Recepcionista', 3);

-- Insertar pacientes para Cuenca
INSERT IGNORE INTO pacientes (id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro) VALUES 
(1, 'Andrea', 'Vargas', '2233445566', '0987654324', 'andrea@email.com', '1992-03-25', 'F', 'Calle Larga 123', 3),
(2, 'Fernando', 'Jiménez', '3344556677', '0987654325', 'fernando@email.com', '1987-11-12', 'M', 'Av. Solano 456', 3),
(3, 'Patricia', 'Castro', '4455667788', '0987654326', 'patricia@email.com', '1995-07-08', 'F', 'Calle Bolívar 789', 3);

-- Insertar consultas para Cuenca
INSERT IGNORE INTO consultas (id, id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos) VALUES 
(1, 3, 1, 'Andrea', 'Vargas', 1, '2024-01-18 11:00:00', 'Palpitaciones', 'Arritmia', 'Medicación antiarrítmica', 'completada', 35),
(2, 3, 2, 'Fernando', 'Jiménez', 2, '2024-01-19 15:45:00', 'Dolor abdominal', 'Gastritis', 'Protectores gástricos', 'completada', 25),
(3, 3, 3, 'Patricia', 'Castro', 3, '2024-01-20 08:30:00', 'Lesión en brazo', 'Esguince', 'Inmovilización', 'completada', 40);

-- ===========================================
-- VERIFICAR DATOS INSERTADOS
-- ===========================================

-- Mostrar resumen de datos insertados
SELECT 'Centros Médicos' as tabla, COUNT(*) as total FROM centros_medicos
UNION ALL
SELECT 'Especialidades', COUNT(*) FROM especialidades
UNION ALL
SELECT 'Médicos', COUNT(*) FROM medicos
UNION ALL
SELECT 'Empleados', COUNT(*) FROM empleados
UNION ALL
SELECT 'Pacientes', COUNT(*) FROM pacientes
UNION ALL
SELECT 'Consultas', COUNT(*) FROM consultas;
