import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import Field from '../components/Field';
import EmployeeCard from './EmployeeCard';

const EMPTY_FORM = { id: '', name: '', position: '', base_salary: '', bonus: '0', deduction: '0' };

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);

    const [accountModal, setAccountModal] = useState(null); // { employeeId, employeeName }
    const [accountUsername, setAccountUsername] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [accountError, setAccountError] = useState('');

    async function fetchEmployees() {
        const res = await apiFetch('/employees');
        setEmployees(await res.json());
    }

    useEffect(() => {
        fetchEmployees();
    }, []);

    function resetForm() {
        setForm(EMPTY_FORM);
    }

    async function handleEdit(id) {
        const res = await apiFetch(`/employees/${id}`);
        const emp = await res.json();
        setForm({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            base_salary: emp.base_salary,
            bonus: emp.bonus,
            deduction: emp.deduction,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const payload = {
            name: form.name,
            position: form.position,
            base_salary: parseFloat(form.base_salary),
            bonus: parseFloat(form.bonus) || 0,
            deduction: parseFloat(form.deduction) || 0,
        };

        if (form.id) {
            await apiFetch(`/employees/${form.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            await apiFetch('/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        resetForm();
        fetchEmployees();
    }

    async function handleDelete(id) {
        if (!window.confirm('ยืนยันการลบพนักงานคนนี้?')) return;
        await apiFetch(`/employees/${id}`, { method: 'DELETE' });
        fetchEmployees();
    }

    function openAccountModal(employeeId, employeeName) {
        setAccountUsername('');
        setAccountPassword('');
        setAccountError('');
        setAccountModal({ employeeId, employeeName });
    }

    async function handleAccountSubmit(event) {
        event.preventDefault();
        setAccountError('');

        const res = await apiFetch('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee_id: accountModal.employeeId,
                username: accountUsername,
                password: accountPassword,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            setAccountError(data.message || 'สร้างบัญชีไม่สำเร็จ');
            return;
        }

        setAccountModal(null);
        fetchEmployees();
    }

    async function handleRemoveAccount(userId) {
        if (!window.confirm('ยืนยันการลบบัญชี login นี้? พนักงานคนนี้จะ login เข้าระบบไม่ได้อีก')) return;
        await apiFetch(`/users/${userId}`, { method: 'DELETE' });
        fetchEmployees();
    }

    return (
        <div className="page-content">
            <Topbar
                title="ระบบจัดการเงินเดือนพนักงาน"
                navLinks={
                    <Link to="/requests" className="btn btn-outline">
                        คำขอเบิก
                    </Link>
                }
            />

            <form className="card" onSubmit={handleSubmit}>
                <Field label="ชื่อพนักงาน" htmlFor="name">
                    <input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                </Field>

                <Field label="ตำแหน่ง" htmlFor="position">
                    <input
                        id="position"
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        required
                    />
                </Field>

                <Field label="เงินเดือนฐาน" htmlFor="base_salary">
                    <input
                        id="base_salary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.base_salary}
                        onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
                        required
                    />
                </Field>

                <Field label="โบนัส/เงินเพิ่ม" htmlFor="bonus">
                    <input
                        id="bonus"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.bonus}
                        onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                    />
                </Field>

                <Field label="รายการหัก" htmlFor="deduction">
                    <input
                        id="deduction"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.deduction}
                        onChange={(e) => setForm({ ...form, deduction: e.target.value })}
                    />
                </Field>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {form.id ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
                    </button>
                    {form.id && (
                        <button type="button" className="btn btn-outline" onClick={resetForm}>
                            ยกเลิกการแก้ไข
                        </button>
                    )}
                </div>
            </form>

            {employees.length === 0 ? (
                <p className="empty-state">ยังไม่มีข้อมูลพนักงาน</p>
            ) : (
                <div className="card-list">
                    {employees.map((emp) => (
                        <EmployeeCard
                            key={emp.id}
                            employee={emp}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onCreateAccount={openAccountModal}
                            onRemoveAccount={handleRemoveAccount}
                        />
                    ))}
                </div>
            )}

            {accountModal && (
                <Modal title="สร้างบัญชี Login" subtitle={`สำหรับ ${accountModal.employeeName}`}>
                    <form onSubmit={handleAccountSubmit}>
                        <Field label="ชื่อผู้ใช้" htmlFor="account-username" wide>
                            <input
                                id="account-username"
                                value={accountUsername}
                                onChange={(e) => setAccountUsername(e.target.value)}
                                required
                            />
                        </Field>
                        <Field label="รหัสผ่าน" htmlFor="account-password" wide>
                            <input
                                id="account-password"
                                type="password"
                                minLength={6}
                                value={accountPassword}
                                onChange={(e) => setAccountPassword(e.target.value)}
                                required
                            />
                        </Field>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                สร้างบัญชี
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setAccountModal(null)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                    <p className="error-text">{accountError}</p>
                </Modal>
            )}

            <BottomNav />
        </div>
    );
}
