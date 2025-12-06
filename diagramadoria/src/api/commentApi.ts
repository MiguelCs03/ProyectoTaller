import axiosInstance from './axiosInstance';

export interface Comment {
    id_comentario: number;
    id_proyecto: number;
    id_usuario: number;
    elemento_id?: string;
    elemento_tipo?: string;
    contenido: string;
    tipo: 'comentario' | 'correccion' | 'sugerencia';
    estado: 'pendiente' | 'resuelto' | 'descartado';
    fecha_creacion: string;
    fecha_resolucion?: string;
    Usuario: {
        id_usuario: number;
        nombre?: string;
        correo: string;
        rol: 'estudiante' | 'docente';
    };
}

export interface CreateCommentData {
    id_proyecto: number;
    elemento_id?: string;
    elemento_tipo?: string;
    contenido: string;
    tipo?: 'comentario' | 'correccion' | 'sugerencia';
}

export interface UpdateCommentStatusData {
    estado: 'pendiente' | 'resuelto' | 'descartado';
}

export const commentApi = {
    // Crear un nuevo comentario
    create: async (data: CreateCommentData): Promise<Comment> => {
        const response = await axiosInstance.post('/comments', data);
        return response.data;
    },

    // Obtener todos los comentarios de un proyecto
    getProjectComments: async (projectId: number): Promise<Comment[]> => {
        const response = await axiosInstance.get(`/comments/project/${projectId}`);
        return response.data;
    },

    // Obtener comentarios de un elemento específico
    getElementComments: async (projectId: number, elementId: string): Promise<Comment[]> => {
        const response = await axiosInstance.get(`/comments/project/${projectId}/element/${elementId}`);
        return response.data;
    },

    //  Actualizar el estado de un comentario
    updateStatus: async (commentId: number, data: UpdateCommentStatusData): Promise<Comment> => {
        const response = await axiosInstance.put(`/comments/${commentId}/status`, data);
        return response.data;
    },

    // Eliminar un comentario
    delete: async (commentId: number): Promise<void> => {
        await axiosInstance.delete(`/comments/${commentId}`);
    }
};

export default commentApi;
