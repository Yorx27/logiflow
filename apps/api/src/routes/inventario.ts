import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate, requireRol } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { emitNotificacion } from '../sockets/socketServer'

export const inventarioRouter = Router()
inventarioRouter.use(authenticate)

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function registrarMovimiento(params: {
  productoId: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number
  motivo?: string
  referencia?: string
  solicitudId?: string
  entregaId?: string
  usuarioId: string
}) {
  const producto = await prisma.producto.findUnique({ where: { id: params.productoId } })
  if (!producto) throw new AppError('Producto no encontrado', 404)

  let nuevoStock = producto.stockActual
  if (params.tipo === 'ENTRADA') nuevoStock += params.cantidad
  else if (params.tipo === 'SALIDA') {
    if (nuevoStock < params.cantidad) throw new AppError('Stock insuficiente', 400)
    nuevoStock -= params.cantidad
  } else {
    // AJUSTE: cantidad puede ser negativa o positiva
    nuevoStock = params.cantidad
  }

  const [movimiento, productoActualizado] = await prisma.$transaction([
    prisma.movimientoInventario.create({
      data: {
        productoId: params.productoId,
        tipo: params.tipo,
        cantidad: params.tipo === 'AJUSTE' ? params.cantidad - producto.stockActual : params.cantidad,
        stockAntes: producto.stockActual,
        stockDespues: nuevoStock,
        motivo: params.motivo,
        referencia: params.referencia,
        solicitudId: params.solicitudId,
        entregaId: params.entregaId,
        usuarioId: params.usuarioId,
      },
    }),
    prisma.producto.update({
      where: { id: params.productoId },
      data: { stockActual: nuevoStock },
    }),
  ])

  // Alerta si el stock queda por debajo del mínimo
  if (productoActualizado.stockActual <= productoActualizado.stockMinimo && productoActualizado.stockMinimo > 0) {
    emitNotificacion({
      mensaje: `⚠️ Stock bajo: ${productoActualizado.nombre} (${productoActualizado.stockActual} ${productoActualizado.unidad} — mín. ${productoActualizado.stockMinimo})`,
      tipo: 'WARNING',
    })
  }

  return { movimiento, producto: productoActualizado }
}

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────

// GET /api/inventario/productos
inventarioRouter.get('/productos', async (req, res, next) => {
  try {
    const { categoria, buscar, activo } = req.query
    const where: any = {}
    if (activo !== undefined) where.activo = activo === 'true'
    if (categoria) where.categoria = String(categoria)
    if (buscar) {
      where.OR = [
        { nombre: { contains: String(buscar), mode: 'insensitive' } },
        { sku: { contains: String(buscar), mode: 'insensitive' } },
        { descripcion: { contains: String(buscar), mode: 'insensitive' } },
      ]
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { movimientos: true } },
      },
    })

    res.json({ data: productos })
  } catch (e) { next(e) }
})

// GET /api/inventario/productos/:id
inventarioRouter.get('/productos/:id', async (req, res, next) => {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id },
      include: {
        movimientos: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { movimientos: true } },
      },
    })
    if (!producto) throw new AppError('Producto no encontrado', 404)
    res.json({ data: producto })
  } catch (e) { next(e) }
})

const productoSchema = z.object({
  sku: z.string().min(1).max(50),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().optional().nullable(),
  unidad: z.string().default('pza'),
  categoria: z.string().optional().nullable(),
  stockMinimo: z.number().int().min(0).default(0),
  precio: z.number().min(0).optional().nullable(),
  activo: z.boolean().default(true),
})

// POST /api/inventario/productos
inventarioRouter.post('/productos', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const data = productoSchema.parse(req.body)
    const exists = await prisma.producto.findUnique({ where: { sku: data.sku } })
    if (exists) throw new AppError('Ya existe un producto con ese SKU', 409)

    const producto = await prisma.producto.create({ data })
    res.status(201).json({ data: producto })
  } catch (e) { next(e) }
})

