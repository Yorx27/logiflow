import { PrismaClient, Rol, EstadoCond, TipoVeh, EstadoVeh, TipoSol, EstadoSol, EstadoFact, TipoMovimiento, SubEstadoConductor } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding LogiFlow database...')

  // ─── Configuración ──────────────────────────────────────────────────────────
  await prisma.configuracion.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      costoEtiqueta: 5, costoTarima: 50, costoPapeleta: 2,
      costoCajaColectiva: 25, costoPlayo: 15, costoPoliBurbuja: 10,
      empresa: 'Aleska Logística S.A. de C.V.',
      email: 'admin@aleska.com',
      telefono: '+52 55 1234-5678',
      direccion: 'Av. Reforma 123, CDMX',
      latOrigen: 19.4326, lngOrigen: -99.1332,
    },
  })

  // ─── Conductores ────────────────────────────────────────────────────────────
  const cond1 = await prisma.conductor.upsert({
    where: { licencia: 'MX-001-2024' }, update: {},
    create: { nombre: 'Carlos Mendoza', telefono: '+52 55 1111-2222', licencia: 'MX-001-2024', estado: EstadoCond.DISPONIBLE },
  })
  const cond2 = await prisma.conductor.upsert({
    where: { licencia: 'MX-002-2024' }, update: {},
    create: { nombre: 'María González', telefono: '+52 55 3333-4444', licencia: 'MX-002-2024', estado: EstadoCond.EN_RUTA },
  })
  const cond3 = await prisma.conductor.upsert({
    where: { licencia: 'MX-003-2024' }, update: {},
    create: { nombre: 'Roberto Sánchez', telefono: '+52 55 5555-6666', licencia: 'MX-003-2024', estado: EstadoCond.DISPONIBLE },
  })

  // ─── Usuarios ───────────────────────────────────────────────────────────────
  const hashAdmin = await bcrypt.hash('admin123', 10)
  const hashOp    = await bcrypt.hash('operador123', 10)
  const hashCond  = await bcrypt.hash('conductor123', 10)

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@logiflow.com' }, update: {},
    create: { nombre: 'Admin LogiFlow', email: 'admin@logiflow.com', password: hashAdmin, rol: Rol.ADMIN },
  })
  await prisma.usuario.upsert({
    where: { email: 'operador1@logiflow.com' }, update: {},
    create: { nombre: 'Laura Operador', email: 'operador1@logiflow.com', password: hashOp, rol: Rol.OPERADOR },
  })
  await prisma.usuario.upsert({
    where: { email: 'operador2@logiflow.com' }, update: {},
    create: { nombre: 'Pedro Dispatcher', email: 'operador2@logiflow.com', password: hashOp, rol: Rol.OPERADOR },
  })
  await prisma.usuario.upsert({
    where: { email: 'carlos@logiflow.com' }, update: {},
    create: { nombre: 'Carlos Mendoza', email: 'carlos@logiflow.com', password: hashCond, rol: Rol.CONDUCTOR, conductorId: cond1.id },
  })
  await prisma.usuario.upsert({
    where: { email: 'maria@logiflow.com' }, update: {},
    create: { nombre: 'María González', email: 'maria@logiflow.com', password: hashCond, rol: Rol.CONDUCTOR, conductorId: cond2.id },
  })
  await prisma.usuario.upsert({
    where: { email: 'roberto@logiflow.com' }, update: {},
    create: { nombre: 'Roberto Sánchez', email: 'roberto@logiflow.com', password: hashCond, rol: Rol.CONDUCTOR, conductorId: cond3.id },
  })

  // ─── Vehículos ──────────────────────────────────────────────────────────────
  const veh1 = await prisma.vehiculo.upsert({
    where: { placa: 'ABC-123-MX' }, update: {},
    create: { placa: 'ABC-123-MX', modelo: 'International LT 2022', tipo: TipoVeh.TORTON, capacidad: '20 ton', costoKm: 18, estado: EstadoVeh.DISPONIBLE },
  })
  const veh2 = await prisma.vehiculo.upsert({
    where: { placa: 'DEF-456-MX' }, update: {},
    create: { placa: 'DEF-456-MX', modelo: 'Kenworth T370 2021', tipo: TipoVeh.RABON, capacidad: '12 ton', costoKm: 14, estado: EstadoVeh.EN_RUTA },
  })
  const veh3 = await prisma.vehiculo.upsert({
    where: { placa: 'GHI-789-MX' }, update: {},
    create: { placa: 'GHI-789-MX', modelo: 'Sprinter 2023', tipo: TipoVeh.VAN, capacidad: '1.5 ton', costoKm: 10, estado: EstadoVeh.DISPONIBLE },
  })

  const adminId = adminUser.id
  const now = new Date()
  const d = (days: number) => new Date(now.getTime() + days * 86400000)

  // ─── Solicitudes ────────────────────────────────────────────────────────────
  const items1 = [
    { descripcion: 'Televisores 55" Smart TV', cantidad: 20, unidad: 'pza', peso: 15 },
    { descripcion: 'Cajas de accesorios', cantidad: 80, unidad: 'pza', peso: 2 },
  ]
  const s1 = await prisma.solicitud.upsert({
    where: { ot: 'OT-240101-0001' }, update: {},
    create: {
      ot: 'OT-240101-0001', cliente: 'Walmart México', rfcCliente: 'WMM950825DW0', ordenCompra: 'PO-WMX-2024-001',
      tipo: TipoSol.DISTRIBUCION, estado: EstadoSol.COMPLETADA,
      fechaSolicitud: d(-5), fechaEntrega: d(-3),
      descripcionCarga: 'Electrónicos y accesorios', cantidad: 100, tarimas: 4,
      etiquetasPieza: 2, etiquetasColectivo: 10,
      tipoTransporte: 'TORTON', distanciaKm: 45, tiempoRuta: '1h 30min', costo: 1260,
      direccionEntrega: 'Blvd. Manuel Ávila Camacho 647, Naucalpan',
      latDestino: 19.4736, lngDestino: -99.2345,
      itemsRemision: items1,
    },
  })

  const items2 = [
    { descripcion: 'Ropa de dama temporada verano', cantidad: 200, unidad: 'pza', peso: 0.3 },
    { descripcion: 'Calzado deportivo', cantidad: 80, unidad: 'par', peso: 0.5 },
  ]
  const s2 = await prisma.solicitud.upsert({
    where: { ot: 'OT-240102-0002' }, update: {},
    create: {
      ot: 'OT-240102-0002', cliente: 'Liverpool Centro', rfcCliente: 'LIC460308BW8', ordenCompra: 'LIV-OC-4521',
      tipo: TipoSol.TRANSFERENCIA, estado: EstadoSol.EN_RUTA,
      fechaSolicitud: d(-2), fechaEntrega: d(1),
      descripcionCarga: 'Ropa y calzado', cantidad: 50, tarimas: 2, etiquetasPieza: 1,
      tipoTransporte: 'RABON', distanciaKm: 30, tiempoRuta: '55min', costo: 640,
      direccionEntrega: 'Venustiano Carranza 92, Centro Histórico',
      latDestino: 19.4270, lngDestino: -99.1361,
      itemsRemision: items2,
    },
  })

  const s3 = await prisma.solicitud.upsert({
    where: { ot: 'OT-240103-0003' }, update: {},
    create: {
      ot: 'OT-240103-0003', cliente: 'OXXO Distribución', rfcCliente: 'ORG960709BF5',
      tipo: TipoSol.ULTIMA_MILLA, estado: EstadoSol.PENDIENTE,
      fechaSolicitud: now, fechaEntrega: d(2),
      descripcionCarga: 'Bebidas y snacks', cantidad: 200, tarimas: 8,
      tipoTransporte: 'VAN', costo: 500,
    },
  })

  const items4 = [
    { descripcion: 'Smart TV QLED 65"', cantidad: 10, unidad: 'pza', peso: 22 },
    { descripcion: 'Monitor Gaming 27"', cantidad: 20, unidad: 'pza', peso: 6 },
    { descripcion: 'Cables HDMI 2m', cantidad: 50, unidad: 'pza', peso: 0.1 },
  ]
  const s4 = await prisma.solicitud.upsert({
    where: { ot: 'OT-240104-0004' }, update: {},
    create: {
      ot: 'OT-240104-0004', cliente: 'Samsung Electronics', rfcCliente: 'SEM941206SB2', ordenCompra: 'SEC-MX-9988',
      tipo: TipoSol.RECOLECCION, estado: EstadoSol.ASIGNADA,
      fechaSolicitud: d(-1), fechaEntrega: d(1),
      descripcionCarga: 'Televisores y monitores', cantidad: 30, tarimas: 3,
      tipoTransporte: 'TORTON', distanciaKm: 60, tiempoRuta: '2h', costo: 1380,
      direccionEntrega: 'Blvd. Adolfo López Mateos 2009, Álvaro Obregón',
      latDestino: 19.3636, lngDestino: -99.1912,
      itemsRemision: items4,
    },
  })

  const s5 = await prisma.solicitud.upsert({
    where: { ot: 'OT-240105-0005' }, update: {},
    create: {
      ot: 'OT-240105-0005', cliente: 'Amazon México', rfcCliente: 'AME900701BN1',
      tipo: TipoSol.DISTRIBUCION, estado: EstadoSol.INCIDENCIA,
      fechaSolicitud: d(-4), fechaEntrega: d(-2),
      descripcionCarga: 'Paquetería variada', cantidad: 500,
      tipoTransporte: 'VAN', distanciaKm: 25, tiempoRuta: '45min', costo: 750,
    },
  })

  const items6 = [
    { descripcion: 'Perfumes importados', cantidad: 120, unidad: 'pza', peso: 0.2 },
    { descripcion: 'Cremas y cosméticos', cantidad: 80, unidad: 'pza', peso: 0.1 },
  ]
  const s6 = await prisma.solicitud.upsert({
    where: { ot: 'OT-260414-0006' }, update: {},
    create: {
      ot: 'OT-260414-0006', cliente: 'Sephora México', rfcCliente: 'SMX021015GV7', ordenCompra: 'SEP-24-0879',
      tipo: TipoSol.DISTRIBUCION, estado: EstadoSol.ASIGNADA,
      fechaSolicitud: now, fechaEntrega: d(3),
      descripcionCarga: 'Cosméticos y fragancias', cantidad: 200, tarimas: 2,
      etiquetasPieza: 3, etiquetasColectivo: 5,
      tipoTransporte: 'VAN', distanciaKm: 18, tiempoRuta: '40min', costo: 480,
      direccionEntrega: 'Antara Fashion Hall, Polanco',
      latDestino: 19.4358, lngDestino: -99.2011,
      observaciones: 'Mercancía frágil — manejar con cuidado',
      itemsRemision: items6,
    },
  })

  const s7 = await prisma.solicitud.upsert({
    where: { ot: 'OT-260414-0007' }, update: {},
    create: {
      ot: 'OT-260414-0007', cliente: 'Costco México',
      tipo: TipoSol.RECOLECCION, estado: EstadoSol.PENDIENTE,
      fechaSolicitud: now, fechaEntrega: d(4),
      descripcionCarga: 'Devoluciones temporada navideña', cantidad: 350, tarimas: 10,
      tipoTransporte: 'TORTON', costo: 0,
    },
  })

  const s8 = await prisma.solicitud.upsert({
    where: { ot: 'OT-260412-0008' }, update: {},
    create: {
      ot: 'OT-260412-0008', cliente: 'Soriana Supermercados', rfcCliente: 'SSA980703L22',
      tipo: TipoSol.ULTIMA_MILLA, estado: EstadoSol.COMPLETADA,
      fechaSolicitud: d(-6), fechaEntrega: d(-4),
      descripcionCarga: 'Productos de limpieza', cantidad: 450, tarimas: 6,
      tipoTransporte: 'RABON', distanciaKm: 35, tiempoRuta: '1h 10min', costo: 890,
      direccionEntrega: 'Insurgentes Sur 1234, Benito Juárez',
      latDestino: 19.3790, lngDestino: -99.1565,
    },
  })

  console.log('   📋 8 solicitudes creadas')

  // ─── Entregas ───────────────────────────────────────────────────────────────
  const ent1 = await prisma.entrega.upsert({
    where: { solicitudId: s1.id }, update: {},
    create: {
      solicitudId: s1.id, conductorId: cond1.id, vehiculoId: veh1.id,
      estado: EstadoSol.COMPLETADA, subEstado: SubEstadoConductor.COMPLETADO,
    },
  })
  const ent2 = await prisma.entrega.upsert({
    where: { solicitudId: s2.id }, update: {},
    create: {
      solicitudId: s2.id, conductorId: cond2.id, vehiculoId: veh2.id,
      estado: EstadoSol.EN_RUTA, subEstado: SubEstadoConductor.DESCARGA,
    },
  })
  await prisma.entrega.upsert({
    where: { solicitudId: s4.id }, update: {},
    create: {
      solicitudId: s4.id, conductorId: cond1.id, vehiculoId: veh1.id,
      estado: EstadoSol.ASIGNADA, subEstado: SubEstadoConductor.EN_RUTA,
    },
  })
  await prisma.entrega.upsert({
    where: { solicitudId: s5.id }, update: {},
    create: {
      solicitudId: s5.id, conductorId: cond2.id, vehiculoId: veh2.id,
      estado: EstadoSol.INCIDENCIA,
      motivo: 'Receptor no disponible en el domicilio indicado',
    },
  })
  await prisma.entrega.upsert({
    where: { solicitudId: s6.id }, update: {},
    create: {
      solicitudId: s6.id, conductorId: cond3.id, vehiculoId: veh3.id,
      estado: EstadoSol.ASIGNADA, subEstado: SubEstadoConductor.EN_RUTA,
    },
  })
  const ent8 = await prisma.entrega.upsert({
    where: { solicitudId: s8.id }, update: {},
    create: {
      solicitudId: s8.id, conductorId: cond3.id, vehiculoId: veh3.id,
      estado: EstadoSol.COMPLETADA, subEstado: SubEstadoConductor.COMPLETADO,
    },
  })

  // Evidencia para entregas completadas
  await prisma.evidencia.upsert({
    where: { entregaId: ent1.id }, update: {},
    create: {
      entregaId: ent1.id,
      checkLlegada: d(-3), checkContacto: d(-3), checkDescarga: d(-3),
      checkConteo: d(-3), checkCondicion: d(-3), checkRemision: d(-3), checkAcuse: d(-3),
      tieneFirma: true, observaciones: 'Entrega sin novedad. Receptor: Juan García.',
      horaFinalizacion: d(-3),
    },
  })
  await prisma.evidencia.upsert({
    where: { entregaId: ent8.id }, update: {},
    create: {
      entregaId: ent8.id,
      checkLlegada: d(-4), checkContacto: d(-4), checkDescarga: d(-4),
      checkConteo: d(-4), checkCondicion: d(-4), checkRemision: d(-4), checkAcuse: d(-4),
      tieneFirma: true, observaciones: 'Entrega correcta. Sin daños en mercancía.',
      horaFinalizacion: d(-4),
    },
  })

  // Evidencia en progreso para ent2 (EN_RUTA/DESCARGA)
  await prisma.evidencia.upsert({
    where: { entregaId: ent2.id }, update: {},
    create: {
      entregaId: ent2.id,
      checkLlegada: new Date(), checkContacto: new Date(),
      tieneFirma: false,
    },
  })

  console.log('   🚚 6 entregas + evidencias creadas')

  // ─── Facturas ───────────────────────────────────────────────────────────────
  await prisma.factura.upsert({
    where: { numero: 'FAC-2024-001' }, update: {},
    create: {
      numero: 'FAC-2024-001', cliente: 'Walmart México', solicitudId: s1.id,
      subtotal: 1260, gastosAdic: 150, estado: EstadoFact.PAGADA, fecha: d(-2),
    },
  })
  await prisma.factura.upsert({
    where: { numero: 'FAC-2024-002' }, update: {},
    create: {
      numero: 'FAC-2024-002', cliente: 'Samsung Electronics', solicitudId: s4.id,
      subtotal: 1380, gastosAdic: 0, estado: EstadoFact.BORRADOR,
    },
  })
  await prisma.factura.upsert({
    where: { numero: 'FAC-2024-003' }, update: {},
    create: {
      numero: 'FAC-2024-003', cliente: 'Soriana Supermercados', solicitudId: s8.id,
      subtotal: 890, gastosAdic: 80, estado: EstadoFact.EMITIDA, fecha: d(-3),
    },
  })
  await prisma.factura.upsert({
    where: { numero: 'FAC-2024-004' }, update: {},
    create: {
      numero: 'FAC-2024-004', cliente: 'Liverpool Centro', solicitudId: s2.id,
      subtotal: 640, gastosAdic: 60, estado: EstadoFact.BORRADOR,
    },
  })
  await prisma.factura.upsert({
    where: { numero: 'FAC-2024-005' }, update: {},
    create: {
      numero: 'FAC-2024-005', cliente: 'Sephora México', solicitudId: s6.id,
      subtotal: 480, gastosAdic: 0, estado: EstadoFact.BORRADOR,
    },
  })

  console.log('   🧾 5 facturas creadas')

  // ─── Inventario ─────────────────────────────────────────────────────────────
  const productos = await Promise.all([
    prisma.producto.upsert({
      where: { sku: 'EMB-001' }, update: {},
      create: { sku: 'EMB-001', nombre: 'Caja de cartón ch (30x20x15)', unidad: 'pza', categoria: 'Embalaje', stockActual: 150, stockMinimo: 50, precio: 8.5 },
    }),
    prisma.producto.upsert({
      where: { sku: 'EMB-002' }, update: {},
      create: { sku: 'EMB-002', nombre: 'Caja de cartón med (50x40x30)', unidad: 'pza', categoria: 'Embalaje', stockActual: 80, stockMinimo: 30, precio: 14 },
    }),
    prisma.producto.upsert({
      where: { sku: 'EMB-003' }, update: {},
      create: { sku: 'EMB-003', nombre: 'Fleje de playo stretch 500m', unidad: 'rollo', categoria: 'Embalaje', stockActual: 12, stockMinimo: 5, precio: 185 },
    }),
    prisma.producto.upsert({
      where: { sku: 'EMB-004' }, update: {},
      create: { sku: 'EMB-004', nombre: 'Burbuja 1.2m x 50m', descripcion: 'Polietileno burbuja para frágiles', unidad: 'rollo', categoria: 'Embalaje', stockActual: 4, stockMinimo: 5, precio: 220 },
    }),
    prisma.producto.upsert({
      where: { sku: 'TAR-001' }, update: {},
      create: { sku: 'TAR-001', nombre: 'Tarima de madera estándar', unidad: 'pza', categoria: 'Tarimas', stockActual: 25, stockMinimo: 10, precio: 120 },
    }),
    prisma.producto.upsert({
      where: { sku: 'TAR-002' }, update: {},
      create: { sku: 'TAR-002', nombre: 'Tarima plástica reutilizable', unidad: 'pza', categoria: 'Tarimas', stockActual: 0, stockMinimo: 5, precio: 350 },
    }),
    prisma.producto.upsert({
      where: { sku: 'DOC-001' }, update: {},
      create: { sku: 'DOC-001', nombre: 'Remisión (talonario 50 hojas)', unidad: 'pza', categoria: 'Documentación', stockActual: 18, stockMinimo: 10, precio: 45 },
    }),
    prisma.producto.upsert({
      where: { sku: 'CON-001' }, update: {},
      create: { sku: 'CON-001', nombre: 'Cinta de atar 48mm x 100m', unidad: 'rollo', categoria: 'Consumibles', stockActual: 30, stockMinimo: 15, precio: 35 },
    }),
  ])

  // Movimientos de inventario
  const movSeed = [
    { idx: 0, tipo: 'ENTRADA' as TipoMovimiento, cant: 200, motivo: 'Compra inicial proveedor', daysAgo: 14 },
    { idx: 0, tipo: 'SALIDA' as TipoMovimiento, cant: 50, motivo: 'Uso en entregas semana 14', ref: 'OT-240101-0001', daysAgo: 5 },
    { idx: 1, tipo: 'ENTRADA' as TipoMovimiento, cant: 100, motivo: 'Reposición de stock', daysAgo: 10 },
    { idx: 1, tipo: 'SALIDA' as TipoMovimiento, cant: 20, motivo: 'Uso en distribución OXXO', ref: 'OT-240103-0003', daysAgo: 3 },
    { idx: 2, tipo: 'ENTRADA' as TipoMovimiento, cant: 15, motivo: 'Compra mensual', daysAgo: 12 },
    { idx: 2, tipo: 'SALIDA' as TipoMovimiento, cant: 3, motivo: 'Embalaje Liverpool', ref: 'OT-240102-0002', daysAgo: 2 },
    { idx: 3, tipo: 'ENTRADA' as TipoMovimiento, cant: 6, motivo: 'Compra emergencia', daysAgo: 8 },
    { idx: 3, tipo: 'SALIDA' as TipoMovimiento, cant: 2, motivo: 'Sephora - frágiles', ref: 'OT-260414-0006', daysAgo: 1 },
    { idx: 4, tipo: 'ENTRADA' as TipoMovimiento, cant: 30, motivo: 'Compra inicial', daysAgo: 20 },
    { idx: 4, tipo: 'SALIDA' as TipoMovimiento, cant: 5, motivo: 'Entrega Walmart', ref: 'OT-240101-0001', daysAgo: 5 },
    { idx: 5, tipo: 'ENTRADA' as TipoMovimiento, cant: 10, motivo: 'Compra tarimas plásticas', daysAgo: 15 },
    { idx: 5, tipo: 'SALIDA' as TipoMovimiento, cant: 10, motivo: 'Rotura — dado de baja', daysAgo: 7 },
    { idx: 6, tipo: 'ENTRADA' as TipoMovimiento, cant: 30, motivo: 'Compra talonarios', daysAgo: 25 },
    { idx: 6, tipo: 'SALIDA' as TipoMovimiento, cant: 12, motivo: 'Uso mensual documentación', daysAgo: 3 },
    { idx: 7, tipo: 'ENTRADA' as TipoMovimiento, cant: 50, motivo: 'Compra inicial', daysAgo: 18 },
    { idx: 7, tipo: 'SALIDA' as TipoMovimiento, cant: 20, motivo: 'Despacho rutas', daysAgo: 4 },
  ]

  for (const m of movSeed) {
    const prod = productos[m.idx]
    const stockDespues = prod.stockActual
    const stockAntes = m.tipo === 'ENTRADA' ? stockDespues - m.cant : stockDespues + m.cant
    await prisma.movimientoInventario.create({
      data: {
        productoId: prod.id, tipo: m.tipo,
        cantidad: m.tipo === 'ENTRADA' ? m.cant : -m.cant,
        stockAntes: Math.max(0, stockAntes), stockDespues,
        motivo: m.motivo, referencia: m.ref,
        usuarioId: adminId,
        createdAt: new Date(Date.now() - (m.daysAgo ?? 1) * 86400000),
      },
    })
  }

  console.log(`   📦 ${productos.length} productos + ${movSeed.length} movimientos creados`)

  // ─── Notificaciones ─────────────────────────────────────────────────────────
  await prisma.notificacion.createMany({
    skipDuplicates: false,
    data: [
      { mensaje: 'Nueva solicitud OT-260414-0007 de Costco México', tipo: 'INFO' },
      { mensaje: 'Nueva solicitud OT-260414-0006 de Sephora México', tipo: 'INFO' },
      { mensaje: 'Entrega OT-240102-0002 — conductor en DESCARGA', tipo: 'SUCCESS' },
      { mensaje: 'Incidencia reportada en OT-240105-0005 — receptor no disponible', tipo: 'WARNING' },
      { mensaje: 'Factura FAC-2024-001 marcada como Pagada', tipo: 'SUCCESS' },
      { mensaje: '⚠️ Stock bajo: Burbuja 1.2m x 50m (4 rollos, mínimo 5)', tipo: 'WARNING' },
      { mensaje: '⚠️ Sin stock: Tarima plástica reutilizable (0 pzas)', tipo: 'WARNING' },
    ],
  })

  console.log('✅ Seed completado!')
  console.log('')
  console.log('   🔑 Credenciales:')
  console.log('   admin@logiflow.com      / admin123')
  console.log('   operador1@logiflow.com  / operador123')
  console.log('   carlos@logiflow.com     / conductor123  (Carlos Mendoza)')
  console.log('   maria@logiflow.com      / conductor123  (María González — EN RUTA)')
  console.log('   roberto@logiflow.com    / conductor123  (Roberto Sánchez)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
