-- Script para inicializar base de datos Guayaquil
USE hospital_guayaquil;

-- Crear tablas básicas
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'medico') NOT NULL,
    id_medico INT NULL,
    id_centro INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar usuario admin por defecto
INSERT IGNORE INTO usuarios (email, password_hash, rol, id_centro) 
VALUES ('admin@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 2);

-- Crear tabla de centros médicos
CREATE TABLE IF NOT EXISTS centros_medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar centro Guayaquil
INSERT IGNORE INTO centros_medicos (id, nombre, ciudad, direccion, telefono) 
VALUES (2, 'Hospital Guayaquil', 'Guayaquil', 'Av. 9 de Octubre', '04-3333-3333');

-- Crear tabla de especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    id_centro INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar especialidades básicas
INSERT IGNORE INTO especialidades (nombre, descripcion, id_centro) VALUES
('Medicina General', 'Atención médica general', 2),
('Cardiología', 'Especialidad en enfermedades del corazón', 2),
('Pediatría', 'Especialidad en medicina infantil', 2);

-- Crear tabla de médicos
CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id),
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar médico de prueba
INSERT IGNORE INTO medicos (nombres, apellidos, cedula, telefono, email, id_especialidad, id_centro) 
VALUES ('Dr. Carlos', 'Mendoza', '2345678901', '0987654321', 'carlos.mendoza@hospital.com', 1, 2);

-- Crear tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'O'),
    direccion TEXT,
    id_centro INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar paciente de prueba
INSERT IGNORE INTO pacientes (nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, id_centro) 
VALUES ('Ana', 'Rodríguez', '1987654321', '0998765432', 'ana.rodriguez@email.com', '1985-03-20', 'F', 2);

-- Crear tabla de consultas
CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL,
    motivo TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    estado ENUM('pendiente', 'programada', 'completada', 'cancelada') DEFAULT 'pendiente',
    duracion_minutos INT,
    id_medico INT NOT NULL,
    id_paciente INT NULL,
    paciente_nombre VARCHAR(255),
    paciente_apellido VARCHAR(255),
    id_centro INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico) REFERENCES medicos(id),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar consulta de prueba
INSERT IGNORE INTO consultas (fecha, motivo, diagnostico, tratamiento, estado, id_medico, id_paciente, id_centro) 
VALUES ('2024-01-16 14:00:00', 'Dolor abdominal', 'Gastritis', 'Dieta blanda y medicamento', 'completada', 1, 1, 2);

-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    cargo VARCHAR(100) NOT NULL,
    salario DECIMAL(10,2),
    fecha_ingreso DATE,
    activo BOOLEAN DEFAULT TRUE,
    id_centro INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar empleados de prueba
INSERT IGNORE INTO empleados (nombres, apellidos, cedula, telefono, email, cargo, salario, fecha_ingreso, id_centro) VALUES
('Pedro', 'Silva', '4444444444', '0994444444', 'pedro.silva@hospital.com', 'Enfermero', 1000.00, '2023-04-15', 2),
('María', 'Castro', '5555555555', '0995555555', 'maria.castro@hospital.com', 'Técnico de Rayos X', 900.00, '2023-05-20', 2);