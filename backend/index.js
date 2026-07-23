const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const salaryRecordRoutes = require('./routes/salaryRecordRoutes');
const claimRequestRoutes = require('./routes/claimRequestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // สำหรับอ่านข้อมูลแบบ JSON จาก Request Body

// Sample Route
app.get('/api', (req, res) => {
    res.json({ message: "Hello from Express Backend!" });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/salary-records', salaryRecordRoutes);
app.use('/api/claim-requests', claimRequestRoutes);

// จับ error จากการอัปโหลดไฟล์ (ไฟล์ใหญ่เกิน/ประเภทไม่ถูกต้อง) ให้ตอบ JSON แทน HTML error page ของ Express
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'ไฟล์มีขนาดใหญ่เกินไป (จำกัด 5MB)' });
        }
        return res.status(400).json({ message: 'อัปโหลดไฟล์ไม่สำเร็จ' });
    }
    if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: 'รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp) เท่านั้น' });
    }
    next(err);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});