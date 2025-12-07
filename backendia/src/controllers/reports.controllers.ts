// @ts-nocheck
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===================================
// 1. REPORTE DE PROGRESO INDIVIDUAL
// ===================================
export const getIndividualProgress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Obtener proyectos del usuario
        const userProjects = await prisma.detalle_Proyecto.findMany({
            where: { id_usuario: userId },
            include: {
                Proyecto: true,
                Permisos: true,
            },
        });

        const projectIds = userProjects.map((dp) => dp.id_proyecto);

        // Calificaciones recibidas
        const grades = await prisma.calificacion.findMany({
            where: { id_proyecto: { in: projectIds } },
            include: {
                Proyecto: { select: { titulo: true } },
                Docente: { select: { nombre: true, correo: true } },
            },
            orderBy: { fecha_calificacion: 'desc' },
        });

        // Comentarios recibidos en proyectos del usuario
        const comments = await prisma.comentario.findMany({
            where: { id_proyecto: { in: projectIds } },
            include: {
                Proyecto: { select: { titulo: true } },
                Usuario: { select: { nombre: true, correo: true } },
            },
        });

        // Solicitudes de revisión enviadas
        const reviewRequests = await prisma.solicitudRevision.findMany({
            where: { id_estudiante: userId },
            include: {
                Proyecto: { select: { titulo: true } },
                Docente: { select: { nombre: true, correo: true } },
            },
            orderBy: { fecha_solicitud: 'desc' },
        });

        // Invitaciones (enviadas y recibidas)
        const invitationsSent = await prisma.invitacion.findMany({
            where: { id_remitente: userId },
            include: {
                Proyecto: { select: { titulo: true } },
                Destinatario: { select: { nombre: true, correo: true } },
            },
        });

        const invitationsReceived = await prisma.invitacion.findMany({
            where: { id_destinatario: userId },
            include: {
                Proyecto: { select: { titulo: true } },
                Remitente: { select: { nombre: true, correo: true } },
            },
        });

        // Calcular estadísticas
        const totalProjects = userProjects.length;
        const createdProjects = userProjects.filter((dp) => dp.Permisos.descripcion === 'creador').length;
        const collaborations = totalProjects - createdProjects;

        const averageGrade = grades.length > 0
            ? grades.reduce((sum, g) => sum + Number(g.nota), 0) / grades.length
            : 0;

        const commentsStats = {
            total: comments.length,
            pending: comments.filter((c) => c.estado === 'pendiente').length,
            resolved: comments.filter((c) => c.estado === 'resuelto').length,
            byType: {
                comentario: comments.filter((c) => c.tipo === 'comentario').length,
                correccion: comments.filter((c) => c.tipo === 'correccion').length,
                sugerencia: comments.filter((c) => c.tipo === 'sugerencia').length,
            },
        };

        const reviewStats = {
            total: reviewRequests.length,
            pending: reviewRequests.filter((r) => r.estado === 'pendiente').length,
            accepted: reviewRequests.filter((r) => r.estado === 'aceptada').length,
            completed: reviewRequests.filter((r) => r.estado === 'completada').length,
        };

        res.json({
            summary: {
                totalProjects,
                createdProjects,
                collaborations,
                averageGrade: parseFloat(averageGrade.toFixed(2)),
            },
            projects: userProjects.map((dp) => ({
                id: dp.Proyecto.id_proyecto,
                titulo: dp.Proyecto.titulo,
                estado: dp.Proyecto.estado,
                rol: dp.Permisos.descripcion,
                fecha_inicio: dp.Proyecto.fecha_inicio,
            })),
            grades: grades.map((g) => ({
                proyecto: g.Proyecto.titulo,
                nota: Number(g.nota),
                nota_maxima: Number(g.nota_maxima),
                comentario: g.comentario,
                docente: g.Docente.nombre || g.Docente.correo,
                fecha: g.fecha_calificacion,
            })),
            comments: {
                stats: commentsStats,
                recent: comments.slice(0, 10).map((c) => ({
                    proyecto: c.Proyecto.titulo,
                    tipo: c.tipo,
                    estado: c.estado,
                    contenido: c.contenido,
                    autor: c.Usuario.nombre || c.Usuario.correo,
                    fecha: c.fecha_creacion,
                })),
            },
            reviewRequests: {
                stats: reviewStats,
                list: reviewRequests.slice(0, 10).map((r) => ({
                    proyecto: r.Proyecto.titulo,
                    docente: r.Docente.nombre || r.Docente.correo,
                    estado: r.estado,
                    mensaje: r.mensaje,
                    fecha_solicitud: r.fecha_solicitud,
                    fecha_respuesta: r.fecha_respuesta,
                })),
            },
            invitations: {
                sent: invitationsSent.length,
                received: invitationsReceived.length,
                accepted: invitationsReceived.filter((i) => i.estado === 'aceptada').length,
            },
        });
    } catch (error) {
        console.error('Error en getIndividualProgress:', error);
        res.status(500).json({ error: 'Error al obtener reporte de progreso individual' });
    }
};

