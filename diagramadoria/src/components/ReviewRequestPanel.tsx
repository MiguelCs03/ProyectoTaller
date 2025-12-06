import React, { useState, useEffect } from 'react';
import reviewApi, { type ReviewRequest } from '../api/reviewApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import '../styles/ReviewRequestPanel.css';

interface ReviewRequestPanelProps {
    projectId: number;
    onRequestSent?: () => void;
}

const ReviewRequestPanel: React.FC<ReviewRequestPanelProps> = ({
    projectId,
    onRequestSent
}) => {
    const [docenteEmail, setDocenteEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [requests, setRequests] = useState<ReviewRequest[]>([]);
    const user = useSelector((state: RootState) => state.auth.user);

    // Solo mostrar si el usuario es estudiante
    if (user?.rol !== 'estudiante') {
        return null;
    }

    const loadRequests = async () => {
        try {
            const allRequests = await reviewApi.getMyRequests();
            // Filtrar solo las del proyecto actual
            const projectRequests = allRequests.filter(r => r.id_proyecto === projectId);
            setRequests(projectRequests);
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [projectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docenteEmail.trim()) {
            alert('Por favor, ingresa el email del docente');
            return;
        }

        setLoading(true);
        try {
            await reviewApi.createRequest({
                id_proyecto: projectId,
                correo_docente: docenteEmail,
                mensaje: mensaje || undefined
            });

            alert(`¡Solicitud de revisión enviada a ${docenteEmail}!`);
            setDocenteEmail('');
            setMensaje('');
            setShowForm(false);
            onRequestSent?.();
            loadRequests();
        } catch (error: any) {
            console.error('Error al enviar solicitud:', error);
            alert(error.response?.data?.error || 'Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (requestId: number) => {
        if (!confirm('¿Estás seguro de cancelar esta solicitud?')) return;

        try {
            await reviewApi.cancelRequest(requestId);
            alert('Solicitud cancelada');
            loadRequests();
        } catch (error) {
            console.error('Error al cancelar:', error);
            alert('Error al cancelar la solicitud');
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

    return (
        <div className="review-request-panel">
            <div className="panel-header">
                <h4>🎓 Solicitar Revisión de Docente</h4>
                <p className="subtitle">
                    Solicita a un docente que revise, comente y califique tu diagrama
                </p>
            </div>

            {!showForm && requests.length === 0 && (
                <button
                    className="btn-show-form"
                    onClick={() => setShowForm(true)}
                >
                    + Solicitar revisión de docente
                </button>
            )}

            {!showForm && requests.length > 0 && (
                <button
                    className="btn-show-form-secondary"
                    onClick={() => setShowForm(true)}
                >
                    + Solicitar a otro docente
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="request-form">
                    <div className="form-group">
                        <label htmlFor="docenteEmail">
                            📧 Email del docente:
                        </label>
                        <input
                            id="docenteEmail"
                            type="email"
                            value={docenteEmail}
                            onChange={(e) => setDocenteEmail(e.target.value)}
                            placeholder="docente@universidad.edu"
                            required
                            className="form-input"
                        />
                        <small className="form-hint">
                            El docente debe estar registrado en la plataforma
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="mensaje">
                            💬 Mensaje para el docente (opcional):
                        </label>
                        <textarea
                            id="mensaje"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Estimado profesor, le solicito revisar mi diagrama de clases sobre..."
                            rows={4}
                            className="form-textarea"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setDocenteEmail('');
                                setMensaje('');
                            }}
                            className="btn-cancel"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-submit"
                        >
                            {loading ? 'Enviando...' : '📨 Enviar solicitud'}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de solicitudes */}
            {requests.length > 0 && (
                <div className="requests-list">
                    <h5>Solicitudes de revisión:</h5>
                    {requests.map((request) => (
                        <div key={request.id_solicitud} className={`request-item ${request.estado}`}>
                            <div className="request-header">
                                <div className="request-info">
                                    <span className="request-docente">
                                        👨‍🏫 {request.Docente?.nombre || request.Docente?.correo}
                                    </span>
                                    {getStatusBadge(request.estado)}
                                </div>
                                <span className="request-date">
                                    {new Date(request.fecha_solicitud).toLocaleDateString('es-ES')}
                                </span>
                            </div>

                            {request.mensaje && (
                                <div className="request-message">
                                    <p>{request.mensaje}</p>
                                </div>
                            )}

                            {request.estado === 'aceptada' && (
                                <div className="request-status-message accepted">
                                    ✅ El docente aceptó revisar tu diagrama. Podrás ver sus comentarios y calificación.
                                </div>
                            )}

                            {request.estado === 'rechazada' && request.fecha_respuesta && (
                                <div className="request-status-message rejected">
                                    ❌ Rechazada el {new Date(request.fecha_respuesta).toLocaleDateString('es-ES')}
                                </div>
                            )}

                            {request.estado === 'completada' && request.fecha_completada && (
                                <div className="request-status-message completed">
                                    🎓 Revisión completada el {new Date(request.fecha_completada).toLocaleDateString('es-ES')}
                                </div>
                            )}

                            {request.estado === 'pendiente' && (
                                <div className="request-actions">
                                    <button
                                        onClick={() => handleCancel(request.id_solicitud)}
                                        className="btn-cancel-request"
                                    >
                                        Cancelar solicitud
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="info-box">
                <p className="info-text">
                    <strong>ℹ️ ¿Cómo funciona?</strong>
                </p>
                <ul className="info-list">
                    <li>Solicitas revisión a un docente registrado</li>
                    <li>El docente acepta o rechaza tu solicitud</li>
                    <li>Si acepta, puede ver tu diagrama, dejar comentarios y calificarte</li>
                    <li>Cuando termine, marcará la revisión como completada</li>
                </ul>
            </div>
        </div>
    );
};

export default ReviewRequestPanel;
