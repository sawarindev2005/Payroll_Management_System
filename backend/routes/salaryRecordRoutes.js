const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { withNetSalary } = require('../utils/salary');
const { ensureCurrentMonthRecord } = require('../utils/salaryRecords');

async function getHistory(employeeId) {
    const [rows] = await pool.query(
        'SELECT * FROM salary_records WHERE employee_id = ? ORDER BY period_year DESC, period_month DESC',
        [employeeId]
    );
    return rows.map(withNetSalary);
}

// GET /api/salary-records/me - พนักงานดูประวัติเงินเดือนของตัวเอง
router.get('/me', verifyToken, async (req, res) => {
    if (!req.user.employee_id) {
        return res.status(404).json({ message: 'บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน' });
    }
    await ensureCurrentMonthRecord(req.user.employee_id);
    res.json(await getHistory(req.user.employee_id));
});

// ตั้งแต่บรรทัดนี้ลงไป ใช้ได้เฉพาะ admin เท่านั้น
router.use(verifyToken, requireAdmin);

// GET /api/salary-records/employee/:employeeId - admin ดูประวัติเงินเดือนของพนักงานคนหนึ่ง
router.get('/employee/:employeeId', async (req, res) => {
    const [empRows] = await pool.query('SELECT id FROM employees WHERE id = ?', [req.params.employeeId]);
    if (empRows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบพนักงานคนนี้' });
    }
    await ensureCurrentMonthRecord(req.params.employeeId);
    res.json(await getHistory(req.params.employeeId));
});

// POST /api/salary-records/employee/:employeeId - admin กำหนดเงินเดือนของเดือนใดเดือนหนึ่งเอง
// (ย้อนหลังหรือล่วงหน้าก็ได้ ใช้ตอนที่ยังไม่มีแถวของเดือนนั้น)
router.post('/employee/:employeeId', async (req, res) => {
    const { period_year, period_month, base_salary, bonus, deduction } = req.body;

    const [empRows] = await pool.query('SELECT id FROM employees WHERE id = ?', [req.params.employeeId]);
    if (empRows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบพนักงานคนนี้' });
    }

    if (!period_year || !period_month || period_month < 1 || period_month > 12) {
        return res.status(400).json({ message: 'กรุณาระบุปีและเดือนให้ถูกต้อง' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO salary_records (employee_id, period_year, period_month, base_salary, bonus, deduction)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.params.employeeId, period_year, period_month, base_salary || 0, bonus || 0, deduction || 0]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'มีข้อมูลเงินเดือนของเดือนนี้อยู่แล้ว กรุณาแก้ไขแทน' });
        }
        throw err;
    }
});

// GET /api/salary-records/:id - ดึง record เดียว (ใช้เติมฟอร์มแก้ไข)
router.get('/:id', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM salary_records WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนเดือนนี้' });
    }
    res.json(withNetSalary(rows[0]));
});

// PUT /api/salary-records/:id - แก้ไขเงินเดือนของเดือนนั้นๆ (ไม่กระทบ employees หรือเดือนอื่น)
router.put('/:id', async (req, res) => {
    const { base_salary, bonus, deduction } = req.body;
    await pool.query(
        'UPDATE salary_records SET base_salary = ?, bonus = ?, deduction = ? WHERE id = ?',
        [base_salary, bonus || 0, deduction || 0, req.params.id]
    );
    res.json({ message: 'อัปเดตเงินเดือนของเดือนนี้สำเร็จ' });
});

module.exports = router;
