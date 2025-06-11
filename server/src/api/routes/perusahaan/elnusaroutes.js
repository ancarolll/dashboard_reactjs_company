import express from 'express';
import { ElnusaController } from '../../../controllers/perusahaan/elnusa.controller.js';
import { ElnusaHSEController } from '../../../controllers/hse/elnusahse.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads');
    // Create directory if it doesn't exist with proper permissions
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Format file name: [docType]-[userId]-[timestamp].[extension]
    const docType = req.params.docType;
    const userId = req.params.userId;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    
    cb(null, `${docType}-${userId}-${timestamp}${extension}`);
  }
});
  
  // Filter file untuk membatasi jenis file yang diperbolehkan
  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.'), false);
    }
  };
  
  // Konfigurasi upload dengan batas ukuran file (10MB)
  // !!! Penting: Definisikan upload di sini !!!
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });  

  const documentFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.'), false);
    }
  };
  
  // Filter khusus untuk file CSV dan Excel
  const dataFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv',
      'text/plain' // Terkadang CSV terdeteksi sebagai text/plain
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan CSV atau Excel (.csv, .xlsx, .xls)'), false);
    }
  };
  
  // Fungsi validasi
const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'no_rekening'
  ];
  return validTypes.includes(docType);
};

  // Konfigurasi upload dengan batas ukuran file untuk dokumen (10MB)
  const docUpload = multer({
    storage: storage,
    fileFilter: documentFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });
  
  // Konfigurasi upload untuk file data massal (5MB)
  const dataUpload = multer({
    storage: storage,
    fileFilter: dataFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  });


// Handle CORS preflight requests
router.options('*', ElnusaController.handleOptionsRequest);

// Halaman utama project elnusa
router.get('/', ElnusaController.index);

// Menambahkan route untuk mendapatkan semua user
router.get('/users', ElnusaController.getAll);

// Halaman edit project (elnusa_editprojectpage)
router.get('/edit', ElnusaController.getEditPage);

// Halaman NA project (elnusa_naprojectpage)
router.get('/na', ElnusaController.getNaPage);

// Halaman view project (elnusa_viewprojectpage)
router.get('/view', ElnusaController.getViewPage);

// Form tambah user
router.get('/tambah-user', ElnusaController.getTambahUserForm);

// Form edit user
router.get('/edit-user/:id', ElnusaController.getEditUserForm);

// API untuk user
router.post('/users', async (req, res) => {
  try {
    // Log request body untuk debugging
    // console.log('POST /users - Request body:', JSON.stringify(req.body, null, 2));
    
    // Lanjutkan ke controller
    await ElnusaController.addUser(req, res);
  } catch (error) {
    console.error('Error in POST /users route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in user creation route',
      error: error.message
    });
  }
});
router.get('/users/:id', ElnusaController.getUserById);
router.put('/users/:id', ElnusaController.updateUser);
router.delete('/users/:id', ElnusaController.deleteUser);

// Memindahkan user ke status NA
router.put('/users/:id/na', ElnusaController.setUserInactive);

// Memulihkan user dari NA
router.put('/users/:id/restore', ElnusaController.restoreUser);

// Upload dokumen (CV, Ijazah, Sertifikat)
router.post('/users/:userId/upload/:docType', upload.single('file'), ElnusaController.uploadDocument);

// Download dokumen
router.get('/users/:userId/download/:docType', ElnusaController.downloadDocument);

// Rute untuk riwayat kontrak
router.get('/users/:id/history', ElnusaController.getKontrakHistory);
router.get('/users/:id/all-contract-history', ElnusaController.getAllContractHistory);
router.get('/contract-history/stats', ElnusaController.getContractChangeStats);

// Endpoint untuk template CSV
router.get('/template/csv', ElnusaController.getCSVTemplate);

// Endpoint untuk upload massal - menggunakan dataUpload
router.post('/upload-bulk', dataUpload.single('file'), ElnusaController.uploadBulkData);

