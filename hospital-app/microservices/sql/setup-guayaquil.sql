-- Configuración para Servidor Guayaquil - Puerto 3307
-- Ejecutar como root: mysql -u root -p < setup-guayaquil.sql

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_guayaquil;

-- Crear usuario admin_guayaquil
CREATE USER IF NOT EXISTS 'admin_guayaquil'@'%' IDENTIFIED BY 'SuperPasswordGye123!';
CREATE USER IF NOT EXISTS 'admin_guayaquil'@'localhost' IDENTIFIED BY 'SuperPasswordGye123!';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON hospital_guayaquil.* TO 'admin_guayaquil'@'%';
GRANT ALL PRIVILEGES ON hospital_guayaquil.* TO 'admin_guayaquil'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar creación
SELECT 'Guayaquil - Usuario creado:' as Status;
SELECT User, Host FROM mysql.user WHERE User = 'admin_guayaquil';
