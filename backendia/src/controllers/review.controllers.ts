import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear solicitud de revisión (estudiante solicita a docente)
export const createReviewRequest = async (req: Request, res: Response) => {
    try {
        const { id_proyecto, correo_docente, mensaje } = req.body;
        const estudianteId = (req as any).userId;

        // Verificar que el usuario es estudiante
        const estudiante = await prisma.usuario.findUnique({
            where: { id_usuario: estudianteId }
        });

        if (!estudiante || estudiante.rol !== 'estudiante') {
            return res.status(403).json({ error: 'Solo los estudiantes pueden solicitar revisiones' });
        }

        // Verificar que el estudiante es creador del proyecto
        const proyecto = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: estudianteId,
                id_proyecto: parseInt(id_proyecto)
            },
            include: { Permisos: true }
        });

        if (!proyecto || proyecto.Permisos.descripcion !== 'creador') {
            return res.status(403).json({ error: 'Solo el creador del proyecto puede solicitar revisiones' });
        }

        // Buscar docente
        const docente = await prisma.usuario.findUnique({
            where: { correo: correo_docente }
        });

        if (!docente) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        if (docente.rol !== 'docente') {
            return res.status(400).json({ error: 'El usuario no es un docente' });
        }

        // Verificar si ya existe una solicitud
        const solicitudExistente = await prisma.solicitudRevision.findUnique({
            where: {
                id_proyecto_id_docente: {
                    id_proyecto: parseInt(id_proyecto),
                    id_docente: docente.id_usuario
                }
            }
        });

        if (solicitudExistente) {
            if (solicitudExistente.estado === 'pendiente') {
                return res.status(409).json({ error: 'Ya existe una solicitud pendiente para este docente' });
            }
            // Si fue rechazada o completada, permitir crear una nueva
            await prisma.solicitudRevision.delete({
                where: { id_solicitud: solicitudExistente.id_solicitud }
            });
        }

        // Crear solicitud
        const solicitud = await prisma.solicitudRevision.create({
            data: {
                id_proyecto: parseInt(id_proyecto),
                id_estudiante: estudianteId,
                id_docente: docente.id_usuario,
                mensaje: mensaje || undefined,
                estado: 'pendiente'
            },
            include: {
                Docente: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                },
                Proyecto: {
                    select: {
                        id_proyecto: true,
                        titulo: true
                    }
                }
            }
        });

        res.status(201).json(solicitud);
    } catch (error) {
        console.error('❌ Error al crear solicitud de revisión:', error);
        console.error('Detalles del error:', {
            message: (error as Error).message,
            stack: (error as Error).stack,
            body: req.body,
            userId: (req as any).userId
        });
        res.status(500).json({
            error: 'Error al crear solicitud de revisión',
            details: (error as Error).message
        });
    }
};

// Obtener solicitudes enviadas (estudiante)
export const getMyReviewRequests = async (req: Request, res: Response) => {
    try {
        const estudianteId = (req as any).userId;

        const solicitudes = await prisma.solicitudRevision.findMany({
            where: {
                id_estudiante: estudianteId
            },
            include: {
                Docente: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true
                    }
                },
                Proyecto: {
                    select: {
                        id_proyecto: true,
                        titulo: true
                    }
                }
            },
            orderBy: {
                fecha_solicitud: 'desc'
            }
        });

        res.json(solicitudes);
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
};

// Obtener solicitudes recibidas (docente)
export const getReceivedReviewRequests = async (req: Request, res: Response) => {
    try {
        const docenteId = (req as any).userId;

        const solicitudes = await prisma.solicitudRevision.findMany({
            where: {
                id_docente: docenteId
            },
            include: {
                Estudiante: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true
                    }
                },
                Proyecto: {
                    select: {
                        id_proyecto: true,
                        titulo: true,
                        fecha_inicio: true
                    }
                }
            },
            orderBy: {
                fecha_solicitud: 'desc'
            }
        });

        res.json(solicitudes);
    } catch (error) {
        console.error('Error al obtener solicitudes recibidas:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes recibidas' });
    }
};

// Responder a solicitud (docente acepta/rechaza)
export const respondToReviewRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { respuesta } = req.body; // 'aceptada' o 'rechazada'
        const docenteId = (req as any).userId;

        const solicitud = await prisma.solicitudRevision.findUnique({
            where: { id_solicitud: parseInt(requestId) }
        });

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (solicitud.id_docente !== docenteId) {
            return res.status(403).json({ error: 'No tienes permiso para responder esta solicitud' });
        }

        if (solicitud.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Esta solicitud ya fue respondida' });
        }

        // Actualizar solicitud
        const solicitudActualizada = await prisma.solicitudRevision.update({
            where: { id_solicitud: parseInt(requestId) },
            data: {
                estado: respuesta,
                fecha_respuesta: new Date()
            },
            include: {
                Proyecto: true,
                Estudiante: {
                    select: {
                        nombre: true,
                        correo: true
                    }
                }
            }
        });

        // Si acepta, dar acceso temporal de vista al proyecto (opcional)
        if (respuesta === 'aceptada') {
            // Buscar permiso de "vista"
            const permisoVista = await prisma.permisos.findFirst({
                where: {
                    descripcion: { contains: 'vista', mode: 'insensitive' }
                }
            });

            if (permisoVista) {
                // Verificar si ya tiene acceso
                const accesoExistente = await prisma.detalle_Proyecto.findFirst({
                    where: {
                        id_usuario: docenteId,
                        id_proyecto: solicitud.id_proyecto
                    }
                });

                if (!accesoExistente) {
                    await prisma.detalle_Proyecto.create({
                        data: {
                            id_usuario: docenteId,
                            id_proyecto: solicitud.id_proyecto,
                            id_permiso: permisoVista.id_permiso
                        }
                    });
                }
            }
        }

        res.json(solicitudActualizada);
    } catch (error) {
        console.error('Error al responder solicitud:', error);
        res.status(500).json({ error: 'Error al responder solicitud' });
    }
};

// Marcar revisión como completada (docente)
export const completeReview = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const docenteId = (req as any).userId;

        const solicitud = await prisma.solicitudRevision.findUnique({
            where: { id_solicitud: parseInt(requestId) }
        });

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (solicitud.id_docente !== docenteId) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        if (solicitud.estado !== 'aceptada') {
            return res.status(400).json({ error: 'Solo puedes completar solicitudes aceptadas' });
        }

        const solicitudCompletada = await prisma.solicitudRevision.update({
            where: { id_solicitud: parseInt(requestId) },
            data: {
                estado: 'completada',
                fecha_completada: new Date()
            }
        });

        res.json(solicitudCompletada);
    } catch (error) {
        console.error('Error al completar revisión:', error);
        res.status(500).json({ error: 'Error al completar revisión' });
    }
};

// Cancelar solicitud (estudiante)
export const cancelReviewRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const estudianteId = (req as any).userId;

        const solicitud = await prisma.solicitudRevision.findUnique({
            where: { id_solicitud: parseInt(requestId) }
        });

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (solicitud.id_estudiante !== estudianteId) {
            return res.status(403).json({ error: 'No tienes permiso' });
        }

        if (solicitud.estado !== 'pendiente') {
            return res.status(400).json({ error: 'Solo puedes cancelar solicitudes pendientes' });
        }

        await prisma.solicitudRevision.delete({
            where: { id_solicitud: parseInt(requestId) }
        });

        res.json({ message: 'Solicitud cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar solicitud:', error);
        res.status(500).json({ error: 'Error al cancelar solicitud' });
    }
};
