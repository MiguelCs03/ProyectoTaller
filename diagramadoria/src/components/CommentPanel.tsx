import React, { useState, useEffect } from 'react';
import commentApi, { type Comment } from '../api/commentApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import '../styles/CommentPanel.css';

interface CommentPanelProps {
    projectId: number;
    elementId?: string;
    elementType?: string;
    onCommentAdded?: () => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({
    projectId,
    elementId,
    elementType,
    onCommentAdded
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState<'comentario' | 'correccion' | 'sugerencia'>('comentario');
    const [loading, setLoading] = useState(false);
    const user = useSelector((state: RootState) => state.auth.user);

    // Cargar comentarios
    useEffect(() => {
        loadComments();
    }, [projectId, elementId]);

    const loadComments = async () => {
        try {
            let fetchedComments;
            if (elementId) {
                fetchedComments = await commentApi.getElementComments(projectId, elementId);
            } else {
                fetchedComments = await commentApi.getProjectComments(projectId);
            }
            setComments(fetchedComments);
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const createdComment = await commentApi.create({
                id_proyecto: projectId,
                elemento_id: elementId,
                elemento_tipo: elementType,
                contenido: newComment,
                tipo: commentType
            });

            setComments([createdComment, ...comments]);
            setNewComment('');
            onCommentAdded?.();
        } catch (error) {
            console.error('Error al crear comentario:', error);
            alert('Error al crear comentario');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (commentId: number, newStatus: 'pendiente' | 'resuelto' | 'descartado') => {
        try {
            const updatedComment = await commentApi.updateStatus(commentId, { estado: newStatus });
            setComments(comments.map(c => c.id_comentario === commentId ? updatedComment : c));
        } catch (error) {
            console.error('Error al actualizar estado:', error);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

        try {
            await commentApi.delete(commentId);
            setComments(comments.filter(c => c.id_comentario !== commentId));
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
        }
    };

    const getCommentIcon = (tipo: string) => {
        switch (tipo) {
            case 'correccion': return '✏️';
            case 'sugerencia': return '💡';
            default: return '💬';
        }
    };

    const getStatusBadge = (estado: string) => {
        const badges = {
            'pendiente': { text: 'Pendiente', class: 'status-pending' },
            'resuelto': { text: 'Resuelto', class: 'status-resolved' },
            'descartado': { text: 'Descartado', class: 'status-discarded' }
        };
        const badge = badges[estado as keyof typeof badges] || badges.pendiente;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    return (
        <div className="comment-panel">
            <div className="comment-panel-header">
                <h3>
                    {elementId ? 'Comentarios del elemento' : 'Todos los comentarios'}
                    <span className="comment-count">({comments.length})</span>
                </h3>
            </div>

            {/* Lista de comentarios (arriba para que sea lo primero visible) */}
            <div className="comments-list">
                {comments.length === 0 ? (
                    <p className="no-comments">No hay comentarios aún</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id_comentario} className={`comment-item ${comment.tipo}`}>
                            <div className="comment-header">
                                <div className="comment-author">
                                    <span className="comment-icon">{getCommentIcon(comment.tipo)}</span>
                                    <strong>{comment.Usuario.nombre || comment.Usuario.correo}</strong>
                                    <span className="author-role">({comment.Usuario.rol})</span>
                                    {getStatusBadge(comment.estado)}
                                </div>
                                <span className="comment-date">
                                    {new Date(comment.fecha_creacion).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="comment-content">
                                <p>{comment.contenido}</p>
                            </div>
                            <div className="comment-actions">
                                {comment.estado !== 'resuelto' && (
                                    <button
                                        onClick={() => handleStatusChange(comment.id_comentario, 'resuelto')}
                                        className="btn-action btn-resolve"
                                    >
                                        ✓ Marcar como resuelto
                                    </button>
                                )}
                                {comment.estado === 'pendiente' && (
                                    <button
                                        onClick={() => handleStatusChange(comment.id_comentario, 'descartado')}
                                        className="btn-action btn-discard"
                                    >
                                        ✗ Descartar
                                    </button>
                                )}
                                {comment.id_usuario === user?.id && (
                                    <button
                                        onClick={() => handleDelete(comment.id_comentario)}
                                        className="btn-action btn-delete"
                                    >
                                        🗑️ Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Formulario para nuevo comentario (abajo) */}
            {user?.rol === 'docente' ? (
                <form onSubmit={handleSubmit} className="comment-form">
                    <div className="form-group">
                        <label>Tipo:</label>
                        <select
                            value={commentType}
                            onChange={(e) => setCommentType(e.target.value as any)}
                            className="comment-type-select"
                        >
                            <option value="comentario">💬 Comentario</option>
                            <option value="correccion">✏️ Corrección</option>
                            <option value="sugerencia">💡 Sugerencia</option>
                        </select>
                    </div>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe una corrección o sugerencia para el estudiante..."
                        className="comment-textarea"
                        rows={3}
                    />
                    <button type="submit" disabled={loading} className="btn-submit-comment">
                        {loading ? 'Enviando...' : 'Enviar comentario'}
                    </button>
                </form>
            ) : (
                <div className="comment-form" style={{ background: '#fff', borderTop: '1px solid #e0e0e0' }}>
                    <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                        Este panel es para el feedback del docente. Puedes marcar comentarios como Resuelto o Descartado cuando los atiendas.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CommentPanel;
