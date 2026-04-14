// ─── Enums ────────────────────────────────────────────────────────────────────

export type Rol = 'ADMIN' | 'OPERADOR' | 'CONDUCTOR'

export type EstadoConductor = 'DISPONIBLE' | 'EN_RUTA' | 'INACTIVO'

export type TipoVehiculo = 'TORTON' | 'RABON' | 'VAN' | 'PICKUP' | 'PLATAFORMA'
export type EstadoVehiculo = 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO'

export type TipoSolicitud = 'DISTRIBUCION' | 'RECOLECCION' | 'TRANSFERENCIA' | 'ULTIMA_MILLA'
export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'ASIGNADA'
  | 'EN_RUTA'
  | 'COMPLETADA'
  | 'RECHAZADA'
  | 'INCIDENCIA'

export type EstadoFactura = 'BORRADOR' | 'EMITIDA' | 'PAGADA' | 'CANCELADA'

export type TipoNotificacion = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'

export type CategoriaFoto = 'DESCARGA' | 'DOCUMENTOS'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  createdAt: string
  conductorId?: string | null
  conductor?: Conductor | null
}

export interface Conductor {
  id: string
  nombre: string
  telefono?: string | null
  licencia: string
  estado: EstadoConductor
  fechaRegistro: string
  usuario?: Usuario | null
  _count?: {
    entregas: number
  }
}

export interface Vehiculo {
  id: string
  placa: string
  modelo: string
  tipo: TipoVehiculo
  capacidad: string
  costoKm: number
  estado: EstadoVehiculo
}

export interface Solicitud {
  id: string
  ot: string
  cliente: string
  tipo: TipoSolicitud
  estado: EstadoSolicitud
  fechaSolicitud: string
  fechaRecoleccion?: string | null
  fechaEntrega?: string | null
  horaEntrega?: string | null
  descripcionCarga?: string | null
  cantidad: number
  tarimas: number
  etiquetasPieza: number
  etiquetasColectivo: number
  papeletas: number
  cajaColectiva: boolean
  playo: boolean
  poliBurbuja: boolean
  requiereAcond: boolean
  gestionTarimas: boolean
  lineaTransporte?: string | null
  tipoTransporte?: string | null
  requiereManiobra: boolean
  variosDestinos: boolean
  observaciones?: string | null
  costo: number
  direccionEntrega?: string | null
  latDestino?: number | null
  lngDestino?: number | null
  distanciaKm?: number | null
  tiempoRuta?: string | null
  createdAt: string
  updatedAt: string
  entrega?: Entrega | null
}

export interface Entrega {
  id: string
  solicitudId: string
  solicitud?: Solicitud
  conductorId?: string | null
  conductor?: Conductor | null
  vehiculoId?: string | null
  vehiculo?: Vehiculo | null
  estado: EstadoSolicitud
  motivo?: string | null
  evidencia?: Evidencia | null
  createdAt: string
  updatedAt: string
}

export interface Evidencia {
  id: string
  entregaId: string
  checkLlegada?: string | null
  checkContacto?: string | null
  checkDescarga?: string | null
  checkConteo?: string | null
  checkCondicion?: string | null
  checkRemision?: string | null
  checkAcuse?: string | null
  tieneFirma: boolean
  firmaUrl?: string | null
  observaciones?: string | null
  horaFinalizacion?: string | null
  fotos: FotoEvidencia[]
  createdAt: string
}

export interface FotoEvidencia {
  id: string
  evidenciaId: string
  categoria: CategoriaFoto
  url: string
  nombre: string
  createdAt: string
}

export interface Factura {
  id: string
  numero: string
  cliente: string
  solicitudId?: string | null
  solicitud?: Solicitud | null
  subtotal: number
  gastosAdic: number
  estado: EstadoFactura
  fecha: string
  createdAt: string
}

export interface Configuracion {
  id: string
  costoEtiqueta: number
  costoTarima: number
  costoPapeleta: number
  costoCajaColectiva: number
  costoPlayo: number
  costoPoliBurbuja: number
  empresa: string
  email: string
  telefono: string
  direccion: string
  latOrigen?: number | null
  lngOrigen?: number | null
  updatedAt: string
}

export interface Notificacion {
  id: string
  mensaje: string
  tipo: TipoNotificacion
  conductorId?: string | null
  leida: boolean
  createdAt: string
}

// ─── API Response types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface AuthResponse {
  user: Usuario
  accessToken: string
  refreshToken: string
}

export interface KPIs {
  pendientes: number
  enRuta: number
  conductoresDisp: number
  completadas: number
  rechazadas: number
  incidencias: number
}

export interface RutaResult {
  km: number
  tiempo: string
  costo: number
  alertas: string[]
}

export interface ReporteItem {
  label: string
  value: number
  extra?: string
}

// ─── WebSocket events ──────────────────────────────────────────────────────────

export interface WSEntregaActualizada {
  entregaId: string
  estado: EstadoSolicitud
  conductorId?: string | null
}

export interface WSNotificacionNueva {
  mensaje: string
  tipo: TipoNotificacion
  conductorId?: string | null
}

export interface WSDashboardKPIs {
  kpis: KPIs
}
