import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp) and PDFs are allowed!'));
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Alias for existing booking routes
export const licenceUpload = upload;

// Multi-document upload for booking verification
export const riderDocumentsUpload = upload.fields([
  { name: 'drivingLicense', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 },
  { name: 'paymentProof', maxCount: 1 },
  // Legacy aliases
  { name: 'licence', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'additional', maxCount: 1 }
]);
