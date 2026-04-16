import { Router } from 'express'
import { z } from 'zod'
import path from 'path'
import multer from 'multer'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../utils/prisma'
import { authenticate, requireRol } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const gastosRouter = Router()
gastosRouter.use(authenticate)

const uploadDir = process.env.UPLOAD_DIR || './uploads'

// Multer para archivos de gastos (imágenes + PDF)
const storageGastos = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(uploadDir, 'gastos')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})
const uploadGastos = multer({
  storage: storageGastos,
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError('Solo imágenes o PDF', 400))
      return
    }
    cb(null, true)
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
})

// ─── GASTOS CONDUCTOR ────────────────────────────────────────────────────────

// GET /api/gastos/conductor — lista gastos del conductor autenticado (o todos si admin/operador)
gastosRouter.get('/conductor', async (req, res, next) => {
  try {
    const { conductorId, estado, ini, fin } = req.query
    const where: any = {}
    if (conductorId) where.conductorId = String(conductorId)
    if (estado) where.estado = estado
    if (ini || fin) {
      where.createdAt = {}
      if (ini) where.createdAt.gte = new Date(String(ini))
      if (fin) where.createdAt.lte = new Date(String(fin))
    }
    const data = await prisma.gastoConductor.findMany({
      where,
      include: { conductor: true, archivos: true, entrega: { include: { solicitud: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})

// POST /api/gastos/conductor — conductor registra un gasto
gastosRouter.post('/conductor', async (req, res, next) => {
  try {
    const body = z.object({
      conductorId:     z.string(),
      entregaId:       z.string().optional().nullable(),
      estacionamiento: z.coerce.number().default(0),
      gasolina:        z.coerce.number().default(0),
      tag:             z.coerce.number().default(0),
      casetas:         z.coerce.number().default(0),
      comidas:         z.coerce.number().default(0),
      otros:           z.coerce.number().default(0),
      otrosDesc:       z.string().optional().nullable(),
      observaciones:   z.string().optional().nullable(),
    }).parse(req.body)

    const gasto = await prisma.gastoConductor.create({
      data: body as any,
      include: { conductor: true, archivos: true },
    })
    res.status(201).json({ data: gasto })
  } catch (e) { next(e) }
})

// POST /api/gastos/conductor/:id/archivos — sube archivos/tickets al gasto
gastosRouter.post(
  '/conductor/:id/archivos',
  uploadGastos.array('archivos', 10),
  async (req, res, next) => {
    try {
      const gasto = await prisma.gastoConductor.findUnique({ where: { id: req.params.id } })
      if (!gasto) throw new AppError('Gasto no encontrado', 404)

      const files = (req.files as Express.Multer.File[]) || []
      if (files.length === 0) throw new AppError('No se recibieron archivos', 400)

      const categoria = String(req.body.categoria || 'otros')
      const archivos = await prisma.$transaction(
        files.map(f =>
          prisma.gastoArchivo.create({
            data: {
              gastoConductorId: gasto.id,
              categoria,
              url: `/uploads/gastos/${f.filename}`,
              nombre: f.originalname,
            },
          })
        )
      )
      res.status(201).json({ data: archivos })
    } catch (e) { next(e) }
  }
)

// PUT /api/gastos/conductor/:id/estado — admin/operador aprueba o rechaza
gastosRouter.put(
  '/conductor/:id/estado',
  requireRol('ADMIN', 'OPERADOR'),
  async (req, res, next) => {
    try {
      const { estado } = z.object({
        estado: z.enum(['APROBADO', 'RECHAZADO', 'PENDIENTE']),
      }).parse(req.body)

      const gasto = await prisma.gastoConductor.update({
        where: { id: req.params.id },
        data: { estado },
        include: { conductor: true, archivos: true },
      })
      res.json({ data: gasto })
    } catch (e) { next(e) }
  }
)

// DELETE /api/gastos/conductor/:id
gastosRouter.delete('/conductor/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    await prisma.gastoConductor.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ─── GASTOS FIJOS ────────────────────────────────────────────────────────────

gastosRouter.get('/fijos', async (_req, res, next) => {
  try {
    const data = await prisma.gastoFijo.findMany({ orderBy: { nombre: 'asc' } })
    res.json({ data })
  } catch (e) { next(e) }
})

const gastoFijoSchema = z.object({
  nombre:     z.string().min(1),
  monto:      z.coerce.number(),
  frecuencia: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL', 'ANUAL']).default('MENSUAL'),
  categoria:  z.string().optional().nullable(),
  activo:     z.boolean().default(true),
})

gastosRouter.post('/fijos', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const body = gastoFijoSchema.parse(req.body)
    const data = await prisma.gastoFijo.create({ data: body as any })
    res.status(201).json({ data })
  } catch (e) { next(e) }
})

gastosRouter.put('/fijos/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const body = gastoFijoSchema.partial().parse(req.body)
    const data = await prisma.gastoFijo.update({ where: { id: req.params.id }, data: body as any })
    res.json({ data })
  } catch (e) { next(e) }
})

gastosRouter.delete('/fijos/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    await prisma.gastoFijo.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ─── GASTOS VARIABLES ────────────────────────────────────────────────────────

gastosRouter.get('/variables', async (req, res, next) => {
  try {
    const { ini, fin, categoria } = req.query
    const where: any = {}
    if (categoria) where.categoria = String(categoria)
    if (ini || fin) {
      where.fecha = {}
      if (ini) where.fecha.gte = new Date(String(ini))
      if (fin) where.fecha.lte = new Date(String(fin))
    }
    const data = await prisma.gastoVariable.findMany({ where, orderBy: { fecha: 'desc' } })
    res.json({ data })
  } catch (e) { next(e) }
})

const gastoVariableSchema = z.object({
  nombre:      z.string().min(1),
  monto:       z.coerce.number(),
  fecha:       z.coerce.date().optional(),
  categoria:   z.string().optional().nullable(),
  comprobante: z.string().optional().nullable(),
})

gastosRouter.post('/variables', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const body = gastoVariableSchema.parse(req.body)
    const data = await prisma.gastoVariable.create({ data: body as any })
    res.status(201).json({ data })
  } catch (e) { next(e) }
})

gastosRouter.put('/variables/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const body = gastoVariableSchema.partial().parse(req.body)
    const data = await prisma.gastoVariable.update({ where: { id: req.params.id }, data: body as any })
    res.json({ data })
  } catch (e) { next(e) }
})

