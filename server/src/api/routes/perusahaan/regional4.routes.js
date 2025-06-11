import express from "express";
import { Regional4Controller } from "../../../controllers/perusahaan/regional4.controller.js";
import { Regional4HSEController } from "../../../controllers/hse/regional4hse.controller.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'nik', 'no_kk', 'npwp', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan', 'nomor_rekening'
  ];
  return validTypes.includes(docType);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/regional4');
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
router.options('*', Regional4Controller.handleOptionsRequest);

// Halaman utama project regional4
router.get('/', Regional4Controller.index);

// Menambahkan route untuk mendapatkan semua user
router.get('/users', Regional4Controller.getAll);

// Halaman edit project (regional4_editprojectpage)
router.get('/edit', Regional4Controller.getEditPage);

// Halaman NA project (regional4_naprojectpage)
router.get('/na', Regional4Controller.getNaPage);

// Halaman view project (regional4_viewprojectpage)
router.get('/view', Regional4Controller.getViewPage);

// Form tambah user
router.get('/tambah-user', Regional4Controller.getTambahUserForm);

// Form edit user
router.get('/edit-user/:id', Regional4Controller.getEditUserForm);

// API untuk user
router.post('/users', async (req, res) => {
  try {
    // Log request body untuk debugging
    // console.log('POST /users - Request body:', JSON.stringify(req.body, null, 2));
    
    // Lanjutkan ke controller
    await Regional4Controller.addUser(req, res);
  } catch (error) {
    console.error('Error in POST /users route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in user creation route',
      error: error.message
    });
  }
});
router.get('/users/:id', Regional4Controller.getUserById);
router.put('/users/:id', Regional4Controller.updateUser);
router.delete('/users/:id', Regional4Controller.deleteUser);

// Delete file document
router.delete('/users/:userId/delete-file/:docType', Regional4Controller.deleteDocument);

// Memindahkan user ke status NA
router.put('/users/:id/na', Regional4Controller.setUserInactive);

// Memulihkan user dari NA
router.put('/users/:id/restore', Regional4Controller.restoreUser);

// Download dokumen
router.get('/users/:userId/download/:docType', Regional4Controller.downloadDocument);

// Rute untuk riwayat kontrak
router.get('/users/:id/history', Regional4Controller.getKontrakHistory);
router.get('/users/:id/all-contract-history', Regional4Controller.getAllContractHistory);
router.get('/contract-history/stats', Regional4Controller.getContractChangeStats);

// Endpoint untuk template CSV
router.get('/template/csv', Regional4Controller.getCSVTemplate);

// Endpoint untuk upload massal - menggunakan dataUpload
router.post('/upload-bulk', dataUpload.single('file'), Regional4Controller.uploadBulkData);

// Data detail user
router.get('/users/:id/personal', Regional4Controller.getPersonalData);
router.get('/users/:id/admin', Regional4Controller.getAdminData);
router.get('/users/:id/certification', Regional4Controller.getCertificationData);

// Route yang menggunakan controller utama Regional4
router.get('/hse-data', Regional4Controller.getHSEData);

// Route yang menggunakan controller HSE khusus
router.put('/users/:id/hse', Regional4HSEController.updateHSEDataWithHistory);
router.get('/users/:id/hse-history', Regional4HSEController.getHSEHistory);
router.get('/hse-history/stats', Regional4HSEController.getHSEHistoryStats);

// Document management routes
router.post('/users/:userId/upload/:docType', upload.single('file'), Regional4Controller.uploadDocument);
router.get('/users/:userId/file/:docType', Regional4Controller.getDocumentFile);

// Routes for sertifikat management
router.post('/sertifikat/create-table', Regional4Controller.createSertifikatTable);
router.post('/sertifikat', Regional4Controller.addSertifikat);
router.get('/sertifikat/user/:userId', Regional4Controller.getSertifikatByUserId);
router.get('/sertifikat/:id', Regional4Controller.getSertifikatById);
router.put('/sertifikat/:id', Regional4Controller.updateSertifikat);
router.delete('/sertifikat/:id', Regional4Controller.deleteSertifikat);

router.post('/users/:userId/upload/nik', upload.single('file'), Regional4Controller.uploadDocument);
router.post('/users/:userId/upload/no_kk', upload.single('file'), Regional4Controller.uploadDocument);
router.post('/users/:userId/upload/npwp', upload.single('file'), Regional4Controller.uploadDocument);
router.post('/users/:userId/upload/bpjs_kesehatan', upload.single('file'), Regional4Controller.uploadDocument);
router.post('/users/:userId/upload/bpjs_ketenagakerjaan', upload.single('file'), Regional4Controller.uploadDocument);
router.post('/users/:userId/upload/nomor_rekening', upload.single('file'), Regional4Controller.uploadDocument);

// Download document routes
router.get('/users/:userId/download/nik', Regional4Controller.downloadDocument);
router.get('/users/:userId/download/no_kk', Regional4Controller.downloadDocument);
router.get('/users/:userId/download/npwp', Regional4Controller.downloadDocument);
router.get('/users/:userId/download/bpjs_kesehatan', Regional4Controller.downloadDocument);
router.get('/users/:userId/download/bpjs_ketenagakerjaan', Regional4Controller.downloadDocument);
router.get('/users/:userId/download/nomor_rekening', Regional4Controller.downloadDocument);

// Delete document routes
router.delete('/users/:userId/delete-file/nik', Regional4Controller.deleteDocument);
router.delete('/users/:userId/delete-file/no_kk', Regional4Controller.deleteDocument);
router.delete('/users/:userId/delete-file/npwp', Regional4Controller.deleteDocument);
router.delete('/users/:userId/delete-file/bpjs_kesehatan', Regional4Controller.deleteDocument);
router.delete('/users/:userId/delete-file/bpjs_ketenagakerjaan', Regional4Controller.deleteDocument);
router.delete('/users/:userId/delete-file/nomor_rekening', Regional4Controller.deleteDocument);

// Routes for sertifikat management
router.post('/sertifikat/create-table', Regional4Controller.createSertifikatTable);
router.post('/sertifikat', Regional4Controller.addSertifikat);
router.get('/sertifikat/user/:userId', Regional4Controller.getSertifikatByUserId);
router.get('/sertifikat/:id', Regional4Controller.getSertifikatById);
router.put('/sertifikat/:id', Regional4Controller.updateSertifikat);
router.delete('/sertifikat/:id', Regional4Controller.deleteSertifikat);

// Utility routes
router.get('/check-expired', Regional4Controller.checkExpiredContracts);

router.get('/check-expired/frontend', async (req, res) => {
  try {
    // console.log('Frontend meminta pengecekan kontrak kedaluwarsa');
    
    // Panggil controller untuk memeriksa kontrak kedaluwarsa
    const result = await Regional4Controller.checkExpiredContracts(req, res);
    
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
