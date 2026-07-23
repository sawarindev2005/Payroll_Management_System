const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'claim-requests');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TO_EXT = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        cb(null, `${crypto.randomUUID()}${ALLOWED_MIME_TO_EXT[file.mimetype]}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
            return cb(new Error('INVALID_FILE_TYPE'));
        }
        cb(null, true);
    },
});

module.exports = { upload, UPLOAD_DIR };
