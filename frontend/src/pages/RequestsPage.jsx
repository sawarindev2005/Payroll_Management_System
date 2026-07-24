import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import Field from '../components/Field';
import ClaimRequestCard from './ClaimRequestCard';
import { formatBaht } from './SalaryRecordCard';

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

    const [approveModal, setApproveModal] = useState(null); // request being approved
    const [slipImage, setSlipImage] = useState(null);
    const [approveNote, setApproveNote] = useState('');
    const [approveError, setApproveError] = useState('');

    async function fetchRequests() {
        const res = await apiFetch('/claim-requests');
        setRequests(await res.json());
    }

    useEffect(() => {
        fetchRequests();
    }, []);

    function openApproveModal(request) {
        setSlipImage(null);
        setApproveNote('');
        setApproveError('');
        setApproveModal(request);
    }

    async function handleApproveSubmit(event) {
        event.preventDefault();
        setApproveError('');

        if (!slipImage) {
            setApproveError('กรุณาแนบรูปสลิปโอนเงิน');
            return;
        }

        const formData = new FormData();
        formData.append('slip_image', slipImage);
        formData.append('admin_note', approveNote);

        const res = await apiFetch(`/claim-requests/${approveModal.id}/approve`, {
            method: 'PUT',
            body: formData,
        });

        if (!res.ok) {
            const data = await res.json();
            setApproveError(data.message || 'อนุมัติคำขอไม่สำเร็จ');
            return;
        }

        setApproveModal(null);
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
                                            onClick={() => openApproveModal(r)}
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

            {approveModal && (
                <Modal title="อนุมัติคำขอ">
                    {approveModal.type === 'advance' && approveModal.remaining_salary !== undefined && (
                        <div className="item-card-rows" style={{ marginBottom: '1rem' }}>
                            <div className="item-card-row">
                                <span>เงินเดือนคงเหลือก่อนอนุมัติ</span>
                                <span>{formatBaht(approveModal.remaining_salary)}</span>
                            </div>
                            <div className="item-card-row">
                                <span>จำนวนที่จะเบิก</span>
                                <span>{formatBaht(approveModal.amount)}</span>
                            </div>
                            <div className="item-card-row">
                                <span>เงินเดือนคงเหลือหลังอนุมัติ</span>
                                <strong
                                    className={
                                        approveModal.remaining_salary - approveModal.amount < 0
                                            ? 'text-negative'
                                            : ''
                                    }
                                >
                                    {formatBaht(approveModal.remaining_salary - approveModal.amount)}
                                </strong>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleApproveSubmit}>
                        <Field label="แนบรูปสลิปโอนเงิน" htmlFor="approve-slip-image" wide>
                            <input
                                id="approve-slip-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setSlipImage(e.target.files[0] || null)}
                                required
                            />
                        </Field>
                        <Field label="หมายเหตุ" htmlFor="approve-note" wide>
                            <textarea
                                id="approve-note"
                                placeholder="ระบุหมายเหตุ (ถ้ามี)"
                                value={approveNote}
                                onChange={(e) => setApproveNote(e.target.value)}
                            />
                        </Field>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={!slipImage}>
                                ยืนยันอนุมัติ
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setApproveModal(null)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                    <p className="error-text">{approveError}</p>
                </Modal>
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
