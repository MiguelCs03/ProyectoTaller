import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useSelector } from '../../store/store';
import type { RootState } from '../../store/store';
import { logout } from '../../store/authSlice';
import { useState } from 'react';
import ReviewRequestModal from './ReviewRequestModal';
import './NavbarCss.css';

const Navbar = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showReportsMenu, setShowReportsMenu] = useState(false);
    const user = useSelector((state: RootState) => state.auth.user);

    const handleLogoClick = () => {
        navigate('/dashboard');
    };

    const handleProjectsClick = () => {
        navigate('/dashboard');
    };

    const handleInvitationsClick = () => {
        navigate('/invitations');
    };

    const handleChatBotClick = () => {
        navigate('/chatbot');
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleReviewRequest = () => {
        setShowReviewModal(true);
    };

    const toggleReportsMenu = () => {
        setShowReportsMenu(!showReportsMenu);
    };

    const handleReportClick = (path: string) => {
        navigate(path);
        setShowReportsMenu(false);
    };

    return (
        <>
            <nav className="navbar">
                <div className='navbar-content'>
                    <button onClick={handleLogoClick}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div>DiagramaIA</div>
                    <ul className="navbar-menu">
                        <li><button onClick={handleProjectsClick}>Proyectos</button></li>
                        <li><button onClick={handleInvitationsClick}>Invitaciones</button></li>
                        {user?.rol === 'estudiante' && (
                            <li><button onClick={handleReviewRequest}>🎓 Solicitar Revisión</button></li>
                        )}

                        {/* Menú de Reportes con dropdown */}
                        <li className="navbar-dropdown">
                            <button onClick={toggleReportsMenu}>
                                📊 Reportes {showReportsMenu ? '▲' : '▼'}
                            </button>
                            {showReportsMenu && (
                                <ul className="dropdown-menu">
                                    <li>
                                        <button onClick={() => handleReportClick('/reports/student-dashboard')}>
                                            🏠 Mi Dashboard
                                        </button>
                                    </li>
                                    <li>
                                        <button onClick={() => handleReportClick('/reports/individual-progress')}>
                                            📈 Mi Progreso
                                        </button>
                                    </li>
                                    {user?.rol === 'docente' && (
                                        <li>
                                            <button onClick={() => handleReportClick('/reports/pending-projects')}>
                                                📂 Proyectos Pendientes
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </li>

                        <li><button onClick={handleChatBotClick}>Chat Bot</button></li>
                        <li><button onClick={handleLogout}>Logout</button></li>
                    </ul>
                </div>
            </nav>

            <ReviewRequestModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
            />
        </>
    );
};

export default Navbar;