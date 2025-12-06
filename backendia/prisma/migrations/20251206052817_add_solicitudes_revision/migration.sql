-- CreateTable
CREATE TABLE "public"."solicitudes_revision" (
    "id_solicitud" SERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "mensaje" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMP(3),
    "fecha_completada" TIMESTAMP(3),

    CONSTRAINT "solicitudes_revision_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_revision_id_proyecto_id_docente_key" ON "public"."solicitudes_revision"("id_proyecto", "id_docente");

-- AddForeignKey
ALTER TABLE "public"."solicitudes_revision" ADD CONSTRAINT "solicitudes_revision_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "public"."Proyecto"("id_proyecto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."solicitudes_revision" ADD CONSTRAINT "solicitudes_revision_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "public"."Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."solicitudes_revision" ADD CONSTRAINT "solicitudes_revision_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "public"."Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
