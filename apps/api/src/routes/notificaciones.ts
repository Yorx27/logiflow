import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'

export const notificacionesRouter = Router()
notificacionesRouter.use(authenticate)

notificacionesRouter.get('/', async (req, res, next) => {
  try {
    const { conductorId } = req.query
    const where: any = {}
    if (conductorId) where.conductorId = String(conductorId)
    const data = await prisma.notificacion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ data })
  } catch (e) { next(e) }
})

notificacionesRouter.put('/:id/leer', async (req, res, next) => {
  try {
    const n = await prisma.notificacion.update({ where: { id: req.params.id }, data: { leida: true } })
    res.json({ data: n })
  } catch (e) { next(e) }
})

notificacionesRouter.delete('/limpiar', async (req, res, next) => {
  try {
    const { conductorId } = req.query
    const where: any = {}
    if (conductorId) where.conductorId = String(conductorId)
    await prisma.notificacion.deleteMany({ where })
    res.json({ data: { ok: true } })
  } catch (e) { next(e) }
})
