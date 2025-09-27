-- ===========================================
-- SCRIPT COMPLETO PARA CONFIGURAR BASES DE DATOS
-- Sistema Hospitalario - Microservicios
-- ===========================================

-- PASO 1: Crear las bases de datos
CREATE DATABASE IF NOT EXISTS hospital_central;
CREATE DATABASE IF NOT EXISTS hospital_guayaquil;
CREATE DATABASE IF NOT EXISTS hospital_cuenca;

-- ===========================================
-- PASO 2: CONFIGURAR BASE DE DATOS CENTRAL (QUITO)
-- ===========================================

USE hospital_central;

-- Tabla Centros Médicos (solo en central)
CREATE TABLE IF NOT EXISTS centros_medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    email VARCHAR(150),
    director VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla Especialidades (solo en central)
CREATE TABLE IF NOT EXISTS especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla Usuarios (en todas las bases de datos)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'medico') NOT NULL,
    id_centro INT NOT NULL,
    id_medico INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE
);

-- Tabla Médicos
CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
    id_paciente INT NULL,
    fecha DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    estado ENUM('pendiente','programada','completada','cancelada') DEFAULT 'pendiente',
    duracion_minutos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id) ON DELETE SET NULL
);

-- Insertar datos en Central (Quito)
INSERT IGNORE INTO centros_medicos (id, nombre, ciudad, direccion, telefono, email, director) VALUES 
(1, 'Hospital Central Quito', 'Quito', 'Av. Amazonas 123', '02-2345678', 'info@hospitalquito.com', 'Dr. Juan Pérez');

INSERT IGNORE INTO especialidades (id, nombre, descripcion) VALUES 
(1, 'Cardiología', 'Especialidad médica que se ocupa del corazón y el sistema cardiovascular'),
(2, 'Neurología', 'Especialidad médica que trata los trastornos del sistema nervioso'),
(3, 'Pediatría', 'Especialidad médica que se ocupa de la salud de los niños'),
(4, 'Ginecología', 'Especialidad médica que se ocupa de la salud reproductiva femenina'),
(5, 'Traumatología', 'Especialidad médica que trata lesiones del sistema musculoesquelético');

-- Insertar médicos para Quito
INSERT IGNORE INTO medicos (id, nombres, apellidos, id_especialidad, id_centro) VALUES 
(1, 'Dr. Juan', 'Pérez', 1, 1),
(2, 'Dra. María', 'González', 2, 1),
(3, 'Dr. Carlos', 'López', 3, 1);

-- Insertar empleados para Quito
INSERT IGNORE INTO empleados (id, nombres, apellidos, cargo, id_centro) VALUES 
(1, 'Ana', 'Martínez', 'Enfermera Jefe', 1),
(2, 'Luis', 'Rodríguez', 'Técnico', 1),
(3, 'Carmen', 'Silva', 'Recepcionista', 1);

-- Insertar pacientes para Quito
INSERT IGNORE INTO pacientes (id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro) VALUES 
(1, 'Roberto', 'Vega', '1712345678', '0987654321', 'roberto@email.com', '1980-05-15', 'M', 'Av. 6 de Diciembre 123', 1),
(2, 'Elena', 'Morales', '1712345679', '0987654322', 'elena@email.com', '1985-08-20', 'F', 'Calle Amazonas 456', 1),
(3, 'Diego', 'Castro', '1712345680', '0987654323', 'diego@email.com', '1975-12-10', 'M', 'Av. Colón 789', 1);

-- Insertar consultas para Quito
INSERT IGNORE INTO consultas (id, id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos) VALUES 
(1, 1, 1, 'Roberto', 'Vega', 1, '2024-01-15 10:00:00', 'Dolor en el pecho', 'Angina de pecho', 'Nitroglicerina', 'completada', 30),
(2, 1, 2, 'Elena', 'Morales', 2, '2024-01-16 14:30:00', 'Dolor de cabeza', 'Migraña', 'Analgésicos', 'completada', 25),
(3, 1, 3, 'Diego', 'Castro', 3, '2024-01-17 09:15:00', 'Fiebre alta', 'Infección viral', 'Antibióticos', 'completada', 20);

