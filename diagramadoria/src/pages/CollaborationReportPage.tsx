import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Button,
} from '@mui/material';
// 👇 USAMOS GRID CLÁSICO
import Grid from '@mui/material/Grid'; 
import { Person, CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from '../components/navbar/Navbar';
import { getCollaborationReport } from '../api/reportsApi';
import type { CollaborationReport } from '../api/reportsApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CollaborationReportPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<CollaborationReport | null>(null);

    useEffect(() => {
        if (projectId) {
            loadReport(parseInt(projectId));
        }
    }, [projectId]);

    const loadReport = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCollaborationReport(id);
            setReportData(data);
        } catch (err: any) {
            console.error('Error cargando reporte:', err);
            if (err.response?.status === 403) {
                setError('No tienes permiso para ver este reporte.');
            } else {
                setError('Error al cargar el reporte de colaboración.');
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

    const { summary, collaborators, invitations } = reportData;

    // Datos para gráfica de roles
    const rolesData = [
        { name: 'Creador', value: summary.roleDistribution.creador },
        { name: 'Editor', value: summary.roleDistribution.editor },
        { name: 'Vista', value: summary.roleDistribution.vista },
    ];

    // Datos para gráfica de invitaciones
    const invitationsStatusData = [
        { name: 'Aceptadas', value: invitations.stats.accepted, fill: '#4caf50' },
        { name: 'Pendientes', value: invitations.stats.pending, fill: '#ff9800' },
        { name: 'Rechazadas', value: invitations.stats.rejected, fill: '#f44336' },
    ];

    // Datos para gráfica de actividad por colaborador
    const activityData = collaborators
        .map(c => ({
            nombre: c.nombre.split(' ')[0] || c.nombre, // Solo primer nombre
            acciones: c.stats.totalActions,
            comentarios: c.stats.commentsGiven,
        }))
        .sort((a, b) => b.acciones - a.acciones)
        .slice(0, 5); // Top 5

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Navbar />
            <Box sx={{ p: 3, mt: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        👥 Reporte de Colaboración
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate(-1)}>
                        Volver
                    </Button>
                </Box>

                {/* Resumen - Usando Grid Item Clásico */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Colaboradores
                                </Typography>
                                <Typography variant="h3" component="div">
                                    {summary.totalCollaborators}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Acciones
                                </Typography>
                                <Typography variant="h3" component="div" color="primary">
                                    {summary.totalActions}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Comentarios
                                </Typography>
                                <Typography variant="h3" component="div" color="secondary">
                                    {summary.totalComments}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Tiempo Respuesta (hrs)
                                </Typography>
                                <Typography variant="h3" component="div" color="success.main">
                                    {invitations.stats.averageResponseTime}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Gráficas - Usando Grid Item Clásico */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Distribución de Roles
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={rolesData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {rolesData.map((entry, index) => (
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
                                    Estado de Invitaciones
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={invitationsStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {invitationsStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Top 5 Colaboradores Más Activos
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={activityData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="nombre" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="acciones" fill="#8884d8" name="Acciones" />
                                        <Bar dataKey="comentarios" fill="#82ca9d" name="Comentarios" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Lista de Colaboradores */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            👨‍👩‍👧‍👦 Colaboradores del Proyecto
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Colaborador</strong></TableCell>
                                        <TableCell><strong>Rol</strong></TableCell>
                                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                                        <TableCell align="center"><strong>Comentarios</strong></TableCell>
                                        <TableCell><strong>Primera Actividad</strong></TableCell>
                                        <TableCell><strong>Última Actividad</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {collaborators.map((collab) => (
                                        <TableRow key={collab.userId}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ mr: 2, bgcolor: collab.isCreator ? '#1976d2' : '#757575' }}>
                                                        <Person />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body1">{collab.nombre}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {collab.correo}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={collab.rol}
                                                    color={collab.isCreator ? 'primary' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">{collab.stats.totalActions}</TableCell>
                                            <TableCell align="center">{collab.stats.commentsGiven}</TableCell>
                                            <TableCell>
                                                {collab.stats.firstActivity
                                                    ? new Date(collab.stats.firstActivity).toLocaleDateString('es-ES')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {collab.stats.lastActivity
                                                    ? new Date(collab.stats.lastActivity).toLocaleDateString('es-ES')
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Historial de Invitaciones */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📨 Historial de Invitaciones
                        </Typography>
                        {invitations.list.length === 0 ? (
                            <Typography color="text.secondary">No hay invitaciones registradas</Typography>
                        ) : (
                            <List>
                                {invitations.list.map((invitation, index) => (
                                    <ListItem key={index} divider={index < invitations.list.length - 1}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                {invitation.estado === 'aceptada' ? (
                                                    <CheckCircle color="success" />
                                                ) : invitation.estado === 'rechazada' ? (
                                                    <Cancel color="error" />
                                                ) : (
                                                    <HourglassEmpty color="warning" />
                                                )}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography>
                                                    <strong>{invitation.remitente}</strong> invitó a <strong>{invitation.destinatario}</strong>
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Chip label={invitation.rol} size="small" sx={{ mr: 1 }} />
                                                    <Chip
                                                        label={invitation.estado}
                                                        size="small"
                                                        color={
                                                            invitation.estado === 'aceptada'
                                                                ? 'success'
                                                                : invitation.estado === 'rechazada'
                                                                    ? 'error'
                                                                    : 'warning'
                                                        }
                                                    />
                                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                        Enviada: {new Date(invitation.fecha_envio).toLocaleDateString('es-ES')}
                                                        {invitation.fecha_respuesta &&
                                                            ` • Respondida: ${new Date(invitation.fecha_respuesta).toLocaleDateString('es-ES')}`}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default CollaborationReportPage;