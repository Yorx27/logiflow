import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { uploadFotos, getFileUrl, saveFirma } from '../middleware/upload'
import { emitEntregaActualizada, emitNotificacion, emitConductorEstado } from '../sockets/socketServer'

export const evidenciasRouter = Router()
evidenciasRouter.use(authenticate)

async function getOrCreateEvidencia(entregaId: string) {
  let ev = await prisma.evidencia.findUnique({ where: { entregaId } })
  if (!ev) ev = await prisma.evidencia.create({ data: { entregaId } })
  return ev
}

// GET /api/evidencias/:entregaId
evidenciasRouter.get('/:entregaId', async (req, res, next) => {
  try {
    const ev = await prisma.evidencia.findUnique({
      where: { entregaId: req.params.entregaId },
      include: { fotos: true },
    })
    res.json({ data: ev })
  } catch (e) { next(e) }
})

// POST /api/evidencias/:entregaId/check
evidenciasRouter.post('/:entregaId/check', async (req, res, next) => {
  try {
    const { tipo, timestamp } = z.object({
      tipo: z.enum(['llegada', 'contacto', 'descarga', 'conteo', 'condicion', 'remision', 'acuse']),
      timestamp: z.string().optional(),
    }).parse(req.body)

    const ts = timestamp ? new Date(timestamp) : new Date()
    const fieldMap: Record<string, string> = {
      llegada: 'checkLlegada', contacto: 'checkContacto', descarga: 'checkDescarga',
      conteo: 'checkConteo', condicion: 'checkCondicion', remision: 'checkRemision', acuse: 'checkAcuse',
    }
    await getOrCreateEvidencia(req.params.entregaId)
    const ev = await prisma.evidencia.update({
      where: { entregaId: req.params.entregaId },
      data: { [fieldMap[tipo]]: ts },
    })
    res.json({ data: ev })
  } catch (e) { next(e) }
})

// POST /api/evidencias/:entregaId/fotos
evidenciasRouter.post('/:entregaId/fotos', uploadFotos.array('fotos', 8), async (req, res, next) => {
  try {
    const { categoria } = z.object({
      categoria: z.enum(['DESCARGA', 'DOCUMENTOS']),
    }).parse(req.body)

    const files = req.files as Express.Multer.File[]
    if (!files?.length) throw new AppError('No se recibieron archivos', 400)

    await getOrCreateEvidencia(req.params.entregaId)
    const ev = await prisma.evidencia.findUnique({ where: { entregaId: req.params.entregaId } })

    const fotos = await Promise.all(
      files.map((f) =>
        prisma.fotoEvidencia.create({
          data: {
            evidenciaId: ev!.id,
            categoria,
            url: getFileUrl(f.filename),
            nombre: f.originalname,
          },
        }),
      ),
    )
    res.status(201).json({ data: fotos })
  } catch (e) { next(e) }
})

// POST /api/evidencias/:entregaId/firma
evidenciasRouter.post('/:entregaId/firma', async (req, res, next) => {
  try {
    const { firma } = z.object({ firma: z.string().min(1) }).parse(req.body)
    if (Buffer.from(firma, 'base64').length > 500 * 1024) {
      throw new AppError('La firma excede el tamaño máximo (500KB)', 400)
    }
    const url = saveFirma(firma)
    await getOrCreateEvidencia(req.params.entregaId)
    const ev = await prisma.evidencia.update({
      where: { entregaId: req.params.entregaId },
      data: { tieneFirma: true, firmaUrl: url },
    })
    res.json({ data: ev })
  } catch (e) { next(e) }
})

// PUT /api/evidencias/:entregaId/finalizar
evidenciasRouter.put('/:entregaId/finalizar', async (req, res, next) => {
  try {
    const { observaciones } = z.object({ observaciones: z.string().optional() }).parse(req.body)

    const entrega = await prisma.entrega.findUnique({
      where: { id: req.params.entregaId },
      include: { evidencia: true, solicitud: true },
    })
    if (!entrega) throw new AppError('Entrega no encontrada', 404)

    // validate required checks
    const ev = await prisma.evidencia.findUnique({ where: { entregaId: req.params.entregaId } })
    if (!ev?.checkLlegada) throw new AppError('Falta confirmar llegada', 400)
    if (!ev?.checkDescarga) throw new AppError('Falta confirmar descarga', 400)
    if (!ev?.checkRemision) throw new AppError('Falta confirmar remisión', 400)

    await prisma.evidencia.update({
      where: { entregaId: req.params.entregaId },
      data: { horaFinalizacion: new Date(), observaciones: observaciones || null },
    })

    await prisma.entrega.update({
      where: { id: req.params.entregaId },
      data: { estado: 'COMPLETADA' },
    })
    await prisma.solicitud.update({
      where: { id: entrega.solicitudId },
      data: { estado: 'COMPLETADA' },
    })

    if (entrega.conductorId) {
      await prisma.conductor.update({ where: { id: entrega.conductorId }, data: { estado: 'DISPONIBLE' } })
      emitConductorEstado({ conductorId: entrega.conductorId, estado: 'DISPONIBLE' })
    }
    if (entrega.vehiculoId) {
      await prisma.vehiculo.update({ where: { id: entrega.vehiculoId }, data: { estado: 'DISPONIBLE' } })
    }

    emitEntregaActualizada({ entregaId: entrega.id, estado: 'COMPLETADA', conductorId: entrega.conductorId })
    emitNotificacion({
      mensaje: `Entrega ${entrega.solicitud.ot} completada exitosamente`,
      tipo: 'SUCCESS',
      conductorId: entrega.conductorId,
    })

    res.json({ data: { ok: true } })
  } catch (e) { next(e) }
})
