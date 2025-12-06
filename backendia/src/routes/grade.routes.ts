import { Router } from 'express';
import {
    upsertGrade,
    getProjectGrades,
    deleteGrade,
    getDocenteProjects
} from '../controllers/grade.controllers.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear o actualizar calificación
router.post('/', upsertGrade);

// Obtener calificaciones de un proyecto
router.get('/project/:projectId', getProjectGrades);

// Eliminar calificación
router.delete('/:gradeId', deleteGrade);

// Obtener proyectos del docente (para su dashboard)
router.get('/docente/projects', getDocenteProjects);

export default router;
