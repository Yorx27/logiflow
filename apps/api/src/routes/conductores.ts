import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const conductoresRouter = Router()
conductoresRouter.use(authenticate)

const condSchema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().optional().nullable(),
  licencia: z.string().min(1),
  estado: z.enum(['DISPONIBLE', 'EN_RUTA', 'INACTIVO']).optional(),
})

conductoresRouter.get('/', async (_req, res, next) => {
  try {
    const data = await prisma.conductor.findMany({
      include: {
        usuario: { select: { id: true, email: true, rol: true, activo: true } },
        _count: { select: { entregas: true } },
      },
      orderBy: { nombre: 'asc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})

conductoresRouter.post('/', async (req, res, next) => {
  try {
    const body = condSchema.parse(req.body)
    const cond = await prisma.conductor.create({ data: body })
    res.status(201).json({ data: cond })
  } catch (e) { next(e) }
})

conductoresRouter.put('/:id', async (req, res, next) => {
  try {
    const body = condSchema.partial().parse(req.body)
    const cond = await prisma.conductor.update({ where: { id: req.params.id }, data: body })
    res.json({ data: cond })
  } catch (e) { next(e) }
})

conductoresRouter.put('/:id/estado', async (req, res, next) => {
  try {
    const { estado } = z.object({ estado: z.enum(['DISPONIBLE', 'INACTIVO']) }).parse(req.body)
    const cond = await prisma.conductor.findUnique({ where: { id: req.params.id } })
    if (!cond) throw new AppError('Conductor no encontrado', 404)
    if (cond.estado === 'EN_RUTA') throw new AppError('No se puede cambiar el estado de un conductor En Ruta', 400)
    const updated = await prisma.conductor.update({ where: { id: req.params.id }, data: { estado } })
    res.json({ data: updated })
  } catch (e) { next(e) }
})

conductoresRouter.get('/:id/entregas', async (req, res, next) => {
  try {
    const data = await prisma.entrega.findMany({
      where: { conductorId: req.params.id },
      include: { solicitud: true, vehiculo: true, evidencia: { include: { fotos: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})
