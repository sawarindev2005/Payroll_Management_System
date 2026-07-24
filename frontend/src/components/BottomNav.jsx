import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_LINKS = [
    { to: '/', icon: '👥', label: 'พนักงาน' },
    { to: '/requests', icon: '📋', label: 'คำขอเบิก' },
];

const EMPLOYEE_LINKS = [
    { to: '/salary', icon: '💰', label: 'เงินเดือน' },
    { to: '/salary/history', icon: '📜', label: 'ประวัติ' },
    { to: '/salary/requests', icon: '📝', label: 'เบิกเงิน' },
];

// นำทางแบบแอปมือถือ เฉพาะจอ <768px (ดู .bottom-nav ใน index.css) รายการเมนูสลับตาม role
export default function BottomNav() {
    const { pathname } = useLocation();
    const { user } = useAuth();

    const links = user?.role === 'admin' ? ADMIN_LINKS : EMPLOYEE_LINKS;

    return (
        <nav className="bottom-nav">
            {links.map((link) => (
                <Link
                    key={link.to}
                    to={link.to}
                    className={`bottom-nav-link${pathname === link.to ? ' active' : ''}`}
                >
                    <span className="bottom-nav-icon">{link.icon}</span>
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
