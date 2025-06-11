import express from "express";
import { ManagementController } from "../../../controllers/management/management.controller.js";
import multer from "multer";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from 'uuid';

// Mendapatkan __dirname di ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder upload untuk file dokumen
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/documents');

// Pastikan folder upload ada
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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
        cb(null, `document-${uniqueSuffix}${extension}`);
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
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Silakan upload file dalam format yang diizinkan.'), false);
    }
};

// Konfigurasi multer dengan batas ukuran file 8MB
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 8 * 1024 * 1024 // 8MB
    }
});

const router = express.Router();

// Middleware untuk menangani error dari multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Ukuran file terlalu besar. Maksimal 8MB.'
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

// ==================== HALAMAN ROUTES ====================

// Halaman edit dan daftar dokumen
router.get('/edit', ManagementController.editPage);

// Halaman tambah dokumen
router.get('/add', ManagementController.addPage);

// Halaman edit dokumen berdasarkan ID
router.get('/edit/:id', ManagementController.editDocumentPage);

// ==================== API ROUTES UNTUK PENCARIAN ====================

// PERBAIKAN: API Endpoint untuk mencari dokumen - letakkan sebelum rute parameter
router.get('/documents/search', ManagementController.searchDocuments);

// ==================== API ROUTES UNTUK DOKUMEN ====================

// API Endpoint untuk mendapatkan semua dokumen
router.get('/documents', ManagementController.getAllDocuments);

// API Endpoint untuk mendapatkan dokumen berdasarkan ID
router.get('/documents/:id', ManagementController.getDocumentById);

// PERBAIKAN: API Endpoint untuk menambahkan dokumen baru dengan auto cleanup on error
router.post('/documents', upload.single('file'), handleMulterError, ManagementController.addDocument);

// PERBAIKAN: API Endpoint untuk mengupdate dokumen dengan auto delete file lama
router.put('/documents/:id', upload.single('file'), handleMulterError, ManagementController.updateDocument);

// PERBAIKAN: API Endpoint untuk menghapus dokumen dengan auto delete file fisik
router.delete('/documents/:id', ManagementController.deleteDocument);

// API Endpoint untuk melihat file dokumen
router.get('/documents/:id/view', ManagementController.getDocumentFile);

// API Endpoint untuk mengunduh file dokumen
router.get('/documents/:id/download', ManagementController.downloadDocumentFile);

// ==================== API ROUTES UNTUK SECTION ====================

// API Endpoint untuk mendapatkan semua section
router.get('/sections', ManagementController.getAllSections);

// API Endpoint untuk menambahkan section baru
router.post('/sections', ManagementController.addSection);

// ==================== PERBAIKAN: API ROUTES UNTUK FILE MANAGEMENT ====================

// API Endpoint untuk batch delete file fisik
router.post('/files/batch-delete', ManagementController.batchDeleteFiles);

// API Endpoint untuk cleanup file tidak terpakai
router.post('/files/cleanup', ManagementController.cleanupUnusedFiles);

