import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GradePanel.css';

interface GradePanelProps {
    projectId: number;
    onGradeSubmitted?: () => void;
}

interface Grade {
    id_calificacion: number;
    calificacion: number;
    comentario: string | null;
    fecha_calificacion: Date;
    Docente: {
        id_usuario: number;
        nombre: string | null;
        correo: string;
    };
}

const GradePanel: React.FC<GradePanelProps> = ({ projectId, onGradeSubmitted }) => {
    const [grade, setGrade] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [existingGrades, setExistingGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadGrades();
    }, [projectId]);

    const loadGrades = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:3000/api/grades/project/${projectId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setExistingGrades(response.data);
        } catch (error) {
            console.error('Error al cargar calificaciones:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (grade < 0 || grade > 100) {
            alert('La calificación debe estar entre 0 y 100');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/grades',
                {
                    id_proyecto: projectId,
                    calificacion: grade,
                    comentario: comment.trim() || undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

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
            </div>

            {/* Formulario de calificación */}
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

            {/* Historial de calificaciones */}
            {existingGrades.length > 0 && (
                <div className="grades-history">
                    <h4>📜 Historial de Calificaciones</h4>
                    {existingGrades.map((g) => (
                        <div key={g.id_calificacion} className="grade-item">
                            <div className="grade-header">
                                <span className="grade-score">{g.calificacion}/100</span>
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
