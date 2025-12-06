import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import reviewApi, { type ReviewRequest } from '../../api/reviewApi';
import '../../styles/TeacherReviewPanel.css';

const TeacherReviewPanel: React.FC = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ReviewRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const receivedRequests = await reviewApi.getReceivedRequests();
            setRequests(receivedRequests);
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId: number, respuesta: 'aceptada' | 'rechazada') => {
        const mensaje = respuesta === 'aceptada' 
            ? '¿Aceptar esta solicitud de revisión?' 
            : '¿Rechazar esta solicitud de revisión?';
        
        if (!confirm(mensaje)) return;

        try {
            await reviewApi.respondToRequest(requestId, respuesta);
            alert(`Solicitud ${respuesta === 'aceptada' ? 'aceptada' : 'rechazada'} correctamente`);
            loadRequests();
        } catch (error) {
            console.error('Error al responder:', error);
            const err = error as { response?: { data?: { error?: string } } };
            alert(err.response?.data?.error || 'Error al responder la solicitud');
        }
    };

    const handleComplete = async (requestId: number) => {
        if (!confirm('¿Marcar esta revisión como completada?')) return;

        try {
            await reviewApi.completeReview(requestId);
            alert('Revisión completada correctamente');
            loadRequests();
        } catch (error) {
            console.error('Error al completar:', error);
            const err = error as { response?: { data?: { error?: string } } };
            alert(err.response?.data?.error || 'Error al completar la revisión');
        }
    };

    const getStatusBadge = (estado: string) => {
        const badges = {
            'pendiente': { text: '⏳ Pendiente', class: 'status-pending' },
            'aceptada': { text: '✅ Aceptada', class: 'status-accepted' },
            'rechazada': { text: '❌ Rechazada', class: 'status-rejected' },
            'completada': { text: '🎓 Completada', class: 'status-completed' }
        };
        const badge = badges[estado as keyof typeof badges] || badges.pendiente;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    if (loading) {
        return (
            <div className="teacher-review-panel">
                <div className="loading-message">
                    <div className="spinner"></div>
                    <p>Cargando solicitudes...</p>
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="teacher-review-panel">
                <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No tienes solicitudes de revisión</h3>
                    <p>Cuando los estudiantes soliciten que revises sus proyectos, aparecerán aquí.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-review-panel">
            <div className="panel-header">
                <h3>🎓 Solicitudes de Revisión</h3>
                <p className="subtitle">
                    Revisa, comenta y califica los diagramas de tus estudiantes
                </p>
            </div>

            <div className="requests-grid">
                {requests.map((request) => (
                    <div key={request.id_solicitud} className={`request-card ${request.estado}`}>
                        <div className="card-header">
                            <div className="student-info">
                                <h4>👨‍🎓 {request.Estudiante?.nombre || request.Estudiante?.correo}</h4>
                                <p className="student-email">{request.Estudiante?.correo}</p>
                            </div>
                            {getStatusBadge(request.estado)}
                        </div>

                        <div className="card-body">
                            <div className="project-info">
                                <span className="label">📁 Proyecto:</span>
                                <span className="value">{request.Proyecto?.titulo}</span>
                            </div>

                            <div className="date-info">
                                <span className="label">📅 Fecha:</span>
                                <span className="value">
                                    {new Date(request.fecha_solicitud).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>

                            {request.mensaje && (
                                <div className="message-box">
                                    <span className="label">💬 Mensaje del estudiante:</span>
                                    <p className="message-text">{request.mensaje}</p>
                                </div>
                            )}
                        </div>

                        <div className="card-actions">
                            {request.estado === 'pendiente' && (
                                <>
                                    <button
                                        onClick={() => handleRespond(request.id_solicitud, 'aceptada')}
                                        className="btn-accept"
                                    >
                                        ✅ Aceptar
                                    </button>
                                    <button
                                        onClick={() => handleRespond(request.id_solicitud, 'rechazada')}
                                        className="btn-reject"
                                    >
                                        ❌ Rechazar
                                    </button>
                                </>
                            )}

                            {request.estado === 'aceptada' && (
                                <>
                                    <button
                                        onClick={() => navigate(`/diagram/${request.id_proyecto}`)}
                                        className="btn-access-project"
                                    >
                                        📊 Acceder al Proyecto
                                    </button>
                                    <div className="info-message">
                                        Puedes revisar el diagrama, dejar comentarios y calificar
                                    </div>
                                    <button
                                        onClick={() => handleComplete(request.id_solicitud)}
                                        className="btn-complete"
                                    >
                                        🎓 Marcar como completada
                                    </button>
                                </>
                            )}

                            {request.estado === 'rechazada' && request.fecha_respuesta && (
                                <div className="info-message rejected">
                                    Rechazada el {new Date(request.fecha_respuesta).toLocaleDateString('es-ES')}
                                </div>
                            )}

                            {request.estado === 'completada' && request.fecha_completada && (
                                <div className="info-message completed">
                                    ✓ Completada el {new Date(request.fecha_completada).toLocaleDateString('es-ES')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherReviewPanel;
