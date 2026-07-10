import { Link } from 'react-router-dom';

function formatBaht(amount) {
    return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EmployeeCard({ employee, onEdit, onDelete, onCreateAccount, onRemoveAccount }) {
    return (
        <div className="item-card">
            <div className="item-card-header">
                <div>
                    <div className="item-card-title">{employee.name}</div>
                    <div className="item-card-subtitle">{employee.position}</div>
                </div>
            </div>

            <div className="item-card-rows">
                <div className="item-card-row">
                    <span>เงินเดือนฐาน</span>
                    <span>{formatBaht(employee.base_salary)}</span>
                </div>
                <div className="item-card-row">
                    <span>โบนัส</span>
                    <span className="text-positive">+{formatBaht(employee.bonus)}</span>
                </div>
                <div className="item-card-row">
                    <span>หัก</span>
                    <span className="text-negative">-{formatBaht(employee.deduction)}</span>
                </div>
                <div className="item-card-row">
                    <span>เงินเดือนสุทธิ</span>
                    <strong>{formatBaht(employee.net_salary)}</strong>
                </div>
            </div>

            <div className="item-card-row">
                <span>บัญชี Login</span>
                {employee.account_username ? (
                    <span className="username-badge">{employee.account_username}</span>
                ) : (
                    <span>ยังไม่มีบัญชี</span>
                )}
            </div>

            <div className="item-card-actions btn-group">
                <Link to={`/payroll/${employee.id}`} className="btn btn-edit btn-sm">
                    ประวัติเงินเดือน
                </Link>
                <button className="btn btn-edit btn-sm" onClick={() => onEdit(employee.id)}>
                    แก้ไข
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(employee.id)}>
                    ลบ
                </button>
                {employee.account_username ? (
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onRemoveAccount(employee.user_id)}
                    >
                        ลบบัญชี
                    </button>
                ) : (
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onCreateAccount(employee.id, employee.name)}
                    >
                        สร้างบัญชี
                    </button>
                )}
            </div>
        </div>
    );
}
