import express from "express";
import cors from "cors";
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import commentRoutes from './routes/comment.routes.js';
import gradeRoutes from './routes/grade.routes.js';
import reviewRoutes from './routes/review.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();
app.use(express.json());

// Allow configuring CORS via env variable
const defaultOrigins = process.env.NODE_ENV === 'production'
    ? ['https://diagramadoria.netlify.app']
    : ['http://localhost:5173', 'http://localhost:3000'];

const envOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: envOrigins && envOrigins.length > 0 ? envOrigins : defaultOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportsRoutes);
console.log('✅ RUTAS DE REPORTES REGISTRADAS EN /api/reports');

// Health check endpoint for Render
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

export default app;