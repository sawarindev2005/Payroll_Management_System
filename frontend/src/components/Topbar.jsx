import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import Modal from './Modal';
import Field from './Field';

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function Topbar({ title, backTo, navLinks }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
    const [passwordError, setPasswordError] = useState('');

    function handleLogout() {
        logout();
        navigate('/login');
    }

    function openPasswordModal() {
        setPasswordForm(EMPTY_PASSWORD_FORM);
        setPasswordError('');
        setShowPasswordModal(true);
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setPasswordError('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน');
            return;
        }

        const res = await apiFetch('/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            setPasswordError(data.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            return;
        }

        setShowPasswordModal(false);
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
                <button className="btn btn-outline" onClick={openPasswordModal}>
                    เปลี่ยนรหัสผ่าน
                </button>
                <button className="btn btn-outline" onClick={handleLogout}>
                    ออกจากระบบ
                </button>
            </div>

            {showPasswordModal && (
                <Modal title="เปลี่ยนรหัสผ่าน">
                    <form onSubmit={handlePasswordSubmit}>
                        <Field label="รหัสผ่านเดิม" htmlFor="current-password" wide>
                            <input
                                id="current-password"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                }
                                required
                            />
                        </Field>
                        <Field label="รหัสผ่านใหม่" htmlFor="new-password" wide>
                            <input
                                id="new-password"
                                type="password"
                                minLength={6}
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                }
                                required
                            />
                        </Field>
                        <Field label="ยืนยันรหัสผ่านใหม่" htmlFor="confirm-password" wide>
                            <input
                                id="confirm-password"
                                type="password"
                                minLength={6}
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                }
                                required
                            />
                        </Field>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                บันทึก
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                    <p className="error-text">{passwordError}</p>
                </Modal>
            )}
        </header>
    );
}
