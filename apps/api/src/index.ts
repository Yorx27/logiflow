import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { rateLimit } from 'express-rate-limit'
import { initSocket } from './sockets/socketServer'
import { authRouter } from './routes/auth'
import { solicitudesRouter } from './routes/solicitudes'
import { entregasRouter } from './routes/entregas'
import { evidenciasRouter } from './routes/evidencias'
import { conductoresRouter } from './routes/conductores'
import { vehiculosRouter } from './routes/vehiculos'
import { rutaRouter } from './routes/ruta'
import { facturasRouter } from './routes/facturas'
import { reportesRouter } from './routes/reportes'
import { configRouter } from './routes/config'
import { notificacionesRouter } from './routes/notificaciones'
import { inventarioRouter } from './routes/inventario'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const server = http.createServer(app)

// ─── Middleware ────────────────────────────────────────────────────────────────
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',')
app.use(cors({ origin: origins, credentials: true }))
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true }))

// Static uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads'
app.use('/uploads', express.static(path.resolve(uploadDir)))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/solicitudes', solicitudesRouter)
app.use('/api/entregas', entregasRouter)
app.use('/api/evidencias', evidenciasRouter)
app.use('/api/conductores', conductoresRouter)
app.use('/api/vehiculos', vehiculosRouter)
app.use('/api/ruta', rutaRouter)
app.use('/api/facturas', facturasRouter)
app.use('/api/reportes', reportesRouter)
app.use('/api/config', configRouter)
app.use('/api/notificaciones', notificacionesRouter)
app.use('/api/inventario', inventarioRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }))

// ─── WebSockets ───────────────────────────────────────────────────────────────
initSocket(server)

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 LogiFlow API running on port ${PORT}`)
})

export { server }
