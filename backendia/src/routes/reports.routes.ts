import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
    getIndividualProgress,
    getStudentDashboard,
    getCollaborationReport,
    getPendingProjectsReport,
    getDiagramEvolution,
} from '../controllers/reports.controllers.js';

const router = Router();
console.log('📊 Inicializando router de REPORTES...');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Reporte de progreso individual (estudiante)
router.get('/individual-progress', getIndividualProgress);

// Dashboard del estudiante
router.get('/student-dashboard', getStudentDashboard);

// Reporte de colaboración de un proyecto específico
router.get('/collaboration/:projectId', getCollaborationReport);

// Reporte de proyectos pendientes (docente)
router.get('/pending-projects', getPendingProjectsReport);

// Evolución del diagrama de un proyecto
router.get('/diagram-evolution/:projectId', getDiagramEvolution);

export default router;
