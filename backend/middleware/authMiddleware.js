const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'ไม่พบ token กรุณา login ก่อน' });
    }

    const token = header.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'token ไม่ถูกต้องหรือหมดอายุ' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'ต้องเป็น admin เท่านั้นจึงจะใช้งานส่วนนี้ได้' });
    }
    next();
}

module.exports = { verifyToken, requireAdmin };
