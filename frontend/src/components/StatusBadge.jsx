const STATUS_LABELS = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธแล้ว',
};

export default function StatusBadge({ status }) {
    return (
        <span className={`status-badge status-${status}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}
