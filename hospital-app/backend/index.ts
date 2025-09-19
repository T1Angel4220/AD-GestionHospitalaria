import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/pacientes", (_, res) => {
  res.json([{ id: 1, nombre: "Juan Pérez" }, { id: 2, nombre: "Ana López" }]);
});

app.listen(4000, () => console.log("Servidor backend en http://localhost:4000"));
