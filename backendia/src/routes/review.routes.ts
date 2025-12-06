import { Router } from 'express';
import {
    createReviewRequest,
    getMyReviewRequests,
    getReceivedReviewRequests,
    respondToReviewRequest,
    completeReview,
    cancelReviewRequest
} from '../controllers/review.controllers.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear solicitud de revisión (estudiante)
router.post('/', createReviewRequest);

// Obtener mis solicitudes enviadas (estudiante)
router.get('/my-requests', getMyReviewRequests);

// Obtener solicitudes recibidas (docente)
router.get('/received', getReceivedReviewRequests);

// Responder a solicitud (docente)
router.put('/:requestId/respond', respondToReviewRequest);

// Completar revisión (docente)
router.put('/:requestId/complete', completeReview);

// Cancelar solicitud (estudiante)
router.delete('/:requestId', cancelReviewRequest);

export default router;
