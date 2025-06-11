import express from 'express';
import { UmranController } from '../../../controllers/perusahaan/umran.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 
    'no_bpjs_tk', 'rekening'
  ];
  return validTypes.includes(docType);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/umran');
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
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
router.options('*', UmranController.handleOptionsRequest);

// Halaman utama project umran
router.get('/', UmranController.index);

// Menambahkan route untuk mendapatkan semua user
router.get('/users', UmranController.getAll);

// Halaman edit project (umran_editprojectpage)
router.get('/edit', UmranController.getEditPage);

// Halaman NA project (umran_naprojectpage)
router.get('/na', UmranController.getNaPage);

// Halaman view project (umran_viewprojectpage)
router.get('/view', UmranController.getViewPage);

// Form tambah user
router.get('/tambah-user', UmranController.getTambahUserForm);

// Form edit user
router.get('/edit-user/:id', UmranController.getEditUserForm);

// API untuk user
router.post('/users', async (req, res) => {
  try {
    // Log request body untuk debugging
    // console.log('POST /users - Request body:', JSON.stringify(req.body, null, 2));
    
    // Lanjutkan ke controller
    await UmranController.addUser(req, res);
  } catch (error) {
    console.error('Error in POST /users route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in user creation route',
      error: error.message
    });
  }
});
router.get('/users/:id', UmranController.getUserById);
router.put('/users/:id', UmranController.updateUser);
router.delete('/users/:id', UmranController.deleteUser);

// Delete file document
router.delete('/users/:userId/delete-file/:docType', UmranController.deleteDocument);

// Memindahkan user ke status NA
router.put('/users/:id/na', UmranController.setUserInactive);

// Memulihkan user dari NA
router.put('/users/:id/restore', UmranController.restoreUser);

// Download dokumen
router.get('/users/:userId/download/:docType', UmranController.downloadDocument);

// Rute untuk riwayat kontrak
router.get('/users/:id/history', UmranController.getKontrakHistory);

// Endpoint untuk template CSV
router.get('/template/csv', UmranController.getCSVTemplate);

// Endpoint untuk upload massal - menggunakan dataUpload
router.post('/upload-bulk', dataUpload.single('file'), UmranController.uploadBulkData);

// Data detail user
router.get('/users/:id/salary', UmranController.getSalaryData);
router.get('/users/:id/personal', UmranController.getPersonalData);
router.get('/users/:id/admin', UmranController.getAdminData);

// Document management routes
router.post('/users/:userId/upload/:docType', upload.single('file'), UmranController.uploadDocument);
router.get('/users/:userId/file/:docType', UmranController.getDocumentFile);

// Routes for existing documents (CV, Ijazah, Sertifikat, PKWT)
router.post('/users/:userId/upload/cv', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/ijazah', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/sertifikat', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/pkwt', upload.single('file'), UmranController.uploadDocument);

// Routes for new Umran documents
router.post('/users/:userId/upload/no_ktp', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/no_kk', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/npwp', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/no_bpjs_kesehatan', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/no_bpjs_tk', upload.single('file'), UmranController.uploadDocument);
router.post('/users/:userId/upload/rekening', upload.single('file'), UmranController.uploadDocument);

// Download document routes for existing documents
router.get('/users/:userId/download/cv', UmranController.downloadDocument);
router.get('/users/:userId/download/ijazah', UmranController.downloadDocument);
router.get('/users/:userId/download/sertifikat', UmranController.downloadDocument);
router.get('/users/:userId/download/pkwt', UmranController.downloadDocument);

// Download document routes for new Umran documents
router.get('/users/:userId/download/no_ktp', UmranController.downloadDocument);
router.get('/users/:userId/download/no_kk', UmranController.downloadDocument);
router.get('/users/:userId/download/npwp', UmranController.downloadDocument);
router.get('/users/:userId/download/no_bpjs_kesehatan', UmranController.downloadDocument);
router.get('/users/:userId/download/no_bpjs_tk', UmranController.downloadDocument);
router.get('/users/:userId/download/rekening', UmranController.downloadDocument);

// Delete document routes for existing documents
router.delete('/users/:userId/delete-file/cv', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/ijazah', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/sertifikat', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/pkwt', UmranController.deleteDocument);

// Delete document routes for new Umran documents
router.delete('/users/:userId/delete-file/no_ktp', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/no_kk', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/npwp', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/no_bpjs_kesehatan', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/no_bpjs_tk', UmranController.deleteDocument);
router.delete('/users/:userId/delete-file/rekening', UmranController.deleteDocument);

// Routes for sertifikat management
router.post('/sertifikat/create-table', UmranController.createSertifikatTable);
router.post('/sertifikat', UmranController.addSertifikat);
router.get('/sertifikat/user/:userId', UmranController.getSertifikatByUserId);
router.get('/sertifikat/:id', UmranController.getSertifikatById);
router.put('/sertifikat/:id', UmranController.updateSertifikat);
router.delete('/sertifikat/:id', UmranController.deleteSertifikat);

// Tambahkan route baru ini SETELAH route yang sudah ada
router.get('/users/:id/history', UmranController.getKontrakHistory);

// 🎯 TAMBAHKAN ROUTE BARU INI:
router.get('/users/:id/all-contract-history', UmranController.getAllKontrakHistory);

// Atau jika ingin menggunakan route yang sama, bisa tambahkan alias:
router.get('/users/:id/all-contract-history', UmranController.getKontrakHistory);

// Utility routes
router.get('/check-expired', UmranController.checkExpiredContracts);

router.get('/check-expired/frontend', async (req, res) => {
  try {
    // console.log('Frontend meminta pengecekan kontrak kedaluwarsa');
    
    // Panggil controller untuk memeriksa kontrak kedaluwarsa
    const result = await UmranController.checkExpiredContracts(req, res);
    
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

export default router;