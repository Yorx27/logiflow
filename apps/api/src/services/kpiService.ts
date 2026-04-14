import { prisma } from '../utils/prisma'

export async function getKPIs() {
  const [pendientes, enRuta, conductoresDisp, completadas, rechazadas, incidencias] = await Promise.all([
    prisma.solicitud.count({ where: { estado: 'PENDIENTE', deletedAt: null } }),
    prisma.solicitud.count({ where: { estado: 'EN_RUTA', deletedAt: null } }),
    prisma.conductor.count({ where: { estado: 'DISPONIBLE' } }),
    prisma.solicitud.count({ where: { estado: 'COMPLETADA', deletedAt: null } }),
    prisma.solicitud.count({ where: { estado: 'RECHAZADA', deletedAt: null } }),
    prisma.solicitud.count({ where: { estado: 'INCIDENCIA', deletedAt: null } }),
  ])
  return { pendientes, enRuta, conductoresDisp, completadas, rechazadas, incidencias }
}