// ===================================
// 2. DASHBOARD DEL ESTUDIANTE
// ===================================
export const getStudentDashboard = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Proyectos del usuario
        const userProjects = await prisma.detalle_Proyecto.findMany({
            where: { id_usuario: userId },
            include: {
                Proyecto: true,
                Permisos: true,
            },
            orderBy: { Proyecto: { fecha_inicio: 'desc' } },
        });

        const projectIds = userProjects.map((dp) => dp.id_proyecto);

        // Comentarios pendientes
        const pendingComments = await prisma.comentario.findMany({
            where: {
                id_proyecto: { in: projectIds },
                estado: 'pendiente',
            },
            include: {
                Proyecto: { select: { titulo: true } },
                Usuario: { select: { nombre: true, correo: true } },
            },
            orderBy: { fecha_creacion: 'desc' },
            take: 5,
        });

        // Calificaciones recientes
        const recentGrades = await prisma.calificacion.findMany({
            where: { id_proyecto: { in: projectIds } },
            include: {
                Proyecto: { select: { titulo: true } },
                Docente: { select: { nombre: true, correo: true } },
            },
            orderBy: { fecha_calificacion: 'desc' },
            take: 5,
        });

        // Solicitudes de revisión pendientes
        const pendingReviews = await prisma.solicitudRevision.findMany({
            where: {
                id_estudiante: userId,
                estado: { in: ['pendiente', 'aceptada'] },
            },
            include: {
                Proyecto: { select: { titulo: true } },
                Docente: { select: { nombre: true, correo: true } },
            },
            orderBy: { fecha_solicitud: 'desc' },
        });

        // Invitaciones pendientes
        const pendingInvitations = await prisma.invitacion.findMany({
            where: {
                id_destinatario: userId,
                estado: 'pendiente',
            },
            include: {
                Proyecto: { select: { titulo: true } },
                Remitente: { select: { nombre: true, correo: true } },
                Permiso: { select: { descripcion: true } },
            },
            orderBy: { fecha_envio: 'desc' },
        });

        // Actividad reciente (últimas 10 acciones)
        const recentActivity = await prisma.acciones_Proyecto.findMany({
            where: {
                Detalle_Proyecto: {
                    id_usuario: userId,
                },
            },
            include: {
                Detalle_Proyecto: {
                    include: {
                        Proyecto: { select: { titulo: true } },
                    },
                },
            },
            orderBy: { fecha_hora: 'desc' },
            take: 10,
        });

        res.json({
            overview: {
                totalProjects: userProjects.length,
                pendingComments: pendingComments.length,
                pendingReviews: pendingReviews.length,
                pendingInvitations: pendingInvitations.length,
                averageGrade: recentGrades.length > 0
                    ? parseFloat((recentGrades.reduce((sum, g) => sum + Number(g.nota), 0) / recentGrades.length).toFixed(2))
                    : 0,
            },
            projects: userProjects.slice(0, 5).map((dp) => ({
                id: dp.Proyecto.id_proyecto,
                titulo: dp.Proyecto.titulo,
                estado: dp.Proyecto.estado,
                rol: dp.Permisos.descripcion,
                fecha_inicio: dp.Proyecto.fecha_inicio,
            })),
            pendingComments: pendingComments.map((c) => ({
                id: c.id_comentario,
                proyecto: c.Proyecto.titulo,
                tipo: c.tipo,
                contenido: c.contenido,
                autor: c.Usuario.nombre || c.Usuario.correo,
                fecha: c.fecha_creacion,
            })),
            recentGrades: recentGrades.map((g) => ({
                proyecto: g.Proyecto.titulo,
                nota: Number(g.nota),
                nota_maxima: Number(g.nota_maxima),
                comentario: g.comentario,
                docente: g.Docente.nombre || g.Docente.correo,
                fecha: g.fecha_calificacion,
            })),
            pendingReviews: pendingReviews.map((r) => ({
                proyecto: r.Proyecto.titulo,
                docente: r.Docente.nombre || r.Docente.correo,
                estado: r.estado,
                fecha_solicitud: r.fecha_solicitud,
            })),
            pendingInvitations: pendingInvitations.map((i) => ({
                id: i.id_invitacion,
                proyecto: i.Proyecto.titulo,
                remitente: i.Remitente.nombre || i.Remitente.correo,
                rol: i.Permiso.descripcion,
                fecha: i.fecha_envio,
            })),
            recentActivity: recentActivity.map((a) => ({
                accion: a.accion,
                proyecto: a.Detalle_Proyecto.Proyecto.titulo,
                fecha: a.fecha_hora,
            })),
        });
    } catch (error) {
        console.error('Error en getStudentDashboard:', error);
        res.status(500).json({ error: 'Error al obtener dashboard del estudiante' });
    }
};