gastosRouter.delete('/variables/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    await prisma.gastoVariable.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ─── RESUMEN ─────────────────────────────────────────────────────────────────

gastosRouter.get('/resumen', async (req, res, next) => {
  try {
    const { ini, fin } = req.query
    const rangeFilter: any = {}
    if (ini || fin) {
      rangeFilter.createdAt = {}
      if (ini) rangeFilter.createdAt.gte = new Date(String(ini))
      if (fin) rangeFilter.createdAt.lte = new Date(String(fin))
    }

    const [conductorGastos, fijos, variables] = await Promise.all([
      prisma.gastoConductor.findMany({ where: rangeFilter }),
      prisma.gastoFijo.findMany({ where: { activo: true } }),
      prisma.gastoVariable.findMany({ where: rangeFilter }),
    ])

    const totalConductor = conductorGastos.reduce((s, g) =>
      s + g.estacionamiento + g.gasolina + g.tag + g.casetas + g.comidas + g.otros, 0)
    const totalFijos    = fijos.reduce((s, g) => s + g.monto, 0)
    const totalVariables = variables.reduce((s, g) => s + g.monto, 0)

    const conductorPorCategoria = {
      estacionamiento: conductorGastos.reduce((s, g) => s + g.estacionamiento, 0),
      gasolina:        conductorGastos.reduce((s, g) => s + g.gasolina, 0),
      tag:             conductorGastos.reduce((s, g) => s + g.tag, 0),
      casetas:         conductorGastos.reduce((s, g) => s + g.casetas, 0),
      comidas:         conductorGastos.reduce((s, g) => s + g.comidas, 0),
      otros:           conductorGastos.reduce((s, g) => s + g.otros, 0),
    }

    res.json({
      data: {
        totalConductor,
        totalFijos,
        totalVariables,
        totalGeneral: totalConductor + totalFijos + totalVariables,
        conductorPorCategoria,
        pendientesAprobacion: conductorGastos.filter(g => g.estado === 'PENDIENTE').length,
      },
    })
  } catch (e) { next(e) }
})
