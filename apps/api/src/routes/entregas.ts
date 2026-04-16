import { Router } from 'express'
import { z } from 'zod'
import path from 'path'
import { prisma } from '../utils/prisma'
import { authenticate, requireRol } from '../middleware/auth'
import { uploadDocumentos } from '../middleware/upload'
import { AppError } from '../middleware/errorHandler'
import {
  emitEntregaActualizada,
  emitConductorEstado,
  emitNotificacion,
} from '../sockets/socketServer'
import { guardarRemision } from '../services/remisionService'

export const entregasRouter = Router()
entregasRouter.use(authenticate)

const uploadDir = process.env.UPLOAD_DIR || './uploads'

// ─── GET /api/entregas ────────────────────────────────────────────────────────
entregasRouter.get('/', async (req, res, next) => {
  try {
    const { estado, conductorId, ini, fin } = req.query
    const where: any = {}
    if (estado) where.estado = estado
    if (conductorId) where.conductorId = String(conductorId)
    if (ini || fin) {
      where.createdAt = {}
      if (ini) where.createdAt.gte = new Date(String(ini))
      if (fin) where.createdAt.lte = new Date(String(fin))
    }
    const data = await prisma.entrega.findMany({
      where,
      include: {
        solicitud: true,
        conductor: true,
        vehiculo: true,
        evidencia: { include: { fotos: true } },
        documentos: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})

// ─── GET /api/entregas/:id ────────────────────────────────────────────────────
entregasRouter.get('/:id', async (req, res, next) => {
  try {
    const entrega = await prisma.entrega.findUnique({
      where: { id: req.params.id },
      include: {
        solicitud: true,
        conductor: true,
        vehiculo: true,
        evidencia: { include: { fotos: true } },
        documentos: true,
      },
    })
    if (!entrega) throw new AppError('Entrega no encontrada', 404)
    res.json({ data: entrega })
  } catch (e) { next(e) }
})

// ─── PUT /api/entregas/:id/asignar ────────────────────────────────────────────
entregasRouter.put('/:id/asignar', async (req, res, next) => {
  try {
    const { conductorId, vehiculoId } = z.object({
      conductorId: z.string(),
      vehiculoId: z.string(),
    }).parse(req.body)

    const cond = await prisma.conductor.findUnique({ where: { id: conductorId } })
    if (!cond || cond.estado !== 'DISPONIBLE') throw new AppError('Conductor no disponible', 400)
    const veh = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } })
    if (!veh || veh.estado !== 'DISPONIBLE') throw new AppError('Vehículo no disponible', 400)

    const entrega = await prisma.entrega.update({
      where: { id: req.params.id },
      data: { conductorId, vehiculoId, estado: 'ASIGNADA', subEstado: 'EN_RUTA' },
      include: { solicitud: true, conductor: true, vehiculo: true },
    })

    await Promise.all([
      prisma.conductor.update({ where: { id: conductorId }, data: { estado: 'EN_RUTA' } }),
      prisma.vehiculo.update({ where: { id: vehiculoId }, data: { estado: 'EN_RUTA' } }),
      prisma.solicitud.update({ where: { id: entrega.solicitudId }, data: { estado: 'ASIGNADA' } }),
    ])

    // ── Generar remisión automáticamente ──────────────────────────────────
    try {
      const sol = entrega.solicitud as any
      const items = Array.isArray(sol.itemsRemision) && sol.itemsRemision.length > 0
        ? sol.itemsRemision
        : [{
            partida: 1,
            descripcion: sol.descripcionCarga || 'CARGA GENERAL',
            unidad: 'PIEZAS',
            cantidadSolicitada: sol.cantidad || 1,
            cantidadEntregada: sol.cantidad || 1,
          }]

      const remisionUrl = await guardarRemision({
        remisionNumero: sol.ot.replace('OT-', 'ML-'),
        fecha: sol.fechaEntrega ? new Date(sol.fechaEntrega) : new Date(),
        clienteNombre: sol.cliente,
        rfcCliente: sol.rfcCliente || undefined,
        ordenCompra: sol.ordenCompra || undefined,
        folioCandado: sol.folioCandado || undefined,
        items,
        observaciones: sol.observaciones || undefined,
      }, path.resolve(uploadDir))

      await prisma.entrega.update({
        where: { id: entrega.id },
        data: { remisionUrl },
      })
      entrega.solicitud = { ...entrega.solicitud, remisionUrl } as any
    } catch (err) {
      console.error('[Remisión] Error generando remisión:', err)
      // No bloquear la asignación si falla la generación
    }

    emitEntregaActualizada({ entregaId: entrega.id, estado: entrega.estado, subEstado: 'EN_RUTA', conductorId })
    emitConductorEstado({ conductorId, estado: 'EN_RUTA' })
    emitNotificacion({
      mensaje: `Entrega ${entrega.solicitud.ot} asignada a ${cond.nombre}`,
      tipo: 'INFO',
      conductorId,
    })

    res.json({ data: entrega })
  } catch (e) { next(e) }
})

// ─── PUT /api/entregas/:id/subestado ─────────────────────────────────────────
// Conductor actualiza su actividad actual
entregasRouter.put('/:id/subestado', async (req, res, next) => {
  try {
    const { subEstado } = z.object({
      subEstado: z.enum(['EN_RUTA', 'EN_ESPERA', 'DESCARGA', 'ENTREGA_DOCUMENTOS', 'COMPLETADO']),
    }).parse(req.body)

    const entrega = await prisma.entrega.update({
      where: { id: req.params.id },
      data: { subEstado },
      include: { solicitud: true, conductor: true },
    })

    // Si llega a COMPLETADO desde el conductor, se marca como COMPLETADA
    if (subEstado === 'COMPLETADO') {
      await prisma.solicitud.update({ where: { id: entrega.solicitudId }, data: { estado: 'COMPLETADA' } })
      await prisma.entrega.update({ where: { id: entrega.id }, data: { estado: 'COMPLETADA' } })
      if (entrega.conductorId) {
        await prisma.conductor.update({ where: { id: entrega.conductorId }, data: { estado: 'DISPONIBLE' } })
        emitConductorEstado({ conductorId: entrega.conductorId, estado: 'DISPONIBLE' })
      }
    }

    emitEntregaActualizada({
      entregaId: entrega.id,
      estado: entrega.estado,
      subEstado,
      conductorId: entrega.conductorId,
    })

    const etiquetas: Record<string, string> = {
      EN_RUTA: 'en ruta',
      EN_ESPERA: 'en espera de entrega',
      DESCARGA: 'en proceso de descarga',
      ENTREGA_DOCUMENTOS: 'entregando documentos',
      COMPLETADO: 'completada',
    }
    emitNotificacion({
      mensaje: `${entrega.solicitud.ot}: conductor ${etiquetas[subEstado]}`,
      tipo: subEstado === 'COMPLETADO' ? 'SUCCESS' : 'INFO',
      conductorId: entrega.conductorId,
    })

    res.json({ data: entrega })
  } catch (e) { next(e) }
})

// ─── PUT /api/entregas/:id/estado ────────────────────────────────────────────
entregasRouter.put('/:id/estado', async (req, res, next) => {
  try {
    const { estado, motivo } = z.object({
      estado: z.enum(['EN_RUTA', 'COMPLETADA', 'RECHAZADA', 'INCIDENCIA']),
      motivo: z.string().optional().nullable(),
    }).parse(req.body)

    if ((estado === 'RECHAZADA' || estado === 'INCIDENCIA') && !motivo) {
      throw new AppError('El motivo es obligatorio para rechazo e incidencia', 400)
    }

    const entrega = await prisma.entrega.update({
      where: { id: req.params.id },
      data: { estado, motivo: motivo || null },
      include: { solicitud: true, conductor: true, vehiculo: true },
    })

    await prisma.solicitud.update({ where: { id: entrega.solicitudId }, data: { estado } })

    if (estado === 'COMPLETADA' || estado === 'RECHAZADA') {
      if (entrega.conductorId) {
        await prisma.conductor.update({ where: { id: entrega.conductorId }, data: { estado: 'DISPONIBLE' } })
        emitConductorEstado({ conductorId: entrega.conductorId, estado: 'DISPONIBLE' })
      }
      if (entrega.vehiculoId) {
        await prisma.vehiculo.update({ where: { id: entrega.vehiculoId }, data: { estado: 'DISPONIBLE' } })
      }
    }

    emitEntregaActualizada({ entregaId: entrega.id, estado, conductorId: entrega.conductorId })

    const tipoNotif = estado === 'COMPLETADA' ? 'SUCCESS' : estado === 'RECHAZADA' ? 'ERROR' : 'WARNING'
    emitNotificacion({
      mensaje: `Entrega ${entrega.solicitud.ot} → ${estado}${motivo ? `: ${motivo}` : ''}`,
      tipo: tipoNotif,
      conductorId: entrega.conductorId,
    })

    res.json({ data: entrega })
  } catch (e) { next(e) }
})

// ─── GET /api/entregas/:id/remision ──────────────────────────────────────────
// Descarga la remisión en Excel
entregasRouter.get('/:id/remision', async (req, res, next) => {
  try {
    const entrega = await prisma.entrega.findUnique({
      where: { id: req.params.id },
      include: { solicitud: true },
    })
    if (!entrega) throw new AppError('Entrega no encontrada', 404)

    // Si ya existe archivo generado, devolverlo
    if (entrega.remisionUrl) {
      const filePath = path.resolve(uploadDir, entrega.remisionUrl.replace('/uploads/', ''))
      if (require('fs').existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="remision_${entrega.solicitud.ot}.pdf"`)
        return res.sendFile(filePath)
      }
    }

    // Generar on-the-fly si no existe
    const { generarRemision } = await import('../services/remisionService')
    const sol = entrega.solicitud as any
    const items = Array.isArray(sol.itemsRemision) && sol.itemsRemision.length > 0
      ? sol.itemsRemision
      : [{ partida: 1, descripcion: sol.descripcionCarga || 'CARGA GENERAL', unidad: 'PIEZAS', cantidadSolicitada: sol.cantidad || 1, cantidadEntregada: sol.cantidad || 1 }]

    const buf = await generarRemision({
      remisionNumero: sol.ot.replace('OT-', 'ML-'),
      fecha: sol.fechaEntrega ? new Date(sol.fechaEntrega) : new Date(),
      clienteNombre: sol.cliente,
      rfcCliente: sol.rfcCliente || undefined,
      ordenCompra: sol.ordenCompra || undefined,
      folioCandado: sol.folioCandado || undefined,
      items,
      observaciones: sol.observaciones || undefined,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="remision_${sol.ot}.pdf"`)
    res.send(buf)
  } catch (e) { next(e) }
})

// ─── POST /api/entregas/:id/documentos ───────────────────────────────────────
// Conductor adjunta archivos en estado ENTREGA_DOCUMENTOS
entregasRouter.post(
  '/:id/documentos',
  uploadDocumentos.array('archivos', 10),
  async (req, res, next) => {
    try {
      const entrega = await prisma.entrega.findUnique({ where: { id: req.params.id } })
      if (!entrega) throw new AppError('Entrega no encontrada', 404)

      const files = (req.files as Express.Multer.File[]) || []
      if (files.length === 0) throw new AppError('No se recibieron archivos', 400)

      const docs = await prisma.$transaction(
        files.map(f =>
          prisma.documentoEntrega.create({
            data: {
              entregaId: entrega.id,
              nombre: f.originalname,
              url: `/uploads/documentos/${f.filename}`,
              tipo: f.mimetype,
              subidoPor: (req as any).user.userId,
            },
          })
        )
      )

      emitEntregaActualizada({
        entregaId: entrega.id,
        estado: entrega.estado,
        subEstado: entrega.subEstado,
        conductorId: entrega.conductorId,
        documentosCount: docs.length,
      })

      res.status(201).json({ data: docs })
    } catch (e) { next(e) }
  }
)

// ─── DELETE /api/entregas/:id/documentos/:docId ───────────────────────────────
entregasRouter.delete('/:id/documentos/:docId', requireRol('ADMIN', 'OPERADOR'), async (req, res, next) => {
  try {
    await prisma.documentoEntrega.delete({ where: { id: req.params.docId } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})
