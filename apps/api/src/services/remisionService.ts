import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

export interface ItemRemision {
  partida: number
  descripcion: string
  unidad: string
  cantidadSolicitada: number
  cantidadEntregada: number
}

export interface RemisionData {
  remisionNumero: string
  fecha: Date
  clienteNombre: string
  rfcCliente?: string
  ordenCompra?: string
  folioCandado?: string
  items: ItemRemision[]
  observaciones?: string
}

const LOGO_PATH = path.resolve(__dirname, '../assets/logo_aleska.jpeg')
const EMPRESA    = 'ALESKA TIER S. DE R.L. DE C.V.'
const RFC_EMPRESA = 'RFC: CAT150918IZ8'

// ── Draw one copy (ENTREGADO or SOLICITADO) ───────────────────────────────────

function drawCopy(
  doc: PDFKit.PDFDocument,
  data: RemisionData,
  copyType: 'ENTREGADO' | 'SOLICITADO',
  startY: number
): number {
  const L  = 40           // left margin
  const R  = 572          // right margin
  const W  = R - L        // content width
  let y    = startY

  // ── Header ──────────────────────────────────────────────────────────────
  const headerH = 72
  doc.rect(L, y, W, headerH).stroke('#000000')

  if (fs.existsSync(LOGO_PATH)) {
    try { doc.image(LOGO_PATH, L + 4, y + 4, { height: 64 }) } catch {}
  }

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
     .text(EMPRESA, L + 95, y + 10, { width: W - 200, lineBreak: false })
  doc.fontSize(9).font('Helvetica')
     .text(RFC_EMPRESA, L + 95, y + 32, { width: W - 200, lineBreak: false })
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#CC0000')
     .text(`REMISION  ${data.remisionNumero}`, L + 95, y + 52, { width: W - 100, align: 'right', lineBreak: false })
  doc.fillColor('#000000')
  y += headerH + 2

  // ── Copy type banner ─────────────────────────────────────────────────────
  doc.rect(L, y, W, 16).fill('#1C1C1C').stroke('#000000')
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
     .text(copyType, L, y + 4, { width: W, align: 'center', lineBreak: false })
  doc.fillColor('#000000')
  y += 18

  // ── Client section ───────────────────────────────────────────────────────
  doc.rect(L, y, W, 42).stroke()
  doc.fontSize(7).font('Helvetica').fillColor('#666666')
     .text('REMITIDO A:', L + 5, y + 5, { lineBreak: false })
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
     .text(data.clienteNombre, L + 5, y + 16, { width: W * 0.62, lineBreak: false })
  doc.fontSize(7).font('Helvetica').fillColor('#666666')
     .text('FECHA:', R - 110, y + 5, { lineBreak: false })
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
     .text(data.fecha.toLocaleDateString('es-MX'), R - 110, y + 16, { width: 100, lineBreak: false })
  y += 44

  // ── RFC / Order row ──────────────────────────────────────────────────────
  const rfcRowH = data.folioCandado ? 22 : 22
  doc.rect(L, y, W, rfcRowH).stroke()

  doc.fontSize(7).font('Helvetica').fillColor('#666666')
     .text('RFC:', L + 5, y + 7, { lineBreak: false })
  doc.font('Helvetica-Bold').fillColor('#000000')
     .text(data.rfcCliente || '—', L + 25, y + 7, { width: W * 0.22, lineBreak: false })

  doc.font('Helvetica').fillColor('#666666')
     .text('ORD. COMPRA:', L + W * 0.38, y + 7, { lineBreak: false })
  doc.font('Helvetica-Bold').fillColor('#000000')
     .text(data.ordenCompra || 'PENDIENTE', L + W * 0.54, y + 7, { width: W * 0.2, lineBreak: false })

  if (data.folioCandado) {
    doc.font('Helvetica').fillColor('#666666')
       .text('FOLIO CANDADO:', L + W * 0.72, y + 7, { lineBreak: false })
    doc.font('Helvetica-Bold').fillColor('#000000')
       .text(data.folioCandado, L + W * 0.9, y + 7, { width: W * 0.1, lineBreak: false })
  }
  y += rfcRowH + 2

  // ── Table header ─────────────────────────────────────────────────────────
  const c1 = L            // PARTIDA
  const c2 = L + 52       // DESCRIPCIÓN
  const c3 = L + W * 0.70 // UNIDAD
  const c4 = L + W * 0.84 // CANTIDAD

  doc.rect(L, y, W, 17).fill('#111111').stroke()
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF')
  doc.text('PARTIDA',   c1,      y + 5, { width: 52,          align: 'center', lineBreak: false })
  doc.text('DESCRIPCIÓN', c2,    y + 5, { width: W * 0.70 - 52, align: 'center', lineBreak: false })
  doc.text('UNIDAD',    c3,      y + 5, { width: W * 0.14,    align: 'center', lineBreak: false })
  doc.text(copyType,    c4,      y + 5, { width: W * 0.16 - 2, align: 'center', lineBreak: false })
  doc.fillColor('#000000')
  y += 19

  // ── Data rows ────────────────────────────────────────────────────────────
  const rowH = 16
  data.items.forEach((item) => {
    doc.rect(L, y, W, rowH).stroke()
    doc.moveTo(c2, y).lineTo(c2, y + rowH).stroke()
    doc.moveTo(c3, y).lineTo(c3, y + rowH).stroke()
    doc.moveTo(c4, y).lineTo(c4, y + rowH).stroke()

    doc.fontSize(8).font('Helvetica').fillColor('#000000')
    doc.text(String(item.partida), c1, y + 4,     { width: 52,            align: 'center', lineBreak: false })
    doc.text(item.descripcion,     c2 + 4, y + 4, { width: W * 0.7 - 60,  lineBreak: false })
    doc.text(item.unidad,          c3 + 3, y + 4, { width: W * 0.14 - 6,  align: 'center', lineBreak: false })
    const qty = copyType === 'ENTREGADO' ? item.cantidadEntregada : item.cantidadSolicitada
    doc.text(String(qty),          c4 + 3, y + 4, { width: W * 0.16 - 8,  align: 'center', lineBreak: false })
    y += rowH
  })

  // ── Observaciones ────────────────────────────────────────────────────────
  if (data.observaciones) {
    doc.rect(L, y, W, 20).stroke()
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000000')
       .text('OBS:', L + 5, y + 6, { lineBreak: false })
    doc.font('Helvetica')
       .text(data.observaciones, L + 32, y + 6, { width: W - 42, lineBreak: false })
    y += 22
  }

  // ── Signature area ────────────────────────────────────────────────────────
  doc.rect(L, y, W, 32).stroke()
  doc.moveTo(L + W / 2, y).lineTo(L + W / 2, y + 32).stroke()
  doc.fontSize(7).font('Helvetica').fillColor('#888888')
     .text('Firma y sello de recibido:', L + 5, y + 5, { lineBreak: false })
     .text('Nombre completo:', L + W / 2 + 5, y + 5, { lineBreak: false })
  y += 34

  return y
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generarRemision(data: RemisionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new (PDFDocument as any)({
      margin: 0,
      size: 'LETTER',
      info: { Title: `Remisión ${data.remisionNumero}`, Author: EMPRESA },
    })

    const chunks: Buffer[] = []
    doc.on('data',  (c: Buffer) => chunks.push(c))
    doc.on('end',   () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Copy 1 — ENTREGADO
    const y1 = drawCopy(doc, data, 'ENTREGADO', 20)

    // Dashed cut line
    const cutY = y1 + 8
    doc.dash(4, { space: 4 })
       .moveTo(40, cutY).lineTo(572, cutY).stroke('#999999')
       .undash()

    // Copy 2 — SOLICITADO
    drawCopy(doc, data, 'SOLICITADO', cutY + 12)

    doc.end()
  })
}

export async function guardarRemision(data: RemisionData, uploadDir: string): Promise<string> {
  const dir = path.join(uploadDir, 'remisiones')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filename = `remision_${data.remisionNumero.replace(/[\s/]/g, '_')}_${Date.now()}.pdf`
  const filepath  = path.join(dir, filename)

  const buf = await generarRemision(data)
  fs.writeFileSync(filepath, buf)

  return `/uploads/remisiones/${filename}`
}
