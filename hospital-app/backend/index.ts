import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./src/config/db";
import dotenv from "dotenv";
import { setupSwagger } from "./src/config/swagger";
import consultasRouter from "./src/routes/consultas";
import authRouter from "./src/routes/auth";
import reportsRouter from "./src/routes/reports";
import medicosRouter from "./src/routes/medicos.routes";
import empleadosRouter from "./src/routes/empleados.routes";
import centrosRouter from "./src/routes/centros.routes";
import especialidadesRouter from "./src/routes/especialidades.routes";
import usuariosRouter from "./src/routes/usuarios.routes";
import pacientesRouter from "./src/routes/pacientes.routes";

dotenv.config();

const app = express();

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:5173', // URL del frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Centro-Id', 'x-centro-id']
}));

app.use(express.json());

// Configurar Swagger
setupSwagger(app);

// Rutas de autenticación
app.use("/api/auth", authRouter);

// Rutas protegidas
app.use("/api/consultas", consultasRouter);

// Rutas de reportes
app.use("/api/reports", reportsRouter);

// Rutas de administración
app.use("/api/admin/medicos", medicosRouter);
app.use("/api/admin/empleados", empleadosRouter);
app.use("/api/admin/centros", centrosRouter);
app.use("/api/admin/especialidades", especialidadesRouter);
app.use("/api/admin/usuarios", usuariosRouter);

// Rutas de pacientes
app.use("/api/pacientes", pacientesRouter);

// Ruta de prueba para verificar conexión
app.get("/ping", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Admin-service listening on port ${PORT}`);
});
