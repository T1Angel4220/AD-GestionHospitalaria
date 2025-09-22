import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// GET /api/admin/empleados
export async function list(req: Request, res: Response) {
    try {
        const rows = await prisma.empleado.findMany({
            orderBy: { id: "asc" },
            include: {
                centro: { select: { id: true, nombre: true, ciudad: true } }
            }
        });
        res.json(rows);
    } catch (err) {
        console.error("[ERROR] listando empleados:", err);
        res.status(500).json({ error: "Error interno al listar empleados" });
    }
}

// GET /api/admin/empleados/:id
export async function getOne(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    try {
        const row = await prisma.empleado.findUnique({
            where: { id },
            include: {
                centro: { select: { id: true, nombre: true, ciudad: true } }
            }
        });
        if (!row) return res.status(404).json({ error: "Empleado no encontrado" });
        res.json(row);
    } catch (err) {
        console.error("[ERROR] obteniendo empleado:", err);
        res.status(500).json({ error: "Error interno" });
    }
}

// POST /api/admin/empleados
export async function create(req: Request, res: Response) {
    const { nombres, apellidos, cargo, id_centro } = req.body ?? {};

    if (!nombres?.trim() || !apellidos?.trim() || !cargo?.trim() || !id_centro) {
        return res.status(400).json({ error: "nombres, apellidos, cargo e id_centro son obligatorios" });
    }

    // Validar centro
    const centroExists = await prisma.centroMedico.findUnique({ where: { id: Number(id_centro) } });
    if (!centroExists) {
        return res.status(400).json({ error: "El centro especificado no existe" });
    }

    try {
        const created = await prisma.empleado.create({
            data: {
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                cargo: cargo.trim(),
                centroId: Number(id_centro)   // 👈 aquí usamos centroId
            },
            select: { id: true, nombres: true, apellidos: true, cargo: true, centroId: true }
        });
        res.status(201).json(created);
    } catch (err: any) {
        console.error("[ERROR] creando empleado:", err);
        res.status(500).json({ error: "Error interno al crear empleado", detalle: err.message });
    }
}

// PUT /api/admin/empleados/:id
export async function update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "id inválido" });
    }

    const { nombres, apellidos, cargo, id_centro } = req.body ?? {};

    // Construir objeto dinámico con los campos presentes
    const data: any = {};
    if (nombres !== undefined) data.nombres = nombres.trim();
    if (apellidos !== undefined) data.apellidos = apellidos.trim();
    if (cargo !== undefined) data.cargo = cargo.trim();
    if (id_centro !== undefined) {
        // Validar centro si viene en el body
        const centroExists = await prisma.centroMedico.findUnique({ where: { id: Number(id_centro) } });
        if (!centroExists) {
            return res.status(400).json({ error: "El centro especificado no existe" });
        }
        data.centroId = Number(id_centro); // 👈 usar campo correcto de Prisma
    }

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
    }

    try {
        const updated = await prisma.empleado.update({
            where: { id },
            data,
            select: { id: true, nombres: true, apellidos: true, cargo: true, centroId: true }
        });
        res.json(updated);
    } catch (err) {
        console.error("[ERROR] actualizando empleado:", err);
        res.status(404).json({ error: "Empleado no encontrado" });
    }
}


// DELETE /api/admin/empleados/:id
export async function remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id inválido" });

    try {
        await prisma.empleado.delete({ where: { id } });
        res.json({ message: "Empleado eliminado correctamente" });
    } catch (err) {
        console.error("[ERROR] eliminando empleado:", err);
        res.status(404).json({ error: "Empleado no encontrado" });
    }
}
