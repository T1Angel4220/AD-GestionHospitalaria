import { Router } from "express";
import * as u from "../controllers/usuarios.controller";

const r = Router();
r.get("/", u.list);
r.get("/:id", u.getOne);
r.get("/medicos-por-centro/:centroId", u.getMedicosByCentroEndpoint);
r.post("/", u.create);
r.put("/:id", u.update);
r.delete("/:id", u.remove);
r.post("/sync-centros", u.syncCentros);

export default r;
