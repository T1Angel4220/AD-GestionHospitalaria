import { Router } from "express";
import * as m from "../controllers/medicos.controller";

const r = Router();
r.get("/", m.list);
r.get("/:id", m.getOne);
r.post("/", m.create);
r.put("/:id", m.update);
r.delete("/:id", m.remove);

export default r;
