import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress,
} from '@mui/material';
// 👇 USAMOS EL GRID CLÁSICO (A PRUEBA DE ERRORES)
import Grid from '@mui/material/Grid';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from '../components/navbar/Navbar';
import { getIndividualProgress } from '../api/reportsApi';
import type { IndividualProgressReport } from '../api/reportsApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const IndividualProgressPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<IndividualProgressReport | null>(null);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getIndividualProgress();
            setReportData(data);
        } catch (err) {
            console.error('Error cargando reporte:', err);
            setError('Error al cargar el reporte. Por favor intenta de nuevo.');
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

    const { summary, projects, grades, comments, reviewRequests, invitations } = reportData;

    // Datos para gráficas
    const projectsData = [
        { name: 'Creados', value: summary.createdProjects },
        { name: 'Colaboraciones', value: summary.collaborations },
    ];

    const commentsData = [
        { name: 'Comentarios', value: comments.stats.byType.comentario },
        { name: 'Correcciones', value: comments.stats.byType.correccion },
        { name: 'Sugerencias', value: comments.stats.byType.sugerencia },
    ];

    const commentsStatusData = [
        { name: 'Pendientes', value: comments.stats.pending, fill: '#ff9800' },
        { name: 'Resueltos', value: comments.stats.resolved, fill: '#4caf50' },
    ];

    const reviewsData = [
        { name: 'Pendientes', value: reviewRequests.stats.pending, fill: '#ff9800' },
        { name: 'Aceptadas', value: reviewRequests.stats.accepted, fill: '#2196f3' },
        { name: 'Completadas', value: reviewRequests.stats.completed, fill: '#4caf50' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Navbar />
            <Box sx={{ p: 3, mt: 8 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                    📈 Mi Progreso Individual
                </Typography>

                {/* Resumen */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Proyectos
                                </Typography>
                                <Typography variant="h3" component="div">
                                    {summary.totalProjects}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Proyectos Creados
                                </Typography>
                                <Typography variant="h3" component="div" color="primary">
                                    {summary.createdProjects}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Colaboraciones
                                </Typography>
                                <Typography variant="h3" component="div" color="secondary">
                                    {summary.collaborations}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Promedio de Calificación
                                </Typography>
                                <Typography variant="h3" component="div" color="success.main">
                                    {summary.averageGrade}
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={summary.averageGrade}
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Gráficas */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Distribución de Proyectos
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={projectsData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {projectsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Comentarios por Tipo
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={commentsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Estado de Comentarios
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={commentsStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {commentsStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Estado de Revisiones
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={reviewsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabla de Calificaciones */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📝 Historial de Calificaciones
                        </Typography>
                        {grades.length === 0 ? (
                            <Typography color="text.secondary">No tienes calificaciones aún</Typography>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Proyecto</strong></TableCell>
                                            <TableCell><strong>Nota</strong></TableCell>
                                            <TableCell><strong>Docente</strong></TableCell>
                                            <TableCell><strong>Comentario</strong></TableCell>
                                            <TableCell><strong>Fecha</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {grades.map((grade, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{grade.proyecto}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${grade.nota}/${grade.nota_maxima}`}
                                                        color={grade.nota >= 70 ? 'success' : grade.nota >= 50 ? 'warning' : 'error'}
                                                    />
                                                </TableCell>
                                                <TableCell>{grade.docente}</TableCell>
                                                <TableCell>{grade.comentario || '-'}</TableCell>
                                                <TableCell>{new Date(grade.fecha).toLocaleDateString('es-ES')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Estadísticas de Invitaciones */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📬 Estadísticas de Invitaciones
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                    <Typography variant="h4">{invitations.sent}</Typography>
                                    <Typography variant="body2">Enviadas</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                                    <Typography variant="h4">{invitations.received}</Typography>
                                    <Typography variant="body2">Recibidas</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                                    <Typography variant="h4">{invitations.accepted}</Typography>
                                    <Typography variant="body2">Aceptadas</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default IndividualProgressPage;