import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./src/config/db";
import dotenv from "dotenv";
import consultasRouter from "./src/routes/consultas";
import authRouter from "./src/routes/auth";
import reportsRouter from "./src/routes/reports";

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

// Rutas de autenticación
app.use("/api/auth", authRouter);

// Rutas protegidas
app.use("/api/consultas", consultasRouter);

// Rutas de reportes
app.use("/api/reports", reportsRouter);

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
