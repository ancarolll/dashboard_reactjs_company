import express from 'express';
import { TarMCUController, DocumentsHSEController, IsoDocumentsHSEController } from '../../../controllers/perusahaan/tarmcu.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi penyimpanan file dokumen
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/tar-mcu-files');

// === RUTE UNTUK DOKUMEN HSE ISO ===

// Pastikan direktori untuk ISO documents ada
const ISO_UPLOAD_DIR = path.join(__dirname, '../../../uploads/iso-documents');
if (!fs.existsSync(ISO_UPLOAD_DIR)) {
  fs.mkdirSync(ISO_UPLOAD_DIR, { recursive: true });
  // console.log(`Direktori upload untuk ISO documents dibuat: ${ISO_UPLOAD_DIR}`);
}

// Konfigurasi penyimpanan file untuk ISO documents
const isoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, ISO_UPLOAD_DIR);
  },
  filename: function(req, file, cb) {
    // Gunakan UUID untuk nama file unik
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `iso-document-${uniqueSuffix}${extension}`);
  }
});


// Pastikan folder upload ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Direktori upload dibuat: ${UPLOAD_DIR}`);
}

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function(req, file, cb) {
    // Gunakan UUID untuk nama file unik
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// Filter file yang diperbolehkan
const fileFilter = (req, file, cb) => {
  // Daftar MIME type yang diizinkan
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    // Izinkan file
    cb(null, true);
  } else {
    // Tolak file
    cb(new Error('File format not supported. Please upload a file in an allowed format.'), false);
  }
};

// Konfigurasi multer dengan batas ukuran file 5MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Setup multer untuk ISO documents
const uploadIsoDocument = multer({
  storage: isoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware untuk menangani error dari multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Max 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error upload file: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

const router = express.Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Define fields for document uploads
const documentFields = [
  { name: 'bpjs', maxCount: 1 },
  { name: 'nik', maxCount: 1 },
  { name: 'kk', maxCount: 1 },
  { name: 'npwp', maxCount: 1 },
  { name: 'norek', maxCount: 1 },
  { name: 'kpj', maxCount: 1 }
];

// Add new routes for file uploads
router.post('/mcu/with-files', upload.fields(documentFields), TarMCUController.addMCUWithFiles);
router.put('/mcu/:id/with-files', upload.fields(documentFields), TarMCUController.updateMCUWithFilesAndHistory);
router.get('/mcu/file/:id/:field', TarMCUController.getFile);

// === RUTE UNTUK MCU TAR ===

// Halaman utama MCU
router.get('/', TarMCUController.index);

// API untuk mendapatkan semua data MCU
router.get('/mcu', TarMCUController.getAll);

// API untuk mendapatkan data MCU berdasarkan ID
router.get('/mcu/:id', TarMCUController.getById);

// API untuk mencari data MCU
router.get('/mcu/search', TarMCUController.searchMCU);

// API untuk menambahkan data MCU baru
router.post('/mcu', TarMCUController.addMCU);

// API untuk mengupdate data MCU dengan riwayat
router.put('/mcu/:id/editable', TarMCUController.updateEditableMCUFields);

// API untuk menghapus data MCU
router.delete('/mcu/:id', TarMCUController.deleteMCU);

// API untuk mendapatkan riwayat MCU untuk ID tertentu
router.get('/mcu/:id/history', TarMCUController.getMCUHistory);

// API untuk mendapatkan statistik riwayat MCU
router.get('/mcu/history/stats', TarMCUController.getMCUHistoryStats);

// View-only routes
router.get('/mcu/view', TarMCUController.viewMcuData);
router.get('/mcu/:id/view-history', TarMCUController.viewMcuHistory);

// API untuk mendapatkan riwayat kontrak untuk ID tertentu
router.get('/mcu/:id/contract-history', TarMCUController.getContractHistory);

// === RUTE UNTUK DOKUMEN HSE ===

// API untuk mendapatkan semua dokumen
router.get('/documents', DocumentsHSEController.getAllDocuments);

// API untuk mencari dokumen
router.get('/documents/search', DocumentsHSEController.searchDocuments);

// API untuk mendapatkan dokumen berdasarkan ID
router.get('/documents/:id', DocumentsHSEController.getDocumentById);

// API untuk menambahkan dokumen baru
router.post('/documents', upload.single('file'), handleMulterError, DocumentsHSEController.addDocument);

// API untuk mengupdate dokumen
router.put('/documents/:id', upload.single('file'), handleMulterError, DocumentsHSEController.updateDocument);

// API untuk menghapus dokumen
router.delete('/documents/:id', DocumentsHSEController.deleteDocument);

// API untuk melihat file dokumen
router.get('/documents/:id/view', DocumentsHSEController.getDocumentFile);

// API untuk mengunduh file dokumen
router.get('/documents/:id/download', DocumentsHSEController.downloadDocumentFile);

// === RUTE UNTUK DOKUMEN HSE ISO ===

// API untuk mendapatkan jumlah dokumen ISO untuk statbox
router.get('/iso-documents/counts', IsoDocumentsHSEController.getDocumentCounts);

// API untuk mendapatkan semua dokumen ISO
router.get('/iso-documents', IsoDocumentsHSEController.getAllDocuments);

// API untuk mendapatkan dokumen ISO berdasarkan ID
router.get('/iso-documents/:id', IsoDocumentsHSEController.getDocumentById);

// API untuk menambahkan dokumen ISO baru
router.post('/iso-documents', uploadIsoDocument.single('file'), handleMulterError, IsoDocumentsHSEController.addDocument);

// API untuk mengupdate dokumen ISO
router.put('/iso-documents/:id', uploadIsoDocument.single('file'), handleMulterError, IsoDocumentsHSEController.updateDocument);

// API untuk menghapus dokumen ISO
router.delete('/iso-documents/:id', IsoDocumentsHSEController.deleteDocument);

// API untuk melihat file dokumen ISO
router.get('/iso-documents/:id/view', IsoDocumentsHSEController.getDocumentFile);

// API untuk mengunduh file dokumen ISO
router.get('/iso-documents/:id/download', IsoDocumentsHSEController.downloadDocumentFile);

// API untuk mendapatkan riwayat dokumen ISO
router.get('/iso-documents/:id/history', IsoDocumentsHSEController.getDocumentHistory);



export default router;