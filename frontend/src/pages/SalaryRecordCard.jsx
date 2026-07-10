const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function formatBaht(amount) {
    return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function monthLabel(record) {
    return `${THAI_MONTHS[record.period_month - 1]} ${record.period_year}`;
}

export default function SalaryRecordCard({ record, onEdit }) {
    return (
        <div className="item-card">
            <div className="item-card-header">
                <div className="item-card-title">{monthLabel(record)}</div>
            </div>

            <div className="item-card-rows">
                <div className="item-card-row">
                    <span>เงินเดือนฐาน</span>
                    <span>{formatBaht(record.base_salary)}</span>
                </div>
                <div className="item-card-row">
                    <span>โบนัส</span>
                    <span className="text-positive">+{formatBaht(record.bonus)}</span>
                </div>
                <div className="item-card-row">
                    <span>หัก</span>
                    <span className="text-negative">-{formatBaht(record.deduction)}</span>
                </div>
                <div className="item-card-row">
                    <span>เงินเดือนสุทธิ</span>
                    <strong>{formatBaht(record.net_salary)}</strong>
                </div>
            </div>

            {onEdit && (
                <div className="item-card-actions btn-group">
                    <button className="btn btn-edit btn-sm" onClick={() => onEdit(record.id)}>
                        แก้ไข
                    </button>
                </div>
            )}
        </div>
    );
}

export { THAI_MONTHS };