// PERBAIKAN: API Endpoint untuk mendapatkan informasi file yang tidak terpakai
router.get('/files/unused', async (req, res) => {
    try {
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        // Ambil semua file path dari database
        const documents = await ManagementModel.getAllDocuments(1, 10000); // Get all documents
        const usedFiles = new Set();
        
        // Kumpulkan semua file path yang terdaftar dengan berbagai variasi
        documents.data.forEach(doc => {
            if (doc.file_path) {
                usedFiles.add(doc.file_path);
                usedFiles.add(path.basename(doc.file_path));
                
                // Handle different path formats
                if (doc.file_path.startsWith('/uploads/')) {
                    usedFiles.add(doc.file_path.substring('/uploads/'.length));
                }
                if (doc.file_path.startsWith('documents/')) {
                    usedFiles.add(doc.file_path.substring('documents/'.length));
                }
                
                // Add relative path variations
                const relativePath = `documents/${path.basename(doc.file_path)}`;
                usedFiles.add(relativePath);
            }
        });
        
        // Scan direktori uploads/documents
        const uploadsDir = path.join(__dirname, '../../../uploads/documents');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                message: 'Direktori uploads/documents tidak ditemukan',
                unusedFiles: [],
                totalUsedFiles: usedFiles.size
            });
        }
        
        const allFiles = fs.readdirSync(uploadsDir);
        const unusedFiles = [];
        
        for (const file of allFiles) {
            const filePath = path.join(uploadsDir, file);
            if (fs.statSync(filePath).isFile()) {
                // Check various path variations
                const pathVariations = [
                    file,
                    `documents/${file}`,
                    `/uploads/${file}`,
                    `/uploads/documents/${file}`
                ];
                
                const isUsed = pathVariations.some(variation => usedFiles.has(variation));
                
                if (!isUsed) {
                    const stats = fs.statSync(filePath);
                    unusedFiles.push({
                        fileName: file,
                        filePath: `documents/${file}`,
                        size: stats.size,
                        lastModified: stats.mtime,
                        sizeFormatted: formatFileSize(stats.size)
                    });
                }
            }
        }
        
        res.json({
            success: true,
            message: `Ditemukan ${unusedFiles.length} file tidak terpakai`,
            unusedFiles: unusedFiles,
            totalUsedFiles: usedFiles.size,
            totalPhysicalFiles: allFiles.length
        });
    } catch (error) {
        console.error('Error getting unused files:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar file tidak terpakai',
            error: error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk mendapatkan statistik file
router.get('/files/stats', async (req, res) => {
    try {
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        // Ambil semua dokumen dari database
        const documents = await ManagementModel.getAllDocuments(1, 10000); // Get all documents
        
        // Hitung statistik dari database
        const dbStats = {
            totalDocuments: documents.data.length,
            totalSize: documents.data.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
            fileTypes: {}
        };
        
        documents.data.forEach(doc => {
            if (doc.file_type) {
                dbStats.fileTypes[doc.file_type] = (dbStats.fileTypes[doc.file_type] || 0) + 1;
            }
        });
        
        // Scan direktori uploads/documents untuk file fisik
        const uploadsDir = path.join(__dirname, '../../../uploads/documents');
        const physicalStats = {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {}
        };
        
        if (fs.existsSync(uploadsDir)) {
            const allFiles = fs.readdirSync(uploadsDir);
            
            for (const file of allFiles) {
                const filePath = path.join(uploadsDir, file);
                if (fs.statSync(filePath).isFile()) {
                    const stats = fs.statSync(filePath);
                    physicalStats.totalFiles++;
                    physicalStats.totalSize += stats.size;
                    
                    const extension = path.extname(file).toLowerCase();
                    physicalStats.fileTypes[extension] = (physicalStats.fileTypes[extension] || 0) + 1;
                }
            }
        }
        
        res.json({
            success: true,
            data: {
                database: {
                    ...dbStats,
                    totalSizeFormatted: formatFileSize(dbStats.totalSize)
                },
                physical: {
                    ...physicalStats,
                    totalSizeFormatted: formatFileSize(physicalStats.totalSize)
                },
                discrepancy: {
                    fileDifference: physicalStats.totalFiles - dbStats.totalDocuments,
                    sizeDifference: physicalStats.totalSize - dbStats.totalSize,
                    sizeDifferenceFormatted: formatFileSize(Math.abs(physicalStats.totalSize - dbStats.totalSize))
                }
            }
        });
    } catch (error) {
        console.error('Error getting file stats:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik file',
            error: error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk validasi integritas file
router.get('/files/validate', async (req, res) => {
    try {
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        // Ambil semua dokumen dari database
        const documents = await ManagementModel.getAllDocuments(1, 10000); // Get all documents
        const validationResults = [];
        
        for (const doc of documents.data) {
            const result = {
                id: doc.id,
                title: doc.title,
                file_path: doc.file_path,
                file_name: doc.file_name,
                status: 'valid',
                issues: []
            };
            
            if (!doc.file_path) {
                result.status = 'error';
                result.issues.push('File path is missing');
            } else {
                // PERBAIKAN: Gunakan path yang benar untuk cek file fisik
                let cleanPath = doc.file_path;
                
                // Remove leading /uploads/ if present
                if (cleanPath.startsWith('/uploads/')) {
                    cleanPath = cleanPath.substring('/uploads/'.length);
                }
                
                // Remove leading documents/ if present
                if (cleanPath.startsWith('documents/')) {
                    cleanPath = cleanPath.substring('documents/'.length);
                }
                
                const fullPath = path.join(__dirname, '../../../uploads/documents', cleanPath);
                
                if (!fs.existsSync(fullPath)) {
                    result.status = 'error';
                    result.issues.push('Physical file not found');
                } else {
                    // Cek ukuran file jika ada informasi di database
                    const stats = fs.statSync(fullPath);
                    if (doc.file_size && stats.size !== doc.file_size) {
                        result.status = 'warning';
                        result.issues.push(`File size mismatch (DB: ${formatFileSize(doc.file_size)}, Physical: ${formatFileSize(stats.size)})`);
                    }
                }
            }
            
            validationResults.push(result);
        }
        
        const summary = {
            total: validationResults.length,
            valid: validationResults.filter(r => r.status === 'valid').length,
            warnings: validationResults.filter(r => r.status === 'warning').length,
            errors: validationResults.filter(r => r.status === 'error').length
        };
        
        res.json({
            success: true,
            data: {
                summary: summary,
                results: validationResults
            }
        });
    } catch (error) {
        console.error('Error validating files:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal melakukan validasi file',
            error: error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk mendapatkan informasi disk usage
router.get('/files/disk-usage', async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../../../uploads/documents');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                data: {
                    totalSize: 0,
                    totalFiles: 0,
                    averageFileSize: 0,
                    largestFile: null,
                    oldestFile: null,
                    newestFile: null
                }
            });
        }
        
        const files = fs.readdirSync(uploadsDir);
        let totalSize = 0;
        let largestFile = null;
        let oldestFile = null;
        let newestFile = null;
        
        for (const file of files) {
            const filePath = path.join(uploadsDir, file);
            if (fs.statSync(filePath).isFile()) {
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                
                // Track largest file
                if (!largestFile || stats.size > largestFile.size) {
                    largestFile = {
                        name: file,
                        size: stats.size,
                        sizeFormatted: formatFileSize(stats.size)
                    };
                }
                
                // Track oldest file
                if (!oldestFile || stats.mtime < oldestFile.mtime) {
                    oldestFile = {
                        name: file,
                        mtime: stats.mtime
                    };
                }
                
                // Track newest file
                if (!newestFile || stats.mtime > newestFile.mtime) {
                    newestFile = {
                        name: file,
                        mtime: stats.mtime
                    };
                }
            }
        }
        
        const fileCount = files.length;
        
        res.json({
            success: true,
            data: {
                totalSize: totalSize,
                totalSizeFormatted: formatFileSize(totalSize),
                totalFiles: fileCount,
                averageFileSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0,
                averageFileSizeFormatted: fileCount > 0 ? formatFileSize(Math.round(totalSize / fileCount)) : '0 B',
                largestFile: largestFile,
                oldestFile: oldestFile,
                newestFile: newestFile
            }
        });
    } catch (error) {
        console.error('Error getting disk usage:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil informasi disk usage',
            error: error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk bulk delete documents
router.post('/documents/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Array ID dokumen harus disediakan'
            });
        }
        
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        // Bulk delete dengan auto file cleanup
        const deletedDocuments = await ManagementModel.bulkDeleteDocuments(ids);
        
        // Auto delete file fisik untuk setiap dokumen yang dihapus
        let deletedFilesCount = 0;
        for (const doc of deletedDocuments) {
            if (doc.file_path) {
                // Helper function untuk mendapatkan path lengkap
                let cleanPath = doc.file_path;
                if (cleanPath.startsWith('/uploads/')) {
                    cleanPath = cleanPath.substring('/uploads/'.length);
                }
                if (cleanPath.startsWith('documents/')) {
                    cleanPath = cleanPath.substring('documents/'.length);
                }
                
                const fullPath = path.join(__dirname, '../../../uploads/documents', cleanPath);
                
                try {
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        deletedFilesCount++;
                        console.log(`✅ Physical file successfully deleted: ${fullPath}`);
                    }
                } catch (fileError) {
                    console.error(`❌ Error menghapus file fisik ${fullPath}:`, fileError);
                }
            }
        }
        
        res.json({
            success: true,
            message: `Successfully deleted ${deletedDocuments.length} documents and ${deletedFilesCount} physical files`,
            data: {
                deletedDocuments: deletedDocuments.length,
                deletedFiles: deletedFilesCount,
                documents: deletedDocuments
            }
        });
    } catch (error) {
        console.error('Error bulk deleting documents:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus dokumen secara bulk: ' + error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk mendapatkan dokumen expired
router.get('/documents/expired', async (req, res) => {
    try {
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        const expiredDocuments = await ManagementModel.getExpiredDocuments();
        
        res.json({
            success: true,
            message: `Ditemukan ${expiredDocuments.length} dokumen yang sudah expired`,
            data: expiredDocuments
        });
    } catch (error) {
        console.error('Error getting expired documents:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil dokumen expired: ' + error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk mendapatkan dokumen yang akan expired
router.get('/documents/expiring', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        const expiringDocuments = await ManagementModel.getExpiringDocuments(days);
        
        res.json({
            success: true,
            message: `Ditemukan ${expiringDocuments.length} dokumen yang akan expired dalam ${days} hari`,
            data: expiringDocuments
        });
    } catch (error) {
        console.error('Error getting expiring documents:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil dokumen yang akan expired: ' + error.message
        });
    }
});

// PERBAIKAN: API Endpoint untuk cleanup section tidak terpakai
router.post('/sections/cleanup', async (req, res) => {
    try {
        const { ManagementModel } = await import('../../../models/management/management.model.js');
        
        const deletedSections = await ManagementModel.cleanupUnusedSections();
        
        res.json({
            success: true,
            message: `Berhasil menghapus ${deletedSections.length} section yang tidak terpakai`,
            data: {
                deletedSections: deletedSections,
                count: deletedSections.length
            }
        });
    } catch (error) {
        console.error('Error cleaning up unused sections:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membersihkan section tidak terpakai: ' + error.message
        });
    }
});

// ==================== HELPER FUNCTIONS ====================

// Helper function untuk format ukuran file
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;