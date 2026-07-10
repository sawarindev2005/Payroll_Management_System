const pool = require('../db');

// สร้าง record เงินเดือนของเดือนปัจจุบันให้อัตโนมัติ (lazy) ถ้ายังไม่มี
// โดย snapshot ค่าจาก employees.base_salary/bonus/deduction ณ ตอนนั้น
async function ensureCurrentMonthRecord(employeeId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [existing] = await pool.query(
        'SELECT id FROM salary_records WHERE employee_id = ? AND period_year = ? AND period_month = ?',
        [employeeId, year, month]
    );
    if (existing.length > 0) return;

    const [empRows] = await pool.query(
        'SELECT base_salary, bonus, deduction FROM employees WHERE id = ?',
        [employeeId]
    );
    if (empRows.length === 0) return;

    const { base_salary, bonus, deduction } = empRows[0];
    try {
        await pool.query(
            `INSERT INTO salary_records (employee_id, period_year, period_month, base_salary, bonus, deduction)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [employeeId, year, month, base_salary, bonus, deduction]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return; // อีก request สร้างไปพอดีแล้ว (race)
        throw err;
    }
}

// คืน record ของเดือนปัจจุบันของพนักงานคนหนึ่ง (สร้างให้อัตโนมัติถ้ายังไม่มี)
async function getCurrentMonthRecord(employeeId) {
    await ensureCurrentMonthRecord(employeeId);
    const now = new Date();
    const [rows] = await pool.query(
        'SELECT * FROM salary_records WHERE employee_id = ? AND period_year = ? AND period_month = ?',
        [employeeId, now.getFullYear(), now.getMonth() + 1]
    );
    return rows[0];
}

module.exports = { ensureCurrentMonthRecord, getCurrentMonthRecord };
