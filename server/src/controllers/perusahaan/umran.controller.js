import { Umran } from '../../models/perusahaan/umran.model.js';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Update the validateDocType function to include the new document types
 */
const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 
    'no_bpjs_tk', 'rekening'
  ];
  return validTypes.includes(docType);
};

export const UmranController = {
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
            const dataKaryawan = await Umran.getAll();
            return res.json(dataKaryawan);
        }
        
        res.redirect('/api/umran/edit');
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
            const tableStructure = await Umran.checkTableStructure();
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
            const dataKaryawan = await Umran.getAll();
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            // Jika tidak meminta JSON, render tampilan normal
            res.render('UmranEditProjectPage', {
                title: 'Edit Project Umran',
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
            const dataKaryawan = await Umran.getAll();
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
            
            const dataKaryawan = await Umran.getViewData();
            console.log(`Retrieved ${dataKaryawan.length} karyawan records for view page`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('UmranViewProjectPage', {
                title: 'View Project Umran',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('UmranViewProjectPage rendered successfully');
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
            
            const dataKaryawan = await Umran.getNAUsers();
            console.log(`Retrieved ${dataKaryawan.length} non-active karyawan records`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('UmranNAProjectPage', {
                title: 'NA Project Umran',
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
            
            res.render('TambahUserUmran', {
                title: 'Tambah User Umran',
                karyawan: {},
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('TambahUserUmran form rendered successfully');
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
            
            const dataKaryawan = await Umran.getUserById(id);
            
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
            
            console.log(`User data retrieved: ${dataKaryawan.nama_lengkap_karyawan}`);
            
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            res.render('TambahUserUmran', {
                title: 'Edit User Umran',
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
            if (!userData.nama_lengkap_karyawan || !userData.kontrak_awal || !userData.kontrak_akhir) {
                return res.status(400).json({
                success: false,
                message: 'Data karyawan tidak lengkap - nama, kontrak_awal, dan kontrak_akhir wajib diisi'
            });
            }
    
            // Reset sequence jika diperlukan sebelum insert
            await Umran.resetSequence();
    
            // Pastikan format tanggal benar sebelum mengirim ke model
            const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
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
            
            // Pastikan field numerik benar-benar numerik
            const numericFields = [
            'gapok', 'ot', 'thp', 't_transport', 't_lapangan'
            ];
            
            numericFields.forEach(field => {
            if (userData[field] === '' || userData[field] === undefined) {
                userData[field] = null;
            } else if (userData[field] !== null) {
                // Konversi ke number jika string
                if (typeof userData[field] === 'string') {
                userData[field] = Number(userData[field].replace(',', '.'));
                }
            }
            });
            
            // Kirim ke model untuk disimpan
            const result = await Umran.addUser(userData);
            
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
            res.redirect('/api/umran/na');
            } else {
            res.redirect('/api/umran/edit');
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
            const dataKaryawan = await Umran.getUserById(id);

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
                'npwp_filename', 'npwp_filepath', 'npwp_mimetype', 'npwp_filesize',
                'no_bpjs_kesehatan_filename', 'no_bpjs_kesehatan_filepath', 'no_bpjs_kesehatan_mimetype', 'no_bpjs_kesehatan_filesize',
                'no_bpjs_tk_filename', 'no_bpjs_tk_filepath', 'no_bpjs_tk_mimetype', 'no_bpjs_tk_filesize',
                'rekening_filename', 'rekening_filepath', 'rekening_mimetype', 'rekening_filesize'
            ];
            
            fileFields.forEach(field => {
                // Jika field ada dalam request dan nilainya null, proses sebagai null
                if (field in userData && userData[field] === null) {
                console.log(`Setting ${field} to null explicitly`);
                userData[field] = null;
                }
            });

            // Dapatkan data user lama untuk perbandingan
            const oldUserData = await Umran.getUserById(userId);
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

            // Pastikan format tanggal benar sebelum mengirim ke model
            const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
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
            else if (field === 'tanggal_lahir' && isRestoring && oldUserData[field]) {
                // Pertahankan tanggal_lahir dari data lama jika tidak diubah
                userData[field] = oldUserData[field];
                console.log(`Preserving original tanggal_lahir for restore:`, userData[field]);
            }
            });

            // Gunakan updateUserWithHistory untuk mencatat perubahan kontrak
            const result = await Umran.updateUserWithHistory(userId, userData, modifiedBy);

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
     * Mendapatkan SEMUA riwayat kontrak berdasarkan ID user (versi lebih lengkap)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getAllKontrakHistory: async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID diperlukan'
        });
        }
        
        console.log(`Fetching all contract history for user ID: ${userId}`);
        
        // Panggil method getAllKontrakHistory dari model Umran
        const history = await Umran.getAllKontrakHistory(userId);
        
        res.status(200).json({
        success: true,
        message: 'All contract history retrieved successfully',
        data: history,
        count: history.length
        });
    } catch (error) {
        console.error('Error in getAllKontrakHistory controller:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to retrieve all contract history',
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
        const userExists = await Umran.getUserById(id);
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
            const result = await Umran.updateUserStatus(id, sebab_na);
            
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
        const userData = await Umran.getUserById(id);
        if (!userData) {
        console.log(`User dengan ID ${id} tidak ditemukan`);
        return res.status(404).json({
            success: false,
            message: 'User tidak ditemukan'
        });
        }

        console.log(`User ditemukan: ${userData.nama_lengkap_karyawan}, sebab_na: ${userData.sebab_na || 'tidak ada'}`);
    
        // Periksa apakah user memang memiliki status non-aktif
        if (!userData.sebab_na) {
        console.log(`User ${userData.nama_lengkap_karyawan} sudah aktif (sebab_na kosong)`);
        return res.status(400).json({
            success: false,
            message: 'User sudah dalam status aktif'
        });
        }
            
        // Lakukan pemulihan (hanya menghapus sebab_na)
        const restoredUser = await Umran.restoreUser(id);

        if (!restoredUser) {
        throw new Error('Gagal memulihkan user');
        }
        
        console.log(`Pemulihan berhasil untuk ${userData.nama_lengkap_karyawan}`);
        
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
        instructions: 'Untuk mengaktifkan kembali user, silakan perbarui tanggal kontrak'
        };
        
        // Jika client meminta JSON
        if (req.xhr || req.headers.accept?.includes('application/json')) {
        console.log('Mengirim respons JSON untuk pemulihan user');
        return res.json(responseData);
        }
        
        // Redirect ke halaman edit dengan data yang diperlukan
        console.log('Melakukan redirect ke halaman edit user');
        res.redirect(`/api/umran/edit-user/${id}?restored=true&message=Perbarui tanggal kontrak`);
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
            
            const result = await Umran.deleteUser(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json({
                    message: 'User berhasil dihapus',
                    data: result
                });
            }
            
            res.redirect('/api/umran/na');
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
            
            // PERBAIKAN: Validasi userId harus berupa integer yang valid
            if (!userId || isNaN(parseInt(userId, 10))) {
                return res.status(400).json({ 
                error: 'User ID tidak valid',
                userId: userId
                });
            }
            
            // Validasi tipe dokumen
            if (!validateDocType(docType)) {
                return res.status(400).json({ error: 'Tipe dokumen tidak valid' });
            }
            
            if (!req.file) {
                return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
            }

            // Konversi userId ke integer
            const userIdInt = parseInt(userId, 10);
            
            // PERBAIKAN: Periksa apakah user dengan ID ini ada
            const userExists = await Umran.getUserById(userIdInt);
            if (!userExists) {
            return res.status(404).json({ 
                error: 'User tidak ditemukan',
                userId: userIdInt
            });
            }
            
            // Log file path before upload
            console.log(`File path: ${req.file.path}`);
            
            // Upload dokumen menggunakan model
            const result = await Umran.uploadDocument(userId, docType, req.file);
            
            // Kembalikan respons
            res.json({
                message: `${docType.toUpperCase()} berhasil diunggah`,
                data: result
            });
        } catch (error) {
            console.error(`Error uploading ${req.params.docType}:`, error);
            
            // Hapus file yang baru diupload jika terjadi error
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            res.status(500).json({ error: error.message || 'Server error' });
        }
    },
    
    /**
     * Download dokumen (CV, Ijazah, Sertifikat)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    downloadDocument: async (req, res) => {
        try {
            const { userId, docType } = req.params;
            
            // Validasi tipe dokumen
            if (!validateDocType(docType)) {
                return res.status(400).json({ error: 'Tipe dokumen tidak valid' });
            }
            
            // Dapatkan info dokumen dari model
            const fileInfo = await Umran.getDocumentInfo(userId, docType);
            
            if (!fileInfo.filepath) {
                return res.status(404).json({ error: 'File tidak ditemukan' });
            }
            
            // Periksa apakah file ada
            if (!fs.existsSync(fileInfo.filepath)) {
                return res.status(404).json({ error: 'File tidak ditemukan di server' });
            }
            
            // Set header untuk download
            res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
            res.setHeader('Content-Type', fileInfo.mimetype);
            
            // Kirim file
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
            const employee = await Umran.getUserById(userId);
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
                path.join('D:/dashboardadmin/server/src/uploads/umran-files', path.basename(normalizedPath))
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
            expiredUsers = await Umran.checkExpiredKontrak();
        } catch (checkError) {
            console.error('Error saat mengecek kontrak kadaluarsa:', checkError);
            // Tetap lanjutkan meskipun check error
        }
        console.log(`Ditemukan ${expiredUsers.length} karyawan dengan kontrak berakhir`);
    
        const updateResults = [];
        
        // Update status for each expired user
        for (const user of expiredUsers) {
            try {
            const updatedUser = await Umran.updateUserStatus(user.id, 'EOC');
            console.log(`Berhasil mengupdate karyawan ID ${user.id} (${updatedUser.nama_lengkap_karyawan}) dengan sebab_na='EOC'`);
            updateResults.push({
                id: user.id,
                nama_lengkap_karyawan: updatedUser.nama_lengkap_karyawan,
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
            res.redirect('/api/umran/na');
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
     * Mendapatkan riwayat kontrak berdasarkan ID user
     */
    getKontrakHistory: async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID diperlukan'
        });
        }
        
        // Panggil method getKontrakHistory dari model Umran
        const history = await Umran.getKontrakHistory(userId);
        
        res.status(200).json({
        success: true,
        message: 'Riwayat kontrak berhasil diambil',
        data: history,
        count: history.length
        });
    } catch (error) {
        console.error('Error in getKontrakHistory controller:', error);
        res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat kontrak',
        error: error.message
        });
    }
    },
    
    /**
     * Mendapatkan detail pendapatan karyawan
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getSalaryData: async (req, res) => {
    try {
        const id = req.params.id;
        const salaryData = await Umran.getSalaryData(id);
        
        // Jika client meminta JSON
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json(salaryData);
        }
        
        res.render('salary_data', {
            title: 'Data Pendapatan',
            salary: salaryData
        });
    } catch (error) {
        console.error('Error pada getSalaryData:', error);
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                error: 'Database error',
                message: error.message
            });
        }
        
        res.status(500).send('Terjadi kesalahan dalam mengambil data pendapatan');
    }
    },

    /**
     * Mendapatkan detail data personal karyawan
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getPersonalData: async (req, res) => {
        try {
            const id = req.params.id;
            const personalData = await Umran.getPersonalData(id);
            
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
     * Hapus dokumen (CV, Ijazah, Sertifikat, dll)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    deleteDocument: async (req, res) => {
    try {
        const { userId, docType } = req.params;
        
        // Validasi tipe dokumen
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
        const fileInfo = await Umran.getDocumentInfo(userId, docType);
        
        // Jika tidak ada file info, anggap berhasil tapi beritahu client
        if (!fileInfo || !fileInfo.filepath) {
        return res.json({ 
            success: true,
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
        const result = await Umran.deleteDocument(userId, docType);
        
        res.json({ 
        success: true, 
        message: `File ${docType} berhasil dihapus` 
        });
    } catch (error) {
        console.error(`Error deleting document:`, error);
        res.status(500).json({ 
        success: false,
        error: error.message || 'Server error' 
        });
    }
    },

    /**
     * Membuat dan mengunduh template CSV untuk upload massal
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getCSVTemplate: async (req, res) => {
    try {
        // Definisi header CSV sesuai struktur tabel project_umran
        const headers = [
        "nama_lengkap_karyawan", "jabatan", "nik_tar", "no_kontrak", "status_pernikahan",
        "no_ktp", "no_kk", "tanggal_lahir", "no_bpjs_kesehatan", "status_bpjs",
        "no_bpjs_tk", "npwp", "pendidikan_terakhir_jurusan", "nama_instansi_pendidikan",
        "alamat_domisili", "alamat_ktp", "no_hp_wa_aktif", "email_pengiriman_form",
        "email_aktif", "nama_kontak_darurat", "kontak_darurat", "nama_ibu_kandung",
        "gapok", "ot", "thp", "t_transport", "t_lapangan", "rekening",
        "nama_pemilik_rekening", "kontrak_awal", "kontrak_akhir",  "asuransi_lainnya", "cv"
        ];
        
        // Buat contoh data (satu baris contoh)
        const exampleData = [
        "John Doe", "Staff", "T12345", "KTR/2023/001", "TK/0",
        "1234567890123456", "1234567890", "10/11/1990", "12345678", "Aktif",
        "87654321", "12.345.678.9-012.345", "Teknik Informatika", "Universitas Contoh",
        "Jl. Contoh No. 123", "Jl. KTP No. 456", "08123456789", "john.sending@example.com",
        "john.main@example.com", "Jane Doe", "08123456788", "Mary Doe",
        "5000000.00", "250000.00", "6550000.00", "400000.00", "0.00", "1234567890",
        "John Doe", "12/11/2023", "31/12/2025", "123456", "done"
        ];
        
        // Buat content CSV
        let csvContent = headers.join(",") + "\n";
        csvContent += exampleData.join(",") + "\n";
        
        // Set header respons untuk CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=template_data_karyawan_umran.csv');
        
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
        const validation = Umran.validateCSVData(parsedData);
        
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
        const processResult = await Umran.processBulkInsert(parsedData);
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
        }
    }
    },

    /**
     * Mendapatkan detail data administrasi karyawan
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getAdminData: async (req, res) => {
        try {
            const id = req.params.id;
            const adminData = await Umran.getAdminData(id);
            
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

    // Membuat tabel sertifikat jika belum ada
    createSertifikatTable: async (req, res) => {
        try {
            await Umran.createSertifikatTable();
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
            await Umran.createSertifikatTable();
            
            // Add the certificate
            const result = await Umran.addSertifikat(sertifikatData);
            
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
            await Umran.createSertifikatTable();
            
            // Get certificates
            const result = await Umran.getSertifikatByUserId(userId);
            
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
            const result = await Umran.getSertifikatById(id);
            
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
            const result = await Umran.updateSertifikat(id, sertifikatData);
            
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
            const result = await Umran.deleteSertifikat(id);
            
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