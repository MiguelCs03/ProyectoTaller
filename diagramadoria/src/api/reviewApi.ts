import axiosInstance from './axiosInstance';

export interface ReviewRequest {
    id_solicitud: number;
    id_proyecto: number;
    id_estudiante: number;
    id_docente: number;
    mensaje?: string;
    estado: 'pendiente' | 'aceptada' | 'rechazada' | 'completada';
    fecha_solicitud: string;
    fecha_respuesta?: string;
    fecha_completada?: string;
    Docente?: {
        id_usuario: number;
        nombre?: string;
        correo: string;
    };
    Estudiante?: {
        id_usuario: number;
        nombre?: string;
        correo: string;
    };
    Proyecto?: {
        id_proyecto: number;
        titulo: string;
    };
}

export interface CreateReviewRequestData {
    id_proyecto: number;
    correo_docente: string;
    mensaje?: string;
}

export const reviewApi = {
    // Crear solicitud de revisión (estudiante)
    createRequest: async (data: CreateReviewRequestData): Promise<ReviewRequest> => {
        const response = await axiosInstance.post('/reviews', data);
        return response.data;
    },

    // Obtener mis solicitudes enviadas (estudiante)
    getMyRequests: async (): Promise<ReviewRequest[]> => {
        const response = await axiosInstance.get('/reviews/my-requests');
        return response.data;
    },

    // Obtener solicitudes recibidas (docente)
    getReceivedRequests: async (): Promise<ReviewRequest[]> => {
        const response = await axiosInstance.get('/reviews/received');
        return response.data;
    },

    // Responder a solicitud (docente)
    respondToRequest: async (
        requestId: number,
        respuesta: 'aceptada' | 'rechazada'
    ): Promise<ReviewRequest> => {
        const response = await axiosInstance.put(`/reviews/${requestId}/respond`, { respuesta });
        return response.data;
    },

    // Completar revisión (docente)
    completeReview: async (requestId: number): Promise<ReviewRequest> => {
        const response = await axiosInstance.put(`/reviews/${requestId}/complete`);
        return response.data;
    },

    // Cancelar solicitud (estudiante)
    cancelRequest: async (requestId: number): Promise<void> => {
        await axiosInstance.delete(`/reviews/${requestId}`);
    }
};

export default reviewApi;
