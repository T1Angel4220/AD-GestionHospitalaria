import { prisma } from '../config/prisma';
export const listByCentro = (centroId: number) =>
    prisma.medico.findMany({
        where: { centroId },
        include: { especialidad: true },
        orderBy: { id: 'asc' }
    });
export const create = (centroId: number, data: { nombres: string; apellidos: string; especialidadId: number }) =>
    prisma.medico.create({ data: { ...data, centroId } });
export const update = (centroId: number, id: number, data: Partial<{ nombres: string; apellidos: string; especialidadId: number }>) =>
    prisma.medico.update({ where: { id }, data: { ...data, centroId } });
export const remove = (centroId: number, id: number) =>
    prisma.medico.delete({ where: { id } });