-- Insertar usuario administrador
INSERT IGNORE INTO usuarios (id, email, password_hash, rol, id_centro) VALUES 
(1, 'admin@hospital.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- ===========================================
-- PASO 3: CONFIGURAR BASE DE DATOS GUAYAQUIL
-- ===========================================

USE hospital_guayaquil;

-- Crear las mismas tablas (sin centros_medicos y especialidades)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'medico') NOT NULL,
    id_centro INT NOT NULL,
    id_medico INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    id_centro INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_centro INT NOT NULL,
    id_medico INT NOT NULL,
    paciente_nombre VARCHAR(100) NOT NULL,
    paciente_apellido VARCHAR(100) NOT NULL,
    id_paciente INT NULL,
    fecha DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    estado ENUM('pendiente','programada','completada','cancelada') DEFAULT 'pendiente',
    duracion_minutos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos para Guayaquil (Centro ID: 2)
INSERT IGNORE INTO medicos (id, nombres, apellidos, id_especialidad, id_centro) VALUES 
(1, 'Dr. Carlos', 'Mendoza', 1, 2),
(2, 'Dra. Ana', 'Vega', 2, 2),
(3, 'Dr. Luis', 'Ramirez', 3, 2);

INSERT IGNORE INTO empleados (id, nombres, apellidos, cargo, id_centro) VALUES 
(1, 'María', 'González', 'Enfermera Jefe', 2),
(2, 'Pedro', 'Martínez', 'Técnico', 2),
(3, 'Laura', 'Silva', 'Recepcionista', 2);

INSERT IGNORE INTO pacientes (id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro) VALUES 
(1, 'Juan', 'Pérez', '0912345678', '0987654321', 'juan@email.com', '1985-05-15', 'M', 'Av. 9 de Octubre 123', 2),
(2, 'María', 'López', '0912345679', '0987654322', 'maria@email.com', '1990-08-20', 'F', 'Calle 10 456', 2),
(3, 'Carlos', 'García', '0912345680', '0987654323', 'carlos@email.com', '1978-12-10', 'M', 'Malecón 789', 2);

INSERT IGNORE INTO consultas (id, id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos) VALUES 
(1, 2, 1, 'Juan', 'Pérez', 1, '2024-01-15 10:00:00', 'Dolor en el pecho', 'Angina de pecho', 'Nitroglicerina', 'completada', 30),
(2, 2, 2, 'María', 'López', 2, '2024-01-16 14:30:00', 'Dolor de cabeza', 'Migraña', 'Analgésicos', 'completada', 25),
(3, 2, 3, 'Carlos', 'García', 3, '2024-01-17 09:15:00', 'Fiebre alta', 'Infección viral', 'Antibióticos', 'completada', 20);

-- Insertar usuario médico para Guayaquil
INSERT IGNORE INTO usuarios (id, email, password_hash, rol, id_centro, id_medico) VALUES 
(1, 'medico@guayaquil.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 2, 1);

-- ===========================================
-- PASO 4: CONFIGURAR BASE DE DATOS CUENCA
-- ===========================================

USE hospital_cuenca;

-- Crear las mismas tablas
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'medico') NOT NULL,
    id_centro INT NOT NULL,
    id_medico INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    id_centro INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_centro INT NOT NULL,
    id_medico INT NOT NULL,
    paciente_nombre VARCHAR(100) NOT NULL,
    paciente_apellido VARCHAR(100) NOT NULL,
    id_paciente INT NULL,
    fecha DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    estado ENUM('pendiente','programada','completada','cancelada') DEFAULT 'pendiente',
    duracion_minutos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos para Cuenca (Centro ID: 3)
INSERT IGNORE INTO medicos (id, nombres, apellidos, id_especialidad, id_centro) VALUES 
(1, 'Dr. Roberto', 'Herrera', 1, 3),
(2, 'Dra. Carmen', 'Morales', 4, 3),
(3, 'Dr. Diego', 'Castillo', 5, 3);

