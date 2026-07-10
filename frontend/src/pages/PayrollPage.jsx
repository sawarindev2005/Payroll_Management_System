import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Field from '../components/Field';
import SalaryRecordCard, { THAI_MONTHS, monthLabel } from './SalaryRecordCard';

const now = new Date();
const EMPTY_ADD_FORM = {
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
    base_salary: '',
    bonus: '0',
    deduction: '0',
};

export default function PayrollPage() {
    const { employeeId } = useParams();
    const [employeeName, setEmployeeName] = useState('');
    const [records, setRecords] = useState([]);
    const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
    const [addError, setAddError] = useState('');

    const [editModal, setEditModal] = useState(null); // { id, period_month, period_year }
    const [editForm, setEditForm] = useState({ base_salary: '', bonus: '', deduction: '' });
    const [editError, setEditError] = useState('');

    async function loadEmployeeName() {
        const res = await apiFetch(`/employees/${employeeId}`);
        if (!res.ok) {
            setEmployeeName('ไม่พบพนักงาน');
            return;
        }
        const emp = await res.json();
        setEmployeeName(emp.name);
    }

    async function loadHistory() {
        const res = await apiFetch(`/salary-records/employee/${employeeId}`);
        if (!res.ok) {
            setRecords([]);
            return;
        }
        setRecords(await res.json());
    }

    useEffect(() => {
        loadEmployeeName();
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);

    async function handleAddSubmit(event) {
        event.preventDefault();
        setAddError('');

        const payload = {
            period_month: parseInt(addForm.period_month, 10),
            period_year: parseInt(addForm.period_year, 10),
            base_salary: parseFloat(addForm.base_salary),
            bonus: parseFloat(addForm.bonus) || 0,
            deduction: parseFloat(addForm.deduction) || 0,
        };

        const res = await apiFetch(`/salary-records/employee/${employeeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            setAddError(data.message || 'เพิ่มเงินเดือนไม่สำเร็จ');
            return;
        }

        setAddForm(EMPTY_ADD_FORM);
        loadHistory();
    }

    async function openEditModal(id) {
        setEditError('');
        const res = await apiFetch(`/salary-records/${id}`);
        const rec = await res.json();
        setEditForm({ base_salary: rec.base_salary, bonus: rec.bonus, deduction: rec.deduction });
        setEditModal(rec);
    }

    async function handleEditSubmit(event) {
        event.preventDefault();
        setEditError('');

        const payload = {
            base_salary: parseFloat(editForm.base_salary),
            bonus: parseFloat(editForm.bonus) || 0,
            deduction: parseFloat(editForm.deduction) || 0,
        };

        const res = await apiFetch(`/salary-records/${editModal.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const data = await res.json();
            setEditError(data.message || 'บันทึกไม่สำเร็จ');
            return;
        }

        setEditModal(null);
        loadHistory();
    }

    return (
        <div className="page-content">
            <Topbar title={`ประวัติเงินเดือน: ${employeeName}`} backTo="/" />

            <form className="card" onSubmit={handleAddSubmit}>
                <h2>เพิ่มเงินเดือนเดือนใหม่</h2>

                <Field label="เดือน" htmlFor="add-month">
                    <select
                        id="add-month"
                        value={addForm.period_month}
                        onChange={(e) => setAddForm({ ...addForm, period_month: e.target.value })}
                        required
                    >
                        {THAI_MONTHS.map((label, idx) => (
                            <option key={idx} value={idx + 1}>
                                {label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="ปี (ค.ศ.)" htmlFor="add-year">
                    <input
                        id="add-year"
                        type="number"
                        value={addForm.period_year}
                        onChange={(e) => setAddForm({ ...addForm, period_year: e.target.value })}
                        required
                    />
                </Field>

                <Field label="เงินเดือนฐาน" htmlFor="add-base-salary">
                    <input
                        id="add-base-salary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={addForm.base_salary}
                        onChange={(e) => setAddForm({ ...addForm, base_salary: e.target.value })}
                        required
                    />
                </Field>

                <Field label="โบนัส/เงินเพิ่ม" htmlFor="add-bonus">
                    <input
                        id="add-bonus"
                        type="number"
                        step="0.01"
                        min="0"
                        value={addForm.bonus}
                        onChange={(e) => setAddForm({ ...addForm, bonus: e.target.value })}
                    />
                </Field>

                <Field label="รายการหัก" htmlFor="add-deduction">
                    <input
                        id="add-deduction"
                        type="number"
                        step="0.01"
                        min="0"
                        value={addForm.deduction}
                        onChange={(e) => setAddForm({ ...addForm, deduction: e.target.value })}
                    />
                </Field>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        เพิ่มเงินเดือนเดือนนี้
                    </button>
                </div>

                <p className="error-text">{addError}</p>
            </form>

            {records.length === 0 ? (
                <p className="empty-state">ยังไม่มีประวัติเงินเดือน</p>
            ) : (
                <div className="card-list">
                    {records.map((rec) => (
                        <SalaryRecordCard key={rec.id} record={rec} onEdit={openEditModal} />
                    ))}
                </div>
            )}

            {editModal && (
                <Modal title="แก้ไขเงินเดือนเดือนนี้" subtitle={monthLabel(editModal)}>
                    <form onSubmit={handleEditSubmit}>
                        <Field label="เงินเดือนฐาน" htmlFor="edit-base-salary" wide>
                            <input
                                id="edit-base-salary"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editForm.base_salary}
                                onChange={(e) => setEditForm({ ...editForm, base_salary: e.target.value })}
                                required
                            />
                        </Field>
                        <Field label="โบนัส/เงินเพิ่ม" htmlFor="edit-bonus" wide>
                            <input
                                id="edit-bonus"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editForm.bonus}
                                onChange={(e) => setEditForm({ ...editForm, bonus: e.target.value })}
                            />
                        </Field>
                        <Field label="รายการหัก" htmlFor="edit-deduction" wide>
                            <input
                                id="edit-deduction"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editForm.deduction}
                                onChange={(e) => setEditForm({ ...editForm, deduction: e.target.value })}
                            />
                        </Field>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                บันทึก
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setEditModal(null)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                    <p className="error-text">{editError}</p>
                </Modal>
            )}
        </div>
    );
}
