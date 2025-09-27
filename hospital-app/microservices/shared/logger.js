const winston = require('winston');
const path = require('path');

// Crear directorio de logs si no existe
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configuración de logger compartida
const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.label({ label: serviceName })
    ),
    transports: [
      new winston.transports.File({ 
        filename: path.join(logDir, `${serviceName}-error.log`), 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: path.join(logDir, `${serviceName}-combined.log`)
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

module.exports = { createLogger };
