import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, requireRol } from '../middleware/auth'

export const configRouter = Router()
configRouter.use(authenticate)

const configSchema = z.object({
  costoEtiqueta: z.number().nonnegative().optional(),
  costoTarima: z.number().nonnegative().optional(),
  costoPapeleta: z.number().nonnegative().optional(),
  costoCajaColectiva: z.number().nonnegative().optional(),
  costoPlayo: z.number().nonnegative().optional(),
  costoPoliBurbuja: z.number().nonnegative().optional(),
  empresa: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  latOrigen: z.number().optional().nullable(),
  lngOrigen: z.number().optional().nullable(),
})

configRouter.get('/', async (_req, res, next) => {
  try {
    let cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } })
    if (!cfg) {
      cfg = await prisma.configuracion.create({ data: { id: 'singleton' } })
    }
    res.json({ data: cfg })
  } catch (e) { next(e) }
})

configRouter.put('/', requireRol('ADMIN'), async (req, res, next) => {
  try {
    const body = configSchema.parse(req.body)

    // If address changed, geocode it
    if (body.direccion && !body.latOrigen) {
      try {
        const encoded = encodeURIComponent(body.direccion)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=mx`, {
          headers: { 'User-Agent': 'LogiFlow/1.0 (admin@logiflow.com)' },
        })
        const geoJson = await geoRes.json() as any[]
        if (geoJson.length) {
          body.latOrigen = parseFloat(geoJson[0].lat)
          body.lngOrigen = parseFloat(geoJson[0].lon)
        }
      } catch { /* ignore geocoding errors */ }
    }

    const cfg = await prisma.configuracion.upsert({
      where: { id: 'singleton' },
      update: body,
      create: { id: 'singleton', ...body },
    })
    res.json({ data: cfg })
  } catch (e) { next(e) }
})
