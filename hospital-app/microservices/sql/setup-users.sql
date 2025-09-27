-- Script para crear usuarios y bases de datos en MySQL
-- Ejecutar como root en cada servidor

-- ==============================================
-- SERVIDOR CENTRAL (QUITO) - Puerto 3306
-- ==============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_central;

-- Crear usuario admin_central
CREATE USER IF NOT EXISTS 'admin_central'@'%' IDENTIFIED BY 'SuperPasswordCentral123!';
CREATE USER IF NOT EXISTS 'admin_central'@'localhost' IDENTIFIED BY 'SuperPasswordCentral123!';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON hospital_central.* TO 'admin_central'@'%';
GRANT ALL PRIVILEGES ON hospital_central.* TO 'admin_central'@'localhost';

-- ==============================================
-- SERVIDOR GUAYAQUIL - Puerto 3307
-- ==============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_guayaquil;

-- Crear usuario admin_guayaquil
CREATE USER IF NOT EXISTS 'admin_guayaquil'@'%' IDENTIFIED BY 'SuperPasswordGye123!';
CREATE USER IF NOT EXISTS 'admin_guayaquil'@'localhost' IDENTIFIED BY 'SuperPasswordGye123!';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON hospital_guayaquil.* TO 'admin_guayaquil'@'%';
GRANT ALL PRIVILEGES ON hospital_guayaquil.* TO 'admin_guayaquil'@'localhost';

-- ==============================================
-- SERVIDOR CUENCA - Puerto 3308
-- ==============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_cuenca;

-- Crear usuario admin_cuenca
CREATE USER IF NOT EXISTS 'admin_cuenca'@'%' IDENTIFIED BY 'SuperPasswordCuenca123!';
CREATE USER IF NOT EXISTS 'admin_cuenca'@'localhost' IDENTIFIED BY 'SuperPasswordCuenca123!';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON hospital_cuenca.* TO 'admin_cuenca'@'%';
GRANT ALL PRIVILEGES ON hospital_cuenca.* TO 'admin_cuenca'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Mostrar usuarios creados
SELECT User, Host FROM mysql.user WHERE User LIKE 'admin_%';
