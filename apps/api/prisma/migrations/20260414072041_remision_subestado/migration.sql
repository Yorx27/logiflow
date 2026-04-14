-- CreateEnum
CREATE TYPE "SubEstadoConductor" AS ENUM ('EN_RUTA', 'EN_ESPERA', 'DESCARGA', 'ENTREGA_DOCUMENTOS', 'COMPLETADO');

-- AlterTable
ALTER TABLE "Entrega" ADD COLUMN     "remisionUrl" TEXT,
ADD COLUMN     "subEstado" "SubEstadoConductor";

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "itemsRemision" JSONB,
ADD COLUMN     "ordenCompra" TEXT,
ADD COLUMN     "rfcCliente" TEXT;

-- CreateTable
CREATE TABLE "DocumentoEntrega" (
    "id" TEXT NOT NULL,
    "entregaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "subidoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoEntrega_entregaId_idx" ON "DocumentoEntrega"("entregaId");

-- AddForeignKey
ALTER TABLE "DocumentoEntrega" ADD CONSTRAINT "DocumentoEntrega_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
