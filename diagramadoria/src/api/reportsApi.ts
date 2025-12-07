import axiosInstance from './axiosInstance';

// ===================================
// TIPOS DE DATOS
// ===================================

export interface IndividualProgressReport {
    summary: {
        totalProjects: number;
        createdProjects: number;
        collaborations: number;
        averageGrade: number;
    };
    projects: Array<{
        id: number;
        titulo: string;
        estado: string;
        rol: string;
        fecha_inicio: string;
    }>;
    grades: Array<{
        proyecto: string;
        nota: number;
        nota_maxima: number;
        comentario: string | null;
        docente: string;
        fecha: string;
    }>;
    comments: {
        stats: {
            total: number;
            pending: number;
            resolved: number;
            byType: {
                comentario: number;
                correccion: number;
                sugerencia: number;
            };
        };
        recent: Array<{
            proyecto: string;
            tipo: string;
            estado: string;
            contenido: string;
            autor: string;
            fecha: string;
        }>;
    };
    reviewRequests: {
        stats: {
            total: number;
            pending: number;
            accepted: number;
            completed: number;
        };
        list: Array<{
            proyecto: string;
            docente: string;
            estado: string;
            mensaje: string | null;
            fecha_solicitud: string;
            fecha_respuesta: string | null;
        }>;
    };
    invitations: {
        sent: number;
        received: number;
        accepted: number;
    };
}

export interface StudentDashboard {
    overview: {
        totalProjects: number;
        pendingComments: number;
        pendingReviews: number;
        pendingInvitations: number;
        averageGrade: number;
    };
    projects: Array<{
        id: number;
        titulo: string;
        estado: string;
        rol: string;
        fecha_inicio: string;
    }>;
    pendingComments: Array<{
        id: number;
        proyecto: string;
        tipo: string;
        contenido: string;
        autor: string;
        fecha: string;
    }>;
    recentGrades: Array<{
        proyecto: string;
        nota: number;
        nota_maxima: number;
        comentario: string | null;
        docente: string;
        fecha: string;
    }>;
    pendingReviews: Array<{
        proyecto: string;
        docente: string;
        estado: string;
        fecha_solicitud: string;
    }>;
    pendingInvitations: Array<{
        id: number;
        proyecto: string;
        remitente: string;
        rol: string;
        fecha: string;
    }>;
    recentActivity: Array<{
        accion: string;
        proyecto: string;
        fecha: string;
    }>;
}

export interface CollaborationReport {
    summary: {
        totalCollaborators: number;
        roleDistribution: {
            creador: number;
            editor: number;
            vista: number;
        };
        totalActions: number;
        totalComments: number;
    };
    collaborators: Array<{
        userId: number;
        nombre: string;
        correo: string;
        rol: string;
        isCreator: boolean;
        stats: {
            totalActions: number;
            commentsGiven: number;
            firstActivity: string | null;
            lastActivity: string | null;
        };
    }>;
    invitations: {
        stats: {
            total: number;
            accepted: number;
            pending: number;
            rejected: number;
            averageResponseTime: number;
        };
        list: Array<{
            remitente: string;
            destinatario: string;
            rol: string;
            estado: string;
            fecha_envio: string;
            fecha_respuesta: string | null;
        }>;
    };
}

export interface PendingProjectsReport {
    summary: {
        totalPendingReviews: number;
        urgentReviews: number;
        ungradedProjects: number;
        unresolvedComments: number;
    };
    pendingReviews: Array<{
        proyecto: string;
        estudiante: string;
        creador: string;
        mensaje: string | null;
        estado: string;
        fecha_solicitud: string;
        waitDays: number;
        urgent: boolean;
    }>;
    ungradedProjects: Array<{
        id: number;
        titulo: string;
        estado: string;
        fecha_inicio: string;
        creador: string;
    }>;
    unresolvedComments: Array<{
        proyecto: string;
        tipo: string;
        contenido: string;
        fecha: string;
    }>;
}

export interface DiagramEvolutionReport {
    summary: {
        projectTitle: string;
        currentStats: {
            totalClasses: number;
            totalRelations: number;
            totalAttributes: number;
            totalMethods: number;
        };
        totalActions: number;
        totalDays: number;
        activityRate: string;
    };
    actionsByType: {
        classAdded: number;
        classUpdated: number;
        classDeleted: number;
        relationAdded: number;
        relationDeleted: number;
        diagramUpdated: number;
    };
    milestones: Array<{
        evento: string;
        fecha: string;
        usuario: string;
    }>;
    activityTimeline: Array<{
        date: string;
        actions: number;
    }>;
    recentActions: Array<{
        accion: string;
        usuario: string;
        fecha: string;
    }>;
}

// ===================================
// API CALLS
// ===================================

// Reporte de progreso individual
export const getIndividualProgress = async (): Promise<IndividualProgressReport> => {
    const response = await axiosInstance.get('/reports/individual-progress');
    return response.data;
};

// Dashboard del estudiante
export const getStudentDashboard = async (): Promise<StudentDashboard> => {
    const response = await axiosInstance.get('/reports/student-dashboard');
    return response.data;
};

// Reporte de colaboración
export const getCollaborationReport = async (projectId: number): Promise<CollaborationReport> => {
    const response = await axiosInstance.get(`/reports/collaboration/${projectId}`);
    return response.data;
};

// Reporte de proyectos pendientes (docente)
export const getPendingProjectsReport = async (): Promise<PendingProjectsReport> => {
    const response = await axiosInstance.get('/reports/pending-projects');
    return response.data;
};

// Evolución del diagrama
export const getDiagramEvolution = async (projectId: number): Promise<DiagramEvolutionReport> => {
    const response = await axiosInstance.get(`/reports/diagram-evolution/${projectId}`);
    return response.data;
};

export default {
    getIndividualProgress,
    getStudentDashboard,
    getCollaborationReport,
    getPendingProjectsReport,
    getDiagramEvolution,
};
