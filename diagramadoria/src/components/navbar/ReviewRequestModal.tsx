import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import reviewApi from '../../api/reviewApi';
import { projectApi } from '../../api/projectApi';
import type { Project } from '../../api/projectApi';
import './ReviewRequestModal.css';

interface ReviewRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReviewRequestModal: React.FC<ReviewRequestModalProps> = ({ isOpen, onClose }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [docenteEmail, setDocenteEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (isOpen && user?.rol === 'estudiante') {
            loadProjects();
        }
    }, [isOpen, user?.rol]);

    const loadProjects = async () => {
        try {
            const userProjects = await projectApi.getUserProjects();
            setProjects(userProjects);
            if (userProjects.length > 0) {
                setSelectedProject(userProjects[0].id);
            }
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !docenteEmail.trim()) {
            alert('Por favor, selecciona un proyecto e ingresa el email del docente');
            return;
        }

        setLoading(true);
        try {
            await reviewApi.createRequest({
                id_proyecto: selectedProject,
                correo_docente: docenteEmail,
                mensaje: mensaje || undefined
            });

            alert(`¡Solicitud de revisión enviada a ${docenteEmail}!`);
            setDocenteEmail('');
            setMensaje('');
            onClose();
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            const err = error as { response?: { data?: { error?: string } } };
            alert(err.response?.data?.error || 'Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || user?.rol !== 'estudiante') {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🎓 Solicitar Revisión de Docente</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="project">📁 Proyecto:</label>
                        <select
                            id="project"
                            value={selectedProject || ''}
                            onChange={(e) => setSelectedProject(Number(e.target.value))}
                            required
                            className="form-select"
                        >
                            <option value="">Selecciona un proyecto</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="docenteEmail">📧 Email del docente:</label>
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
                        <label htmlFor="mensaje">💬 Mensaje (opcional):</label>
                        <textarea
                            id="mensaje"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Estimado profesor, le solicito revisar mi diagrama..."
                            rows={4}
                            className="form-textarea"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
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
            </div>
        </div>
    );
};

export default ReviewRequestModal;
