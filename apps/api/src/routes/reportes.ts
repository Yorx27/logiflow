import { Router } from 'express'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'

export const reportesRouter = Router()
reportesRouter.use(authenticate)

function rangeWhere(ini?: string, fin?: string) {
  const where: any = {}
  if (ini || fin) {
    where.createdAt = {}
    if (ini) where.createdAt.gte = new Date(String(ini))
    if (fin) where.createdAt.lte = new Date(String(fin))
  }
  return where
}

reportesRouter.get('/solicitudes', async (req, res, next) => {
  try {
    const { ini, fin, tipo } = req.query
    const where: any = { deletedAt: null, ...rangeWhere(ini as string, fin as string) }
    if (tipo) where.tipo = tipo
    const rows = await prisma.solicitud.groupBy({
      by: ['estado'],
      where,
      _count: { _all: true },
    })
    const total = rows.reduce((s, r) => s + r._count._all, 0)
    const data = rows.map((r) => ({
      label: r.estado,
      value: r._count._all,
      extra: total ? `${Math.round((r._count._all / total) * 100)}%` : '0%',
    }))
    res.json({ data })
  } catch (e) { next(e) }
})

reportesRouter.get('/conductores', async (req, res, next) => {
  try {
    const conductores = await prisma.conductor.findMany({ include: { _count: { select: { entregas: true } } } })
    const data = await Promise.all(
      conductores.map(async (c) => {
        const completadas = await prisma.entrega.count({ where: { conductorId: c.id, estado: 'COMPLETADA' } })
        const incidencias = await prisma.entrega.count({ where: { conductorId: c.id, estado: 'INCIDENCIA' } })
        const total = c._count.entregas
        const tasa = total ? Math.round((completadas / total) * 100) : 0
        return { label: c.nombre, value: completadas, extra: `${tasa}% éxito | ${incidencias} inc.` }
      }),
    )
    res.json({ data })
  } catch (e) { next(e) }
})

reportesRouter.get('/facturacion', async (req, res, next) => {
  try {
    const { ini, fin } = req.query
    const where: any = rangeWhere(ini as string, fin as string)
    const facturas = await prisma.factura.findMany({ where })
    const data = facturas.map((f) => ({
      label: f.numero,
      value: f.subtotal + f.subtotal * 0.16 + f.gastosAdic,
      extra: f.estado,
    }))
    const total = data.reduce((s, r) => s + r.value, 0)
    res.json({ data, total: Math.round(total * 100) / 100 })
  } catch (e) { next(e) }
})

reportesRouter.get('/incidencias', async (req, res, next) => {
  try {
    const { ini, fin } = req.query
    const where: any = { estado: 'INCIDENCIA', deletedAt: null, ...rangeWhere(ini as string, fin as string) }
    const sols = await prisma.solicitud.findMany({
      where,
      include: { entrega: true },
    })
    const data = sols.map((s) => ({
      label: s.ot,
      value: 1,
      extra: `${s.cliente} — ${s.entrega?.motivo || 'Sin motivo'}`,
    }))
    res.json({ data })
  } catch (e) { next(e) }
})

reportesRouter.get('/export/excel', async (req, res, next) => {
  try {
    const { tipo, ini, fin } = req.query
    const where: any = { deletedAt: null, ...rangeWhere(ini as string, fin as string) }
    if (tipo) where.tipo = tipo
    const solicitudes = await prisma.solicitud.findMany({
      where,
      include: { entrega: { include: { conductor: true, vehiculo: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'LogiFlow'
    const ws = wb.addWorksheet('Solicitudes')
    ws.columns = [
      { header: 'OT', key: 'ot', width: 18 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Entrega', key: 'fechaEntrega', width: 18 },
      { header: 'Km', key: 'distanciaKm', width: 10 },
      { header: 'Tiempo', key: 'tiempoRuta', width: 12 },
      { header: 'Costo', key: 'costo', width: 14 },
      { header: 'Conductor', key: 'conductor', width: 22 },
      { header: 'Vehículo', key: 'vehiculo', width: 16 },
    ]
    ws.getRow(1).font = { bold: true }

    for (const s of solicitudes) {
      ws.addRow({
        ot: s.ot, cliente: s.cliente, tipo: s.tipo, estado: s.estado,
        fechaEntrega: s.fechaEntrega ? new Date(s.fechaEntrega).toLocaleDateString('es-MX') : '',
        distanciaKm: s.distanciaKm || '', tiempoRuta: s.tiempoRuta || '', costo: s.costo,
        conductor: s.entrega?.conductor?.nombre || '',
        vehiculo: s.entrega?.vehiculo?.placa || '',
      })
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-logiflow.xlsx"')
    await wb.xlsx.write(res)
    res.end()
  } catch (e) { next(e) }
})
