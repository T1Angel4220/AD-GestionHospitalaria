import { Request, Response } from "express";
import { prisma } from "../config/prisma";

/**
 * Modelo Prisma esperado: `model CentroMedico { ... @@map("centros_medicos") }`
 * Cliente: prisma.centroMedico
 */

// GET /api/admin/centros
export async function list(_req: Request, res: Response) {
  const rows = await prisma.centroMedico.findMany({ orderBy: { id: "asc" } });
  res.json(rows);
}

// GET /api/admin/centros/:id
export async function getOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

  const row = await prisma.centroMedico.findUnique({ where: { id } });
  if (!row) return res.status(404).json({ error: "Centro no encontrado" });
  res.json(row);
}

// POST /api/admin/centros
export async function create(req: Request, res: Response) {
  const { nombre, ciudad, direccion } = req.body ?? {};
  if (!nombre || !ciudad) return res.status(400).json({ error: "nombre y ciudad son obligatorios" });

  const created = await prisma.centroMedico.create({
    data: { nombre, ciudad, direccion: direccion ?? null },
    select: { id: true }
  });
  res.status(201).json(created);
}

// PUT /api/admin/centros/:id  (parcial)
export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

  const { nombre, ciudad, direccion } = req.body ?? {};
  try {
    const updated = await prisma.centroMedico.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(ciudad !== undefined ? { ciudad } : {}),
        ...(direccion !== undefined ? { direccion } : {}),
      },
      select: { id: true }
    });
    res.json(updated);
  } catch {
    return res.status(404).json({ error: "Centro no encontrado" });
  }
}

// DELETE /api/admin/centros/:id
export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

  try {
    await prisma.centroMedico.delete({ where: { id } });
    res.sendStatus(204);
  } catch {
    res.status(404).json({ error: "Centro no encontrado" });
  }
}
