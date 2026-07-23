const path = require('path');
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { getCurrentMonthRecord } = require('../utils/salaryRecords');
const { withNetSalary } = require('../utils/salary');
const { upload, UPLOAD_DIR } = require('../middleware/upload');

const VALID_TYPES = ['advance', 'reimbursement'];

// POST /api/claim-requests - พนักงานสร้างคำขอเบิกของตัวเอง (เบิกล่วงหน้า/เบิกค่าใช้จ่าย)
// ต้องแนบรูป QR พร้อมเพย์ (field: qr_image) เพื่อให้แอดมินรู้ว่าจะโอนเงินไปที่ไหน
router.post('/', verifyToken, upload.single('qr_image'), async (req, res) => {
    if (!req.user.employee_id) {
        return res.status(404).json({ message: 'บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน' });
    }

    const { type, amount, reason } = req.body;

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ message: 'ประเภทคำขอไม่ถูกต้อง' });
    }
    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: 'กรุณาระบุจำนวนเงินให้ถูกต้อง' });
    }
    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'กรุณาระบุเหตุผล' });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'กรุณาแนบรูป QR code พร้อมเพย์' });
    }

    const [result] = await pool.query(
        'INSERT INTO claim_requests (employee_id, type, amount, reason, qr_image_path) VALUES (?, ?, ?, ?, ?)',
        [req.user.employee_id, type, amount, reason.trim(), req.file.filename]
    );
    res.status(201).json({ id: result.insertId });
});

// GET /api/claim-requests/me - พนักงานดูคำขอของตัวเอง
router.get('/me', verifyToken, async (req, res) => {
    if (!req.user.employee_id) {
        return res.status(404).json({ message: 'บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน' });
    }
    const [rows] = await pool.query(
        'SELECT * FROM claim_requests WHERE employee_id = ? ORDER BY created_at DESC',
        [req.user.employee_id]
    );
    res.json(rows);
});

// เจ้าของคำขอ หรือ admin เท่านั้นที่ดูรูปแนบของคำขอนั้นได้
async function sendClaimImage(req, res, column) {
    const [rows] = await pool.query(
        `SELECT employee_id, ${column} AS image_path FROM claim_requests WHERE id = ?`,
        [req.params.id]
    );
    if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบคำขอนี้' });
    }
    const request = rows[0];
    if (req.user.role !== 'admin' && request.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    if (!request.image_path) {
        return res.status(404).json({ message: 'ไม่พบรูปภาพ' });
    }
    res.sendFile(path.join(UPLOAD_DIR, request.image_path));
}

// GET /api/claim-requests/:id/qr-image - รูป QR พร้อมเพย์ที่พนักงานแนบตอนยื่นคำขอ
router.get('/:id/qr-image', verifyToken, (req, res) => sendClaimImage(req, res, 'qr_image_path'));

// GET /api/claim-requests/:id/slip-image - รูปสลิปโอนเงินที่แอดมินแนบตอนอนุมัติ
router.get('/:id/slip-image', verifyToken, (req, res) => sendClaimImage(req, res, 'slip_image_path'));

// ตั้งแต่บรรทัดนี้ลงไป ใช้ได้เฉพาะ admin เท่านั้น
router.use(verifyToken, requireAdmin);