// PUT /api/inventario/productos/:id
inventarioRouter.put('/productos/:id', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const data = productoSchema.partial().parse(req.body)
    if (data.sku) {
      const exists = await prisma.producto.findFirst({
        where: { sku: data.sku, id: { not: req.params.id } },
      })
      if (exists) throw new AppError('SKU ya en uso por otro producto', 409)
    }
    const producto = await prisma.producto.update({ where: { id: req.params.id }, data })
    res.json({ data: producto })
  } catch (e) { next(e) }
})

// DELETE /api/inventario/productos/:id  (soft delete)
inventarioRouter.delete('/productos/:id', requireRol('ADMIN'), async (req, res, next) => {
  try {
    await prisma.producto.update({ where: { id: req.params.id }, data: { activo: false } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ─── MOVIMIENTOS ─────────────────────────────────────────────────────────────

// GET /api/inventario/movimientos
inventarioRouter.get('/movimientos', async (req, res, next) => {
  try {
    const { productoId, tipo, ini, fin, page = '1', limit = '50' } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {}
    if (productoId) where.productoId = String(productoId)
    if (tipo) where.tipo = String(tipo)
    if (ini || fin) {
      where.createdAt = {}
      if (ini) where.createdAt.gte = new Date(String(ini))
      if (fin) where.createdAt.lte = new Date(String(fin))
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoInventario.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
        },
      }),
      prisma.movimientoInventario.count({ where }),
    ])

    res.json({ data: movimientos, total, page: Number(page), limit: Number(limit) })
  } catch (e) { next(e) }
})

const movimientoSchema = z.object({
  productoId: z.string().uuid(),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
  cantidad: z.number().int().positive(),
  motivo: z.string().optional(),
  referencia: z.string().optional(),
  solicitudId: z.string().uuid().optional(),
  entregaId: z.string().uuid().optional(),
})

// POST /api/inventario/movimientos
inventarioRouter.post('/movimientos', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const body = movimientoSchema.parse(req.body)
    const result = await registrarMovimiento({
      ...body,
      usuarioId: (req as any).user.userId,
    })
    res.status(201).json({ data: result })
  } catch (e) { next(e) }
})

// ─── STOCK SUMMARY ───────────────────────────────────────────────────────────

// GET /api/inventario/stock
inventarioRouter.get('/stock', async (_req, res, next) => {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })

    const total = productos.length
    const sinStock = productos.filter(p => p.stockActual === 0).length
    const stockBajo = productos.filter(p => p.stockActual > 0 && p.stockActual <= p.stockMinimo && p.stockMinimo > 0).length
    const stockOk = total - sinStock - stockBajo

    // Categorías únicas
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))]

    // Últimos 5 movimientos
    const ultimosMovimientos = await prisma.movimientoInventario.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        producto: { select: { sku: true, nombre: true, unidad: true } },
      },
    })

    res.json({
      data: {
        resumen: { total, sinStock, stockBajo, stockOk },
        alertas: productos.filter(p => p.stockActual <= p.stockMinimo && p.stockMinimo > 0),
        categorias,
        ultimosMovimientos,
      },
    })
  } catch (e) { next(e) }
})

// ─── MOVIMIENTO DESDE ENTREGA (integración) ──────────────────────────────────

// POST /api/inventario/movimientos/desde-entrega
// Llamado desde el flujo de entregas para registrar salida de productos
inventarioRouter.post('/movimientos/desde-entrega', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    const schema = z.object({
      entregaId: z.string().uuid(),
      ot: z.string(),
      items: z.array(z.object({
        productoId: z.string().uuid(),
        cantidad: z.number().int().positive(),
      })),
    })
    const { entregaId, ot, items } = schema.parse(req.body)

    const resultados = []
    for (const item of items) {
      const r = await registrarMovimiento({
        productoId: item.productoId,
        tipo: 'SALIDA',
        cantidad: item.cantidad,
        motivo: `Salida por entrega ${ot}`,
        referencia: ot,
        entregaId,
        usuarioId: (req as any).user.userId,
      })
      resultados.push(r)
    }

    res.status(201).json({ data: resultados })
  } catch (e) { next(e) }
})
