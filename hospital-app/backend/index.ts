// backend/index.ts  (entrypoint FUERA de src)
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

// Como este archivo está fuera de src, importamos desde ./src/...
import { CONFIG } from "./src/config/env";
import { testDB } from "./src/config/db";
import consultasRouter from "./src/routes/consultas";
import reportsRouter from "./src/routes/reports";

// import reportsRouter from "./src/routes/reports"; // cuando lo agregues

const app = express();

/* ========= Middlewares ========= */
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ========= Healthchecks ========= */
app.get("/ping", (_req: Request, res: Response) => {
  res.json({ ok: true, now: new Date().toISOString(), port: CONFIG.PORT });
});

app.get("/ping-db", async (_req: Request, res: Response) => {
  try {
    await testDB();
    res.json({ ok: true, db: `${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME}` });
  } catch (e: any) {
    console.error("DB PING ERROR:", e?.code || e?.name, e?.message);
    res.status(500).json({
      ok: false,
      error: "DB_ERROR",
      message: "No se pudo conectar a la base de datos",
    });
  }
});

/* ========= Rutas ========= */
app.use("/api/consultas", consultasRouter);
app.use("/api/reports", reportsRouter);
console.log("[ROUTER] /api/reports montado");


// app.use("/api/reports", reportsRouter);

/* ========= 404 ========= */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl });
});

/* ========= Error global ========= */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

/* ========= Arranque ========= */
async function bootstrap() {
  try {
    await testDB(); // verifica BD antes de escuchar
    const server = app.listen(CONFIG.PORT, () => {
      console.log(`API escuchando en http://localhost:${CONFIG.PORT}`);
    });

    const graceful = () => server.close(() => process.exit(0));
    process.on("SIGINT", graceful);
    process.on("SIGTERM", graceful);
  } catch (err) {
    console.error("[DB] Error al conectar antes de iniciar el servidor:", err);
    process.exit(1);
  }
}
bootstrap();

export default app;
