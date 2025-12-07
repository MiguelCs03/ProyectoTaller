import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear un nuevo comentario
export const createComment = async (req: Request, res: Response) => {
    try {
        const { id_proyecto, elemento_id, elemento_tipo, contenido, tipo } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Verificar que el usuario tiene acceso al proyecto
        const acceso = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: userId,
                id_proyecto: parseInt(id_proyecto)
            }
        });

        if (!acceso) {
            return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
        }

        // Sólo docentes pueden crear comentarios en el panel
        const usuario = await prisma.usuario.findUnique({ where: { id_usuario: userId } });
        if (!usuario || usuario.rol !== 'docente') {
            return res.status(403).json({ error: 'Solo los docentes pueden crear comentarios en este panel' });
        }

        const comentario = await prisma.comentario.create({
            data: {
                id_proyecto: parseInt(id_proyecto),
                id_usuario: userId,
                elemento_id,
                elemento_tipo,
                contenido,
                tipo: tipo || 'comentario',
                estado: 'pendiente'
            },
            include: {
                Usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                }
            }
        });

        res.status(201).json(comentario);
    } catch (error) {
        console.error('Error al crear comentario:', error);
        res.status(500).json({ error: 'Error al crear comentario' });
    }
};

// Obtener todos los comentarios de un proyecto
export const getProjectComments = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'Falta el parámetro projectId' });
        }

        // Verificar acceso al proyecto
        const acceso = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: userId,
                id_proyecto: parseInt(projectId)
            }
        });

        if (!acceso) {
            return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
        }

        const comentarios = await prisma.comentario.findMany({
            where: {
                id_proyecto: parseInt(projectId)
            },
            include: {
                Usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                }
            },
            orderBy: {
                fecha_creacion: 'desc'
            }
        });

        res.json(comentarios);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ error: 'Error al obtener comentarios' });
    }
};

// Obtener comentarios de un elemento específico
export const getElementComments = async (req: Request, res: Response) => {
    try {
        const { projectId, elementId } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'Falta el parámetro projectId' });
        }

        // Verificar acceso
        const acceso = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: userId,
                id_proyecto: parseInt(projectId)
            }
        });

        if (!acceso) {
            return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
        }

        const comentarios = await prisma.comentario.findMany({
            where: {
                id_proyecto: parseInt(projectId),
                elemento_id: elementId ?? null
            },
            include: {
                Usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                }
            },
            orderBy: {
                fecha_creacion: 'desc'
            }
        });

        res.json(comentarios);
    } catch (error) {
        console.error('Error al obtener comentarios del elemento:', error);
        res.status(500).json({ error: 'Error al obtener comentarios del elemento' });
    }
};

// Actualizar estado de un comentario (marcar como resuelto, etc)
export const updateCommentStatus = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const { estado } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!commentId) {
            return res.status(400).json({ error: 'Falta el parámetro commentId' });
        }
        // Obtener el comentario
        const comentario = await prisma.comentario.findUnique({
            where: { id_comentario: parseInt(commentId) },
            include: {
                Proyecto: {
                    include: {
                        Detalle_Proyecto: true
                    }
                }
            }
        });

        if (!comentario) {
            return res.status(404).json({ error: 'Comentario no encontrado' });
        }

        // Verificar que el usuario es el creador del proyecto o el autor del comentario
        const esColaborador = comentario.Proyecto.Detalle_Proyecto.some(
            d => d.id_usuario === userId
        );

        if (!esColaborador && comentario.id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para actualizar este comentario' });
        }

        const comentarioActualizado = await prisma.comentario.update({
            where: { id_comentario: parseInt(commentId) },
            data: {
                estado,
                fecha_resolucion: estado === 'resuelto' ? new Date() : null
            },
            include: {
                Usuario: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                }
            }
        });

        res.json(comentarioActualizado);
    } catch (error) {
        console.error('Error al actualizar comentario:', error);
        res.status(500).json({ error: 'Error al actualizar comentario' });
    }
};

// Eliminar un comentario
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!commentId) {
            return res.status(400).json({ error: 'Falta el parámetro commentId' });
        }
        const comentario = await prisma.comentario.findUnique({
            where: { id_comentario: parseInt(commentId) }
        });

        if (!comentario) {
            return res.status(404).json({ error: 'Comentario no encontrado' });
        }

        // Solo el autor puede eliminar su comentario
        if (comentario.id_usuario !== userId) {
            return res.status(403).json({ error: 'Solo el autor puede eliminar el comentario' });
        }

        await prisma.comentario.delete({
            where: { id_comentario: parseInt(commentId) }
        });

        res.json({ message: 'Comentario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        res.status(500).json({ error: 'Error al eliminar comentario' });
    }
};
