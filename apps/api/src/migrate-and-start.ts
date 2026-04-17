import 'dotenv/config'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

async function main() {
  console.log('[startup] Aplicando migraciones pendientes...')

  // Intentar prisma migrate deploy primero
  try {
    execSync('node_modules/.bin/prisma migrate deploy', { stdio: 'inherit' })
    console.log('[startup] Prisma migrate deploy OK')
  } catch (e) {
    console.warn('[startup] prisma migrate deploy falló, aplicando SQL manualmente...')

    // Aplicar tablas de gastos manualmente si no existen
    const prisma = new PrismaClient()
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Solicitud" ADD COLUMN IF NOT EXISTS "folioCandado" TEXT`)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "EstadoGasto" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');
        EXCEPTION WHEN duplicate_object THEN null; END $$
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "FrecuenciaGasto" AS ENUM ('DIARIO', 'SEMANAL', 'MENSUAL', 'ANUAL');
        EXCEPTION WHEN duplicate_object THEN null; END $$
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GastoConductor" (
          "id" TEXT NOT NULL,
          "conductorId" TEXT NOT NULL,
          "entregaId" TEXT,
          "estacionamiento" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "gasolina" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "tag" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "casetas" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "comidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "otros" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "otrosDesc" TEXT,
          "estado" "EstadoGasto" NOT NULL DEFAULT 'PENDIENTE',
          "observaciones" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GastoConductor_pkey" PRIMARY KEY ("id")
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GastoArchivo" (
          "id" TEXT NOT NULL,
          "gastoConductorId" TEXT NOT NULL,
          "categoria" TEXT NOT NULL,
          "url" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GastoArchivo_pkey" PRIMARY KEY ("id")
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GastoFijo" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "monto" DOUBLE PRECISION NOT NULL,
          "frecuencia" "FrecuenciaGasto" NOT NULL DEFAULT 'MENSUAL',
          "categoria" TEXT,
          "activo" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GastoFijo_pkey" PRIMARY KEY ("id")
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GastoVariable" (
          "id" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "monto" DOUBLE PRECISION NOT NULL,
          "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "categoria" TEXT,
          "comprobante" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GastoVariable_pkey" PRIMARY KEY ("id")
        )
      `)
      // FK constraints
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "GastoConductor" ADD CONSTRAINT "GastoConductor_conductorId_fkey"
            FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "GastoArchivo" ADD CONSTRAINT "GastoArchivo_gastoConductorId_fkey"
            FOREIGN KEY ("gastoConductorId") REFERENCES "GastoConductor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$
      `)
      // Indexes
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GastoConductor_conductorId_idx" ON "GastoConductor"("conductorId")`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GastoArchivo_gastoConductorId_idx" ON "GastoArchivo"("gastoConductorId")`)
      console.log('[startup] Tablas de gastos creadas manualmente OK')
    } finally {
      await prisma.$disconnect()
    }
  }

  // Arrancar el servidor
  console.log('[startup] Iniciando servidor...')
  require('./index')
}

main().catch((e) => {
  console.error('[startup] Error fatal:', e)
  process.exit(1)
})
