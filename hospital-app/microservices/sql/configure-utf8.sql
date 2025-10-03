-- Script para configurar UTF-8 en la base de datos actual
-- Este script debe ejecutarse en cada base de datos

-- Configurar charset de la base de datos actual
-- (Se ejecutará automáticamente para cada base de datos)

-- Configurar charset de la base de datos
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Configurar charset de las tablas principales
-- Tabla usuarios
ALTER TABLE usuarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla centros_medicos
ALTER TABLE centros_medicos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla especialidades
ALTER TABLE especialidades CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla medicos
ALTER TABLE medicos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla empleados
ALTER TABLE empleados CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla pacientes
ALTER TABLE pacientes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla consultas
ALTER TABLE consultas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Configurar charset específico para campos de texto
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
