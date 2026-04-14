import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'

export const vehiculosRouter = Router()
vehiculosRouter.use(authenticate)

const vehSchema = z.object({
  placa: z.string().min(1),
  modelo: z.string().min(1),
  tipo: z.enum(['TORTON', 'RABON', 'VAN', 'PICKUP', 'PLATAFORMA']),
  capacidad: z.string().min(1),
  costoKm: z.number().positive(),
  estado: z.enum(['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO']).optional(),
})

vehiculosRouter.get('/', async (_req, res, next) => {
  try {
    const data = await prisma.vehiculo.findMany({ orderBy: { placa: 'asc' } })
    res.json({ data })
  } catch (e) { next(e) }
})

vehiculosRouter.post('/', async (req, res, next) => {
  try {
    const body = vehSchema.parse(req.body)
    const veh = await prisma.vehiculo.create({ data: body })
    res.status(201).json({ data: veh })
  } catch (e) { next(e) }
})

vehiculosRouter.put('/:id', async (req, res, next) => {
  try {
    const body = vehSchema.partial().parse(req.body)
    const veh = await prisma.vehiculo.update({ where: { id: req.params.id }, data: body })
    res.json({ data: veh })
  } catch (e) { next(e) }
})
