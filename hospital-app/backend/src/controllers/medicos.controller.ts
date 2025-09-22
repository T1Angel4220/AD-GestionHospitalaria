import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// =========================
// GET /api/admin/medicos
// =========================
export async function list(req: Request, res: Response) {
  try {
    const medicos = await prisma.medico.findMany({
      include: {
        especialidad: { select: { id: true, nombre: true } },
        centro: { select: { id: true, nombre: true, ciudad: true } },
      },
    });
    res.json(medicos);
  } catch (err) {
    console.error("[ERROR] listando médicos:", err);
    res.status(500).json({ error: "Error interno al listar médicos" });
  }
}

// =========================
// GET /api/admin/medicos/:id
// =========================
export async function getOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const medico = await prisma.medico.findUnique({
      where: { id },
      include: {
        especialidad: { select: { id: true, nombre: true } },
        centro: { select: { id: true, nombre: true, ciudad: true } },
      },
    });

    if (!medico) return res.status(404).json({ error: "Médico no encontrado" });

    res.json(medico);
  } catch (err) {
    console.error("[ERROR] obteniendo médico:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =========================
// POST /api/admin/medicos
// =========================
export async function create(req: Request, res: Response) {
  try {
    const { nombres, apellidos, id_especialidad, id_centro } = req.body ?? {};

    if (!nombres?.trim() || !apellidos?.trim() || !id_especialidad || !id_centro) {
      return res.status(400).json({ error: "nombres, apellidos, id_especialidad e id_centro son obligatorios" });
    }

    // Validar centro
    const centroExists = await prisma.centroMedico.findUnique({ where: { id: Number(id_centro) } });
    if (!centroExists) return res.status(400).json({ error: "El centro especificado no existe" });

    // Validar especialidad
    const especialidadExists = await prisma.especialidad.findUnique({ where: { id: Number(id_especialidad) } });
    if (!especialidadExists) return res.status(400).json({ error: "La especialidad especificada no existe" });

    const created = await prisma.medico.create({
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        especialidad: { connect: { id: Number(id_especialidad) } },
        centro: { connect: { id: Number(id_centro) } },
      },
      select: { id: true, nombres: true, apellidos: true },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] creando médico:", err);
    res.status(500).json({ error: "Error interno al crear médico" });
  }
}

// =========================
// PUT /api/admin/medicos/:id
// =========================
export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const { nombres, apellidos, id_especialidad, id_centro } = req.body ?? {};

    // Validaciones mínimas
    if (!nombres?.trim() || !apellidos?.trim() || !id_especialidad || !id_centro) {
      return res.status(400).json({ error: "nombres, apellidos, id_especialidad e id_centro son obligatorios" });
    }

    // Validar existencia
    const medico = await prisma.medico.findUnique({ where: { id } });
    if (!medico) return res.status(404).json({ error: "Médico no encontrado" });

    const updated = await prisma.medico.update({
      where: { id },
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        especialidad: { connect: { id: Number(id_especialidad) } },
        centro: { connect: { id: Number(id_centro) } },
      },
      select: { id: true, nombres: true, apellidos: true },
    });

    res.json(updated);
  } catch (err) {
    console.error("[ERROR] actualizando médico:", err);
    res.status(500).json({ error: "Error interno al actualizar médico" });
  }
}

// =========================
// DELETE /api/admin/medicos/:id
// =========================
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const medico = await prisma.medico.findUnique({ where: { id } });
    if (!medico) return res.status(404).json({ error: "Médico no encontrado" });

    await prisma.medico.delete({ where: { id } });

    res.json({ message: "Médico eliminado correctamente" });
  } catch (err) {
    console.error("[ERROR] eliminando médico:", err);
    res.status(500).json({ error: "Error interno al eliminar médico" });
  }
}
