import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { API_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Field from '../components/Field';

export default function LoginPage() {
    const { user, token, login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // ถ้า login ค้างอยู่แล้ว เด้งไปหน้าของตัวเองเลยไม่ต้อง login ซ้ำ
    if (user && token) {
        return <Navigate to={user.role === 'admin' ? '/' : '/salary'} replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
            return;
        }

        login(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/' : '/salary');
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>เข้าสู่ระบบ</h1>
                <p className="auth-subtitle">ระบบจัดการเงินเดือนพนักงาน</p>

                <form onSubmit={handleSubmit}>
                    <Field label="ชื่อผู้ใช้" htmlFor="username" wide>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </Field>

                    <Field label="รหัสผ่าน" htmlFor="password" wide>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Field>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary btn-block">
                            เข้าสู่ระบบ
                        </button>
                    </div>
                </form>

                <p className="error-text">{error}</p>
            </div>
        </div>
    );
}
