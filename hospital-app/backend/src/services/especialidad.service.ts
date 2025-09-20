import { prisma } from '../config/prisma';
export const listByCentro = (centroId: number) =>
    prisma.especialidad.findMany({
        where: { medicos: { some: { centroId } } }, orderBy: { id: 'asc' }
    });
export const listAll = () => prisma.especialidad.findMany({ orderBy: { id: 'asc' } });
export const create = (nombre: string) => prisma.especialidad.create({ data: { nombre } });
export const update = (id: number, nombre: string) => prisma.especialidad.update({ where: { id }, data: { nombre } });
export const remove = (id: number) => prisma.especialidad.delete({ where: { id } });
