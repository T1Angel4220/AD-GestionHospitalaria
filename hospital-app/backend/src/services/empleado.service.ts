import { prisma } from '../config/prisma';
export const listByCentro = (centroId:number) =>
  prisma.empleado.findMany({ where:{ centroId }, orderBy:{ id:'asc' }});
export const create = (centroId:number, data:{nombres:string;apellidos:string;cargo:string}) =>
  prisma.empleado.create({ data:{ ...data, centroId }});
export const update = (centroId:number, id:number, data:Partial<{nombres:string;apellidos:string;cargo:string}>) =>
  prisma.empleado.update({ where:{ id }, data:{ ...data, centroId }});
export const remove = (centroId:number, id:number) =>
  prisma.empleado.delete({ where:{ id }});
