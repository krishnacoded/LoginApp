const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/documents';
    if (file.fieldname === 'profile_picture') folder = 'uploads/profiles';
    else if (file.fieldname === 'resume') folder = 'uploads/resumes';
    else if (file.fieldname === 'leave_attachment') folder = 'uploads/leaves';

    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const allowed = allowedTypes || ['image/jpeg', 'image/png', 'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowed.join(', ')}`), false);
  }
};

const uploadProfile = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).single('profile_picture');

const uploadDocument = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: fileFilter(),
}).fields([
  { name: 'resume', maxCount: 1 },
  { name: 'id_proof', maxCount: 1 },
  { name: 'certificate', maxCount: 5 },
  { name: 'document', maxCount: 1 },
]);

const uploadLeaveAttachment = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'application/pdf']),
}).single('leave_attachment');

const uploadSingle = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: fileFilter(),
}).single('file');

module.exports = { uploadProfile, uploadDocument, uploadLeaveAttachment, uploadSingle };