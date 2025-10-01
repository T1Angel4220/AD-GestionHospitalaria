-- Script para inicializar base de datos Cuenca
USE hospital_cuenca;

-- Crear tablas básicas
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'medico') NOT NULL,
    id_medico INT NULL,
    id_centro INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar usuario admin por defecto
INSERT IGNORE INTO usuarios (email, password_hash, rol, id_centro) 
VALUES ('admin@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 3);

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

-- Insertar centro Cuenca
INSERT IGNORE INTO centros_medicos (id, nombre, ciudad, direccion, telefono) 
VALUES (3, 'Hospital Cuenca', 'Cuenca', 'Av. Solano', '07-4444-4444');

-- Crear tabla de especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    id_centro INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar especialidades básicas
INSERT IGNORE INTO especialidades (nombre, descripcion, id_centro) VALUES
('Medicina General', 'Atención médica general', 3),
('Cardiología', 'Especialidad en enfermedades del corazón', 3),
('Pediatría', 'Especialidad en medicina infantil', 3);

-- Crear tabla de médicos
CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    id_especialidad INT NOT NULL,
    id_centro INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id),
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar médico de prueba
INSERT IGNORE INTO medicos (nombres, apellidos, cedula, telefono, email, id_especialidad, id_centro) 
VALUES ('Dr. Luis', 'Fernández', '3456789012', '0987654321', 'luis.fernandez@hospital.com', 1, 3);

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
    id_centro INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar paciente de prueba
INSERT IGNORE INTO pacientes (nombres, apellidos, cedula, telefono, email, fecha_nacimiento, genero, id_centro) 
VALUES ('Pedro', 'Martínez', '2987654321', '0998765432', 'pedro.martinez@email.com', '1988-07-10', 'M', 3);

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
    id_centro INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico) REFERENCES medicos(id),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar consulta de prueba
INSERT IGNORE INTO consultas (fecha, motivo, diagnostico, tratamiento, estado, id_medico, id_paciente, id_centro) 
VALUES ('2024-01-17 09:00:00', 'Fiebre', 'Gripe', 'Reposo y medicamento', 'completada', 1, 1, 3);

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
    id_centro INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_centro) REFERENCES centros_medicos(id)
);

-- Insertar empleados de prueba
INSERT IGNORE INTO empleados (nombres, apellidos, cedula, telefono, email, cargo, salario, fecha_ingreso, id_centro) VALUES
('Roberto', 'Herrera', '6666666666', '0996666666', 'roberto.herrera@hospital.com', 'Farmacéutico', 1100.00, '2023-06-15', 3),
('Sofia', 'Morales', '7777777777', '0997777777', 'sofia.morales@hospital.com', 'Técnico de Farmacia', 750.00, '2023-07-20', 3);