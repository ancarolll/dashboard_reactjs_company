import express from "express";
import { Regional2Z7DController } from "../../../controllers/perusahaan/regional2Z7D.controller.js";
import { Regional2Z7DHSEController } from "../../../controllers/hse/regional2z7dhse.controller.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan_karyawan', 'bpjstk', 'no_rekening_mandiri'
  ];
  return validTypes.includes(docType);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Konfigurasi penyimpanan file dengan multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/regional2z7d');
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }
    cb(null, uploadDir);
},
filename: function(req, file, cb) {
    // Format nama file: [tipe dokumen]-[userId]-[timestamp].[extension]
    const docType = req.params.docType; // cv, ijazah, atau sertifikat
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
router.options('*', Regional2Z7DController.handleOptionsRequest);

// Halaman utama project regional2Z7D
router.get('/', Regional2Z7DController.index);

// Menambahkan route untuk mendapatkan semua user
router.get('/users', Regional2Z7DController.getAll);

// Halaman edit project (regional2Z7D_editprojectpage)
router.get('/edit', Regional2Z7DController.getEditPage);

// Halaman NA project (regional2Z7D_naprojectpage)
router.get('/na', Regional2Z7DController.getNaPage);

// Halaman view project (regional2Z7D_viewprojectpage)
router.get('/view', Regional2Z7DController.getViewPage);

// Form tambah user
router.get('/tambah-user', Regional2Z7DController.getTambahUserForm);

// Form edit user
router.get('/edit-user/:id', Regional2Z7DController.getEditUserForm);

// API untuk user
router.post('/users', async (req, res) => {
    try {
        // Log request body untuk debugging
        // console.log('POST /users - Request body:', JSON.stringify(req.body, null, 2));
        
        // Lanjutkan ke controller
        await Regional2Z7DController.addUser(req, res);
    } catch (error) {
        console.error('Error in POST /users route:', error);
        res.status(500).json({
        success: false,
        message: 'Internal server error in user creation route',
        error: error.message
        });
    }
});
router.get('/users/:id', Regional2Z7DController.getUserById);
router.put('/users/:id', Regional2Z7DController.updateUser);
router.delete('/users/:id', Regional2Z7DController.deleteUser);

// Delete file document
router.delete('/users/:userId/delete-file/:docType', Regional2Z7DController.deleteDocument);

// Memindahkan user ke status NA
router.put('/users/:id/na', Regional2Z7DController.setUserInactive);

// Memulihkan user dari NA
router.put('/users/:id/restore', Regional2Z7DController.restoreUser);

// Document management routes
router.post('/users/:userId/upload/:docType', upload.single('file'), Regional2Z7DController.uploadDocument);
router.get('/users/:userId/file/:docType', Regional2Z7DController.getDocumentFile);

// Download dokumen
router.get('/users/:userId/download/:docType', Regional2Z7DController.downloadDocument);

// Rute untuk riwayat kontrak
router.get('/users/:id/history', Regional2Z7DController.getKontrakHistory);
router.get('/users/:id/all-contract-history', Regional2Z7DController.getAllContractHistory);
router.get('/contract-history/stats', Regional2Z7DController.getContractChangeStats);

// Endpoint untuk template CSV
router.get('/template/csv', Regional2Z7DController.getCSVTemplate);

// Endpoint untuk upload massal - menggunakan dataUpload
router.post('/upload-bulk', dataUpload.single('file'), Regional2Z7DController.uploadBulkData);

// Data detail user
router.get('/users/:id/personal', Regional2Z7DController.getPersonalData);
router.get('/users/:id/admin', Regional2Z7DController.getAdminData);
router.get('/users/:id/certification', Regional2Z7DController.getCertificationData);

// Route yang menggunakan controller utama Regional2Z7D
router.get('/hse-data', Regional2Z7DController.getHSEData);

// Route yang menggunakan controller HSE khusus
router.put('/users/:id/hse', Regional2Z7DHSEController.updateHSEDataWithHistory);
router.get('/users/:id/hse-history', Regional2Z7DHSEController.getHSEHistory);
router.get('/hse-history/stats', Regional2Z7DHSEController.getHSEHistoryStats);

// Upload dokumen untuk semua tipe dokumen yang didukung
router.post('/users/:userId/upload/no_ktp', upload.single('file'), Regional2Z7DController.uploadDocument);
router.post('/users/:userId/upload/no_kk', upload.single('file'), Regional2Z7DController.uploadDocument);
router.post('/users/:userId/upload/no_npwp', upload.single('file'), Regional2Z7DController.uploadDocument);
router.post('/users/:userId/upload/bpjs_kesehatan_karyawan', upload.single('file'), Regional2Z7DController.uploadDocument);
router.post('/users/:userId/upload/bpjstk', upload.single('file'), Regional2Z7DController.uploadDocument);
router.post('/users/:userId/upload/no_rekening_mandiri', upload.single('file'), Regional2Z7DController.uploadDocument);

// Download document routes
router.get('/users/:userId/download/no_ktp', Regional2Z7DController.downloadDocument);
router.get('/users/:userId/download/no_kk', Regional2Z7DController.downloadDocument);
router.get('/users/:userId/download/no_npwp', Regional2Z7DController.downloadDocument);
router.get('/users/:userId/download/bpjs_kesehatan_karyawan', Regional2Z7DController.downloadDocument);
router.get('/users/:userId/download/bpjstk', Regional2Z7DController.downloadDocument);
router.get('/users/:userId/download/no_rekening_mandiri', Regional2Z7DController.downloadDocument);

// Delete document routes
router.delete('/users/:userId/delete-file/no_ktp', Regional2Z7DController.deleteDocument);
router.delete('/users/:userId/delete-file/no_kk', Regional2Z7DController.deleteDocument);
router.delete('/users/:userId/delete-file/no_npwp', Regional2Z7DController.deleteDocument);
router.delete('/users/:userId/delete-file/bpjs_kesehatan_karyawan', Regional2Z7DController.deleteDocument);
router.delete('/users/:userId/delete-file/bpjstk', Regional2Z7DController.deleteDocument);
router.delete('/users/:userId/delete-file/no_rekening_mandiri', Regional2Z7DController.deleteDocument);

// Routes for sertifikat management
router.post('/sertifikat/create-table', Regional2Z7DController.createSertifikatTable);
router.post('/sertifikat', Regional2Z7DController.addSertifikat);
router.get('/sertifikat/user/:userId', Regional2Z7DController.getSertifikatByUserId);
router.get('/sertifikat/:id', Regional2Z7DController.getSertifikatById);
router.put('/sertifikat/:id', Regional2Z7DController.updateSertifikat);
router.delete('/sertifikat/:id', Regional2Z7DController.deleteSertifikat);

// Utility routes
router.get('/check-expired', Regional2Z7DController.checkExpiredContracts);

router.get('/check-expired/frontend', async (req, res) => {
    try {
        // console.log('Frontend meminta pengecekan kontrak kedaluwarsa');
        
        // Panggil controller untuk memeriksa kontrak kedaluwarsa
        const result = await Regional2Z7DController.checkExpiredContracts(req, res);
        
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