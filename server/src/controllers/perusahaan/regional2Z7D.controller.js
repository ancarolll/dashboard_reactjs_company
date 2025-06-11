import { Regional2Z7D } from "../../models/perusahaan/regional2Z7D.model.js";
import fs from 'fs';
import path from 'path';
import { Regional2Z7DContractHistory } from "../../models/perusahaan/regional2Z7D_contract_history.model.js";
import { Regional2z7dHSEHistory } from "../../models/hse/regional2z7d_hse_history.model.js";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import pool from "../../config/db.js";

/**
 * Update the validateDocType function to include the new document types
 */
const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan_karyawan', 'bpjstk', 'no_rekening_mandiri'
  ];
  return validTypes.includes(docType);
};

export const Regional2Z7DController = {

/**
  * Menampilkan halaman edit project dengan data karyawan aktif
  * @param {object} req - Express request object
  * @param {object} res - Express response object
  */
    handleOptionsRequest: (req, res) => {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    },

    // Halaman utama
    index: async (req, res) => {
    try {
        // Jika meminta format JSON
        if (req.query.format === 'json') {
            const dataKaryawan = await Regional2Z7D.getAll();
            return res.json(dataKaryawan);
        }
        
        res.redirect('/api/regional2Z7D/edit');
    } catch (error) {
        console.error('Error pada index:', error);
        
        // Jika meminta format JSON
        if (req.query.format === 'json') {
            return res.status(500).json({
                error: 'Database error',
                message: error.message
            });
        }
        
        res.status(500).send('Terjadi kesalahan');
    }
    },

    // Debug utility function to check database structure
    checkDbStructure: async (req, res) => {
        try {
            const tableStructure = await Regional2Z7D.checkTableStructure();
            res.json({
                message: 'Database structure',
                structure: tableStructure
            });
        } catch (error) {
            console.error('Error checking DB structure:', error);
            res.status(500).json({
                error: 'Database error',
                message: error.message
            });
        }
    },

    getEditPage: async (req, res) => {
        try {
            const dataKaryawan = await Regional2Z7D.getAll();
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            // Jika tidak meminta JSON, render tampilan normal
            res.render('Regional2Z7DEditProjectPage', {
                title: 'Edit Project Regional 2 Zona 7 Devplan',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
        } catch (error) {
            console.error('Error pada getEditPage:', error);
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.status(500).json({
                    error: 'Database error', 
                    message: error.message
                });
            }
            res.status(500).send('Terjadi Kesalahan dalam mengambil data karyawan');
        }
    },

    getAll: async (req, res) => {
        try {
            const dataKaryawan = await Regional2Z7D.getAll();
            res.json(dataKaryawan || []);
        } catch (error) {
            console.error('Error pada getAllUsers:', error);
            res.status(500).json({
                error: 'Database error',
                message: 'Terjadi kesalahan dalam mengambil data karyawan'
            });
        }
    },

    /**
     * Menampilkan halaman View project dengan data karyawan aktif
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getViewPage: async (req, res) => {
        try {
            console.log('Starting getViewPage...');
            
            const dataKaryawan = await Regional2Z7D.getViewData();
            console.log(`Retrieved ${dataKaryawan.length} karyawan records for view page`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('Regional2Z7DViewProjectPage', {
                title: 'View Project Regional 2 Zona 7 Devplan',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('Regional2Z7DViewProjectPage rendered successfully');
        } catch (error) {
            console.error('Error pada getViewPage:', error);
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.status(500).json({
                    error: 'Database error', 
                    message: error.message
                });
            }
            res.status(500).render('error', {
                message: 'Terjadi Kesalahan dalam mengambil data karyawan',
                error: process.env.NODE_ENV !== 'production' ? error : {},
                stack: process.env.NODE_ENV !== 'production' ? error.stack : ''
            });
        }
    },

    /**
     * Menampilkan halaman NA project dengan data karyawan tidak aktif
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getNaPage: async (req, res) => {
        try {
            console.log('Starting getNaPage...');
            
            const dataKaryawan = await Regional2Z7D.getNAUsers();
            console.log(`Retrieved ${dataKaryawan.length} non-active karyawan records`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('Regional2Z7DNAProjectPage', {
                title: 'NA Project Regional 2 Zona 7 Devplan',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
        } catch (error) {
            console.error('Error pada getNAPage:', error);
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.status(500).json({
                    error: 'Database error', 
                    message: error.message
                });
            }
            res.status(500).render('error', {
                message: 'Terjadi kesalahan dalam mengambil data karyawan',
                error: process.env.NODE_ENV !== 'production' ? error : {},
                stack: process.env.NODE_ENV !== 'production' ? error.stack : ''
            });
        }
    },


    /**
     * Menampilkan form tambah user
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getTambahUserForm: async (req, res) => {
        try {
            console.log('Rendering tambah user form...');
            
            res.render('TambahUserRegional2Z7D', {
                title: 'Tambah User Regional 2 Zona 7 Devplan',
                karyawan: {},
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('TambahUserRegional2Z7D form rendered successfully');
        } catch (error) {
            console.error('Error pada getTambahUserForm:', error);
            res.status(500).render('error', {
                message: 'Terjadi kesalahan dalam membuka form tambah user',
                error: process.env.NODE_ENV !== 'production' ? error : {},
                stack: process.env.NODE_ENV !== 'production' ? error.stack : ''
            });
        }
    },

    /**
    * Menampilkan form edit user
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    getEditUserForm: async (req, res) => {
        try {
            console.log('Starting getEditUserForm...');
            
            const id = req.params.id;
            console.log(`Editing user with ID: ${id}`);
            
            const dataKaryawan = await Regional2Z7D.getUserById(id);
            
            if (!dataKaryawan) {
                console.log(`User with ID ${id} not found`);
                if (req.query.format === 'json') {
                    return res.status(404).json({
                        error: 'Not found',
                        message: 'Karyawan tidak ditemukan'
                    });
                }
                
                return res.status(404).render('error', {
                    message: 'Karyawan tidak ditemukan',
                    error: { status: 404 },
                    stack: ''
                });
            }
            
            console.log(`User data retrieved: ${dataKaryawan.nama_lengkap}`);
            
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            res.render('TambahUserRegional2Z7D', {
                title: 'Edit User Regional 2 Zona 7 Devplan',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('Edit user form rendered successfully');
        } catch (error) {
            console.error('Error pada getEditUserForm:', error);
            
            if (req.query.format === 'json') {
                return res.status(500).json({
                    error: 'Database error',
                    message: error.message
                });
            }
            
            res.status(500).render('error', {
                message: 'Terjadi Kesalahan dalam membuka form edit user',
                error: process.env.NODE_ENV !== 'production' ? error : {},
                stack: process.env.NODE_ENV !== 'production' ? error.stack : ''
            });
        }
    },

    /**
     * Menambahkan user baru
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    addUser: async (req, res) => {
        try {
            const userData = req.body;

            // Pastikan id tidak dikirimkan dari frontend
            if (userData.id) {
            delete userData.id;
            }

            // Validasi data dasar
            if (!userData.nama_lengkap || !userData.kontrak_awal || !userData.kontrak_akhir) {
                return res.status(400).json({
                    success: false,
                    message: 'Data karyawan tidak lengkap - nama, kontrak_awal, dan kontrak_akhir wajib diisi'
                });
                }
        
        // Pastikan format tanggal benar sebelum mengirim ke model
        const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
        dateFields.forEach(field => {
            if (userData[field] && typeof userData[field] === 'string') {
            if (userData[field].includes('/')) {
                const [day, month, year] = userData[field].split('/');
                userData[field] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            // Jika tanggal dengan timestamp, hapus timestamp
            else if (userData[field].includes('T')) {
                userData[field] = userData[field].split('T')[0];
            }
            }
        });
        
        // Kirim ke model untuk disimpan
        const result = await Regional2Z7D.addUser(userData);
        
        // Jika client meminta JSON
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(201).json({
            success: true,
            message: 'Data karyawan berhasil ditambahkan',
            data: result
            });
        }
        
        // Redirect berdasarkan status user (NA atau aktif)
        if (result.sebab_na) {
            res.redirect('/api/regional2Z7D/na');
        } else {
            res.redirect('/api/regional2Z7D/edit');
        }
        } catch (error) {
        console.error('Error pada addUser:', error);
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
            success: false,
            error: 'Database error',
            message: error.message
            });
        }
        
        res.status(500).send('Terjadi Kesalahan dalam menambahkan user');
        }
    },

    getUserById: async (req, res) => {
        try {
            const id = req.params.id;
            const dataKaryawan = await Regional2Z7D.getUserById(id);

            if (!dataKaryawan) {
                return res.status(404).send('Karyawan tidak ditemukan');
            }

            res.json(dataKaryawan);
        } catch (error) {
            console.error('Error pada getUserById:', error);
            res.status(500).send('Terjadi kesalahan dalam mengambil data karyawan');
        }
    },

    /**
     * Mengupdate data user
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    updateUser: async (req, res) => {
        try {
            const userId = req.params.id;
            let userData = req.body;
            const modifiedBy = req.user?.username || 'system';
        
            if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: 'ID User diperlukan' 
            });
        }

            // Pastikan field file yang null diproses dengan benar
            const fileFields = [
            'cv_filename', 'cv_filepath', 'cv_mimetype', 'cv_filesize',
            'ijazah_filename', 'ijazah_filepath', 'ijazah_mimetype', 'ijazah_filesize',
            'sertifikat_filename', 'sertifikat_filepath', 'sertifikat_mimetype', 'sertifikat_filesize', 
            'pkwt_filename', 'pkwt_filepath', 'pkwt_mimetype', 'pkwt_filesize',
            'no_ktp_filename', 'no_ktp_filepath', 'no_ktp_mimetype', 'no_ktp_filesize',
            'no_kk_filename', 'no_kk_filepath', 'no_kk_mimetype', 'no_kk_filesize',
            'no_npwp_filename', 'no_npwp_filepath', 'no_npwp_mimetype', 'no_npwp_filesize',
            'bpjs_kesehatan_karyawan_filename', 'bpjs_kesehatan_karyawan_filepath', 'bpjs_kesehatan_karyawan_mimetype', 'bpjs_kesehatan_karyawan_filesize',
            'bpjstk_filename', 'bpjstk_filepath', 'bpjstk_mimetype', 'bpjstk_filesize',
            'no_rekening_mandiri_filename', 'no_rekening_mandiri_filepath', 'no_rekening_mandiri_mimetype', 'no_rekening_mandiri_filesize'
            ];
            
            fileFields.forEach(field => {
            // Jika field ada dalam request dan nilainya null, proses sebagai null
            if (field in userData && userData[field] === null) {
                console.log(`Setting ${field} to null explicitly`);
                userData[field] = null;
            }
            });

            // Dapatkan data user lama untuk perbandingan
            const oldUserData = await Regional2Z7D.getUserById(userId);
            if (!oldUserData) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            // Verifikasi apakah pengguna mencoba memulihkan dari NA
            const isRestoring = oldUserData.sebab_na && !userData.sebab_na;
            const contractChanged = 
            oldUserData.no_kontrak !== userData.no_kontrak ||
            oldUserData.kontrak_awal !== userData.kontrak_awal ||
            oldUserData.kontrak_akhir !== userData.kontrak_akhir;

            console.log(`Update untuk user ID ${userId}:`);
            console.log(`- Kontrak berubah: ${contractChanged ? 'Ya' : 'Tidak'}`);
            console.log(`- Memulihkan dari NA: ${isRestoring ? 'Ya' : 'Tidak'}`);

            // ** ATURAN BISNIS KHUSUS **
            // Jika user mencoba memulihkan dari NA (menghapus sebab_na),
            // pastikan tanggal kontrak dan nomor kontrak juga diubah
            if (isRestoring && !contractChanged) {
            return res.status(400).json({
                success: false,
                message: 'Untuk memulihkan user, Anda harus mengubah tanggal kontrak dan nomor kontrak'
            });
            }

            // Pastikan format tanggal benar sebelum mengirim ke model
            const dateFields = ['kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
            dateFields.forEach(field => {
            if (userData[field] && typeof userData[field] === 'string') {
                // PERBAIKAN: Log format tanggal untuk debugging
                console.log(`Original ${field} before formatting:`, userData[field]);
                
                // Jika dalam format DD/MM/YYYY, konversi ke YYYY-MM-DD
                if (userData[field].includes('/')) {
                const [day, month, year] = userData[field].split('/');
                userData[field] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                // Jika tanggal dengan timestamp, hapus timestamp
                else if (userData[field].includes('T')) {
                userData[field] = userData[field].split('T')[0];
                }
                
                // Log hasil formatting untuk debugging
                console.log(`Format tanggal ${field} sesudah:`, userData[field]);
            }
            });

            // Gunakan updateUserWithHistory untuk mencatat perubahan kontrak
            const result = await Regional2Z7D.updateUserWithHistory(userId, userData, modifiedBy);

            // Jika mengembalikan dari NA, tambahkan pesan khusus
            let message = 'Data user berhasil diperbarui';
            if (isRestoring && contractChanged) {
            message = 'User berhasil dipulihkan dan dikembalikan ke status aktif';
            }
            
            res.status(200).json({
            message: 'Data user berhasil diperbarui',
            data: result
            });
        } catch (error) {
            console.error('Error in updateUser controller:', error);
            res.status(500).json({
            message: 'Gagal memperbarui data user',
            error: error.message
            });
        }
    },

    /**
    * Memindahkan user ke halaman NA
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    setUserInactive: async (req, res) => {
        try {
            const id = req.params.id;
            const { sebab_na } = req.body;
        
            // Tambahkan validasi input
            if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ 
                success: false,
                message: 'ID karyawan tidak valid' 
            });
            }
        
            if (!sebab_na || typeof sebab_na !== 'string' || sebab_na.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Alasan non-aktif (sebab_na) wajib diisi' 
            });
            }
        
            // Periksa apakah user ada
            const userExists = await Regional2Z7D.getUserById(id);
            if (!userExists) {
            return res.status(404).json({ 
                success: false, 
                message: 'Karyawan tidak ditemukan' 
            });
            }
        
            // Log untuk debugging
            console.log(`Memproses non-aktif untuk karyawan ID ${id} dengan alasan: ${sebab_na}`);
        
            // Update status dengan try-catch terpisah
            try {
            const result = await Regional2Z7D.updateUserStatus(id, sebab_na);
            
            // Pastikan result berisi data yang diharapkan
            if (!result) {
                throw new Error('Tidak ada data yang dikembalikan setelah update');
            }
            
            // Response sukses
            return res.json({
                success: true,
                message: `Karyawan berhasil diubah menjadi non-aktif dengan alasan: ${sebab_na}`,
                data: result
            });
            } catch (updateError) {
            console.error(`Error updating user status:`, updateError);
            return res.status(500).json({
                success: false,
                message: `Gagal mengubah status: ${updateError.message}`,
                error: updateError.toString()
            });
            }
        } catch (error) {
            console.error('Error pada setUserInactive', error);
            res.status(500).json({
            success: false,
            message: `Terjadi kesalahan server: ${error.message}`,
            error: error.toString()
            });
        }
    },

    /**
    * Memulihkan user dari NA ke halaman edit
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    restoreUser: async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id) {
        return res.status(400).json({
            success: false,
            message: 'ID user tidak ditemukan'
        });
        }

        console.log(`Memulai proses pemulihan untuk user ID: ${id}`);
        
        // Dapatkan data user sebelum pemulihan
        const userData = await Regional2Z7D.getUserById(id);
        if (!userData) {
        console.log(`User dengan ID ${id} tidak ditemukan`);
        return res.status(404).json({
            success: false,
            message: 'User tidak ditemukan'
        });
        }

        console.log(`User ditemukan: ${userData.nama_lengkap}, sebab_na: ${userData.sebab_na || 'tidak ada'}`);
    
        // Periksa apakah user memang memiliki status non-aktif
        if (!userData.sebab_na) {
        console.log(`User ${userData.nama_lengkap} sudah aktif (sebab_na kosong)`);
        return res.status(400).json({
            success: false,
            message: 'User sudah dalam status aktif'
        });
        }
            
        // Lakukan pemulihan (hanya menghapus sebab_na)
        const restoredUser = await Regional2Z7D.restoreUser(id);

        if (!restoredUser) {
        throw new Error('Gagal memulihkan user');
        }
        
        console.log(`Pemulihan berhasil untuk ${userData.nama_lengkap}`);
        
        // Cek status kontrak untuk informasi tambahan
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const kontrakAkhir = restoredUser.kontrak_akhir ? new Date(restoredUser.kontrak_akhir) : null;
        kontrakAkhir?.setHours(0, 0, 0, 0);
        
        const isContractExpired = kontrakAkhir ? kontrakAkhir < today : true;
        
        let daysDifference = 0;
        if (kontrakAkhir) {
        const diffTime = kontrakAkhir.getTime() - today.getTime();
        daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        // Kirim respons dengan data tambahan untuk informasi
        const responseData = {
        success: true,
        message: 'User berhasil dipulihkan (sebab_na dihapus)',
        data: restoredUser,
        contract_status: {
            isExpired: isContractExpired,
            daysRemaining: daysDifference,
            kontrak_akhir: restoredUser.kontrak_akhir,
            kontrak_awal: restoredUser.kontrak_awal,
            no_kontrak: restoredUser.no_kontrak
        },
        previous_status: {
            sebab_na: userData.sebab_na
        },
        // Tambahkan instruksi untuk frontend
        instructions: 'Untuk mengaktifkan kembali user, silakan perbarui tanggal kontrak dan nomor kontrak'
        };
        
        // Jika client meminta JSON
        if (req.xhr || req.headers.accept?.includes('application/json')) {
        console.log('Mengirim respons JSON untuk pemulihan user');
        return res.json(responseData);
        }
        
        // Redirect ke halaman edit dengan data yang diperlukan
        console.log('Melakukan redirect ke halaman edit user');
        res.redirect(`/api/regional2Z7D/edit-user/${id}?restored=true&message=Perbarui tanggal kontrak dan nomor kontrak`);
    } catch (error) {
        console.error('Error pada restoreUser:', error);
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
            success: false,
            error: 'Database error',
            message: error.message
        });
        }
        
        res.status(500).send(`Terjadi kesalahan dalam memulihkan user: ${error.message}`);
    }
    },

    /**
     * Menghapus user
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    deleteUser: async (req, res) => {
        try {
            const id = req.params.id;
            
            const result = await Regional2Z7D.deleteUser(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json({
                    message: 'User berhasil dihapus',
                    data: result
                });
            }
            
            res.redirect('/api/regional2Z7D/na');
        } catch (error) {
            console.error('Error pada deleteUser:', error);
            
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    error: 'Database error',
                    message: error.message
                });
            }
            
            res.status(500).send('Terjadi kesalahan dalam menghapus user');
        }
    },

    /**
     * Upload dokumen (file attachment)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    uploadDocument: async (req, res) => {
      try {
        const { userId, docType } = req.params;
        
        console.log(`Upload request received for ${docType}, userId: ${userId}`);
        console.log("File info:", req.file);
        
        // Validate userId as integer
        if (!userId || isNaN(parseInt(userId, 10))) {
          return res.status(400).json({ 
            error: 'User ID tidak valid',
            userId: userId
          });
        }
        
        // Validate document type
        if (!validateDocType(docType)) {
          return res.status(400).json({ error: 'Document type not valid' });
        }
        
        // Check if file exists in request
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Convert userId to integer
        const userIdInt = parseInt(userId, 10);
        
        // Check if user exists
        const userExists = await Regional2Z7D.getUserById(userIdInt);
        if (!userExists) {
          return res.status(404).json({ 
            error: 'User tidak ditemukan',
            userId: userIdInt
          });
        }
        
        // Log file path before upload
        console.log(`File path: ${req.file.path}`);
        
        // Upload document using model
        const result = await Regional2Z7D.uploadDocument(userId, docType, req.file);
        
        // Return response
        return res.json({
          success: true,
          message: `${docType.toUpperCase()} successfully uploaded`,
          data: result
        });
      } catch (error) {
        console.error(`Error uploading ${req.params.docType}:`, error);
        
        // Delete uploaded file if there's an error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log(`Temporary file deleted: ${req.file.path}`);
        }
        
        return res.status(500).json({ 
          success: false,
          error: error.message || 'Server error' 
        });
      }
    },

    /**
     * Download dokumen
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    downloadDocument: async (req, res) => {
      try {
        const { userId, docType } = req.params;
        
        // Validate document type
        if (!validateDocType(docType)) {
          return res.status(400).json({ error: 'Tipe dokumen tidak valid' });
        }
        
        // Get document info from model
        const fileInfo = await Regional2Z7D.getDocumentInfo(userId, docType);
        
        if (!fileInfo.filepath) {
          return res.status(404).json({ error: 'File tidak ditemukan' });
        }
        
        // Check if file exists
        if (!fs.existsSync(fileInfo.filepath)) {
          return res.status(404).json({ error: 'File tidak ditemukan di server' });
        }
        
        // Set header for download
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
        res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');
        
        // Send file
        const fileStream = fs.createReadStream(fileInfo.filepath);
        fileStream.pipe(res);
      } catch (error) {
        console.error(`Error downloading document:`, error);
        res.status(500).json({ error: error.message || 'Server error' });
      }
    },

    /**
     * Ambil file dokumen untuk preview
     */
    getDocumentFile: async (req, res) => {
      try {
        const { userId, docType } = req.params;
        
        console.log(`Getting file for user ID ${userId}, document type ${docType}`);
        
        // Validate document type
        if (!validateDocType(docType)) {
          return res.status(400).json({ 
            success: false,
            message: 'Tipe dokumen tidak valid' 
          });
        }
        
        // Get employee data
        const employee = await Regional2Z7D.getUserById(userId);
        if (!employee) {
          console.log(`Employee with ID ${userId} not found`);
          return res.status(404).json({
            success: false,
            message: 'Karyawan tidak ditemukan'
          });
        }
        
        // Check if file exists in database
        const filePath = employee[`${docType}_filepath`];
        if (!filePath) {
          console.log(`File path for ${docType} not found in database`);
          return res.status(404).json({
            success: false,
            message: 'File tidak ditemukan dalam database'
          });
        }
        
        console.log(`File path from database: ${filePath}`);
        
        // Normalize path
        let normalizedPath = filePath;
        if (normalizedPath.startsWith('public/')) {
          normalizedPath = normalizedPath.substring(7);
        }
        if (normalizedPath.startsWith('/')) {
          normalizedPath = normalizedPath.substring(1);
        }
        
        // Try several possible file locations
        const possiblePaths = [
          path.join(__dirname, '../../', normalizedPath),
          path.join(__dirname, '../../../', normalizedPath),
          path.join(__dirname, '../../public', normalizedPath),
          path.join(__dirname, '../../uploads', normalizedPath),
          path.join('D:/dashboardadmin/server/src/uploads/regional2z7d', path.basename(normalizedPath))
        ];
        
        let fullPath = null;
        for (const testPath of possiblePaths) {
          console.log(`Checking path: ${testPath}`);
          if (fs.existsSync(testPath)) {
            console.log(`File found at: ${testPath}`);
            fullPath = testPath;
            break;
          }
        }
        
        if (!fullPath) {
          console.error(`File not found on server. Database path: ${filePath}`);
          console.error(`Paths tried: ${JSON.stringify(possiblePaths)}`);
          return res.status(404).json({
            success: false,
            message: 'File tidak ditemukan di server'
          });
        }
        
        // Set appropriate headers
        const fileName = employee[`${docType}_filename`] || `${docType}_document`;
        const mimeType = employee[`${docType}_mimetype`] || 'application/octet-stream';
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Content-Length', fs.statSync(fullPath).size);
        
        // Send the file
        const fileStream = fs.createReadStream(fullPath);
        fileStream.on('error', (error) => {
          console.error(`Error while streaming file: ${error.message}`);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Gagal membaca file'
            });
          }
        });
        
        fileStream.pipe(res);
      } catch (error) {
        console.error(`Error getting file: ${error.message}`, error);
        res.status(500).json({
          success: false,
          message: 'Gagal mengakses file',
          error: error.message
        });
      }
    },

    /**
    * Mengecek dan memperbarui kontrak yang sudah berakhir
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    checkExpiredContracts: async (req, res) => {
        try {
            console.log('Menjalankan pengecekan kontrak yang sudah kedaluwarsa...');
    
            let expiredUsers = [];
            try {
            expiredUsers = await Regional2Z7D.checkExpiredKontrak();
            } catch (checkError) {
            console.error('Error saat mengecek kontrak kadaluarsa:', checkError);
            // Tetap lanjutkan meskipun check error
            }
    
            console.log(`Ditemukan ${expiredUsers.length} karyawan dengan kontrak berakhir`);
    
            const updateResults = [];
        
        // Update status for each expired user
        for (const user of expiredUsers) {
            try {
            const updatedUser = await Regional2Z7D.updateUserStatus(user.id, 'EOC');
            console.log(`Berhasil mengupdate karyawan ID ${user.id} (${updatedUser.nama_lengkap}) dengan sebab_na='EOC'`);
            updateResults.push({
                id: user.id,
                nama_lengkap: updatedUser.nama_lengkap,
                kontrak_akhir: updatedUser.kontrak_akhir,
                status: 'success'
            });
            } catch (updateError) {
            console.error(`Gagal mengupdate karyawan ID ${user.id}:`, updateError);
            updateResults.push({
                id: user.id,
                status: 'error',
                error: updateError.message
            });
            }
        }
        const result = { 
            message: 'Kontrak yang expired telah diupdate', 
            count: expiredUsers.length,
            updated: updateResults 
        };
    
        if (res && req && (req.xhr || (req.headers && req.headers.accept && req.headers.accept.includes('application/json')))) {
            return res.json(result);
        }
        if (res && res.redirect) {
            res.redirect('/api/regional2Z7D/na');
        }
        return result;
        } catch (error) {
        console.error('Error pada checkExpiredContracts:', error);
        
        if (res && res.status && req && (req.xhr || (req.headers && req.headers.accept && req.headers.accept.includes('application/json')))) {
            return res.status(500).json({
            error: 'Database error',
            message: error.message
            });
        }
        
        if (res && res.status) {
            res.status(500).send('Terjadi kesalahan dalam memeriksa kontrak yang sudah berakhir');
        }
        
        throw error;
        }
    },
    
    /**
    * Update user dengan mencatat riwayat kontrak
    */
    updateUserWithHistory: async (req, res) => {
        try {
        const id = req.params.id;
        const userData = req.body;
        const modifiedBy = req.user?.username || 'system';
    
        // Update data pengguna
        const updatedUser = await Regional2Z7D.updateUser(id, userData);
        
        // Cek apakah contract history perlu diperbarui
        const oldUser = await Regional2Z7D.getUserById(id);
        const contractChanged = 
            oldUser.no_kontrak !== userData.no_kontrak ||
            oldUser.kontrak_awal !== userData.kontrak_awal ||
            oldUser.kontrak_akhir !== userData.kontrak_akhir;
        
        // Jika kontrak berubah, coba simpan ke history
        if (contractChanged) {
            try {
            // Periksa apakah model Regional2Z7DContractHistory ada
            if (typeof Regional2Z7DContractHistory !== 'undefined') {
                await Regional2Z7DContractHistory.addHistory({
                user_id: id,
                nama_karyawan: userData.nama_lengkap,
                no_kontrak_lama: oldUser.no_kontrak,
                kontrak_awal_lama: oldUser.kontrak_awal,
                kontrak_akhir_lama: oldUser.kontrak_akhir,
                no_kontrak_baru: userData.no_kontrak,
                kontrak_awal_baru: userData.kontrak_awal,
                kontrak_akhir_baru: userData.kontrak_akhir,
                modified_by: modifiedBy,
                tanggal_perubahan: new Date()
                });
            } else {
                console.warn('Regional2Z7DContractHistory not defined, skipping history recording');
                // Gunakan alternatif Regional2Z7D.saveKontrakHistory jika ada
                if (typeof Regional2Z7D.saveKontrakHistory === 'function') {
                await Regional2Z7D.saveKontrakHistory(id, oldUser, userData);
                }
            }
            } catch (historyError) {
            console.error('Failed to save contract history:', historyError);
            // Lanjutkan proses meskipun gagal menyimpan history
            }
        }
        
        return res.json({
            success: true,
            message: 'User berhasil diperbarui',
            data: updatedUser
        });
        } catch (error) {
        console.error('Error dalam updateUserWithHistory:', error);
        return res.status(500).json({
            success: false,
            error: 'Database error',
            message: error.message
        });
        }
    },

    /**
    * Mendapatkan semua riwayat kontrak untuk satu user
    */
    getAllContractHistory: async (req, res) => {
    try {
    const userId = req.params.id;
    console.log(`Getting all contract history for user ${userId}`);
    
    const history = await Regional2Z7DContractHistory.getAllHistoryByUserId(userId);
    
    return res.status(200).json({
        success: true,
        message: 'Riwayat kontrak berhasil diambil',
        data: history
    });
    } catch (error) {
    console.error('Error getting contract history:', error);
    return res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat kontrak',
        data: [],
        error: error.message });
    }
    },

    /**
    * Mendapatkan statistik perubahan kontrak
    */
    getContractChangeStats: async (req, res) => {
        try {
        const stats = await Regional2Z7DContractHistory.getContractChangeStats();
        
        res.json(stats);
        } catch (error) {
        console.error('Error pada getContractChangeStats:', error);
        res.status(500).json({
            error: 'Database error',
            message: error.message
        });
        }
        },
    
    getKontrakHistory: async (req, res) => {
        try {
        const userId = req.params.id;
        
        // Panggil method getKontrakHistory dari model Regional2Z7D
        const history = await Regional2Z7D.getKontrakHistory(userId);
        
        res.status(200).json({
            message: 'Riwayat kontrak berhasil diambil',
            data: history
        });
        } catch (error) {
        console.error('Error in getKontrakHistory controller:', error);
        res.status(500).json({
            message: 'Gagal mengambil riwayat kontrak',
            error: error.message });
        }
    },

    /**
    * Mendapatkan detail personal karyawan
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    getPersonalData: async (req, res) => {
        try {
            const id = req.params.id;
            const personalData = await Regional2Z7D.getPersonalData(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json(personalData);
            }
            
            res.render('personal_data', {
                title: 'Data Personal',
                personal: personalData
            });
        } catch (error) {
            console.error('Error pada getPersonalData:', error);
            
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    error: 'Database error',
                    message: error.message
                });
            }
            
            res.status(500).send('Terjadi kesalahan dalam mengambil data personal');
        }
    },

    /**
    * Hapus dokumen
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    deleteDocument: async (req, res) => {
        try {
        const { userId, docType } = req.params;
        
        // Validate document type
        if (!validateDocType(docType)) {
            return res.status(400).json({ 
            success: false,
            error: 'Tipe dokumen tidak valid' 
            });
        }

        // Validasi input
        if (!userId || !docType) {
            return res.status(400).json({ 
            success: false,
            error: 'User ID dan tipe dokumen wajib diisi' 
            });
        }
        
        // Dapatkan info dokumen dari model
        const fileInfo = await Regional2Z7D.getDocumentInfo(userId, docType);
        
        if (!fileInfo || !fileInfo.filepath) {
            return res.status(404).json({ 
            success: false,
            message: `Tidak ada file ${docType} yang perlu dihapus`,
            warning: true 
            });
        }
        
        // Hapus file fisik jika ada
        if (fileInfo.filepath && fs.existsSync(fileInfo.filepath)) {
            try {
            fs.unlinkSync(fileInfo.filepath);
            console.log(`File ${docType} berhasil dihapus: ${fileInfo.filepath}`);
            } catch (fsError) {
            console.error(`Gagal menghapus file fisik: ${fsError.message}`);
            // Lanjutkan proses meskipun hapus file gagal
            }
        } else {
            console.log(`File fisik tidak ditemukan: ${fileInfo.filepath}`);
        }
        
        // Hapus referensi file dari database
        await Regional2Z7D.deleteDocument(userId, docType);
        
        res.json({ 
            success: true, 
            message: `File ${docType} berhasil dihapus` 
        });
        } catch (error) {
        console.error(`Error deleting document:`, error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Server error' });
        }
    },

    /**
    * Membuat dan mengunduh template CSV untuk upload massal
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    getCSVTemplate: async (req, res) => {
        try {
        // Definisi header CSV (disesuaikan dengan skema regional2Z7D)
        const headers = [
            "nama_lengkap", "jabatan", "no_kontrak", 
            "kontrak_awal", "kontrak_akhir", "tempat_lahir", "tanggal_lahir", "alamat_domisili", "no_telpon", 
            "kontak_darurat", "nama_kontak_darurat", "email", "email_lain",
            "no_ktp", "no_kk", "jenis_kelamin", "alamat_ktp", 
            "bpjs_kesehatan_karyawan", "bpjstk", "bpjs_kesehatan_suami_istri", "bpjs_anak1", 
            "bpjs_anak2", "bpjs_anak3", "bpjstk_keterangan", "asuransi_lainnya",
            "no_npwp", "pendidikan", 
            "no_rekening_mandiri",
            "awal_mcu", "akhir_mcu", "hasil_mcu", "vendor_mcu", "no_hsepassport",
            "awal_hsepassport", "akhir_hsepassport", "no_siml", "awal_siml", "akhir_siml", "cv"
        ];
        
        // Buat contoh data (satu baris contoh)
        const exampleData = [
            "John Doe", "Staff", "KTR/2023/001",
            "12/11/2023", "31/12/2025", "Makassar", "10/11/1990", "Jl. Contoh No. 123", "08123456789",
            "08123456788", "Jane Doe", "john.doe@example.com", "johndoe@gmail.com",
            "1234567890123456", "1234567890", "Laki-laki", "Jl. KTP No. 123",
            "12345678", "87654321", "12345679", "12345680", "12345681", "12345682", "Keterangan BPJS",
            "12345682", "123456789012345", "S1 Teknik", 
            "1234567890",
            "12/11/2023", "31/12/2023", "Sehat", "RS Contoh", "HSE123456",
            "21/11/2023", "31/12/2023", "SIM123456", "12/11/2023", "31/12/2025", "done"
        ];
        
        // Buat content CSV
        let csvContent = headers.join(",") + "\n";
        csvContent += exampleData.join(",") + "\n";
        
        // Set header respons untuk CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=template_data_karyawan_regional2Z7D.csv');
        
        // Kirim file CSV
        res.send(csvContent);
        } catch (error) {
        console.error('Error generating CSV template:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Gagal membuat template CSV'
        });
        }
    },
    
    /**
    * Menangani upload massal karyawan dari file CSV/Excel
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    uploadBulkData: async (req, res) => {
        try {
        console.log("Memulai uploadBulkData");
        console.log("File request:", req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : "No file");
        // Cek apakah ada file yang diupload
        if (!req.file) {
            console.log("Tidak ada file yang diupload");
            return res.status(400).json({
            success: 0,
            errors: [{ message: 'Tidak ada file yang diupload' }],
            total: 0
            });
        }
        // Log informasi file
        console.log("File diterima:", req.file.originalname, req.file.mimetype, req.file.size);
        // Validasi file dasar
        const file = req.file;
        // Cek ukuran file (maksimal 5MB)
        if (file.size > 5 * 1024 * 1024) {
            console.log("File terlalu besar:", file.size);
            return res.status(400).json({
            success: 0,
            errors: [{ message: 'Ukuran file melebihi 5MB' }],
            total: 0
            });
        }
        // Cek ekstensi file
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const allowedExtensions = ['csv', 'xlsx', 'xls'];
        if (!allowedExtensions.includes(fileExtension)) {
            console.log("Ekstensi file tidak valid:", fileExtension);
            return res.status(400).json({
            success: 0,
            errors: [{ message: 'Format file tidak didukung. Gunakan CSV atau Excel (.csv, .xlsx, .xls)' }],
            total: 0
            });
        }
        // Parsing file sesuai formatnya
        let parsedData = [];
        try {
            if (fileExtension === 'csv') {
            // Parse CSV
            console.log("Memproses file CSV...");
            const content = fs.readFileSync(file.path, 'utf8');
            const result = Papa.parse(content, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false
            });
            if (result.errors && result.errors.length > 0) {
                return res.status(400).json({
                success: 0,
                errors: result.errors.map(err => ({ message: `Error parsing CSV: ${err.message}`, row: err.row })),
                total: 0
                });
            }
            parsedData = result.data;
            } else {
            // Parse Excel
            const workbook = XLSX.readFile(file.path);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            parsedData = jsonData;
            }
            // Log parsedData untuk debugging
            console.log(`Berhasil parse ${parsedData.length} records dari file`);
            if (parsedData.length > 0) {
            console.log(`Contoh record pertama:`, JSON.stringify(parsedData[0], null, 2));
            }
            if (parsedData.length === 0) {
            return res.status(400).json({
                success: 0,
                errors: [{ message: 'File tidak berisi data yang valid atau kosong' }],
                total: 0
            });
            }
        } catch (parseError) {
            console.error("Error parsing file:", parseError);
            return res.status(400).json({
            success: 0,
            errors: [{ message: `Error parsing file: ${parseError.message}` }],
            total: 0
            });
        }
        // Validasi data sebelum diproses
        const validation = Regional2Z7D.validateCSVData(parsedData);
        // Log validation result untuk debugging
        console.log(`Validasi: ${validation.valid ? 'Valid' : 'Invalid'}, Errors: ${validation.errors.length}`);
        // Jika ada error validasi yang kritis, kembalikan error
        if (validation.errors.length > 10) {
            return res.status(400).json({
            success: 0,
            errors: validation.errors.slice(0, 10), // Batasi jumlah error yang ditampilkan
            total: parsedData.length,
            message: `Terdapat ${validation.errors.length} error validasi. Perbaiki data sebelum mengupload.`
            });
        }
        // Proses bulk insert
        console.log("Memulai proses bulk insert untuk", parsedData.length, "data");
        const processResult = await Regional2Z7D.processBulkInsert(parsedData);
        console.log(`Hasil pemrosesan: ${processResult.success} berhasil, ${processResult.errors.length} gagal`);
        
        // Return hasil
        return res.status(200).json({
            success: processResult.success,
            errors: processResult.errors,
            total: parsedData.length
        });
        } catch (error) {
        console.error('Error detail pada uploadBulkData:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: 0,
            errors: [{ message: `Server error: ${error.message}` }],
            total: 0
        });
        } finally {
        try {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log("File temporary berhasil dihapus");
            }
        } catch (cleanupError) {
            console.error("Error saat membersihkan file temporary:", cleanupError);
        }}
    },

    /**
    * Mendapatkan detail data administrasi karyawan
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    getAdminData: async (req, res) => {
        try {
            const id = req.params.id;
            const adminData = await Regional2Z7D.getAdminData(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json(adminData);
            }
            
            res.render('admin_data', {
                title: 'Data Administrasi',
                admin: adminData
            });
        } catch (error) {
            console.error('Error pada getAdminData:', error);
            
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    error: 'Database error',
                    message: error.message
                });
            }
            
            res.status(500).send('Terjadi kesalahan dalam mengambil data administrasi');
        }
    },

    /**
    * Mendapatkan detail data sertifikasi karyawan
    * @param {object} req - Express request object
    * @param {object} res - Express response object
    */
    getCertificationData: async (req, res) => {
        try {
            const id = req.params.id;
            const certificationData = await Regional2Z7D.getCertificationData(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json(certificationData);
            }
            
            res.render('certification_data', {
                title: 'Data Sertifikasi',
                certification: certificationData
            });
        } catch (error) {
            console.error('Error pada getCertificationData:', error);
            
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    error: 'Database error',
                    message: error.message
                });
            }
            
            res.status(500).send('Terjadi kesalahan dalam mengambil data sertifikasi');
        }
    },

    /**
     * Mendapatkan data HSE karyawan untuk halaman monitoring HSE
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getHSEData: async (req, res) => {
        try {
        console.log('Memulai getHSEData...');
        
        // Gunakan fungsi khusus untuk mendapatkan data HSE
        const dataHSE = await Regional2Z7D.getHSEData();
        
        console.log(`Mengambil ${dataHSE.length} data HSE karyawan`);
        
        // Jika meminta format JSON
        if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
            console.log('Mengirim respons JSON untuk data HSE');
            return res.json(dataHSE);
        }
        
        // Jika memerlukan render view, bisa ditambahkan di sini
        // Untuk saat ini, selalu kirim JSON karena data ini akan diakses dari frontend React
        res.json(dataHSE);
        } catch (error) {
        console.error('Error pada getHSEData:', error);
        
        res.status(500).json({
            error: 'Database error',
            message: error.message
        });
        }
    },

    /**
     * Update data HSE karyawan (MCU, HSE Passport, dan SIM) dengan pencatatan riwayat
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    updateHSEDataWithHistory: async (req, res) => {
        try {
        const id = req.params.id;
        let userData = req.body;
        const modifiedBy = req.user?.username || 'system';
        
        if (!id) {
            return res.status(400).json({ 
            success: false, 
            message: 'ID karyawan diperlukan' 
            });
        }
        
        console.log(`Memperbarui data HSE untuk karyawan ID: ${id}`);
        
        // Dapatkan data user sebelum pembaruan untuk perbandingan
        const oldUserData = await Regional2Z7D.getUserById(id);
        if (!oldUserData) {
            console.log(`User dengan ID ${id} tidak ditemukan`);
            return res.status(404).json({
            success: false,
            message: 'Karyawan tidak ditemukan'
            });
        }
        
        // Pastikan format tanggal benar sebelum mengirim ke model
        const dateFields = ['awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
        dateFields.forEach(field => {
            if (userData[field] && typeof userData[field] === 'string') {
            // Log format tanggal untuk debugging
            console.log(`Format ${field} sebelum pemrosesan:`, userData[field]);
            
            // Jika dalam format DD/MM/YYYY, konversi ke YYYY-MM-DD
            if (userData[field].includes('/')) {
                const [day, month, year] = userData[field].split('/');
                userData[field] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            // Jika tanggal dengan timestamp, hapus timestamp
            else if (userData[field].includes('T')) {
                userData[field] = userData[field].split('T')[0];
            }
            
            // Log hasil formatting untuk debugging
            console.log(`Format tanggal ${field} sesudah:`, userData[field]);
            }
        });
        
        // Filter hanya data HSE yang perlu diupdate
        const hseUpdateData = {
            // MCU Data
            awal_mcu: userData.awal_mcu,
            akhir_mcu: userData.akhir_mcu,
            hasil_mcu: userData.hasil_mcu,
            vendor_mcu: userData.vendor_mcu,
            
            // HSE Passport Data
            no_hsepassport: userData.no_hsepassport,
            awal_hsepassport: userData.awal_hsepassport,
            akhir_hsepassport: userData.akhir_hsepassport,
            
            // SIM Data
            no_siml: userData.no_siml,
            awal_siml: userData.awal_siml,
            akhir_siml: userData.akhir_siml,
        };
        
        // Periksa apakah data HSE berubah secara signifikan
        const isHSEChanged = Regional2z7dHSEHistory.isHSEDataChanged(oldUserData, hseUpdateData);
        
        // Mulai transaksi database
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Update data user di database
            const updatedUser = await Regional2Z7D.updateUser(id, hseUpdateData);
            
            if (!updatedUser) {
            throw new Error('Gagal memperbarui data HSE');
            }
            
            // Jika data HSE berubah secara signifikan, catat dalam riwayat
            if (isHSEChanged) {
            try {
                // Siapkan data riwayat
                const historyData = Regional2z7dHSEHistory.prepareHistoryData(oldUserData, hseUpdateData, modifiedBy);
                
                // Tambahkan catatan ke riwayat
                await Regional2z7dHSEHistory.addHistory(historyData);
                
                console.log(`Berhasil mencatat perubahan HSE dalam riwayat untuk karyawan ID ${id}`);
            } catch (historyError) {
                console.error(`Error saat mencatat riwayat HSE: ${historyError.message}`);
                // Lanjutkan operasi meskipun pencatatan riwayat gagal
            }
            } else {
            console.log(`Tidak ada perubahan signifikan pada data HSE untuk karyawan ID ${id}`);
            }
            
            // Commit transaksi
            await client.query('COMMIT');
            
            console.log(`Berhasil memperbarui data HSE untuk karyawan: ${updatedUser.nama_lengkap}`);
            
            res.status(200).json({
            success: true,
            message: 'Data HSE berhasil diperbarui',
            data: updatedUser,
            historyUpdated: isHSEChanged
            });
        } catch (error) {
            // Rollback transaksi jika terjadi error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            // Release client
            client.release();
        }
        } catch (error) {
        console.error('Error pada updateHSEDataWithHistory:', error);
        
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data HSE',
            error: error.message
        });
        }
    },

    /**
     * Mendapatkan riwayat HSE untuk user tertentu
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getHSEHistory: async (req, res) => {
        try {
        const userId = req.params.id;
        
        if (!userId) {
            return res.status(400).json({
            success: false,
            message: 'ID karyawan diperlukan'
            });
        }
        
        console.log(`Mengambil riwayat HSE untuk user ID: ${userId}`);
        
        // Pastikan user ada
        const userExists = await Regional2Z7D.getUserById(userId);
        if (!userExists) {
            return res.status(404).json({
            success: false,
            message: 'Karyawan tidak ditemukan'
            });
        }
        
        // Dapatkan catatan riwayat
        const history = await Regional2z7dHSEHistory.getAllHistoryByUserId(userId);
        
        console.log(`Mengambil ${history.length} catatan riwayat HSE untuk user ID ${userId}`);
        
        // Format tanggal untuk tampilan jika diperlukan
        const formattedHistory = history.map(record => {
            // Buat salinan untuk menghindari mutasi objek asli
            const formatted = { ...record };
            
            // Format field tanggal jika diperlukan
            const dateFields = [
            'awal_mcu_lama', 'akhir_mcu_lama', 'awal_mcu_baru', 'akhir_mcu_baru',
            'awal_hsepassport_lama', 'akhir_hsepassport_lama', 'awal_hsepassport_baru', 'akhir_hsepassport_baru',
            'awal_siml_lama', 'akhir_siml_lama', 'awal_siml_baru', 'akhir_siml_baru'
            ];
            
            dateFields.forEach(field => {
            if (formatted[field]) {
                // Sudah ditangani oleh driver database, tapi untuk amannya
                if (formatted[field] instanceof Date) {
                formatted[field] = formatted[field].toISOString().split('T')[0];
                }
            }
            });
            
            return formatted;
        });
        
        res.status(200).json({
            success: true,
            message: 'Riwayat HSE berhasil diambil',
            data: formattedHistory
        });
        } catch (error) {
        console.error('Error saat mengambil riwayat HSE:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil riwayat HSE',
            error: error.message
        });
        }
    },

    /**
     * Mendapatkan statistik riwayat HSE
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getHSEHistoryStats: async (req, res) => {
        try {
        console.log('Mengambil statistik riwayat HSE');
        
        // Dapatkan statistik
        const stats = await Regional2z7dHSEHistory.getHSEChangeStats();
        
        res.status(200).json({
            success: true,
            message: 'Statistik HSE berhasil diambil',
            data: stats
        });
        } catch (error) {
        console.error('Error saat mengambil statistik riwayat HSE:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik HSE',
            error: error.message
        });
        }
    },

    // Membuat tabel sertifikat jika belum ada
    createSertifikatTable: async (req, res) => {
      try {
        await Regional2Z7D.createSertifikatTable();
        res.json({ success: true, message: 'Tabel sertifikat berhasil dibuat atau sudah ada' });
      } catch (error) {
        console.error('Error creating sertifikat table:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal membuat tabel sertifikat',
          error: error.message
        });
      }
    },

    // Menambahkan sertifikat baru
    addSertifikat: async (req, res) => {
      try {
        const sertifikatData = req.body;
        
        // Validate data
        if (!sertifikatData.user_id || !sertifikatData.judul_sertifikat) {
          return res.status(400).json({
            success: false,
            message: 'Data sertifikat tidak lengkap'
          });
        }
        
        // Ensure the table exists
        await Regional2Z7D.createSertifikatTable();
        
        // Add the certificate
        const result = await Regional2Z7D.addSertifikat(sertifikatData);
        
        res.status(201).json({
          success: true,
          message: 'Sertifikat berhasil ditambahkan',
          data: result
        });
      } catch (error) {
        console.error('Error adding sertifikat:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal menambahkan sertifikat',
          error: error.message
        });
      }
    },

    // Mendapatkan sertifikat berdasarkan user_id
    getSertifikatByUserId: async (req, res) => {
      try {
        const userId = req.params.userId;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'ID user tidak boleh kosong'
          });
        }
        
        // Ensure the table exists
        await Regional2Z7D.createSertifikatTable();
        
        // Get certificates
        const result = await Regional2Z7D.getSertifikatByUserId(userId);
        
        res.json({
          success: true,
          message: 'Sertifikat berhasil diambil',
          data: result
        });
      } catch (error) {
        console.error('Error getting sertifikat by userId:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal mengambil sertifikat',
          error: error.message
        });
      }
    },

    // Mendapatkan sertifikat berdasarkan id
    getSertifikatById: async (req, res) => {
      try {
        const id = req.params.id;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID sertifikat tidak boleh kosong'
          });
        }
        
        // Get the certificate
        const result = await Regional2Z7D.getSertifikatById(id);
        
        if (!result) {
          return res.status(404).json({
            success: false,
            message: 'Sertifikat tidak ditemukan'
          });
        }
        
        res.json({
          success: true,
          message: 'Sertifikat berhasil diambil',
          data: result
        });
      } catch (error) {
        console.error('Error getting sertifikat by id:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal mengambil sertifikat',
          error: error.message
        });
      }
    },

    // Mengupdate sertifikat
    updateSertifikat: async (req, res) => {
      try {
        const id = req.params.id;
        const sertifikatData = req.body;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID sertifikat tidak boleh kosong'
          });
        }
        
        if (!sertifikatData) {
          return res.status(400).json({
            success: false,
            message: 'Data sertifikat tidak boleh kosong'
          });
        }
        
        // Update the certificate
        const result = await Regional2Z7D.updateSertifikat(id, sertifikatData);
        
        res.json({
          success: true,
          message: 'Sertifikat berhasil diupdate',
          data: result
        });
      } catch (error) {
        console.error('Error updating sertifikat:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal mengupdate sertifikat',
          error: error.message
        });
      }
    },

    // Menghapus sertifikat
    deleteSertifikat: async (req, res) => {
      try {
        const id = req.params.id;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID sertifikat tidak boleh kosong'
          });
        }
        
        // Delete the certificate
        const result = await Regional2Z7D.deleteSertifikat(id);
        
        res.json({
          success: true,
          message: 'Sertifikat berhasil dihapus',
          data: result
        });
      } catch (error) {
        console.error('Error deleting sertifikat:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal menghapus sertifikat',
          error: error.message
        });
      }
    }
};