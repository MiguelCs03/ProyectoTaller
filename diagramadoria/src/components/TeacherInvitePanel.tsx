import React, { useState, useEffect } from 'react';
import commentApi from '../../api/commentApi';
import invitationApi from '../../api/invitationApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import '../../styles/TeacherInvitePanel.css';

interface TeacherInvitePanelProps {
    projectId: number;
    onInviteSent?: () => void;
}

const TeacherInvitePanel: React.FC<TeacherInvitePanelProps> = ({
    projectId,
    onInviteSent
}) => {
    const [docenteEmail, setDocenteEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [invitations, setInvitations] = useState<any[]>([]);
    const user = useSelector((state: RootState) => state.auth.user);

    // Solo mostrar si el usuario es estudiante
    if (user?.rol !== 'estudiante') {
        return null;
    }

    const loadInvitations = async () => {
        try {
            const sent = await invitationApi.getSentInvitations();
            // Filtrar invitaciones de este proyecto
            const projectInvitations = sent.filter((inv: any) => inv.project_id === projectId);
            setInvitations(projectInvitations);
        } catch (error) {
            console.error('Error al cargar invitaciones:', error);
        }
    };

    useEffect(() => {
        loadInvitations();
    }, [projectId]);

    const handleSendInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docenteEmail.trim()) {
            alert('Por favor, ingresa el email del docente');
            return;
        }

        setLoading(true);
        try {
            // Obtener permisos
            const permissions = await invitationApi.getPermissions();
            // Buscar permiso de "revisor" o "editor"
            const revisorPermission = permissions.find((p: any) =>
                p.nombre.toLowerCase().includes('revisor') ||
                p.nombre.toLowerCase().includes('vista')
            );

            if (!revisorPermission) {
                alert('No se encontró el permiso adecuado');
                return;
            }

            await invitationApi.sendInvitation({
                projectId,
                toUserEmail: docenteEmail,
                permissionId: revisorPermission.id,
                mensaje: mensaje || `Por favor, revise mi diagrama "${projectId}"`
            });

            alert(`¡Invitación enviada a ${docenteEmail}!`);
            setDocenteEmail('');
            setMensaje('');
            setShowForm(false);
            onInviteSent?.();
            loadInvitations();
        } catch (error: any) {
            console.error('Error al enviar invitación:', error);
            alert(error.response?.data?.error || 'Error al enviar la invitación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacher-invite-panel">
            <div className="panel-header">
                <h4>👨‍🏫 Invitar Docente</h4>
                <p className="subtitle">Invita a un docente para que revise y califique tu diagrama</p>
            </div>

            {!showForm && (
                <button
                    className="btn-show-form"
                    onClick={() => setShowForm(true)}
                >
                    + Invitar docente a revisar
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSendInvitation} className="invite-form">
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
                    </div>

                    <div className="form-group">
                        <label htmlFor="mensaje">
                            💬 Mensaje (opcional):
                        </label>
                        <textarea
                            id="mensaje"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Ej: Estimado profesor, le pido que revise mi diagrama de clases..."
                            rows={3}
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
                            {loading ? 'Enviando...' : '📨 Enviar invitación'}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de invitaciones enviadas */}
            {invitations.length > 0 && (
                <div className="invitations-list">
                    <h5>Invitaciones enviadas:</h5>
                    {invitations.map((inv) => (
                        <div key={inv.id} className="invitation-item">
                            <div className="invitation-info">
                                <span className="invitation-email">
                                    👤 {inv.to_user?.email || 'Usuario'}
                                </span>
                                <span className={`invitation-status status-${inv.estado}`}>
                                    {inv.estado === 'pendiente' && '⏳ Pendiente'}
                                    {inv.estado === 'aceptada' && '✅ Aceptada'}
                                    {inv.estado === 'rechazada' && '❌ Rechazada'}
                                </span>
                            </div>
                            <span className="invitation-date">
                                {new Date(inv.created_at).toLocaleDateString('es-ES')}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="info-box">
                <p className="info-text">
                    💡 <strong>Consejo:</strong> El docente podrá ver tu diagrama, dejar comentarios,
                    correcciones y asignarte una calificación.
                </p>
            </div>
        </div>
    );
};

export default TeacherInvitePanel;
