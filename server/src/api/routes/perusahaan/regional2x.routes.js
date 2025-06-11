import express from "express";
import { Regional2xController } from "../../../controllers/perusahaan/regional2x.controller.js";
import { Regional2xHSEController } from "../../../controllers/hse/regional2xhse.controller.js";
import multer from "multer";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 
    'bpjstk', 'no_rekening'
  ];
  return validTypes.includes(docType);
};

// SIMPLIFIED: Improved multer configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/regional2x');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      // console.log(`Created upload directory: ${uploadDir}`);
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    try {
      const docType = req.params.docType;
      const userId = req.params.userId;
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      const filename = `${docType}-${userId}-${timestamp}-${sanitizedOriginalName}`;
      
      // console.log(`Generated filename: ${filename}`);
      cb(null, filename);
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(error);
    }
  }
});

// SIMPLIFIED: File filter
const fileFilter = (req, file, cb) => {
  // console.log(`File filter check:`, {
  //   originalname: file.originalname,
  //   mimetype: file.mimetype,
  //   size: file.size
  // });

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    // console.log(`File type ${file.mimetype} is allowed`);
    cb(null, true);
  } else {
    console.error(`File type ${file.mimetype} is not allowed`);
    cb(new Error(`Unsupported file format: ${file.mimetype}. Use PDF, DOC, DOCX, JPG, or PNG.`), false);
  }
};

// SIMPLIFIED: Single multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only allow 1 file per upload
  }
});

// Handle CORS preflight requests
router.options('*', Regional2xController.handleOptionsRequest);

// Halaman utama project regional2x
router.get('/', Regional2xController.index);
router.get('/users', Regional2xController.getAll);
router.get('/edit', Regional2xController.getEditPage);
router.get('/na', Regional2xController.getNaPage);
router.get('/view', Regional2xController.getViewPage);
router.get('/tambah-user', Regional2xController.getTambahUserForm);
router.get('/edit-user/:id', Regional2xController.getEditUserForm);

// API untuk user
router.post('/users', Regional2xController.addUser);
router.get('/users/:id', Regional2xController.getUserById);
router.put('/users/:id', Regional2xController.updateUser);
router.delete('/users/:id', Regional2xController.deleteUser);

// Memindahkan user ke status NA
router.put('/users/:id/na', Regional2xController.setUserInactive);
router.put('/users/:id/restore', Regional2xController.restoreUser);

// FIXED: Simplified upload route
router.post('/users/:userId/upload/:docType', 
  (req, res, next) => {
    // console.log('=== UPLOAD ROUTE START ===');
    // console.log('Upload request received:', {
    //   userId: req.params.userId,
    //   docType: req.params.docType,
    //   contentType: req.headers['content-type'],
    //   contentLength: req.headers['content-length']
    // });

    // Validate parameters first
    const { userId, docType } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      console.error('Invalid userId:', userId);
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    if (!validateDocType(docType)) {
      console.error('Invalid docType:', docType);
      return res.status(400).json({
        success: false,
        error: 'Invalid document type',
        validTypes: ['cv', 'ijazah', 'sertifikat', 'pkwt', 'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk', 'no_rekening']
      });
    }

    next();
  },
  upload.single('file'),
  (req, res, next) => {
    // console.log('File upload middleware completed:', {
    //   hasFile: !!req.file,
    //   file: req.file ? {
    //     originalname: req.file.originalname,
    //     filename: req.file.filename,
    //     size: req.file.size,
    //     mimetype: req.file.mimetype,
    //     path: req.file.path
    //   } : null
    // });

    if (!req.file) {
      console.error('No file received after multer processing');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded or file rejected by filter'
      });
    }

    // console.log('=== UPLOAD ROUTE END ===');
    next();
  },
  Regional2xController.uploadDocument
);
// Download dan delete document routes
router.get('/users/:userId/download/:docType', Regional2xController.downloadDocument);
router.delete('/users/:userId/delete-file/:docType', Regional2xController.deleteDocument);
router.get('/users/:userId/file/:docType', Regional2xController.getDocumentFile);

// Contract history routes
router.get('/users/:id/history', Regional2xController.getKontrakHistory);
router.get('/users/:id/all-contract-history', Regional2xController.getAllContractHistory);
router.get('/contract-history/stats', Regional2xController.getContractChangeStats);

// Bulk upload routes
router.get('/template/csv', Regional2xController.getCSVTemplate);
router.post('/upload-bulk', upload.single('file'), Regional2xController.uploadBulkData);

// Data detail user routes
router.get('/users/:id/personal', Regional2xController.getPersonalData);
router.get('/users/:id/admin', Regional2xController.getAdminData);
router.get('/users/:id/certification', Regional2xController.getCertificationData);

// HSE routes
router.get('/hse-data', Regional2xController.getHSEData);
router.put('/users/:id/hse', Regional2xHSEController.updateHSEDataWithHistory);
router.get('/users/:id/hse-history', Regional2xHSEController.getHSEHistory);
router.get('/hse-history/stats', Regional2xHSEController.getHSEHistoryStats);

// ADDED: Explicit routes for each document type (like regional4)
const documentTypes = ['no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk', 'no_rekening'];

documentTypes.forEach(docType => {
  router.post(`/users/:userId/upload/${docType}`, upload.single('file'), Regional2xController.uploadDocument);
  router.get(`/users/:userId/download/${docType}`, Regional2xController.downloadDocument);
  router.delete(`/users/:userId/delete-file/${docType}`, Regional2xController.deleteDocument);
});

// Certificate management routes
router.post('/sertifikat/create-table', Regional2xController.createSertifikatTable);
router.post('/sertifikat', Regional2xController.addSertifikat);
router.get('/sertifikat/user/:userId', Regional2xController.getSertifikatByUserId);
router.get('/sertifikat/:id', Regional2xController.getSertifikatById);
router.put('/sertifikat/:id', Regional2xController.updateSertifikat);
router.delete('/sertifikat/:id', Regional2xController.deleteSertifikat);

// Utility routes
router.get('/check-expired', Regional2xController.checkExpiredContracts);
router.get('/check-expired/frontend', Regional2xController.checkExpiredContracts);

// Test upload endpoint for debugging
router.post('/test-upload/:userId/:docType', 
  upload.single('file'),
  (req, res) => {
    // console.log('=== TEST UPLOAD ENDPOINT ===');
    // console.log('Headers:', req.headers);
    // console.log('Params:', req.params);
    // console.log('Body:', req.body);
    // console.log('File:', req.file);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file received',
        debug: {
          headers: req.headers,
          params: req.params,
          body: req.body
        }
      });
    }
    
    return res.json({
      success: true,
      message: 'File received successfully',
      file: {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      }
    });
  }
);

export default router;