import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import Field from '../components/Field';
import ClaimRequestCard from './ClaimRequestCard';

const FILTERS = [
    { status: '', label: 'ทั้งหมด' },
    { status: 'pending', label: 'รออนุมัติ' },
    { status: 'approved', label: 'อนุมัติแล้ว' },
    { status: 'rejected', label: 'ปฏิเสธแล้ว' },
];

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('');

    const [rejectModal, setRejectModal] = useState(null); // request being rejected
    const [rejectNote, setRejectNote] = useState('');
    const [rejectError, setRejectError] = useState('');

    async function fetchRequests() {
        const res = await apiFetch('/claim-requests');
        setRequests(await res.json());
    }

    useEffect(() => {
        fetchRequests();
    }, []);

    async function handleApprove(id) {
        if (!window.confirm('ยืนยันการอนุมัติคำขอนี้?')) return;
        await apiFetch(`/claim-requests/${id}/approve`, { method: 'PUT' });
        fetchRequests();
    }

    function openRejectModal(request) {
        setRejectNote('');
        setRejectError('');
        setRejectModal(request);
    }

    async function handleRejectSubmit(event) {
        event.preventDefault();
        setRejectError('');

        const res = await apiFetch(`/claim-requests/${rejectModal.id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_note: rejectNote }),
        });

        if (!res.ok) {
            const data = await res.json();
            setRejectError(data.message || 'ปฏิเสธคำขอไม่สำเร็จ');
            return;
        }

        setRejectModal(null);
        fetchRequests();
    }

    const filtered = filter ? requests.filter((r) => r.status === filter) : requests;

    return (
        <div className="page-content">
            <Topbar title="คำขอเบิก" backTo="/" />

            <div className="filter-bar">
                {FILTERS.map((f) => (
                    <button
                        key={f.status}
                        className={`btn btn-outline${filter === f.status ? ' active' : ''}`}
                        onClick={() => setFilter(f.status)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="empty-state">ไม่มีคำขอในหมวดนี้</p>
            ) : (
                <div className="card-list">
                    {filtered.map((r) => (
                        <ClaimRequestCard
                            key={r.id}
                            request={r}
                            showEmployeeName
                            showReviewInfo
                            actions={
                                r.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleApprove(r.id)}
                                        >
                                            อนุมัติ
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => openRejectModal(r)}
                                        >
                                            ปฏิเสธ
                                        </button>
                                    </>
                                )
                            }
                        />
                    ))}
                </div>
            )}

            {rejectModal && (
                <Modal title="ปฏิเสธคำขอ">
                    <form onSubmit={handleRejectSubmit}>
                        <Field label="เหตุผลที่ปฏิเสธ" htmlFor="reject-note" wide>
                            <textarea
                                id="reject-note"
                                placeholder="ระบุเหตุผล (ถ้ามี)"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                            />
                        </Field>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-danger">
                                ยืนยันปฏิเสธ
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setRejectModal(null)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                    <p className="error-text">{rejectError}</p>
                </Modal>
            )}

            <BottomNav />
        </div>
    );
}
