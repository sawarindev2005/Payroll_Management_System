import { Link, useLocation } from 'react-router-dom';

// นำทางแบบแอปมือถือ เฉพาะจอ <768px (ดู .bottom-nav ใน index.css) สำหรับหน้า admin
export default function BottomNav() {
    const { pathname } = useLocation();

    return (
        <nav className="bottom-nav">
            <Link to="/" className={`bottom-nav-link${pathname === '/' ? ' active' : ''}`}>
                <span className="bottom-nav-icon">👥</span>
                พนักงาน
            </Link>
            <Link
                to="/requests"
                className={`bottom-nav-link${pathname === '/requests' ? ' active' : ''}`}
            >
                <span className="bottom-nav-icon">📋</span>
                คำขอเบิก
            </Link>
        </nav>
    );
}
