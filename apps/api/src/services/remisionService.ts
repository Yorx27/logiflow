import ExcelJS from 'exceljs'
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
  remisionNumero: string       // ej: ML-240
  fecha: Date
  clienteNombre: string
  rfcCliente?: string
  ordenCompra?: string
  items: ItemRemision[]
  observaciones?: string
}

const LOGO_PATH = path.resolve(__dirname, '../assets/logo_aleska.jpeg')
const EMPRESA   = 'ALESKA TIER S. DE R.L. DE C.V.'
const RFC_EMPRESA = 'RFC: CAT150918IZ8'

// ── helpers ──────────────────────────────────────────────────────────────────

function applyMediumBorder(cell: ExcelJS.Cell, sides: ('top'|'bottom'|'left'|'right')[]) {
  const border: any = { ...cell.border }
  sides.forEach(s => { border[s] = { style: 'medium' } })
  cell.border = border
}

function blackHeader(ws: ExcelJS.Worksheet, row: number, col: number) {
  const cell = ws.getCell(row, col)
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }
  cell.font = { name: 'Arial', size: 12, bold: true, italic: true, color: { argb: 'FFFFFFFF' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
}

function mergeAndSet(
  ws: ExcelJS.Worksheet,
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  value: any,
  opts: Partial<{ font: Partial<ExcelJS.Font>; alignment: Partial<ExcelJS.Alignment>; numFmt: string }>  = {}
) {
  ws.mergeCells(startRow, startCol, endRow, endCol)
  const cell = ws.getCell(startRow, startCol)
  cell.value = value
  if (opts.font) cell.font = opts.font as ExcelJS.Font
  if (opts.alignment) cell.alignment = opts.alignment as ExcelJS.Alignment
  if (opts.numFmt) cell.numFmt = opts.numFmt
  return cell
}

// ── single copy builder ───────────────────────────────────────────────────────

function buildCopy(
  ws: ExcelJS.Worksheet,
  base: number,               // row offset (0 for top, 25 for bottom)
  data: RemisionData,
  copyType: 'ENTREGADO' | 'SOLICITADO'
) {
  const r = (n: number) => base + n   // absolute row

  // ── Title  (col G–I, rows 1–2) ──────────────────────────────────────────
  mergeAndSet(ws, r(1), 7, r(2), 9, `REMISION   ${data.remisionNumero}`, {
    font: { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFFF0000' } },
    alignment: { horizontal: 'right', vertical: 'bottom' },
  })
  ws.getCell(r(2), 7).border = { bottom: { style: 'medium' } }

  // ── Company name (row 4, col C–I) ────────────────────────────────────────
  mergeAndSet(ws, r(4), 3, r(4), 9, `                ${EMPRESA}`, {
    font: { name: 'Calibri', size: 28, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })
  ws.getRow(r(4)).height = 36.75
  applyMediumBorder(ws.getCell(r(4), 9), ['right'])

  // ── RFC empresa (rows 6–7, cols E–H) ────────────────────────────────────
  mergeAndSet(ws, r(6), 5, r(7), 8, RFC_EMPRESA, {
    font: { name: 'Calibri', size: 18, bold: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
  })

  // ── Outer border (rows 3–22, cols B & I as left/right rails) ────────────
  for (let row = r(3); row <= r(22); row++) {
    applyMediumBorder(ws.getCell(row, 2), ['left'])
    applyMediumBorder(ws.getCell(row, 9), ['right'])
  }
  // top & bottom rail
  for (let col = 2; col <= 9; col++) {
    applyMediumBorder(ws.getCell(r(3), col), ['top'])
    applyMediumBorder(ws.getCell(r(22), col), ['bottom'])
  }

  // ── Recipient section (rows 10–13) ──────────────────────────────────────
  ws.getRow(r(10)).height = 24
  const lblCell = ws.getCell(r(10), 3)
  lblCell.value = 'REMITIDO A: '
  lblCell.font  = { name: 'Calibri', size: 14 }

  const fechaLbl = ws.getCell(r(10), 7)
  fechaLbl.value = 'FECHA: '
  fechaLbl.font  = { name: 'Calibri', size: 14 }
  fechaLbl.alignment = { horizontal: 'right' }

  const fechaCell = ws.getCell(r(10), 8)
  fechaCell.value  = data.fecha
  fechaCell.numFmt = 'DD/MM/YYYY'
  fechaCell.font   = { name: 'Calibri', size: 16, bold: true }
  fechaCell.alignment = { horizontal: 'center' }

  const clienteCell = ws.getCell(r(11), 3)
  clienteCell.value = data.clienteNombre
  clienteCell.font  = { name: 'Calibri', size: 14, bold: true }

  // RFC cliente
  ws.getRow(r(13)).height = 24
  ws.getCell(r(13), 3).value = 'RFC :'
  ws.getCell(r(13), 3).font  = { name: 'Calibri', size: 16 }
  ws.getCell(r(13), 3).alignment = { horizontal: 'center' }

  mergeAndSet(ws, r(13), 4, r(13), 5, data.rfcCliente || '', {
    font: { name: 'Arial', size: 14, bold: true, italic: true },
    alignment: { horizontal: 'left' },
  })

  mergeAndSet(ws, r(13), 6, r(13), 7, ' ORDEN DE COMPRA:', {
    font: { name: 'Calibri', size: 14 },
    alignment: { horizontal: 'right' },
  })

  ws.getCell(r(13), 8).value = data.ordenCompra || 'PENDIENTE'
  ws.getCell(r(13), 8).font  = { name: 'Calibri', size: 14, bold: true }
  ws.getCell(r(13), 8).alignment = { horizontal: 'center' }

  // ── Table headers (row 16) ───────────────────────────────────────────────
  ws.getRow(r(16)).height = 24.75

  ws.mergeCells(r(16), 3, r(16), 4)
  blackHeader(ws, r(16), 3)
  ws.getCell(r(16), 3).value = 'PARTIDA'
  applyMediumBorder(ws.getCell(r(16), 3), ['top', 'left'])

  ws.mergeCells(r(16), 5, r(16), 6)
  blackHeader(ws, r(16), 5)
  ws.getCell(r(16), 5).value = 'DESCRIPCIÓN'
  applyMediumBorder(ws.getCell(r(16), 5), ['top'])

  blackHeader(ws, r(16), 7)
  ws.getCell(r(16), 7).value = 'UNIDAD'
  applyMediumBorder(ws.getCell(r(16), 7), ['top'])

  blackHeader(ws, r(16), 8)
  ws.getCell(r(16), 8).value = copyType
  applyMediumBorder(ws.getCell(r(16), 8), ['top', 'right'])

  // ── Data rows (starting at row 18) ──────────────────────────────────────
  let dataRow = r(18)
  data.items.forEach((item, idx) => {
    ws.getRow(dataRow).height = 24.95

    ws.mergeCells(dataRow, 3, dataRow, 4)
    ws.getCell(dataRow, 3).value = item.partida
    ws.getCell(dataRow, 3).font  = { name: 'Arial', size: 12 }
    ws.getCell(dataRow, 3).alignment = { horizontal: 'center', vertical: 'middle' }
    applyMediumBorder(ws.getCell(dataRow, 3), ['left'])

    ws.mergeCells(dataRow, 5, dataRow, 6)
    ws.getCell(dataRow, 5).value = item.descripcion
    ws.getCell(dataRow, 5).font  = { name: 'Arial', size: 12 }
    ws.getCell(dataRow, 5).alignment = { horizontal: 'center', vertical: 'middle' }

    ws.getCell(dataRow, 7).value = item.unidad
    ws.getCell(dataRow, 7).font  = { name: 'Arial', size: 12 }
    ws.getCell(dataRow, 7).alignment = { horizontal: 'center', vertical: 'middle' }

    const qty = copyType === 'ENTREGADO' ? item.cantidadEntregada : item.cantidadSolicitada
    ws.getCell(dataRow, 8).value = qty
    ws.getCell(dataRow, 8).font  = { name: 'Arial', size: 12 }
    ws.getCell(dataRow, 8).alignment = { horizontal: 'center', vertical: 'middle' }
    applyMediumBorder(ws.getCell(dataRow, 8), ['right'])

    dataRow++
  })

  // ── OBS row ──────────────────────────────────────────────────────────────
  if (data.observaciones) {
    ws.getRow(dataRow).height = 24.95
    ws.mergeCells(dataRow, 3, dataRow, 4)
    ws.getCell(dataRow, 3).value = 'OBS:'
    ws.getCell(dataRow, 3).font  = { name: 'Arial', size: 12 }
    ws.getCell(dataRow, 3).alignment = { horizontal: 'center' }
    applyMediumBorder(ws.getCell(dataRow, 3), ['left'])

    ws.mergeCells(dataRow, 5, dataRow, 6)
    ws.getCell(dataRow, 5).value = data.observaciones
    ws.getCell(dataRow, 5).font  = { name: 'Arial', size: 10 }
    ws.getCell(dataRow, 5).alignment = { horizontal: 'center', wrapText: true }

    applyMediumBorder(ws.getCell(dataRow, 8), ['right'])
    dataRow++
  }

  // ── Bottom border for table + outer box ─────────────────────────────────
  for (let col = 3; col <= 8; col++) {
    applyMediumBorder(ws.getCell(dataRow, col), ['bottom'])
  }
  for (let col = 2; col <= 9; col++) {
    applyMediumBorder(ws.getCell(dataRow + 1, col), ['bottom'])
  }

  // ── Logo image ───────────────────────────────────────────────────────────
  if (fs.existsSync(LOGO_PATH)) {
    const logoId = ws.workbook.addImage({ filename: LOGO_PATH, extension: 'jpeg' })
    ws.addImage(logoId, {
      tl: { col: 1.1, row: r(3) - 0.5 },
      ext: { width: 170, height: 112 },
    })
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generarRemision(data: RemisionData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Remisión', {
    pageSetup: { orientation: 'portrait', printArea: 'B2:I48' },
    views: [{ showGridLines: false }],
  })

  // Column widths (B=2 … I=9)
  ws.getColumn(1).width = 11.43   // A
  ws.getColumn(2).width = 4.30    // B
  ws.getColumn(3).width = 11.43   // C
  ws.getColumn(4).width = 10.36   // D
  ws.getColumn(5).width = 18.02   // E
  ws.getColumn(6).width = 30.40   // F
  ws.getColumn(7).width = 23.68   // G
  ws.getColumn(8).width = 27.57   // H
  ws.getColumn(9).width = 3.63    // I

  // Top copy: ENTREGADO
  buildCopy(ws, 1, data, 'ENTREGADO')

  // Cut line (row 25)
  for (let col = 2; col <= 9; col++) {
    ws.getCell(25, col).border = { bottom: { style: 'mediumDashed' } }
  }

  // Bottom copy: SOLICITADO (offset 25 rows)
  buildCopy(ws, 26, data, 'SOLICITADO')

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

// ── Save to disk ─────────────────────────────────────────────────────────────

export async function guardarRemision(data: RemisionData, uploadDir: string): Promise<string> {
  const dir = path.join(uploadDir, 'remisiones')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filename = `remision_${data.remisionNumero.replace(/\s/g, '_')}_${Date.now()}.xlsx`
  const filepath = path.join(dir, filename)

  const buf = await generarRemision(data)
  fs.writeFileSync(filepath, buf)

  return `/uploads/remisiones/${filename}`
}
