import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import Field from '../components/Field';
import SalaryRecordCard, { formatBaht } from './SalaryRecordCard';
import ClaimRequestCard from './ClaimRequestCard';

const EMPTY_REQUEST_FORM = { type: 'advance', amount: '', reason: '', qrImage: null };

export default function SalaryPage() {
    const [me, setMe] = useState(null);
    const [meError, setMeError] = useState('');
    const [history, setHistory] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    const [requestForm, setRequestForm] = useState(EMPTY_REQUEST_FORM);
    const [requestError, setRequestError] = useState('');
    const [qrInputKey, setQrInputKey] = useState(0);

    async function loadMySalary() {
        const res = await apiFetch('/employees/me');
        if (!res.ok) {
            setMeError('ไม่พบข้อมูลเงินเดือนของคุณ');
            return;
        }
        setMe(await res.json());
    }

    async function loadSalaryHistory() {
        const res = await apiFetch('/salary-records/me');
        if (res.ok) setHistory(await res.json());
    }

    async function loadMyRequests() {
        const res = await apiFetch('/claim-requests/me');
        if (res.ok) setMyRequests(await res.json());
    }

    useEffect(() => {
        loadMySalary();
        loadSalaryHistory();
        loadMyRequests();
    }, []);

    async function handleRequestSubmit(event) {
        event.preventDefault();
        setRequestError('');

        if (!requestForm.qrImage) {
            setRequestError('กรุณาแนบรูป QR code พร้อมเพย์');
            return;
        }

        const formData = new FormData();
        formData.append('type', requestForm.type);
        formData.append('amount', parseFloat(requestForm.amount));
        formData.append('reason', requestForm.reason);
        formData.append('qr_image', requestForm.qrImage);

        const res = await apiFetch('/claim-requests', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            setRequestError(data.message || 'ส่งคำขอไม่สำเร็จ');
            return;
        }

        setRequestForm(EMPTY_REQUEST_FORM);
        setQrInputKey((k) => k + 1);
        loadMyRequests();
    }

    return (
        <div className="page-content">
            <Topbar title="เงินเดือนของฉัน" />

            <div className="salary-card">
                {meError ? (
                    <p className="error-text">{meError}</p>
                ) : !me ? (
                    <p>กำลังโหลดข้อมูล...</p>
                ) : (
                    <>
                        <div className="salary-row">
                            <span>ชื่อพนักงาน</span>
                            <strong>{me.name}</strong>
                        </div>
                        <div className="salary-row">
                            <span>ตำแหน่ง</span>
                            <strong>{me.position}</strong>
                        </div>
                        <div className="salary-row">
                            <span>เงินเดือนฐาน</span>
                            <strong>{formatBaht(me.base_salary)} บาท</strong>
                        </div>
                        <div className="salary-row">
                            <span>โบนัส/เงินเพิ่ม</span>
                            <strong className="text-positive">+{formatBaht(me.bonus)} บาท</strong>
                        </div>
                        <div className="salary-row">
                            <span>รายการหัก</span>
                            <strong className="text-negative">-{formatBaht(me.deduction)} บาท</strong>
                        </div>
                        <div className="salary-row salary-net">
                            <span>เงินเดือนสุทธิ</span>
                            <strong>{formatBaht(me.net_salary)} บาท</strong>
                        </div>
                    </>
                )}
            </div>

            <h2 style={{ marginTop: '1.5rem' }}>ประวัติเงินเดือน</h2>
            {history.length === 0 ? (
                <p className="empty-state">ยังไม่มีประวัติเงินเดือน</p>
            ) : (
                <div className="card-list">
                    {history.map((rec) => (
                        <SalaryRecordCard key={rec.id} record={rec} />
                    ))}
                </div>
            )}

            <form className="card" style={{ marginTop: '1.5rem' }} onSubmit={handleRequestSubmit}>
                <h2>ยื่นคำขอเบิก</h2>

                <Field label="ประเภท" htmlFor="request-type">
                    <select
                        id="request-type"
                        value={requestForm.type}
                        onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                    >
                        <option value="advance">เบิกเงินล่วงหน้า</option>
                        <option value="reimbursement">เบิกค่าใช้จ่าย</option>
                    </select>
                </Field>

                <Field label="จำนวนเงิน" htmlFor="request-amount">
                    <input
                        id="request-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={requestForm.amount}
                        onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                        required
                    />
                </Field>

                <Field label="เหตุผล" htmlFor="request-reason" wide>
                    <textarea
                        id="request-reason"
                        value={requestForm.reason}
                        onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                        required
                    />
                </Field>

                <Field label="แนบรูป QR code พร้อมเพย์" htmlFor="request-qr-image" wide>
                    <input
                        key={qrInputKey}
                        id="request-qr-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setRequestForm({ ...requestForm, qrImage: e.target.files[0] || null })}
                        required
                    />
                </Field>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        ส่งคำขอ
                    </button>
                </div>

                <p className="error-text">{requestError}</p>
            </form>

            <h2 style={{ marginTop: '1.5rem' }}>รายการคำขอของฉัน</h2>
            {myRequests.length === 0 ? (
                <p className="empty-state">ยังไม่มีคำขอเบิก</p>
            ) : (
                <div className="card-list">
                    {myRequests.map((r) => (
                        <ClaimRequestCard key={r.id} request={r} />
                    ))}
                </div>
            )}
        </div>
    );
}
