import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import Field from '../components/Field';
import ClaimRequestCard, { TYPE_NOTES } from './ClaimRequestCard';

const EMPTY_REQUEST_FORM = { type: 'advance', amount: '', reason: '', qrImage: null };

export default function SalaryRequestsPage() {
    const [myRequests, setMyRequests] = useState([]);

    const [requestForm, setRequestForm] = useState(EMPTY_REQUEST_FORM);
    const [requestError, setRequestError] = useState('');
    const [qrInputKey, setQrInputKey] = useState(0);

    async function loadMyRequests() {
        const res = await apiFetch('/claim-requests/me');
        if (res.ok) setMyRequests(await res.json());
    }

    useEffect(() => {
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
            <Topbar
                title="เบิกเงิน"
                navLinks={
                    <>
                        <Link to="/salary" className="btn btn-outline">
                            เงินเดือนของฉัน
                        </Link>
                        <Link to="/salary/history" className="btn btn-outline">
                            ประวัติเงินเดือน
                        </Link>
                    </>
                }
            />

            <form className="card" onSubmit={handleRequestSubmit}>
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
                    <div className="item-card-subtitle">{TYPE_NOTES[requestForm.type]}</div>
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

            <BottomNav />
        </div>
    );
}
