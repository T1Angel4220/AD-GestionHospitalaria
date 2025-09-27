// src/config/swagger.ts
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

// Cargar el archivo YAML de Swagger
const swaggerFilePath = path.join(__dirname, '../../swagger.yaml');
const swaggerFile = fs.readFileSync(swaggerFilePath, 'utf8');
const specs = yaml.load(swaggerFile) as any;

export const setupSwagger = (app: Express) => {
  // Configuración de Swagger UI
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2563eb; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
    `,
    customSiteTitle: 'HospitalApp API Documentation',
    customfavIcon: '/favicon.ico'
  };

  // Ruta para la documentación Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  
  // Ruta para el JSON de la especificación
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger UI disponible en: http://localhost:3000/api-docs');
  console.log('📄 Especificación OpenAPI en: http://localhost:3000/api-docs.json');
};

export default specs;
