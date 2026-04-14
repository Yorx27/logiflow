import { Router } from 'express'
import { z } from 'zod'
import PDFDocument from 'pdfkit'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export const facturasRouter = Router()
facturasRouter.use(authenticate)

const facturaSchema = z.object({
  numero: z.string().min(1),
  cliente: z.string().min(1),
  solicitudId: z.string().optional().nullable(),
  subtotal: z.number().nonnegative(),
  gastosAdic: z.number().nonnegative().default(0),
  estado: z.enum(['BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA']).optional(),
  fecha: z.string().optional(),
})

facturasRouter.get('/', async (req, res, next) => {
  try {
    const { estado, ini, fin } = req.query
    const where: any = {}
    if (estado) where.estado = estado
    if (ini || fin) {
      where.fecha = {}
      if (ini) where.fecha.gte = new Date(String(ini))
      if (fin) where.fecha.lte = new Date(String(fin))
    }
    const data = await prisma.factura.findMany({
      where,
      include: { solicitud: { select: { ot: true, cliente: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (e) { next(e) }
})

facturasRouter.post('/', async (req, res, next) => {
  try {
    const body = facturaSchema.parse(req.body)
    const factura = await prisma.factura.create({ data: body as any })
    res.status(201).json({ data: factura })
  } catch (e) { next(e) }
})

facturasRouter.put('/:id/estado', async (req, res, next) => {
  try {
    const { estado } = z.object({
      estado: z.enum(['BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA']),
    }).parse(req.body)
    const factura = await prisma.factura.update({ where: { id: req.params.id }, data: { estado } })
    res.json({ data: factura })
  } catch (e) { next(e) }
})

facturasRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const factura = await prisma.factura.findUnique({
      where: { id: req.params.id },
      include: { solicitud: true },
    })
    if (!factura) throw new AppError('Factura no encontrada', 404)
    const cfg = await prisma.configuracion.findUnique({ where: { id: 'singleton' } })

    const iva = factura.subtotal * 0.16
    const total = factura.subtotal + iva + factura.gastosAdic

    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${factura.numero}.pdf"`)
    doc.pipe(res)

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(cfg?.empresa || 'LogiFlow S.A.', 50, 50)
    doc.fontSize(10).font('Helvetica').text(cfg?.direccion || '', 50, 80)
    doc.text(`Tel: ${cfg?.telefono || ''} | ${cfg?.email || ''}`, 50, 95)
    doc.moveTo(50, 115).lineTo(545, 115).stroke()

    // Invoice header
    doc.fontSize(18).font('Helvetica-Bold').text('FACTURA', 400, 50)
    doc.fontSize(10).font('Helvetica').text(`No: ${factura.numero}`, 400, 78)
    doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString('es-MX')}`, 400, 93)
    doc.text(`Estado: ${factura.estado}`, 400, 108)

    // Client
    doc.moveDown(2)
    doc.fontSize(11).font('Helvetica-Bold').text('CLIENTE')
    doc.fontSize(10).font('Helvetica').text(factura.cliente)
    if (factura.solicitud) doc.text(`OT: ${factura.solicitud.ot}`)

    // Table
    const tableTop = 220
    doc.moveTo(50, tableTop).lineTo(545, tableTop).stroke()
    doc.fontSize(10).font('Helvetica-Bold')
    doc.text('Concepto', 55, tableTop + 8)
    doc.text('Monto', 450, tableTop + 8, { width: 90, align: 'right' })
    doc.moveTo(50, tableTop + 25).lineTo(545, tableTop + 25).stroke()

    let y = tableTop + 35
    const rows = [
      ['Subtotal', `$${factura.subtotal.toFixed(2)}`],
      ['IVA 16%', `$${iva.toFixed(2)}`],
      ['Gastos adicionales', `$${factura.gastosAdic.toFixed(2)}`],
    ]
    doc.font('Helvetica')
    for (const [label, amount] of rows) {
      doc.text(label, 55, y)
      doc.text(amount, 450, y, { width: 90, align: 'right' })
      y += 20
    }
    doc.moveTo(50, y).lineTo(545, y).stroke()
    y += 10
    doc.font('Helvetica-Bold').text('TOTAL', 55, y)
    doc.text(`$${total.toFixed(2)} MXN`, 450, y, { width: 90, align: 'right' })

    doc.end()
  } catch (e) { next(e) }
})
