import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { rateLimit } from 'express-rate-limit'
import { prisma } from './utils/prisma'
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
import { gastosRouter } from './routes/gastos'
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
app.use('/api/gastos', gastosRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date(), v: '2026-04-17' }))

// ─── WebSockets ───────────────────────────────────────────────────────────────
initSocket(server)

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

async function ensureGastosTables() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Solicitud" ADD COLUMN IF NOT EXISTS "folioCandado" TEXT`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "EstadoGasto" AS ENUM ('PENDIENTE','APROBADO','RECHAZADO'); EXCEPTION WHEN duplicate_object THEN null; END $$`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN CREATE TYPE "FrecuenciaGasto" AS ENUM ('DIARIO','SEMANAL','MENSUAL','ANUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$`)
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "GastoConductor" ("id" TEXT NOT NULL,"conductorId" TEXT NOT NULL,"entregaId" TEXT,"estacionamiento" DOUBLE PRECISION NOT NULL DEFAULT 0,"gasolina" DOUBLE PRECISION NOT NULL DEFAULT 0,"tag" DOUBLE PRECISION NOT NULL DEFAULT 0,"casetas" DOUBLE PRECISION NOT NULL DEFAULT 0,"comidas" DOUBLE PRECISION NOT NULL DEFAULT 0,"otros" DOUBLE PRECISION NOT NULL DEFAULT 0,"otrosDesc" TEXT,"estado" "EstadoGasto" NOT NULL DEFAULT 'PENDIENTE',"observaciones" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "GastoConductor_pkey" PRIMARY KEY ("id"))`)
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "GastoArchivo" ("id" TEXT NOT NULL,"gastoConductorId" TEXT NOT NULL,"categoria" TEXT NOT NULL,"url" TEXT NOT NULL,"nombre" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "GastoArchivo_pkey" PRIMARY KEY ("id"))`)
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "GastoFijo" ("id" TEXT NOT NULL,"nombre" TEXT NOT NULL,"monto" DOUBLE PRECISION NOT NULL,"frecuencia" "FrecuenciaGasto" NOT NULL DEFAULT 'MENSUAL',"categoria" TEXT,"activo" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "GastoFijo_pkey" PRIMARY KEY ("id"))`)
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "GastoVariable" ("id" TEXT NOT NULL,"nombre" TEXT NOT NULL,"monto" DOUBLE PRECISION NOT NULL,"fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"categoria" TEXT,"comprobante" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "GastoVariable_pkey" PRIMARY KEY ("id"))`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN ALTER TABLE "GastoConductor" ADD CONSTRAINT "GastoConductor_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN ALTER TABLE "GastoArchivo" ADD CONSTRAINT "GastoArchivo_gastoConductorId_fkey" FOREIGN KEY ("gastoConductorId") REFERENCES "GastoConductor"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GastoConductor_conductorId_idx" ON "GastoConductor"("conductorId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GastoArchivo_gastoConductorId_idx" ON "GastoArchivo"("gastoConductorId")`)
    console.log('✅ Tablas de gastos verificadas/creadas')
  } catch (e) {
    console.error('⚠️  ensureGastosTables error:', e)
  }
}

const PORT = process.env.PORT || 3001
ensureGastosTables().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 LogiFlow API running on port ${PORT}`)
  })
})

export { server }
