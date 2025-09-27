import { Router } from "express";
import * as e from "../controllers/empleados.controller";

const r = Router();
r.get("/", e.list);
r.get("/:id", e.getOne);
r.post("/", e.create);
r.put("/:id", e.update);
r.delete("/:id", e.remove);

export default r;
