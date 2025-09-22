import express from "express";
import cors from "cors";
import centros from "./routes/centros.routes";
import especialidades from "./routes/especialidades.routes";
import medicos from "./routes/medicos.routes";
import empleados from "./routes/empleados.routes";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, module: "backend" });
});

app.use("/api/admin/centros", centros);
app.use("/api/admin/especialidades", especialidades);
app.use("/api/admin/medicos", medicos);
app.use("/api/admin/empleados", empleados);
