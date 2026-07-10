import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// แทน requireRole() เดิม: ไม่มี session -> เด้งไป login, role ไม่ตรง -> เด้งไปหน้า home ของ role นั้น
export default function ProtectedRoute({ role, children }) {
    const { token, user } = useAuth();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        return <Navigate to={user.role === 'admin' ? '/' : '/salary'} replace />;
    }

    return children;
}
