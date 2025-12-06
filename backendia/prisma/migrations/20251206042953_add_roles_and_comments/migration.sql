-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'estudiante';

-- CreateTable
CREATE TABLE "public"."comentarios" (
    "id_comentario" SERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "elemento_id" TEXT,
    "elemento_tipo" TEXT,
    "contenido" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'comentario',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id_comentario")
);

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "public"."Proyecto"("id_proyecto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
