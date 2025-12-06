import { Router } from 'express';
import {
    createComment,
    getProjectComments,
    getElementComments,
    updateCommentStatus,
    deleteComment
} from '../controllers/comment.controllers.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear comentario
router.post('/', createComment);

// Obtener comentarios de un proyecto
router.get('/project/:projectId', getProjectComments);

// Obtener comentarios de un elemento específico
router.get('/project/:projectId/element/:elementId', getElementComments);

// Actualizar estado de comentario
router.put('/:commentId/status', updateCommentStatus);

// Eliminar comentario
router.delete('/:commentId', deleteComment);

export default router;
