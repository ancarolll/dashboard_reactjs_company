import { ManagementModel } from "../../models/management/management.model.js";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";

// Mendapatkan __dirname di ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ManagementController {

    // ==================== HELPER FUNCTIONS UNTUK FILE MANAGEMENT ====================

    // PERBAIKAN: Fungsi helper untuk menghapus file fisik
    static deletePhysicalFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ File fisik berhasil dihapus: ${filePath}`);
                return true;
            } else {
                console.log(`⚠️ File tidak ditemukan: ${filePath}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error menghapus file fisik ${filePath}:`, error);
            return false;
        }
    }

    // PERBAIKAN: Fungsi helper untuk mendapatkan path lengkap file
    static getFullFilePath(relativePath) {
        if (!relativePath) return null;
        
        // Handle berbagai format path
        let cleanPath = relativePath;
        
        // Remove leading /uploads/ if present
        if (cleanPath.startsWith('/uploads/')) {
            cleanPath = cleanPath.substring('/uploads/'.length);
        }
        
        // Remove leading documents/ if present
        if (cleanPath.startsWith('documents/')) {
            cleanPath = cleanPath.substring('documents/'.length);
        }
        
        // Gabungkan dengan direktori uploads/documents
        return path.join(__dirname, '../../uploads/documents', cleanPath);
    }

    // ==================== PAGE CONTROLLERS ====================

    // Menampilkan halaman dokumen manajemen
    static async editPage(req, res) {
        try {
            res.render('management/edit', {
                title: 'Management Documents',
                page: 'edit'
            });
        } catch (error) {
            console.error('Error rendering edit page:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat memuat halaman' 
            });
        }
    }

    // Menampilkan halaman tambah dokumen
    static async addPage(req, res) {
        try {
            // Ambil semua section yang tersedia
            const sections = await ManagementModel.getAllSections();
            
            res.render('management/add', {
                title: 'Add Management Document',
                page: 'add',
                document: null,
                sections: sections,
                editMode: false
            });
        } catch (error) {
            console.error('Error rendering add page:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat memuat halaman' 
            });
        }
    }

    // Menampilkan halaman edit dokumen
    static async editDocumentPage(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            // Ambil data dokumen berdasarkan ID
            const document = await ManagementModel.getDocumentById(id);
            if (!document) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dokumen tidak ditemukan' 
                });
            }
            
            // Ambil semua section yang tersedia
            const sections = await ManagementModel.getAllSections();
            
            res.render('management/add', {
                title: 'Edit Management Document',
                page: 'edit',
                document: document,
                sections: sections,
                editMode: true
            });
        } catch (error) {
            console.error(`Error rendering edit document page for id ${req.params.id}:`, error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat memuat halaman' 
            });
        }
    }

    // ==================== API CONTROLLERS ====================

    // Mendapatkan semua dokumen
    static async getAllDocuments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.perPage) || 20;
            const searchTerm = req.query.search || '';
            const sectionFilter = req.query.section || 'all';
            
            console.log('Request parameters:', {
                page, perPage, searchTerm, sectionFilter
            });
            
            const documents = await ManagementModel.getAllDocuments(
                page,
                perPage,
                searchTerm,
                sectionFilter === 'all' ? '' : sectionFilter
            );
            
            console.log(`Returning ${documents.data?.length || 0} documents out of ${documents.pagination?.total || 0} total`);
            
            res.json({ 
                success: true, 
                data: documents 
            });
        } catch (error) {
            console.error('Error getting all documents:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mengambil data dokumen: ' + error.message
            });
        }
    }

    // Mendapatkan dokumen berdasarkan ID
    static async getDocumentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const document = await ManagementModel.getDocumentById(id);
            
            if (!document) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dokumen tidak ditemukan' 
                });
            }
            
            res.json({ 
                success: true, 
                data: document 
            });
        } catch (error) {
            console.error(`Error getting document with id ${req.params.id}:`, error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mengambil data dokumen' 
            });
        }
    }

    // PERBAIKAN: Menambahkan dokumen baru dengan error handling file
    static async addDocument(req, res) {
        try {
            console.log('Received form data:', req.body);
            
            const { section, addSection, nameFile, uploadDate, awalBerlaku, akhirBerlaku } = req.body;
            
            let fileName = '';
            let filePath = '';
            let fileType = '';
            
            // Jika ada file yang diupload
            if (req.file) {
                fileName = nameFile || req.file.originalname;
                filePath = `/uploads/documents/${req.file.filename}`;
                fileType = req.file.mimetype;
            }
            
            // Penanganan string kosong menjadi null
            const parsedAwalBerlaku = awalBerlaku && awalBerlaku !== '' ? awalBerlaku : null;
            const parsedAkhirBerlaku = akhirBerlaku && akhirBerlaku !== '' ? akhirBerlaku : null;
            
            console.log('Parsed date values:', {
                original: { awalBerlaku, akhirBerlaku },
                parsed: { parsedAwalBerlaku, parsedAkhirBerlaku }
            });
            
            const documentData = {
                title: addSection,
                section: section,
                fileName: fileName,
                filePath: filePath,
                fileType: fileType,
                uploadDate: uploadDate || new Date().toISOString().split('T')[0],
                awalBerlaku: parsedAwalBerlaku,
                akhirBerlaku: parsedAkhirBerlaku
            };
            
            // Simpan ke database
            const result = await ManagementModel.addDocument(documentData);
            
            res.json({ 
                success: true, 
                message: 'Dokumen berhasil ditambahkan', 
                data: result 
            });
        } catch (error) {
            console.error('Error adding document:', error);
            
            // PERBAIKAN: Jika terjadi error dan file sudah terupload, hapus file tersebut
            if (req.file) {
                const uploadedFilePath = req.file.path;
                ManagementController.deletePhysicalFile(uploadedFilePath);
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat menambahkan dokumen: ' + error.message 
            });
        }
    }

    // PERBAIKAN: Mengupdate dokumen dengan auto delete file lama
    static async updateDocument(req, res) {
        try {
            console.log('Received update form data:', req.body);
            
            const id = parseInt(req.params.id);
            const { section, addSection, nameFile, uploadDate, awalBerlaku, akhirBerlaku } = req.body;
            
            // Cek apakah dokumen ada
            const existingDocument = await ManagementModel.getDocumentById(id);
            if (!existingDocument) {
                // Jika dokumen tidak ditemukan dan ada file baru, hapus file tersebut
                if (req.file) {
                    ManagementController.deletePhysicalFile(req.file.path);
                }
                
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dokumen tidak ditemukan' 
                });
            }
            
            let fileName = existingDocument.file_name;
            let filePath = existingDocument.file_path;
            let fileType = existingDocument.file_type;
            let oldFilePath = null;
            
            // Jika ada file baru yang diupload
            if (req.file) {
                // Simpan path file lama untuk dihapus nanti
                if (existingDocument.file_path) {
                    oldFilePath = ManagementController.getFullFilePath(existingDocument.file_path);
                }
                
                fileName = nameFile || req.file.originalname;
                filePath = `/uploads/documents/${req.file.filename}`;
                fileType = req.file.mimetype;
            } else if (nameFile && nameFile !== existingDocument.file_name) {
                // Hanya perbarui nama file tanpa mengubah file
                fileName = nameFile;
            }
            
            // Penanganan string kosong menjadi null
            const parsedAwalBerlaku = awalBerlaku && awalBerlaku !== '' ? awalBerlaku : null;
            const parsedAkhirBerlaku = akhirBerlaku && akhirBerlaku !== '' ? akhirBerlaku : null;
            
            console.log('Parsed update date values:', {
                original: { awalBerlaku, akhirBerlaku },
                parsed: { parsedAwalBerlaku, parsedAkhirBerlaku }
            });
            
            const documentData = {
                title: addSection,
                section: section,
                fileName: fileName,
                filePath: filePath,
                fileType: fileType,
                uploadDate: uploadDate || existingDocument.upload_date,
                awalBerlaku: parsedAwalBerlaku,
                akhirBerlaku: parsedAkhirBerlaku
            };
            
            // Update dokumen di database
            const result = await ManagementModel.updateDocument(id, documentData);
            
            // PERBAIKAN: Jika ada file baru dan update berhasil, hapus file lama
            if (req.file && oldFilePath) {
                ManagementController.deletePhysicalFile(oldFilePath);
            }
            
            res.json({ 
                success: true, 
                message: 'Dokumen berhasil diperbarui', 
                data: result 
            });
        } catch (error) {
            console.error(`Error updating document with id ${req.params.id}:`, error);
            
            // PERBAIKAN: Jika terjadi error dan ada file baru, hapus file tersebut
            if (req.file) {
                ManagementController.deletePhysicalFile(req.file.path);
            }
            
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat memperbarui dokumen: ' + error.message 
            });
        }
    }

    // PERBAIKAN: Menghapus dokumen dengan auto delete file fisik
    static async deleteDocument(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            // Cek apakah dokumen ada dan ambil info file sebelum dihapus
            const document = await ManagementModel.getDocumentById(id);
            if (!document) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dokumen tidak ditemukan' 
                });
            }
            
            // Hapus dokumen dari database terlebih dahulu
            await ManagementModel.deleteDocument(id);
            
            // PERBAIKAN: Setelah berhasil hapus dari database, hapus file fisik
            if (document.file_path) {
                const filePath = ManagementController.getFullFilePath(document.file_path);
                if (filePath) {
                    const fileDeleted = ManagementController.deletePhysicalFile(filePath);
                    console.log(`File fisik ${fileDeleted ? 'berhasil' : 'gagal'} dihapus untuk dokumen ID: ${id}`);
                }
            }
            
            res.json({ 
                success: true, 
                message: 'Dokumen dan file fisik berhasil dihapus',
                data: {
                    id: id,
                    deletedFile: document.file_path
                }
            });
        } catch (error) {
            console.error(`Error deleting document with id ${req.params.id}:`, error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat menghapus dokumen: ' + error.message 
            });
        }
    }

    // PERBAIKAN: Melihat file dokumen dengan path yang benar
    static async getDocumentFile(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            console.log(`Processing file view request for document ID: ${id}`);
            
            const document = await ManagementModel.getDocumentById(id);
            if (!document) {
                console.error(`Document with ID ${id} not found`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dokumen tidak ditemukan' 
                });
            }
            
            if (!document.file_path) {
                console.error(`Document with ID ${id} has no file`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'File tidak ditemukan untuk dokumen ini' 
                });
            }
            
            // PERBAIKAN: Gunakan helper function untuk mendapatkan path yang benar
            const filePath = ManagementController.getFullFilePath(document.file_path);
            console.log(`Looking for file at: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                console.error(`File not found at path: ${filePath}`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'File tidak ditemukan di server' 
                });
            }
            
            console.log(`Sending file ${document.file_name} (${document.file_type})`);
            
            // Set content-type yang sesuai
            res.setHeader('Content-Type', document.file_type);
            res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
            
            // Kirim file
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            console.error(`Error getting document file with id ${req.params.id}:`, error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mengambil file dokumen' 
            });
        }
    }

    // PERBAIKAN: Download file dokumen dengan path yang benar
    static async downloadDocumentFile(req, res) {
        try {
            const id = parseInt(req.params.id);
            
            console.log(`Processing file download request for document ID: ${id}`);
            
            const document = await ManagementModel.getDocumentById(id);
            if (!document) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Dokumen tidak ditemukan' 
                });
            }
            
            // PERBAIKAN: Gunakan helper function untuk mendapatkan path yang benar
            const filePath = ManagementController.getFullFilePath(document.file_path);
            console.log(`Downloading file from: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'File tidak ditemukan di server' 
                });
            }
            
            // Ekstrak ekstensi file dan pastikan ada dalam nama file
            let fileName = document.file_name || 'document';
            const fileExtension = path.extname(fileName).toLowerCase();
            
            // Jika file tidak memiliki ekstensi, derive dari MIME type
            if (!fileExtension && document.file_type) {
                const mimeToExt = {
                    'application/pdf': '.pdf',
                    'application/msword': '.doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                    'application/vnd.ms-excel': '.xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                    'application/vnd.ms-powerpoint': '.ppt',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
                    'text/plain': '.txt',
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif'
                };
                
                const derivedExt = mimeToExt[document.file_type];
                if (derivedExt) {
                    fileName = fileName + derivedExt;
                }
            }
            
            // Set Content-Type
            let contentType = document.file_type;
            if (!contentType) {
                const extToMime = {
                    '.pdf': 'application/pdf',
                    '.doc': 'application/msword',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.xls': 'application/vnd.ms-excel',
                    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    '.ppt': 'application/vnd.ms-powerpoint',
                    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    '.txt': 'text/plain',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif'
                };
                contentType = extToMime[fileExtension] || 'application/octet-stream';
            }
            
            // Format Content-Disposition dengan benar
            const safeFileName = encodeURIComponent(fileName);
            
            // Set headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${safeFileName}`);
            res.setHeader('Content-Length', fs.statSync(filePath).size);
            res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
            res.setHeader('Pragma', 'public');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            
            console.log(`Sending file ${fileName} with Content-Type: ${contentType}`);
            
            // Kirim file
            const fileStream = fs.createReadStream(filePath);
            fileStream.on('error', (error) => {
                console.error(`Error streaming file: ${error.message}`);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Terjadi kesalahan saat membaca file'
                    });
                }
            });
            
            fileStream.pipe(res);
        } catch (error) {
            console.error(`Error downloading document file with id ${req.params.id}:`, error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mengunduh file dokumen: ' + error.message 
            });
        }
    }

    // Mencari dokumen
    static async searchDocuments(req, res) {
        try {
            const { keyword, section } = req.query;
            
            const results = await ManagementModel.searchDocuments(keyword || '', section || 'all');
            
            res.json({ 
                success: true, 
                data: results 
            });
        } catch (error) {
            console.error('Error searching documents:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mencari dokumen' 
            });
        }
    }

    // Mendapatkan semua section
    static async getAllSections(req, res) {
        try {
            const sections = await ManagementModel.getAllSections();
            
            res.json({ 
                success: true, 
                data: sections 
            });
        } catch (error) {
            console.error('Error getting all sections:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mengambil data section' 
            });
        }
    }

    // Menambahkan section baru
    static async addSection(req, res) {
        try {
            const { name } = req.body;
            
            if (!name || name.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Nama section tidak boleh kosong' 
                });
            }
            
            const result = await ManagementModel.addSection(name);
            
            res.json({ 
                success: true, 
                message: 'Section berhasil ditambahkan', 
                data: result 
            });
        } catch (error) {
            console.error('Error adding section:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat menambahkan section: ' + error.message 
            });
        }
    }

    // ==================== PERBAIKAN: ADDITIONAL FILE MANAGEMENT METHODS ====================

    // Batch delete file fisik
    static async batchDeleteFiles(req, res) {
        try {
            const { filePaths } = req.body;
            
            if (!Array.isArray(filePaths) || filePaths.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Array filePaths harus disediakan'
                });
            }
            
            const results = [];
            
            for (const filePath of filePaths) {
                const fullPath = ManagementController.getFullFilePath(filePath);
                if (fullPath) {
                    const deleted = ManagementController.deletePhysicalFile(fullPath);
                    results.push({
                        filePath: filePath,
                        deleted: deleted
                    });
                }
            }
            
            res.json({
                success: true,
                message: `Batch delete selesai. ${results.filter(r => r.deleted).length} file berhasil dihapus dari ${results.length} file.`,
                results: results
            });
        } catch (error) {
            console.error('Error batch deleting files:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal menghapus file secara batch: ' + error.message
            });
        }
    }

    // Cleanup file tidak terpakai
    static async cleanupUnusedFiles(req, res) {
        try {
            // Ambil semua file path dari database
            const documents = await ManagementModel.getAllDocuments(1, 10000); // Get all documents
            const usedFiles = new Set();
            
            // Kumpulkan semua file path yang terdaftar
            documents.data.forEach(doc => {
                if (doc.file_path) {
                    usedFiles.add(doc.file_path);
                    usedFiles.add(path.basename(doc.file_path));
                    if (doc.file_path.startsWith('/uploads/')) {
                        usedFiles.add(doc.file_path.substring('/uploads/'.length));
                    }
                    if (doc.file_path.startsWith('documents/')) {
                        usedFiles.add(doc.file_path.substring('documents/'.length));
                    }
                }
            });
            
            // Scan direktori uploads/documents
            const uploadsDir = path.join(__dirname, '../../uploads/documents');
            if (!fs.existsSync(uploadsDir)) {
                return res.json({
                    success: true,
                    message: 'Direktori uploads/documents tidak ditemukan',
                    deletedCount: 0
                });
            }
            
            const allFiles = fs.readdirSync(uploadsDir);
            const deletedFiles = [];
            
            for (const file of allFiles) {
                const filePath = path.join(uploadsDir, file);
                if (fs.statSync(filePath).isFile()) {
                    const relativePath = `documents/${file}`;
                    
                    // Cek berbagai variasi path
                    const pathVariations = [
                        file,
                        relativePath,
                        `/uploads/${file}`,
                        `/uploads/${relativePath}`
                    ];
                    
                    const isUsed = pathVariations.some(variation => usedFiles.has(variation));
                    
                    // Jika file tidak terdaftar di database, hapus
                    if (!isUsed) {
                        const deleted = ManagementController.deletePhysicalFile(filePath);
                        if (deleted) {
                            deletedFiles.push(file);
                        }
                    }
                }
            }
            
            res.json({
                success: true,
                message: `Cleanup selesai. ${deletedFiles.length} file tidak terpakai dihapus.`,
                deletedCount: deletedFiles.length,
                deletedFiles: deletedFiles
            });
        } catch (error) {
            console.error('Error cleaning up unused files:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal membersihkan file tidak terpakai: ' + error.message
            });
        }
    }
}