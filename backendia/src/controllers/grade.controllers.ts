import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear o actualizar calificación 
export const upsertGrade = async (req: Request, res: Response) => {
    try {
        const { id_proyecto, nota, nota_maxima, comentario } = req.body;
        const docenteId = (req as any).userId;

        // Verificar que el usuario es docente
        const docente = await prisma.usuario.findUnique({
            where: { id_usuario: docenteId }
        });

        if (!docente || docente.rol !== 'docente') {
            return res.status(403).json({ error: 'Solo los docentes pueden calificar proyectos' });
        }

        // Verificar que el docente tiene acceso al proyecto
        const acceso = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: docenteId,
                id_proyecto: parseInt(id_proyecto)
            }
        });

        if (!acceso) {
            return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
        }

        // Crear o actualizar calificación
        const calificacion = await prisma.calificacion.upsert({
            where: {
                id_proyecto_id_docente: {
                    id_proyecto: parseInt(id_proyecto),
                    id_docente: docenteId
                }
            },
            update: {
                nota,
                nota_maxima: nota_maxima || 100,
                comentario,
                fecha_actualizacion: new Date()
            },
            create: {
                id_proyecto: parseInt(id_proyecto),
                id_docente: docenteId,
                nota,
                nota_maxima: nota_maxima || 100,
                comentario
            },
            include: {
                Docente: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                }
            }
        });

        res.json(calificacion);
    } catch (error) {
        console.error('Error al calificar proyecto:', error);
        res.status(500).json({ error: 'Error al calificar proyecto' });
    }
};

// Obtener calificaciones de un proyecto
export const getProjectGrades = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = (req as any).userId;

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

        const calificaciones = await prisma.calificacion.findMany({
            where: {
                id_proyecto: parseInt(projectId)
            },
            include: {
                Docente: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                        rol: true
                    }
                }
            },
            orderBy: {
                fecha_calificacion: 'desc'
            }
        });

        // Calcular promedio si hay múltiples calificaciones
        let promedio = null;
        if (calificaciones.length > 0) {
            const suma = calificaciones.reduce((acc, cal) => {
                const notaRelativa = (Number(cal.nota) / Number(cal.nota_maxima)) * 100;
                return acc + notaRelativa;
            }, 0);
            promedio = suma / calificaciones.length;
        }

        res.json({
            calificaciones,
            promedio,
            total_calificaciones: calificaciones.length
        });
    } catch (error) {
        console.error('Error al obtener calificaciones:', error);
        res.status(500).json({ error: 'Error al obtener calificaciones' });
    }
};

// Eliminar calificación (solo el docente que la creó)
export const deleteGrade = async (req: Request, res: Response) => {
    try {
        const { gradeId } = req.params;
        const userId = (req as any).userId;

        const calificacion = await prisma.calificacion.findUnique({
            where: { id_calificacion: parseInt(gradeId) }
        });

        if (!calificacion) {
            return res.status(404).json({ error: 'Calificación no encontrada' });
        }

        // Solo el docente que creó la calificación puede eliminarla
        if (calificacion.id_docente !== userId) {
            return res.status(403).json({ error: 'Solo puedes eliminar tus propias calificaciones' });
        }

        await prisma.calificacion.delete({
            where: { id_calificacion: parseInt(gradeId) }
        });

        res.json({ message: 'Calificación eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar calificación:', error);
        res.status(500).json({ error: 'Error al eliminar calificación' });
    }
};

// Obtener proyectos del docente para revisar (dashboard del docente)
export const getDocenteProjects = async (req: Request, res: Response) => {
    try {
        const docenteId = (req as any).userId;

        // Verificar que es docente
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: docenteId }
        });

        if (!usuario || usuario.rol !== 'docente') {
            return res.status(403).json({ error: 'Solo docentes pueden acceder a esta información' });
        }

        // Obtener proyectos donde el docente es colaborador
        const proyectos = await prisma.detalle_Proyecto.findMany({
            where: {
                id_usuario: docenteId
            },
            include: {
                Proyecto: {
                    include: {
                        Calificaciones: {
                            where: {
                                id_docente: docenteId
                            }
                        },
                        Detalle_Proyecto: {
                            include: {
                                Usuario: {
                                    select: {
                                        id_usuario: true,
                                        nombre: true,
                                        correo: true,
                                        rol: true
                                    }
                                },
                                Permisos: true
                            }
                        }
                    }
                }
            }
        });

        // Formatear respuesta
        const proyectosFormateados = proyectos.map(detalle => {
            const proyecto = detalle.Proyecto;
            const estudiante = proyecto.Detalle_Proyecto.find(d => d.Usuario.rol === 'estudiante');
            const miCalificacion = proyecto.Calificaciones[0];

            return {
                id_proyecto: proyecto.id_proyecto,
                titulo: proyecto.titulo,
                fecha_inicio: proyecto.fecha_inicio,
                estado: proyecto.estado,
                estudiante: estudiante?.Usuario,
                calificacion: miCalificacion ? {
                    nota: miCalificacion.nota,
                    nota_maxima: miCalificacion.nota_maxima,
                    comentario: miCalificacion.comentario,
                    fecha: miCalificacion.fecha_calificacion
                } : null,
                ya_calificado: !!miCalificacion
            };
        });

        res.json(proyectosFormateados);
    } catch (error) {
        console.error('Error al obtener proyectos del docente:', error);
        res.status(500).json({ error: 'Error al obtener proyectos' });
    }
};
