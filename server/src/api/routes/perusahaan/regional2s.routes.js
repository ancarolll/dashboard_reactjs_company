import express from "express";
import { Regional2sController } from "../../../controllers/perusahaan/regional2s.controller.js";
import { Regional2SHSEController } from "../../../controllers/hse/regional2shse.controller.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Fungsi validasi tipe dokumen - DISESUAIKAN UNTUK REGIONAL2S
const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 
    'bpjstk', 'no_rekening'
  ];
  return validTypes.includes(docType);
};

// Konfigurasi penyimpanan file dengan multer
// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Gunakan path absolut untuk direktori uploads
    const uploadDir = path.join(__dirname, '../../../uploads/regional2s');
    // console.log(`Direktori uploads: ${uploadDir}`);
    
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
      // console.log(`Direktori uploads tidak ada, membuat direktori baru...`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Periksa apakah direktori dapat ditulis
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      // console.log('Direktori uploads dapat ditulis');
    } catch (err) {
      console.error('Direktori uploads tidak dapat ditulis:', err);
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // PERBAIKAN: Ambil docType dari req.params, bukan req.params.docType
    const docType = req.params.docType; // Ini yang benar
    const userId = req.params.userId;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    
    // console.log(`[DEBUG] Generating filename for docType: ${docType}, userId: ${userId}`);
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
  
// Konfigurasi upload dengan batas ukuran file (5MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
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
router.options('*', Regional2sController.handleOptionsRequest);

// Halaman utama project regional2s
router.get('/', Regional2sController.index);

// Menambahkan route untuk mendapatkan semua user
router.get('/users', Regional2sController.getAll);

// Halaman edit project (regional2s_editprojectpage)
router.get('/edit', Regional2sController.getEditPage);

// Halaman NA project (regional2s_naprojectpage)
router.get('/na', Regional2sController.getNaPage);

// Halaman view project (regional2s_viewprojectpage)
router.get('/view', Regional2sController.getViewPage);

// Form tambah user
router.get('/tambah-user', Regional2sController.getTambahUserForm);

// Form edit user
router.get('/edit-user/:id', Regional2sController.getEditUserForm);

// API untuk user
router.post('/users', async (req, res) => {
  try {
    // Log request body untuk debugging
    // console.log('POST /users - Request body:', JSON.stringify(req.body, null, 2));
    
    // Lanjutkan ke controller
    await Regional2sController.addUser(req, res);
  } catch (error) {
    console.error('Error in POST /users route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in user creation route',
      error: error.message
    });
  }
});

router.get('/users/:id', Regional2sController.getUserById);
router.put('/users/:id', Regional2sController.updateUser);
router.delete('/users/:id', Regional2sController.deleteUser);

// Memindahkan user ke status NA
router.put('/users/:id/na', Regional2sController.setUserInactive);

// Memulihkan user dari NA
router.put('/users/:id/restore', Regional2sController.restoreUser);

router.post('/users/:userId/upload/:docType', upload.single('file'), Regional2sController.uploadDocument);

// Download dokumen - Routes untuk semua tipe dokumen
router.get('/users/:userId/download/:docType', Regional2sController.downloadDocument);

// Get file info untuk preview
router.get('/users/:userId/file/:docType', Regional2sController.getDocumentFile);

// Delete file document - Routes untuk semua tipe dokumen
router.delete('/users/:userId/delete-file/:docType', Regional2sController.deleteDocument);

// Rute untuk riwayat kontrak
router.get('/users/:id/history', Regional2sController.getKontrakHistory);
router.get('/users/:id/all-contract-history', Regional2sController.getAllContractHistory);
router.get('/contract-history/stats', Regional2sController.getContractChangeStats);

// Endpoint untuk template CSV
router.get('/template/csv', Regional2sController.getCSVTemplate);

// Endpoint untuk upload massal - menggunakan dataUpload
router.post('/upload-bulk', dataUpload.single('file'), Regional2sController.uploadBulkData);

// Data detail user
router.get('/users/:id/personal', Regional2sController.getPersonalData);
router.get('/users/:id/admin', Regional2sController.getAdminData);
router.get('/users/:id/certification', Regional2sController.getCertificationData);

// Route yang menggunakan controller utama Regional2S
router.get('/hse-data', Regional2sController.getHSEData);

// Route yang menggunakan controller HSE khusus
router.put('/users/:id/hse', Regional2SHSEController.updateHSEDataWithHistory);
router.get('/users/:id/hse-history', Regional2SHSEController.getHSEHistory);
router.get('/hse-history/stats', Regional2SHSEController.getHSEHistoryStats);

// Routes for sertifikat management
router.post('/sertifikat/create-table', Regional2sController.createSertifikatTable);
router.post('/sertifikat', Regional2sController.addSertifikat);
router.get('/sertifikat/user/:userId', Regional2sController.getSertifikatByUserId);
router.get('/sertifikat/:id', Regional2sController.getSertifikatById);
router.put('/sertifikat/:id', Regional2sController.updateSertifikat);
router.delete('/sertifikat/:id', Regional2sController.deleteSertifikat);

// Utility routes
router.get('/check-expired', Regional2sController.checkExpiredContracts);

router.get('/check-expired/frontend', async (req, res) => {
  try {
    // console.log('Frontend meminta pengecekan kontrak kedaluwarsa');
    
    // Panggil controller untuk memeriksa kontrak kedaluwarsa
    const result = await Regional2sController.checkExpiredContracts(req, res);
    
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