// Data detail user
router.get('/users/:id/salary', ElnusaController.getSalaryData);
router.get('/users/:id/personal', ElnusaController.getPersonalData);
router.get('/users/:id/admin', ElnusaController.getAdminData);

// Route yang menggunakan controller utama Elnusa
router.get('/hse-data', ElnusaController.getHSEData);

// Route yang menggunakan controller HSE khusus
router.put('/users/:id/hse', ElnusaHSEController.updateHSEDataWithHistory);
router.get('/users/:id/hse-history', ElnusaHSEController.getHSEHistory);
router.get('/hse-history/stats', ElnusaHSEController.getHSEHistoryStats);

// Delete file document
router.delete('/users/:userId/delete-file/:docType', ElnusaController.deleteDocument);

// Utility routes
router.get('/check-expired', ElnusaController.checkExpiredContracts);

router.get('/check-expired/frontend', async (req, res) => {
  try {
    // console.log('Frontend meminta pengecekan kontrak kedaluwarsa');
    
    // Panggil controller untuk memeriksa kontrak kedaluwarsa
    const result = await ElnusaController.checkExpiredContracts(req, res);
    
    // Result sudah ditangani oleh controller dan response dikirim di sana
    return result;
  } catch (error) {
    console.error('Error saat memeriksa kontrak kedaluwarsa dari frontend:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Add these document-related routes to your existing elnusa.routes.js

// Upload document routes for KTP, KK, NPWP, BPJS Kesehatan, BPJS TK, and Account Number
router.post('/users/:userId/upload/no_ktp', upload.single('file'), ElnusaController.uploadDocument);
router.post('/users/:userId/upload/no_kk', upload.single('file'), ElnusaController.uploadDocument);
router.post('/users/:userId/upload/npwp', upload.single('file'), ElnusaController.uploadDocument);
router.post('/users/:userId/upload/no_bpjs_kesehatan', upload.single('file'), ElnusaController.uploadDocument);
router.post('/users/:userId/upload/no_bpjs_tk', upload.single('file'), ElnusaController.uploadDocument);
router.post('/users/:userId/upload/no_rekening', upload.single('file'), ElnusaController.uploadDocument);

// Download document routes
router.get('/users/:userId/download/no_ktp', ElnusaController.downloadDocument);
router.get('/users/:userId/download/no_kk', ElnusaController.downloadDocument);
router.get('/users/:userId/download/npwp', ElnusaController.downloadDocument);
router.get('/users/:userId/download/no_bpjs_kesehatan', ElnusaController.downloadDocument);
router.get('/users/:userId/download/no_bpjs_tk', ElnusaController.downloadDocument);
router.get('/users/:userId/download/no_rekening', ElnusaController.downloadDocument);

// Delete document routes
router.delete('/users/:userId/delete-file/no_ktp', ElnusaController.deleteDocument);
router.delete('/users/:userId/delete-file/no_kk', ElnusaController.deleteDocument);
router.delete('/users/:userId/delete-file/npwp', ElnusaController.deleteDocument);
router.delete('/users/:userId/delete-file/no_bpjs_kesehatan', ElnusaController.deleteDocument);
router.delete('/users/:userId/delete-file/no_bpjs_tk', ElnusaController.deleteDocument);
router.delete('/users/:userId/delete-file/no_rekening', ElnusaController.deleteDocument);

// Routes for sertifikat management
router.post('/sertifikat/create-table', ElnusaController.createSertifikatTable);
router.post('/sertifikat', ElnusaController.addSertifikat);
router.get('/sertifikat/user/:userId', ElnusaController.getSertifikatByUserId);
router.get('/sertifikat/:id', ElnusaController.getSertifikatById);
router.put('/sertifikat/:id', ElnusaController.updateSertifikat);
router.delete('/sertifikat/:id', ElnusaController.deleteSertifikat);

export default router;