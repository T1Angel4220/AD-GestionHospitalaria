import express, { Request, Response } from "express";
import { pool } from "./src/config/db";
import dotenv from "dotenv";
import consultasRouter from "./src/routes/consultas";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/consultas", consultasRouter);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Admin-service listening on port ${PORT}`);
});
