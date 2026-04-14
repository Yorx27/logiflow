-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERADOR', 'CONDUCTOR');

-- CreateEnum
CREATE TYPE "EstadoCond" AS ENUM ('DISPONIBLE', 'EN_RUTA', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoVeh" AS ENUM ('TORTON', 'RABON', 'VAN', 'PICKUP', 'PLATAFORMA');

-- CreateEnum
CREATE TYPE "EstadoVeh" AS ENUM ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "TipoSol" AS ENUM ('DISTRIBUCION', 'RECOLECCION', 'TRANSFERENCIA', 'ULTIMA_MILLA');

-- CreateEnum
CREATE TYPE "EstadoSol" AS ENUM ('PENDIENTE', 'ASIGNADA', 'EN_RUTA', 'COMPLETADA', 'RECHAZADA', 'INCIDENCIA');

-- CreateEnum
CREATE TYPE "CatFoto" AS ENUM ('DESCARGA', 'DOCUMENTOS');

-- CreateEnum
CREATE TYPE "EstadoFact" AS ENUM ('BORRADOR', 'EMITIDA', 'PAGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoNotif" AS ENUM ('SUCCESS', 'ERROR', 'WARNING', 'INFO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conductorId" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conductor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "licencia" TEXT NOT NULL,
    "estado" "EstadoCond" NOT NULL DEFAULT 'DISPONIBLE',
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "tipo" "TipoVeh" NOT NULL,
    "capacidad" TEXT NOT NULL,
    "costoKm" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoVeh" NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "ot" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "tipo" "TipoSol" NOT NULL,
    "estado" "EstadoSol" NOT NULL DEFAULT 'PENDIENTE',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL,
    "fechaRecoleccion" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "horaEntrega" TEXT,
    "descripcionCarga" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "tarimas" INTEGER NOT NULL DEFAULT 0,
    "etiquetasPieza" INTEGER NOT NULL DEFAULT 0,
    "etiquetasColectivo" INTEGER NOT NULL DEFAULT 0,
    "papeletas" INTEGER NOT NULL DEFAULT 0,
    "cajaColectiva" BOOLEAN NOT NULL DEFAULT false,
    "playo" BOOLEAN NOT NULL DEFAULT false,
    "poliBurbuja" BOOLEAN NOT NULL DEFAULT false,
    "requiereAcond" BOOLEAN NOT NULL DEFAULT false,
    "gestionTarimas" BOOLEAN NOT NULL DEFAULT false,
    "lineaTransporte" TEXT,
    "tipoTransporte" TEXT,
    "requiereManiobra" BOOLEAN NOT NULL DEFAULT false,
    "variosDestinos" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "costo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "direccionEntrega" TEXT,
    "latDestino" DOUBLE PRECISION,
    "lngDestino" DOUBLE PRECISION,
    "distanciaKm" DOUBLE PRECISION,
    "tiempoRuta" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "conductorId" TEXT,
    "vehiculoId" TEXT,
    "estado" "EstadoSol" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" TEXT NOT NULL,
    "entregaId" TEXT NOT NULL,
    "checkLlegada" TIMESTAMP(3),
    "checkContacto" TIMESTAMP(3),
    "checkDescarga" TIMESTAMP(3),
    "checkConteo" TIMESTAMP(3),
    "checkCondicion" TIMESTAMP(3),
    "checkRemision" TIMESTAMP(3),
    "checkAcuse" TIMESTAMP(3),
    "tieneFirma" BOOLEAN NOT NULL DEFAULT false,
    "firmaUrl" TEXT,
    "observaciones" TEXT,
    "horaFinalizacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoEvidencia" (
    "id" TEXT NOT NULL,
    "evidenciaId" TEXT NOT NULL,
    "categoria" "CatFoto" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoEvidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "solicitudId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "gastosAdic" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" "EstadoFact" NOT NULL DEFAULT 'BORRADOR',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "costoEtiqueta" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "costoTarima" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "costoPapeleta" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "costoCajaColectiva" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "costoPlayo" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "costoPoliBurbuja" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "empresa" TEXT NOT NULL DEFAULT 'LogiFlow S.A.',
    "email" TEXT NOT NULL DEFAULT 'admin@logiflow.com',
    "telefono" TEXT NOT NULL DEFAULT '+52 55 1234-5678',
    "direccion" TEXT NOT NULL DEFAULT 'Av. Reforma 123, CDMX',
    "latOrigen" DOUBLE PRECISION,
    "lngOrigen" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotif" NOT NULL,
    "conductorId" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_conductorId_key" ON "Usuario"("conductorId");

-- CreateIndex
CREATE UNIQUE INDEX "Conductor_licencia_key" ON "Conductor"("licencia");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_placa_key" ON "Vehiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_ot_key" ON "Solicitud"("ot");

-- CreateIndex
CREATE UNIQUE INDEX "Entrega_solicitudId_key" ON "Entrega"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidencia_entregaId_key" ON "Evidencia"("entregaId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoEvidencia" ADD CONSTRAINT "FotoEvidencia_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "Evidencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE SET NULL ON UPDATE CASCADE;
