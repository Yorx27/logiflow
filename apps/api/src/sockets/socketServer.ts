import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'

let io: Server

export function initSocket(server: HttpServer) {
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',')
  io = new Server(server, {
    cors: { origin: origins, credentials: true },
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] connected: ${socket.id}`)

    socket.on('join:rol', ({ rol, conductorId }: { rol: string; conductorId?: string }) => {
      socket.join(`rol:${rol}`)
      if (conductorId) socket.join(`conductor:${conductorId}`)
      console.log(`[Socket] ${socket.id} joined rol:${rol}${conductorId ? ` conductor:${conductorId}` : ''}`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] disconnected: ${socket.id}`)
    })
  })

  // KPIs broadcast every 30s
  setInterval(async () => {
    try {
      const { getKPIs } = await import('../services/kpiService')
      const kpis = await getKPIs()
      io.to('rol:ADMIN').to('rol:OPERADOR').emit('dashboard:kpis', { kpis })
    } catch (_e) {
      // ignore
    }
  }, 30000)

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function emitEntregaActualizada(payload: object) {
  getIO().to('rol:ADMIN').to('rol:OPERADOR').emit('entrega:actualizada', payload)
}

export function emitSolicitudNueva(payload: object) {
  getIO().to('rol:ADMIN').to('rol:OPERADOR').emit('solicitud:nueva', payload)
}

export function emitNotificacion(payload: { mensaje: string; tipo: string; conductorId?: string | null }) {
  getIO().to('rol:ADMIN').to('rol:OPERADOR').emit('notificacion:nueva', payload)
  if (payload.conductorId) {
    getIO().to(`conductor:${payload.conductorId}`).emit('notificacion:nueva', payload)
  }
}

export function emitConductorEstado(payload: object) {
  getIO().to('rol:ADMIN').to('rol:OPERADOR').emit('conductor:estado', payload)
}

export function emitStockAlerta(payload: { productoId: string; nombre: string; stockActual: number; stockMinimo: number }) {
  getIO().to('rol:ADMIN').to('rol:OPERADOR').emit('inventario:stockAlerta', payload)
}
