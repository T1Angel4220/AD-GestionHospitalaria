-- Configuración para Servidor Central (Quito) - Puerto 3306
-- Ejecutar como root: mysql -u root -p < setup-central.sql

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_central;

-- Crear usuario admin_central
CREATE USER IF NOT EXISTS 'admin_central'@'%' IDENTIFIED BY 'SuperPasswordCentral123!';
CREATE USER IF NOT EXISTS 'admin_central'@'localhost' IDENTIFIED BY 'SuperPasswordCentral123!';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON hospital_central.* TO 'admin_central'@'%';
GRANT ALL PRIVILEGES ON hospital_central.* TO 'admin_central'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar creación
SELECT 'Central (Quito) - Usuario creado:' as Status;
SELECT User, Host FROM mysql.user WHERE User = 'admin_central';
