import { prisma } from '../config/prisma';
export const list = () => prisma.centroMedico.findMany({ orderBy: { id: 'asc' } });
export const create = (data: { nombre: string; ciudad: string; direccion?: string | null }) =>
    prisma.centroMedico.create({ data });
export const update = (id: number, data: Partial<{ nombre: string; ciudad: string; direccion?: string | null }>) =>
    prisma.centroMedico.update({ where: { id }, data });
export const remove = (id: number) => prisma.centroMedico.delete({ where: { id } });
