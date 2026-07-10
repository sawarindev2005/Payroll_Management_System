import StatusBadge from '../components/StatusBadge';
import { formatBaht } from './SalaryRecordCard';

const TYPE_LABELS = {
    advance: 'เบิกเงินล่วงหน้า',
    reimbursement: 'เบิกค่าใช้จ่าย',
};

function formatDate(value, withTime) {
    if (!value) return '';
    return withTime ? new Date(value).toLocaleString('th-TH') : new Date(value).toLocaleDateString('th-TH');
}

export default function ClaimRequestCard({ request, showEmployeeName, showReviewInfo, actions }) {
    return (
        <div className="item-card">
            <div className="item-card-header">
                <div>
                    {showEmployeeName && (
                        <div className="item-card-title">{request.employee_name}</div>
                    )}
                    <div className="item-card-subtitle">{TYPE_LABELS[request.type] || request.type}</div>
                </div>
                <StatusBadge status={request.status} />
            </div>

            <div className="item-card-rows">
                <div className="item-card-row">
                    <span>จำนวนเงิน</span>
                    <strong>{formatBaht(request.amount)}</strong>
                </div>
                <div className="item-card-row">
                    <span>เหตุผล</span>
                    <span>{request.reason}</span>
                </div>
                <div className="item-card-row">
                    <span>วันที่ขอ</span>
                    <span>{formatDate(request.created_at)}</span>
                </div>
                {showReviewInfo && request.status !== 'pending' && (
                    <div className="item-card-row">
                        <span>ตรวจเมื่อ</span>
                        <span>
                            {formatDate(request.reviewed_at, true)}
                            {request.admin_note && ` — ${request.admin_note}`}
                        </span>
                    </div>
                )}
                {request.type === 'advance' && request.remaining_salary !== undefined && (
                    <>
                        <div className="item-card-row">
                            <span>เงินเดือนเดือนนี้</span>
                            <span>{formatBaht(request.current_net_salary)}</span>
                        </div>
                        <div className="item-card-row">
                            <span>เงินเดือนคงเหลือ</span>
                            <strong>{formatBaht(request.remaining_salary)}</strong>
                        </div>
                    </>
                )}
            </div>

            {request.type === 'advance' && request.advances_this_month?.length > 0 && (
                <div className="item-card-rows">
                    <div className="item-card-subtitle">รายการเบิกล่วงหน้าเดือนนี้</div>
                    {request.advances_this_month.map((a) => (
                        <div key={a.id} className="item-card-row">
                            <span>{formatDate(a.reviewed_at, true)}</span>
                            <span>{formatBaht(a.amount)}</span>
                        </div>
                    ))}
                </div>
            )}

            {actions && <div className="item-card-actions btn-group">{actions}</div>}
        </div>
    );
}