// ===================================
// 3. REPORTE DE COLABORACIÓN
// ===================================
export const getCollaborationReport = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Verificar que el usuario tiene acceso al proyecto
        const userAccess = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: userId,
                id_proyecto: parseInt(projectId),
            },
        });

        if (!userAccess) {
            return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
        }

        // Obtener todos los colaboradores
        const collaborators = await prisma.detalle_Proyecto.findMany({
            where: { id_proyecto: parseInt(projectId) },
            include: {
                Usuario: { select: { id_usuario: true, nombre: true, correo: true } },
                Permisos: true,
                Acciones_Proyecto: {
                    orderBy: { fecha_hora: 'asc' },
                },
            },
        });

        // Invitaciones del proyecto
        const invitations = await prisma.invitacion.findMany({
            where: { id_proyecto: parseInt(projectId) },
            include: {
                Remitente: { select: { nombre: true, correo: true } },
                Destinatario: { select: { nombre: true, correo: true } },
                Permiso: { select: { descripcion: true } },
            },
            orderBy: { fecha_envio: 'desc' },
        });

        // Comentarios por colaborador
        const comments = await prisma.comentario.findMany({
            where: { id_proyecto: parseInt(projectId) },
            include: {
                Usuario: { select: { id_usuario: true, nombre: true, correo: true } },
            },
        });

        // Analizar actividad por colaborador
        const collaboratorStats = collaborators.map((collab) => {
            const userComments = comments.filter((c) => c.id_usuario === collab.id_usuario);
            const actions = collab.Acciones_Proyecto;

            return {
                userId: collab.Usuario.id_usuario,
                nombre: collab.Usuario.nombre || collab.Usuario.correo,
                correo: collab.Usuario.correo,
                rol: collab.Permisos.descripcion,
                isCreator: collab.Permisos.descripcion === 'creador',
                stats: {
                    totalActions: actions.length,
                    commentsGiven: userComments.length,
                    firstActivity: actions.length > 0 ? actions[0].fecha_hora : null,
                    lastActivity: actions.length > 0 ? actions[actions.length - 1].fecha_hora : null,
                },
            };
        });

        // Distribución de roles
        const roleDistribution = {
            creador: collaborators.filter((c) => c.Permisos.descripcion === 'creador').length,
            editor: collaborators.filter((c) => c.Permisos.descripcion === 'editor').length,
            vista: collaborators.filter((c) => c.Permisos.descripcion === 'vista').length,
        };

        // Estadísticas de invitaciones
        const invitationStats = {
            total: invitations.length,
            accepted: invitations.filter((i) => i.estado === 'aceptada').length,
            pending: invitations.filter((i) => i.estado === 'pendiente').length,
            rejected: invitations.filter((i) => i.estado === 'rechazada').length,
            averageResponseTime: 0, // Calcular si hay fechas de respuesta
        };

        // Calcular tiempo promedio de respuesta
        const responseTimes = invitations
            .filter((i) => i.fecha_respuesta)
            .map((i) => {
                const sent = new Date(i.fecha_envio).getTime();
                const responded = new Date(i.fecha_respuesta!).getTime();
                return responded - sent;
            });

        if (responseTimes.length > 0) {
            const avgMs = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
            invitationStats.averageResponseTime = Math.round(avgMs / (1000 * 60 * 60)); // en horas
        }

        res.json({
            summary: {
                totalCollaborators: collaborators.length,
                roleDistribution,
                totalActions: collaborators.reduce((sum, c) => sum + c.Acciones_Proyecto.length, 0),
                totalComments: comments.length,
            },
            collaborators: collaboratorStats,
            invitations: {
                stats: invitationStats,
                list: invitations.map((i) => ({
                    remitente: i.Remitente.nombre || i.Remitente.correo,
                    destinatario: i.Destinatario.nombre || i.Destinatario.correo,
                    rol: i.Permiso.descripcion,
                    estado: i.estado,
                    fecha_envio: i.fecha_envio,
                    fecha_respuesta: i.fecha_respuesta,
                })),
            },
        });
    } catch (error) {
        console.error('Error en getCollaborationReport:', error);
        res.status(500).json({ error: 'Error al obtener reporte de colaboración' });
    }
};

