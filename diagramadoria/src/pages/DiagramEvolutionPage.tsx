import React, { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Stack,
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
    Paper,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
} from '@mui/lab';
import { Add, Edit, Delete, TrendingUp, EmojiEvents } from '@mui/icons-material';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import Navbar from '../components/navbar/Navbar';
import { getDiagramEvolution } from '../api/reportsApi';
import type { DiagramEvolutionReport } from '../api/reportsApi';

const DiagramEvolutionPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<DiagramEvolutionReport | null>(null);

    useEffect(() => {
        if (projectId) {
            loadReport(parseInt(projectId));
        }
    }, [projectId]);

    const loadReport = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDiagramEvolution(id);
            setReportData(data);
        } catch (err: any) {
            console.error('Error cargando reporte:', err);
            if (err.response?.status === 403) {
                setError('No tienes permiso para ver este reporte.');
            } else {
                setError('Error al cargar la evolución del diagrama.');
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
                    <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Volver</Button>
                </Box>
            </Box>
        );
    }

    const { summary, actionsByType, milestones, activityTimeline, recentActions } = reportData;

    // Datos para gráfica de acciones por tipo
    const actionsData = [
        { name: 'Clases Agregadas', value: actionsByType.classAdded, fill: '#4caf50' },
        { name: 'Clases Actualizadas', value: actionsByType.classUpdated, fill: '#2196f3' },
        { name: 'Clases Eliminadas', value: actionsByType.classDeleted, fill: '#f44336' },
        { name: 'Relaciones Agregadas', value: actionsByType.relationAdded, fill: '#ff9800' },
        { name: 'Relaciones Eliminadas', value: actionsByType.relationDeleted, fill: '#9c27b0' },
        { name: 'Diagrama Actualizado', value: actionsByType.diagramUpdated, fill: '#00bcd4' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Navbar />
            <Box sx={{ p: 3, mt: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            🚀 Evolución del Diagrama
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            {summary.projectTitle}
                        </Typography>
                    </Box>
                    <Button variant="outlined" onClick={() => navigate(-1)}>
                        Volver
                    </Button>
                </Box>

                {/* Resumen del Estado Actual */}
                <Card sx={{ mb: 4, bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                            📊 Estado Actual del Diagrama
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "150px" }}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                    <Typography variant="h3" color="primary">{summary.currentStats.totalClasses}</Typography>
                                    <Typography variant="body2">Clases</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "150px" }}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                                    <Typography variant="h3" color="secondary">{summary.currentStats.totalRelations}</Typography>
                                    <Typography variant="body2">Relaciones</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "150px" }}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                                    <Typography variant="h3" color="success.main">{summary.currentStats.totalAttributes}</Typography>
                                    <Typography variant="body2">Atributos</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ flex: "1 1 calc(25% - 24px)", minWidth: "150px" }}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                                    <Typography variant="h3" color="warning.main">{summary.currentStats.totalMethods}</Typography>
                                    <Typography variant="body2">Métodos</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Estadísticas Generales */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    <Box sx={{ flex: "1 1 calc(33.33% - 24px)", minWidth: "250px" }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total de Acciones
                                </Typography>
                                <Typography variant="h3" component="div">
                                    {summary.totalActions}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: "1 1 calc(33.33% - 24px)", minWidth: "250px" }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Días de Desarrollo
                                </Typography>
                                <Typography variant="h3" component="div" color="primary">
                                    {summary.totalDays}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ flex: "1 1 calc(33.33% - 24px)", minWidth: "250px" }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Tasa de Actividad
                                </Typography>
                                <Typography variant="h3" component="div" color="secondary">
                                    {summary.activityRate}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    acciones/día
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                {/* Gráficas */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                    {/* Timeline de Actividad */}
                    <Box sx={{ width: "100%" }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    📈 Timeline de Actividad
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={activityTimeline}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="actions"
                                            stroke="#8884d8"
                                            fill="#8884d8"
                                            name="Acciones"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Acciones por Tipo */}
                    <Box sx={{ flex: "1 1 calc(50% - 24px)", minWidth: "400px" }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    🔨 Acciones por Tipo
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={actionsData} layout="horizontal">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={150} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#8884d8">
                                            {actionsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Resumen de Acciones */}
                    <Box sx={{ flex: "1 1 calc(50% - 24px)", minWidth: "400px" }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    📋 Resumen de Acciones
                                </Typography>
                                <List>
                                    <ListItem>
                                        <Add sx={{ color: '#4caf50', mr: 2 }} />
                                        <ListItemText
                                            primary="Clases Agregadas"
                                            secondary={actionsByType.classAdded}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <Edit sx={{ color: '#2196f3', mr: 2 }} />
                                        <ListItemText
                                            primary="Clases Actualizadas"
                                            secondary={actionsByType.classUpdated}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <Delete sx={{ color: '#f44336', mr: 2 }} />
                                        <ListItemText
                                            primary="Clases Eliminadas"
                                            secondary={actionsByType.classDeleted}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <TrendingUp sx={{ color: '#ff9800', mr: 2 }} />
                                        <ListItemText
                                            primary="Relaciones Agregadas"
                                            secondary={actionsByType.relationAdded}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <TrendingUp sx={{ color: '#9c27b0', mr: 2, transform: 'rotate(180deg)' }} />
                                        <ListItemText
                                            primary="Relaciones Eliminadas"
                                            secondary={actionsByType.relationDeleted}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                {/* Hitos y Actividad Reciente */}
                <Stack direction="row" flexWrap="wrap" gap={3}>
                    {/* Hitos Importantes */}
                    <Box sx={{ flex: "1 1 calc(50% - 24px)", minWidth: "400px" }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    🏆 Hitos Importantes
                                </Typography>
                                {milestones.length === 0 ? (
                                    <Typography color="text.secondary">Sin hitos registrados</Typography>
                                ) : (
                                    <Timeline>
                                        {milestones.map((milestone, index) => (
                                            <TimelineItem key={index}>
                                                <TimelineOppositeContent color="text.secondary">
                                                    {new Date(milestone.fecha).toLocaleDateString('es-ES')}
                                                </TimelineOppositeContent>
                                                <TimelineSeparator>
                                                    <TimelineDot color="primary">
                                                        <EmojiEvents />
                                                    </TimelineDot>
                                                    {index < milestones.length - 1 && <TimelineConnector />}
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Typography variant="h6" component="span">
                                                        {milestone.evento}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Por: {milestone.usuario}
                                                    </Typography>
                                                </TimelineContent>
                                            </TimelineItem>
                                        ))}
                                    </Timeline>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Actividad Reciente */}
                    <Box sx={{ flex: "1 1 calc(50% - 24px)", minWidth: "400px" }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    🕐 Actividad Reciente (Últimas 20 acciones)
                                </Typography>
                                <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                                    <List>
                                        {recentActions.length === 0 ? (
                                            <ListItem>
                                                <ListItemText primary="Sin actividad reciente" />
                                            </ListItem>
                                        ) : (
                                            recentActions.map((action, index) => (
                                                <React.Fragment key={index}>
                                                    {index > 0 && <Divider />}
                                                    <ListItem>
                                                        <ListItemText
                                                            primary={action.accion}
                                                            secondary={
                                                                <>
                                                                    <Typography variant="caption" component="span">
                                                                        {action.usuario}
                                                                    </Typography>
                                                                    {' • '}
                                                                    <Typography variant="caption" component="span">
                                                                        {new Date(action.fecha).toLocaleString('es-ES')}
                                                                    </Typography>
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>
                                                </React.Fragment>
                                            ))
                                        )}
                                    </List>
                                </Paper>
                            </CardContent>
                        </Card>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};

export default DiagramEvolutionPage;
