import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import {
    Box,

    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import { Warning, Assignment, Comment as CommentIcon, Star } from '@mui/icons-material';
import Navbar from '../components/navbar/Navbar';
import { getPendingProjectsReport } from '../api/reportsApi';
import type { PendingProjectsReport } from '../api/reportsApi';

const PendingProjectsReportPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<PendingProjectsReport | null>(null);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPendingProjectsReport();
            setReportData(data);
        } catch (err: any) {
            console.error('Error cargando reporte:', err);
            if (err.response?.status === 403) {
                setError('Solo los docentes pueden acceder a este reporte.');
            } else {
                setError('Error al cargar el reporte de proyectos pendientes.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Navbar />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error || !reportData) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Navbar />
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">{error || 'No se pudo cargar el reporte'}</Alert>
                </Box>
            </Box>
        );
    }

    const { summary, pendingReviews, ungradedProjects, unresolvedComments } = reportData;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Navbar />
            <Box sx={{ p: 3, mt: 8 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                    📂 Proyectos Pendientes - Panel Docente
                </Typography>

                {/* Resumen */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "250px" }}>
                        <Card sx={{ bgcolor: '#fff3e0' }}>
                            <CardContent>
                                <Assignment sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
                                <Typography variant="h3" component="div">
                                    {summary.totalPendingReviews}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Revisiones Pendientes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "250px" }}>
                        <Card sx={{ bgcolor: '#ffebee' }}>
                            <CardContent>
                                <Warning sx={{ fontSize: 40, color: '#d32f2f', mb: 1 }} />
                                <Typography variant="h3" component="div">
                                    {summary.urgentReviews}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Urgentes (+7 días)
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "250px" }}>
                        <Card sx={{ bgcolor: '#e8eaf6' }}>
                            <CardContent>
                                <Star sx={{ fontSize: 40, color: '#3f51b5', mb: 1 }} />
                                <Typography variant="h3" component="div">
                                    {summary.ungradedProjects}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sin Calificar
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "250px" }}>
                        <Card sx={{ bgcolor: '#fce4ec' }}>
                            <CardContent>
                                <CommentIcon sx={{ fontSize: 40, color: '#c2185b', mb: 1 }} />
                                <Typography variant="h3" component="div">
                                    {summary.unresolvedComments}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Comentarios Sin Resolver
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                {/* Revisiones Pendientes */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            🔍 Solicitudes de Revisión Pendientes
                        </Typography>
                        {pendingReviews.length === 0 ? (
                            <Alert severity="success">¡Excelente! No tienes revisiones pendientes.</Alert>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Proyecto</strong></TableCell>
                                            <TableCell><strong>Estudiante</strong></TableCell>
                                            <TableCell><strong>Mensaje</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell><strong>Días Esperando</strong></TableCell>
                                            <TableCell><strong>Fecha Solicitud</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pendingReviews.map((review, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    bgcolor: review.urgent ? '#ffebee' : 'inherit',
                                                }}
                                            >
                                                <TableCell>{review.proyecto}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{review.estudiante}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Creador: {review.creador}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{review.mensaje || '-'}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={review.estado}
                                                        size="small"
                                                        color={review.estado === 'pendiente' ? 'warning' : 'info'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {review.urgent && <Warning sx={{ color: '#d32f2f', mr: 1 }} />}
                                                        <Typography
                                                            color={review.urgent ? 'error' : 'text.primary'}
                                                            fontWeight={review.urgent ? 'bold' : 'normal'}
                                                        >
                                                            {review.waitDays} días
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(review.fecha_solicitud).toLocaleDateString('es-ES')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Proyectos Sin Calificar */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            ⭐ Proyectos Sin Calificar
                        </Typography>
                        {ungradedProjects.length === 0 ? (
                            <Alert severity="success">Todos los proyectos están calificados.</Alert>
                        ) : (
                            <List>
                                {ungradedProjects.map((project, index) => (
                                    <React.Fragment key={project.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem
                                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                                            onClick={() => navigate(`/diagram/${project.id}`)}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {project.titulo}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Creador: {project.creador}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                            <Chip label={project.estado} size="small" />
                                                            <Chip
                                                                label={`Iniciado: ${new Date(project.fecha_inicio).toLocaleDateString('es-ES')}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                            <Button variant="contained" size="small">
                                                Revisar
                                            </Button>
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>

                {/* Comentarios Sin Resolver */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            💬 Mis Comentarios Sin Resolver
                        </Typography>
                        {unresolvedComments.length === 0 ? (
                            <Alert severity="success">Todos tus comentarios han sido resueltos.</Alert>
                        ) : (
                            <List>
                                {unresolvedComments.map((comment, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <Divider />}
                                        <ListItem>
                                            <ListItemText
                                                primary={comment.proyecto}
                                                secondary={
                                                    <>
                                                        <Chip label={comment.tipo} size="small" sx={{ mr: 1, mb: 1 }} />
                                                        <Typography variant="body2" component="div">
                                                            {comment.contenido}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(comment.fecha).toLocaleDateString('es-ES')}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default PendingProjectsReportPage;

