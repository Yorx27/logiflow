-- AlterTable: agregar folioCandado a Solicitud
ALTER TABLE "Solicitud" ADD COLUMN IF NOT EXISTS "folioCandado" TEXT;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EstadoGasto" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FrecuenciaGasto" AS ENUM ('DIARIO', 'SEMANAL', 'MENSUAL', 'ANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: GastoConductor
CREATE TABLE IF NOT EXISTS "GastoConductor" (
    "id"              TEXT NOT NULL,
    "conductorId"     TEXT NOT NULL,
    "entregaId"       TEXT,
    "estacionamiento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gasolina"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tag"             DOUBLE PRECISION NOT NULL DEFAULT 0,
    "casetas"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comidas"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otros"           DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otrosDesc"       TEXT,
    "estado"          "EstadoGasto" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones"   TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoConductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GastoArchivo
CREATE TABLE IF NOT EXISTS "GastoArchivo" (
    "id"               TEXT NOT NULL,
    "gastoConductorId" TEXT NOT NULL,
    "categoria"        TEXT NOT NULL,
    "url"              TEXT NOT NULL,
    "nombre"           TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GastoFijo
CREATE TABLE IF NOT EXISTS "GastoFijo" (
    "id"         TEXT NOT NULL,
    "nombre"     TEXT NOT NULL,
    "monto"      DOUBLE PRECISION NOT NULL,
    "frecuencia" "FrecuenciaGasto" NOT NULL DEFAULT 'MENSUAL',
    "categoria"  TEXT,
    "activo"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GastoVariable
CREATE TABLE IF NOT EXISTS "GastoVariable" (
    "id"          TEXT NOT NULL,
    "nombre"      TEXT NOT NULL,
    "monto"       DOUBLE PRECISION NOT NULL,
    "fecha"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria"   TEXT,
    "comprobante" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoVariable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GastoConductor"
    ADD CONSTRAINT "GastoConductor_conductorId_fkey"
    FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GastoConductor"
    ADD CONSTRAINT "GastoConductor_entregaId_fkey"
    FOREIGN KEY ("entregaId") REFERENCES "Entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GastoArchivo"
    ADD CONSTRAINT "GastoArchivo_gastoConductorId_fkey"
    FOREIGN KEY ("gastoConductorId") REFERENCES "GastoConductor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GastoConductor_conductorId_idx" ON "GastoConductor"("conductorId");
CREATE INDEX IF NOT EXISTS "GastoArchivo_gastoConductorId_idx" ON "GastoArchivo"("gastoConductorId");
