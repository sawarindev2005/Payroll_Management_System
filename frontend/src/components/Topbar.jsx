import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, backTo, navLinks }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <header className="topbar">
            <div className="topbar-title">
                {backTo && (
                    <Link to={backTo} className="btn btn-outline btn-sm">
                        กลับ
                    </Link>
                )}
                <h1>{title}</h1>
            </div>
            <div className="topbar-actions">
                {navLinks && <nav className="topbar-nav-links">{navLinks}</nav>}
                <span className="username-badge">{user?.username}</span>
                <button className="btn btn-outline" onClick={handleLogout}>
                    ออกจากระบบ
                </button>
            </div>
        </header>
    );
}
