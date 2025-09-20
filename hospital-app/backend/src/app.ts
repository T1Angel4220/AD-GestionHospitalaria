import express from "express";
import cors from "cors";
import centros from "./routes/centros.routes";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, module: "backend" });
});

app.use("/api/admin/centros", centros);
