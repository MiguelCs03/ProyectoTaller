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
    Stack,
} from '@mui/material';
// 👇 IMPORTAMOS EL GRID CLÁSICO
import Grid from '@mui/material/Grid';
import {
    AssignmentTurnedIn,
    Comment,
    RateReview,
    Mail,
    TrendingUp,
    Folder,
} from '@mui/icons-material';
import Navbar from '../components/navbar/Navbar';
import { getStudentDashboard } from '../api/reportsApi';
import type { StudentDashboard as StudentDashboardType } from '../api/reportsApi';

const StudentDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<StudentDashboardType | null>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getStudentDashboard();
            setDashboardData(data);
        } catch (err) {
            console.error('Error cargando dashboard:', err);
            setError('Error al cargar el dashboard. Por favor intenta de nuevo.');
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

    if (error || !dashboardData) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Navbar />
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">{error || 'No se pudo cargar el dashboard'}</Alert>
                    <Button onClick={loadDashboard} sx={{ mt: 2 }}>Reintentar</Button>
                </Box>
            </Box>
        );
    }

    const { overview, projects, pendingComments, recentGrades, pendingReviews, pendingInvitations, recentActivity } = dashboardData;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Navbar />
            <Box sx={{ p: 3, mt: 8 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                    📊 Mi Dashboard
                </Typography>

                {/* Resumen General */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
                            <CardContent>
                                <Folder sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{overview.totalProjects}</Typography>
                                <Typography variant="body2">Proyectos</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{ bgcolor: '#f57c00', color: 'white' }}>
                            <CardContent>
                                <Comment sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{overview.pendingComments}</Typography>
                                <Typography variant="body2">Comentarios Pendientes</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{ bgcolor: '#7b1fa2', color: 'white' }}>
                            <CardContent>
                                <RateReview sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{overview.pendingReviews}</Typography>
                                <Typography variant="body2">Revisiones Pendientes</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{ bgcolor: '#c62828', color: 'white' }}>
                            <CardContent>
                                <Mail sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{overview.pendingInvitations}</Typography>
                                <Typography variant="body2">Invitaciones</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card sx={{ bgcolor: '#2e7d32', color: 'white' }}>
                            <CardContent>
                                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h4">{overview.averageGrade.toFixed(1)}</Typography>
                                <Typography variant="body2">Promedio</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Sección de Paneles */}
                <Grid container spacing={3}>
                    {/* Proyectos Recientes */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    📁 Mis Proyectos Recientes
                                </Typography>
                                {projects.length === 0 ? (
                                    <Typography color="text.secondary">No tienes proyectos aún</Typography>
                                ) : (
                                    <List>
                                        {projects.map((project, index) => (
                                            <React.Fragment key={project.id}>
                                                {index > 0 && <Divider />}
                                                <ListItem
                                                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                                                    onClick={() => navigate(`/diagram/${project.id}`)}
                                                >
                                                    <ListItemText
                                                        primary={project.titulo}
                                                        // 👇 CORRECCIÓN 1: Cambiamos el contenedor secundario a DIV
                                                        secondaryTypographyProps={{ component: 'div' }}
                                                        secondary={
                                                            <Stack direction="row" spacing={1} component="div">
                                                                <Chip label={project.rol} size="small" />
                                                                <Chip label={project.estado} size="small" color="primary" />
                                                            </Stack>
                                                        }
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Comentarios Pendientes */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    💬 Comentarios Pendientes
                                </Typography>
                                {pendingComments.length === 0 ? (
                                    <Typography color="text.secondary">No tienes comentarios pendientes</Typography>
                                ) : (
                                    <List>
                                        {pendingComments.map((comment, index) => (
                                            <React.Fragment key={comment.id}>
                                                {index > 0 && <Divider />}
                                                <ListItem>
                                                    <ListItemText
                                                        primary={comment.proyecto}
                                                        // 👇 CORRECCIÓN 2: Cambiamos el contenedor secundario a DIV
                                                        secondaryTypographyProps={{ component: 'div' }}
                                                        secondary={
                                                            <Box component="div">
                                                                <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                                                                    <strong>{comment.autor}:</strong> {comment.contenido}
                                                                </Typography>
                                                                <Chip label={comment.tipo} size="small" sx={{ mt: 0.5 }} />
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Calificaciones Recientes */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    ⭐ Calificaciones Recientes
                                </Typography>
                                {recentGrades.length === 0 ? (
                                    <Typography color="text.secondary">No tienes calificaciones aún</Typography>
                                ) : (
                                    <List>
                                        {recentGrades.map((grade, index) => (
                                            <React.Fragment key={`grade-${grade.proyecto}-${index}`}>
                                                {index > 0 && <Divider />}
                                                <ListItem>
                                                    <ListItemText
                                                        primary={grade.proyecto}
                                                        // 👇 CORRECCIÓN 3: Cambiamos el contenedor secundario a DIV
                                                        secondaryTypographyProps={{ component: 'div' }}
                                                        secondary={
                                                            <Box component="div">
                                                                <Typography variant="body2" component="span">
                                                                    Nota: <strong>{grade.nota}/{grade.nota_maxima}</strong>
                                                                </Typography>
                                                                <br />
                                                                <Typography variant="caption" color="text.secondary" component="span">
                                                                    Docente: {grade.docente}
                                                                </Typography>
                                                                {grade.comentario && (
                                                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', display: 'block' }} component="div">
                                                                        "{grade.comentario}"
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Actividad Reciente */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    🕐 Actividad Reciente
                                </Typography>
                                {recentActivity.length === 0 ? (
                                    <Typography color="text.secondary">Sin actividad reciente</Typography>
                                ) : (
                                    <List>
                                        {recentActivity.map((activity, index) => (
                                            <React.Fragment key={`activity-${activity.proyecto}-${index}`}>
                                                {index > 0 && <Divider />}
                                                <ListItem>
                                                    <ListItemText
                                                        primary={activity.accion}
                                                        secondary={
                                                            <>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {activity.proyecto} • {new Date(activity.fecha).toLocaleString('es-ES')}
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
                    </Grid>

                    {/* Invitaciones Pendientes */}
                    {pendingInvitations.length > 0 && (
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        📬 Invitaciones Pendientes
                                    </Typography>
                                    <List>
                                        {pendingInvitations.map((invitation, index) => (
                                            <React.Fragment key={invitation.id}>
                                                {index > 0 && <Divider />}
                                                <ListItem>
                                                    <ListItemText
                                                        primary={`Invitación a: ${invitation.proyecto}`}
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2">
                                                                    De: <strong>{invitation.remitente}</strong> • Rol: {invitation.rol}
                                                                </Typography>
                                                            </>
                                                        }
                                                    />
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => navigate('/invitations')}
                                                    >
                                                        Ver
                                                    </Button>
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Revisiones Pendientes */}
                    {pendingReviews.length > 0 && (
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: '#e8eaf6' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                        🔍 Revisiones en Proceso
                                    </Typography>
                                    <List>
                                        {pendingReviews.map((review, index) => (
                                            <React.Fragment key={`review-${review.proyecto}-${index}`}>
                                                {index > 0 && <Divider />}
                                                <ListItem>
                                                    <ListItemText
                                                        primary={review.proyecto}
                                                        secondary={
                                                            <>
                                                                <Typography variant="body2">
                                                                    Docente: <strong>{review.docente}</strong>
                                                                </Typography>
                                                                <Chip
                                                                    label={review.estado}
                                                                    size="small"
                                                                    color={review.estado === 'pendiente' ? 'warning' : 'info'}
                                                                    sx={{ mt: 0.5 }}
                                                                />
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default StudentDashboardPage;