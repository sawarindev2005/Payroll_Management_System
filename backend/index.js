const express = require('express');
const cors = require('cors');
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});