// คำนวณบริบทเบิกล่วงหน้าของพนักงานคนหนึ่ง
// หมายเหตุ: เงินเดือนสุทธิที่เก็บไว้ (จาก salary_records) หักเบิกล่วงหน้าที่อนุมัติแล้วของเดือนนี้ไปในตัวอยู่แล้ว
// (เพราะตอนอนุมัติจะบวกเข้า deduction ตรงๆ) จึงต้อง "บวกกลับ" totalAdvances เพื่อได้เงินเดือนเต็มเดือนก่อนหักเบิกล่วงหน้า
// ส่วน remaining_salary คือค่าที่เก็บไว้ตรงๆ (หักไปแล้วจริง) ไม่ต้องลบซ้ำอีกครั้ง
async function getAdvanceContext(employeeId) {
    const record = await getCurrentMonthRecord(employeeId);
    const storedNetSalary = withNetSalary(record).net_salary;

    const now = new Date();
    const [advances] = await pool.query(
        `SELECT id, amount, reviewed_at FROM claim_requests
         WHERE employee_id = ? AND type = 'advance' AND status = 'approved'
           AND YEAR(reviewed_at) = ? AND MONTH(reviewed_at) = ?
         ORDER BY reviewed_at DESC`,
        [employeeId, now.getFullYear(), now.getMonth() + 1]
    );
    const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);

    return {
        current_net_salary: storedNetSalary + totalAdvances,
        advances_this_month: advances,
        remaining_salary: storedNetSalary,
    };
}

// GET /api/claim-requests - admin ดูคำขอทั้งหมด (filter ?status= ได้)
router.get('/', async (req, res) => {
    const { status } = req.query;
    const params = [];
    let query = `
        SELECT cr.*, e.name AS employee_name
        FROM claim_requests cr
        JOIN employees e ON e.id = cr.employee_id
    `;
    if (status) {
        query += ' WHERE cr.status = ?';
        params.push(status);
    }
    query += " ORDER BY (cr.status = 'pending') DESC, cr.created_at DESC";

    const [rows] = await pool.query(query, params);

    const enriched = await Promise.all(
        rows.map(async (row) => {
            if (row.type !== 'advance') return row;
            return { ...row, ...(await getAdvanceContext(row.employee_id)) };
        })
    );

    res.json(enriched);
});

async function reviewRequest(req, res, newStatus, fileColumn, filename) {
    const { admin_note } = req.body || {};

    const [rows] = await pool.query('SELECT * FROM claim_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
        return res.status(400).json({ message: 'ไม่พบคำขอนี้ หรือถูกดำเนินการไปแล้ว' });
    }
    const request = rows[0];

    const setClauses = ['status = ?', 'reviewed_by = ?', 'reviewed_at = NOW()', 'admin_note = ?'];
    const params = [newStatus, req.user.id, admin_note || null];
    if (fileColumn) {
        setClauses.push(`${fileColumn} = ?`);
        params.push(filename);
    }
    params.push(req.params.id);

    const [result] = await pool.query(
        `UPDATE claim_requests SET ${setClauses.join(', ')} WHERE id = ? AND status = 'pending'`,
        params
    );
    if (result.affectedRows === 0) {
        return res.status(400).json({ message: 'ไม่พบคำขอนี้ หรือถูกดำเนินการไปแล้ว' });
    }

    // เบิกล่วงหน้าที่อนุมัติ ต้องหักเข้า deduction ของเดือนปัจจุบันจริง (ไม่กระทบเดือนอื่น/employees ฐาน)
    if (newStatus === 'approved' && request.type === 'advance') {
        const record = await getCurrentMonthRecord(request.employee_id);
        await pool.query(
            'UPDATE salary_records SET deduction = deduction + ? WHERE id = ?',
            [request.amount, record.id]
        );
    }

    res.json({ message: newStatus === 'approved' ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ' });
}

// PUT /api/claim-requests/:id/approve - admin อนุมัติคำขอ (ต้องเป็น pending อยู่เท่านั้น)
// ต้องแนบรูปสลิปโอนเงิน (field: slip_image) เป็นหลักฐานว่าโอนเงินจริงแล้ว
router.put('/:id/approve', upload.single('slip_image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'กรุณาแนบรูปสลิปโอนเงิน' });
    }
    return reviewRequest(req, res, 'approved', 'slip_image_path', req.file.filename);
});

// PUT /api/claim-requests/:id/reject - admin ปฏิเสธคำขอ (ต้องเป็น pending อยู่เท่านั้น, ไม่ต้องแนบไฟล์)
router.put('/:id/reject', (req, res) => reviewRequest(req, res, 'rejected'));

module.exports = router;
