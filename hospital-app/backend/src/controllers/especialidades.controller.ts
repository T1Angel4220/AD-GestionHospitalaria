import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function list(_req: Request, res: Response) {
    const rows = await prisma.especialidad.findMany({ orderBy: { id: "asc" } });
    res.json(rows);
}

export async function getOne(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });
    const row = await prisma.especialidad.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: "Especialidad no encontrada" });
    res.json(row);
}

export async function create(req: Request, res: Response) {
    const { nombre } = req.body ?? {};
    if (!nombre) return res.status(400).json({ error: "nombre es obligatorio" });
    try {
        const created = await prisma.especialidad.create({ data: { nombre }, select: { id: true } });
        res.status(201).json(created);
    } catch (e: any) {
        // unique constraint nombre
        return res.status(409).json({ error: "nombre ya existe" });
    }
}

export async function update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { nombre } = req.body ?? {};
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });
    try {
        const updated = await prisma.especialidad.update({
            where: { id },
            data: { ...(nombre !== undefined ? { nombre } : {}) },
            select: { id: true }
        });
        res.json(updated);
    } catch {
        return res.status(404).json({ error: "Especialidad no encontrada" });
    }
}

export async function remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });
    try {
        await prisma.especialidad.delete({ where: { id } });
        res.sendStatus(204);
    } catch {
        res.status(404).json({ error: "Especialidad no encontrada" });
    }
}
