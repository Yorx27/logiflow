import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, requireRol } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { emitSolicitudNueva, emitNotificacion } from '../sockets/socketServer'
import { calcularCostoSolicitud } from '@logiflow/utils'

export const solicitudesRouter = Router()
solicitudesRouter.use(authenticate)

const solicitudSchema = z.object({
  ot: z.string().min(1),
  cliente: z.string().min(1),
  rfcCliente: z.string().optional().nullable(),
  ordenCompra: z.string().optional().nullable(),
  tipo: z.enum(['DISTRIBUCION', 'RECOLECCION', 'TRANSFERENCIA', 'ULTIMA_MILLA']),
  fechaSolicitud: z.coerce.date(),
  fechaRecoleccion: z.coerce.date().optional().nullable(),
  fechaEntrega: z.coerce.date().optional().nullable(),
  horaEntrega: z.string().optional().nullable(),
  descripcionCarga: z.string().optional().nullable(),
  cantidad: z.number().int().default(0),
  tarimas: z.number().int().default(0),
  etiquetasPieza: z.number().int().default(0),
  etiquetasColectivo: z.number().int().default(0),
  papeletas: z.number().int().default(0),
  cajaColectiva: z.boolean().default(false),
  playo: z.boolean().default(false),
  poliBurbuja: z.boolean().default(false),
  requiereAcond: z.boolean().default(false),
  gestionTarimas: z.boolean().default(false),
  lineaTransporte: z.string().optional().nullable(),
  tipoTransporte: z.string().optional().nullable(),
  requiereManiobra: z.boolean().default(false),
  variosDestinos: z.boolean().default(false),
  observaciones: z.string().optional().nullable(),
  costo: z.number().default(0),
  direccionEntrega: z.string().optional().nullable(),
  latDestino: z.number().optional().nullable(),
  lngDestino: z.number().optional().nullable(),
  distanciaKm: z.number().optional().nullable(),
  tiempoRuta: z.string().optional().nullable(),
  itemsRemision: z.array(z.any()).optional().nullable(),
  folioCandado: z.string().optional().nullable(),
})

// GET /api/solicitudes
solicitudesRouter.get('/', async (req, res, next) => {
  try {
    const { estado, tipo, cliente, ini, fin, mostrarCompletadas } = req.query
    const where: any = { deletedAt: null }
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (cliente) where.cliente = { contains: String(cliente), mode: 'insensitive' }
    if (ini || fin) {
      where.fechaSolicitud = {}
      if (ini) where.fechaSolicitud.gte = new Date(String(ini))
      if (fin) where.fechaSolicitud.lte = new Date(String(fin))
    }
    if (mostrarCompletadas === 'false') {
      where.estado = { notIn: ['COMPLETADA', 'RECHAZADA'] }
    }
    const data = await prisma.solicitud.findMany({
      where,
      include: { entrega: { include: { conductor: true, vehiculo: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})

// GET /api/solicitudes/:id
solicitudesRouter.get('/:id', async (req, res, next) => {
  try {
    const sol = await prisma.solicitud.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        entrega: {
          include: {
            conductor: true,
            vehiculo: true,
            evidencia: { include: { fotos: true } },
          },
        },
        facturas: true,
      },
    })
    if (!sol) throw new AppError('Solicitud no encontrada', 404)
    res.json({ data: sol })
  } catch (e) { next(e) }
})

// POST /api/solicitudes
solicitudesRouter.post('/', async (req, res, next) => {
  try {
    const body = solicitudSchema.parse(req.body)
    // recalculate cost server-side
    const cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } })
    if (cfg) {
      body.costo = calcularCostoSolicitud(body as any, cfg)
    }
    const sol = await prisma.solicitud.create({ data: body as any })
    emitSolicitudNueva({ solicitudId: sol.id, ot: sol.ot, cliente: sol.cliente })
    emitNotificacion({ mensaje: `Nueva solicitud ${sol.ot} de ${sol.cliente}`, tipo: 'INFO' })
    res.status(201).json({ data: sol })
  } catch (e) { next(e) }
})

// PUT /api/solicitudes/:id
solicitudesRouter.put('/:id', async (req, res, next) => {
  try {
    const body = solicitudSchema.partial().parse(req.body)
    const cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } })
    if (cfg && (body.distanciaKm !== undefined || body.tarimas !== undefined)) {
      const existing = await prisma.solicitud.findUnique({ where: { id: req.params.id } })
      if (existing) {
        const merged = { ...existing, ...body }
        body.costo = calcularCostoSolicitud(merged as any, cfg)
      }
    }
    const sol = await prisma.solicitud.update({ where: { id: req.params.id }, data: body as any })
    res.json({ data: sol })
  } catch (e) { next(e) }
})

// DELETE /api/solicitudes/:id (soft)
solicitudesRouter.delete('/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    await prisma.solicitud.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    res.json({ data: { ok: true } })
  } catch (e) { next(e) }
})

// POST /api/solicitudes/:id/generar-entrega
solicitudesRouter.post('/:id/generar-entrega', async (req, res, next) => {
  try {
    const sol = await prisma.solicitud.findFirst({ where: { id: req.params.id, deletedAt: null } })
    if (!sol) throw new AppError('Solicitud no encontrada', 404)
    const exists = await prisma.entrega.findUnique({ where: { solicitudId: sol.id } })
    if (exists) throw new AppError('Esta solicitud ya tiene una entrega generada', 409)
    const entrega = await prisma.entrega.create({
      data: { solicitudId: sol.id, estado: 'PENDIENTE' },
      include: { solicitud: true },
    })
    res.status(201).json({ data: entrega })
  } catch (e) { next(e) }
})

// POST /api/solicitudes/carga-masiva
solicitudesRouter.post('/carga-masiva', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const { rows } = req.body as { rows: any[] }
    if (!Array.isArray(rows)) throw new AppError('Formato inválido', 400)
    const cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } })
    const created = []
    for (const row of rows) {
      const body = solicitudSchema.parse(row)
      if (cfg) body.costo = calcularCostoSolicitud(body as any, cfg)
      const sol = await prisma.solicitud.create({ data: body as any })
      created.push(sol)
    }
    res.status(201).json({ data: created })
  } catch (e) { next(e) }
})