INSERT IGNORE INTO empleados (id, nombres, apellidos, cargo, id_centro) VALUES 
(1, 'Elena', 'Ruiz', 'Enfermera', 3),
(2, 'Miguel', 'Torres', 'Técnico', 3),
(3, 'Sofia', 'Mendoza', 'Recepcionista', 3);

INSERT IGNORE INTO pacientes (id, nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, direccion, id_centro) VALUES 
(1, 'Andrea', 'Vargas', '0701234567', '0987654324', 'andrea@email.com', '1992-03-25', 'F', 'Calle Larga 123', 3),
(2, 'Fernando', 'Jiménez', '0701234568', '0987654325', 'fernando@email.com', '1987-11-12', 'M', 'Av. Solano 456', 3),
(3, 'Patricia', 'Castro', '0701234569', '0987654326', 'patricia@email.com', '1995-07-08', 'F', 'Calle Bolívar 789', 3);

INSERT IGNORE INTO consultas (id, id_centro, id_medico, paciente_nombre, paciente_apellido, id_paciente, fecha, motivo, diagnostico, tratamiento, estado, duracion_minutos) VALUES 
(1, 3, 1, 'Andrea', 'Vargas', 1, '2024-01-18 11:00:00', 'Palpitaciones', 'Arritmia', 'Medicación antiarrítmica', 'completada', 35),
(2, 3, 2, 'Fernando', 'Jiménez', 2, '2024-01-19 15:45:00', 'Dolor abdominal', 'Gastritis', 'Protectores gástricos', 'completada', 25),
(3, 3, 3, 'Patricia', 'Castro', 3, '2024-01-20 08:30:00', 'Lesión en brazo', 'Esguince', 'Inmovilización', 'completada', 40);

-- Insertar usuario médico para Cuenca
INSERT IGNORE INTO usuarios (id, email, password_hash, rol, id_centro, id_medico) VALUES 
(1, 'medico@cuenca.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'medico', 3, 1);

-- ===========================================
-- VERIFICACIÓN FINAL
-- ===========================================

-- Mostrar resumen de todas las bases de datos
SELECT 'CENTRAL - Centros' as info, COUNT(*) as total FROM hospital_central.centros_medicos
UNION ALL
SELECT 'CENTRAL - Especialidades', COUNT(*) FROM hospital_central.especialidades
UNION ALL
SELECT 'CENTRAL - Usuarios', COUNT(*) FROM hospital_central.usuarios
UNION ALL
SELECT 'CENTRAL - Médicos', COUNT(*) FROM hospital_central.medicos
UNION ALL
SELECT 'CENTRAL - Pacientes', COUNT(*) FROM hospital_central.pacientes
UNION ALL
SELECT 'CENTRAL - Consultas', COUNT(*) FROM hospital_central.consultas
UNION ALL
SELECT 'GUAYAQUIL - Usuarios', COUNT(*) FROM hospital_guayaquil.usuarios
UNION ALL
SELECT 'GUAYAQUIL - Médicos', COUNT(*) FROM hospital_guayaquil.medicos
UNION ALL
SELECT 'GUAYAQUIL - Pacientes', COUNT(*) FROM hospital_guayaquil.pacientes
UNION ALL
SELECT 'GUAYAQUIL - Consultas', COUNT(*) FROM hospital_guayaquil.consultas
UNION ALL
SELECT 'CUENCA - Usuarios', COUNT(*) FROM hospital_cuenca.usuarios
UNION ALL
SELECT 'CUENCA - Médicos', COUNT(*) FROM hospital_cuenca.medicos
UNION ALL
SELECT 'CUENCA - Pacientes', COUNT(*) FROM hospital_cuenca.pacientes
UNION ALL
SELECT 'CUENCA - Consultas', COUNT(*) FROM hospital_cuenca.consultas;

-- ===========================================
-- CREDENCIALES DE PRUEBA
-- ===========================================

-- Usuarios creados:
-- Admin: admin@hospital.com / password
-- Médico Guayaquil: medico@guayaquil.com / password  
-- Médico Cuenca: medico@cuenca.com / password
