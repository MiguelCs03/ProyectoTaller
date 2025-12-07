import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import axiosInstance from '../api/axiosInstance';
import '../styles/GradePanel.css';

interface GradePanelProps {
    projectId: number;
    onGradeSubmitted?: () => void;
    viewOnly?: boolean;
}

interface Grade {
    id_calificacion: number;
    nota: number;
    nota_maxima: number;
    comentario: string | null;
    fecha_calificacion: string;
    Docente: {
        id_usuario: number;
        nombre: string | null;
        correo: string;
    };
}

const GradePanel: React.FC<GradePanelProps> = ({ projectId, onGradeSubmitted, viewOnly }) => {
    const [grade, setGrade] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [existingGrades, setExistingGrades] = useState<Grade[]>([]);
    const [promedio, setPromedio] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: RootState) => state.auth.user);
    const canGrade = user?.rol === 'docente' && !viewOnly;

    useEffect(() => {
        loadGrades();
    }, [projectId]);

    const loadGrades = async () => {
        try {
            const response = await axiosInstance.get(`/grades/project/${projectId}`);
            const data = response.data;
            const calificaciones: Grade[] = data?.calificaciones || data || [];
            setExistingGrades(calificaciones);
            setPromedio(typeof data?.promedio === 'number' ? data.promedio : null);
        } catch (error) {
            console.error('Error al cargar calificaciones:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canGrade) return;
        if (grade < 0 || grade > 100) {
            alert('La calificación debe estar entre 0 y 100');
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post('/grades', {
                id_proyecto: projectId,
                calificacion: grade,
                comentario: comment.trim() || undefined
            });

            alert('Calificación registrada correctamente');
            setGrade(0);
            setComment('');
            loadGrades();
            onGradeSubmitted?.();
        } catch (error) {
            console.error('Error al calificar:', error);
            const err = error as { response?: { data?: { error?: string } } };
            alert(err.response?.data?.error || 'Error al registrar calificación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grade-panel">
            <div className="grade-panel-header">
                <h3>📊 Calificación del Proyecto</h3>
                {existingGrades.length > 0 && (
                    <p style={{ margin: '6px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                        Promedio: {promedio !== null ? `${promedio.toFixed(1)}%` : '-'} · Registros: {existingGrades.length}
                    </p>
                )}
            </div>

            {/* Formulario de calificación (solo docentes) */}
            {canGrade && (
                <form onSubmit={handleSubmit} className="grade-form">
                    <div className="form-group">
                        <label>Calificación (0-100):</label>
                        <input
                            type="number"
                            value={grade}
                            onChange={(e) => setGrade(Number(e.target.value))}
                            min="0"
                            max="100"
                            step="1"
                            className="grade-input"
                            required
                        />
                        <div className="grade-visual">
                            <div 
                                className="grade-bar" 
                                style={{ width: `${grade}%`, backgroundColor: grade >= 70 ? '#4caf50' : grade >= 50 ? '#ff9800' : '#f44336' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Comentario de calificación (opcional):</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Agrega observaciones sobre la calificación..."
                            className="grade-textarea"
                            rows={3}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-submit-grade">
                        {loading ? 'Guardando...' : '✅ Registrar Calificación'}
                    </button>
                </form>
            )}

            {/* Historial de calificaciones */}
            {existingGrades.length > 0 && (
                <div className="grades-history">
                    <h4>📜 Historial de Calificaciones</h4>
                    {existingGrades.map((g) => (
                        <div key={g.id_calificacion} className="grade-item">
                            <div className="grade-header">
                                <span className="grade-score">{g.nota}/{g.nota_maxima}</span>
                                <span className="grade-date">
                                    {new Date(g.fecha_calificacion).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="grade-teacher">
                                👨‍🏫 {g.Docente.nombre || g.Docente.correo}
                            </div>
                            {g.comentario && (
                                <div className="grade-comment">{g.comentario}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {existingGrades.length === 0 && (
                <p className="no-grades">No hay calificaciones registradas aún</p>
            )}
        </div>
    );
};

export default GradePanel;