// ===================================
// 4. REPORTE DE PROYECTOS PENDIENTES (DOCENTE)
// ===================================
export const getPendingProjectsReport = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        console.log('📊 getPendingProjectsReport - userId:', userId);

        // Verificar que el usuario es docente
        const user = await prisma.usuario.findUnique({
            where: { id_usuario: userId },
        });

        if (user?.rol !== 'docente') {
            console.log('❌ Usuario no es docente, rol:', user?.rol);
            return res.status(403).json({ error: 'Solo docentes pueden acceder a este reporte' });
        }
        console.log('✅ Usuario es docente');

        // Solicitudes de revisión pendientes
        const pendingReviews = await prisma.solicitudRevision.findMany({
            where: {
                id_docente: userId,
                estado: { in: ['pendiente', 'aceptada'] },
            },
            include: {
                Proyecto: {
                    include: {
                        Detalle_Proyecto: {
                            where: { Permisos: { descripcion: 'creador' } },
                            include: { Usuario: { select: { nombre: true, correo: true } } },
                        },
                    },
                },
                Estudiante: { select: { nombre: true, correo: true } },
            },
            orderBy: { fecha_solicitud: 'asc' },
        });
        console.log('✅ Solicitudes de revisión encontradas:', pendingReviews.length);

        // Proyectos en los que participa como colaborador
        const collaboratingProjects = await prisma.detalle_Proyecto.findMany({
            where: { id_usuario: userId },
            include: {
                Proyecto: true,
                Permisos: true,
            },
        });

        const collabProjectIds = collaboratingProjects.map((dp) => dp.id_proyecto);

        // Proyectos sin calificar (donde el docente tiene acceso)
        const ungradedProjects = await prisma.proyecto.findMany({
            where: {
                id_proyecto: { in: collabProjectIds },
                Calificaciones: {
                    none: { id_docente: userId },
                },
            },
            include: {
                Detalle_Proyecto: {
                    where: { Permisos: { descripcion: 'creador' } },
                    include: { Usuario: { select: { nombre: true, correo: true } } },
                },
            },
        });

        // Comentarios pendientes de resolver en proyectos del docente
        const unresolvedComments = await prisma.comentario.findMany({
            where: {
                id_usuario: userId,
                estado: 'pendiente',
            },
            include: {
                Proyecto: { select: { titulo: true } },
            },
        });

        // Calcular tiempos de espera
        const now = new Date();
        const reviewsWithWaitTime = pendingReviews.map((r) => {
            const waitTime = now.getTime() - new Date(r.fecha_solicitud).getTime();
            const waitDays = Math.floor(waitTime / (1000 * 60 * 60 * 24));
            const creadorData = r.Proyecto.Detalle_Proyecto?.[0]?.Usuario;
            return {
                proyecto: r.Proyecto.titulo,
                estudiante: r.Estudiante.nombre || r.Estudiante.correo,
                creador: creadorData ? (creadorData.nombre || creadorData.correo) : 'Desconocido',
                mensaje: r.mensaje,
                estado: r.estado,
                fecha_solicitud: r.fecha_solicitud,
                waitDays,
                urgent: waitDays > 7, // Urgente si ha esperado más de 7 días
            };
        });

        res.json({
            summary: {
                totalPendingReviews: pendingReviews.length,
                urgentReviews: reviewsWithWaitTime.filter((r) => r.urgent).length,
                ungradedProjects: ungradedProjects.length,
                unresolvedComments: unresolvedComments.length,
            },
            pendingReviews: reviewsWithWaitTime,
            ungradedProjects: ungradedProjects.map((p) => {
                const creadorData = p.Detalle_Proyecto?.[0]?.Usuario;
                return {
                    id: p.id_proyecto,
                    titulo: p.titulo,
                    estado: p.estado,
                    fecha_inicio: p.fecha_inicio,
                    creador: creadorData ? (creadorData.nombre || creadorData.correo) : 'Desconocido',
                };
            }),
            unresolvedComments: unresolvedComments.map((c) => ({
                proyecto: c.Proyecto.titulo,
                tipo: c.tipo,
                contenido: c.contenido,
                fecha: c.fecha_creacion,
            })),
        });
    } catch (error) {
        console.error('Error en getPendingProjectsReport:', error);
        res.status(500).json({ error: 'Error al obtener reporte de proyectos pendientes' });
    }
};

