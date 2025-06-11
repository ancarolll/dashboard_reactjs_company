import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { DocFileController } from '../../../controllers/management/docfile.controller.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Konfigurasi direktori upload
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/dashboard');

// Pastikan direktori upload ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Konfigurasi penyimpanan Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Membuat nama file unik dengan timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// Filter file untuk memastikan hanya gambar yang diterima
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan format JPG, JPEG, atau PNG.'), false);
  }
};

// Setup Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Batas ukuran file 2MB
  },
  fileFilter: fileFilter
});

// Middleware untuk menangani error dari Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file tidak boleh melebihi 2MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error Multer: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Routes untuk halaman
router.get('/view', DocFileController.viewDashboard);
router.get('/inactive', DocFileController.viewInactiveDashboard);
router.get('/edit', DocFileController.editDashboard);
router.get('/edit/:id', DocFileController.editDashboard);
router.get('/preview/:id', DocFileController.previewDashboard);

// API routes
router.get('/api/data', DocFileController.getAllData);
router.get('/api/data/:id', DocFileController.getDataById);
router.post('/api/data', upload.single('image'), handleMulterError, DocFileController.addData);
router.put('/api/data/:id', upload.single('image'), handleMulterError, DocFileController.updateData);
router.patch('/api/data/:id/toggle', DocFileController.toggleActive);
router.delete('/api/data/:id', DocFileController.deleteData);

export default router;
