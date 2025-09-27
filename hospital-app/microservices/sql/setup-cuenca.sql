-- Configuración para Servidor Cuenca - Puerto 3308
-- Ejecutar como root: mysql -u root -p < setup-cuenca.sql

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_cuenca;

-- Crear usuario admin_cuenca
CREATE USER IF NOT EXISTS 'admin_cuenca'@'%' IDENTIFIED BY 'SuperPasswordCuenca123!';
CREATE USER IF NOT EXISTS 'admin_cuenca'@'localhost' IDENTIFIED BY 'admin_cuenca'@'localhost';

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON hospital_cuenca.* TO 'admin_cuenca'@'%';
GRANT ALL PRIVILEGES ON hospital_cuenca.* TO 'admin_cuenca'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar creación
SELECT 'Cuenca - Usuario creado:' as Status;
SELECT User, Host FROM mysql.user WHERE User = 'admin_cuenca';