// ===================================
// 5. EVOLUCIÓN DEL DIAGRAMA
// ===================================
export const getDiagramEvolution = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Verificar acceso al proyecto
        const userAccess = await prisma.detalle_Proyecto.findFirst({
            where: {
                id_usuario: userId,
                id_proyecto: parseInt(projectId),
            },
        });

        if (!userAccess) {
            return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
        }

        // Obtener proyecto con diagrama actual
        const project = await prisma.proyecto.findUnique({
            where: { id_proyecto: parseInt(projectId) },
        });

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        // Obtener historial de acciones
        const actions = await prisma.acciones_Proyecto.findMany({
            where: {
                Detalle_Proyecto: {
                    id_proyecto: parseInt(projectId),
                },
            },
            include: {
                Detalle_Proyecto: {
                    include: {
                        Usuario: { select: { nombre: true, correo: true } },
                    },
                },
            },
            orderBy: { fecha_hora: 'asc' },
        });

        // Analizar el diagrama actual
        const diagramData = project.diagrama_json as any;
        let currentStats = {
            totalClasses: 0,
            totalRelations: 0,
            totalAttributes: 0,
            totalMethods: 0,
        };

        if (diagramData && diagramData.classes) {
            currentStats.totalClasses = diagramData.classes.length;
            currentStats.totalAttributes = diagramData.classes.reduce(
                (sum: number, cls: any) => sum + (cls.attributes?.length || 0),
                0
            );
            currentStats.totalMethods = diagramData.classes.reduce(
                (sum: number, cls: any) => sum + (cls.methods?.length || 0),
                0
            );
        }

        if (diagramData && diagramData.relations) {
            currentStats.totalRelations = diagramData.relations.length;
        }

        // Agrupar acciones por tipo
        const actionsByType = {
            classAdded: actions.filter((a) => a.accion.includes('agregó clase') || a.accion.includes('added class')).length,
            classUpdated: actions.filter((a) => a.accion.includes('actualizó clase') || a.accion.includes('updated class')).length,
            classDeleted: actions.filter((a) => a.accion.includes('eliminó clase') || a.accion.includes('deleted class')).length,
            relationAdded: actions.filter((a) => a.accion.includes('agregó relación') || a.accion.includes('added relation')).length,
            relationDeleted: actions.filter((a) => a.accion.includes('eliminó relación') || a.accion.includes('deleted relation')).length,
            diagramUpdated: actions.filter((a) => a.accion.includes('actualizó diagrama') || a.accion.includes('updated diagram')).length,
        };

        // Timeline de eventos importantes (milestones)
        const milestones = [];
        const firstClassAction = actions.find((a) => a.accion.includes('agregó clase'));
        if (firstClassAction) {
            milestones.push({
                evento: 'Primera clase creada',
                fecha: firstClassAction.fecha_hora,
                usuario: firstClassAction.Detalle_Proyecto.Usuario.nombre || firstClassAction.Detalle_Proyecto.Usuario.correo,
            });
        }

        const firstRelationAction = actions.find((a) => a.accion.includes('agregó relación'));
        if (firstRelationAction) {
            milestones.push({
                evento: 'Primera relación creada',
                fecha: firstRelationAction.fecha_hora,
                usuario: firstRelationAction.Detalle_Proyecto.Usuario.nombre || firstRelationAction.Detalle_Proyecto.Usuario.correo,
            });
        }

        // Actividad por día
        const activityByDay: { [key: string]: number } = {};
        actions.forEach((a) => {
            const date = new Date(a.fecha_hora).toISOString().split('T')[0];
            activityByDay[date] = (activityByDay[date] || 0) + 1;
        });

        const activityTimeline = Object.entries(activityByDay).map(([date, count]) => ({
            date,
            actions: count,
        }));

        // Periodos de actividad
        const firstActivity = actions.length > 0 ? actions[0].fecha_hora : null;
        const lastActivity = actions.length > 0 ? actions[actions.length - 1].fecha_hora : null;

        let totalDays = 0;
        if (firstActivity && lastActivity) {
            const diff = new Date(lastActivity).getTime() - new Date(firstActivity).getTime();
            totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        res.json({
            summary: {
                projectTitle: project.titulo,
                currentStats,
                totalActions: actions.length,
                totalDays,
                activityRate: totalDays > 0 ? (actions.length / totalDays).toFixed(2) : 0,
            },
            actionsByType,
            milestones,
            activityTimeline,
            recentActions: actions.slice(-20).map((a) => ({
                accion: a.accion,
                usuario: a.Detalle_Proyecto.Usuario.nombre || a.Detalle_Proyecto.Usuario.correo,
                fecha: a.fecha_hora,
            })),
        });
    } catch (error) {
        console.error('Error en getDiagramEvolution:', error);
        res.status(500).json({ error: 'Error al obtener evolución del diagrama' });
    }
};
