-- CreateTable
CREATE TABLE "public"."calificaciones" (
    "id_calificacion" SERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "nota" DECIMAL(5,2) NOT NULL,
    "nota_maxima" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "comentario" TEXT,
    "fecha_calificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id_calificacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_id_proyecto_id_docente_key" ON "public"."calificaciones"("id_proyecto", "id_docente");

-- AddForeignKey
ALTER TABLE "public"."calificaciones" ADD CONSTRAINT "calificaciones_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "public"."Proyecto"("id_proyecto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calificaciones" ADD CONSTRAINT "calificaciones_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "public"."Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
