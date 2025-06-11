import { Regional2x } from "../../models/perusahaan/regional2x.model.js";
import fs from 'fs';
import path from "path";
import { Regional2xContractHistory } from "../../models/perusahaan/regional2x_contract_history.model.js";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import pool from "../../config/db.js";

/**
 * Validates that the document type is one of the allowed types
 */
const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 
    'bpjstk', 'no_rekening'
  ];
  return validTypes.includes(docType);
};

export const Regional2xController = {
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
            const dataKaryawan = await Regional2x.getAll();
            return res.json(dataKaryawan);
        }
        
        res.redirect('/api/regional2x/edit');
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
            const tableStructure = await Regional2x.checkTableStructure();
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
            const dataKaryawan = await Regional2x.getAll();
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            // Jika tidak meminta JSON, render tampilan normal
            res.render('Regional2xEditProjectPage', {
                title: 'Edit Project Regional2x',
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
            const dataKaryawan = await Regional2x.getAll();
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
            
            const dataKaryawan = await Regional2x.getViewData();
            console.log(`Retrieved ${dataKaryawan.length} karyawan records for view page`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('Regional2xViewProjectPage', {
                title: 'View Project Regional2x',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('Regional2xViewProjectPage rendered successfully');
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
            
            const dataKaryawan = await Regional2x.getNAUsers();
            console.log(`Retrieved ${dataKaryawan.length} non-active karyawan records`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('Regional2xNAProjectPage', {
                title: 'NA Project Regional2x',
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
            
            res.render('TambahUserRegional2x', {
                title: 'Tambah User Regional2x',
                karyawan: {},
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('TambahUserRegional2x form rendered successfully');
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
            
            const dataKaryawan = await Regional2x.getUserById(id);
            
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
            
            res.render('TambahUserRegional2x', {
                title: 'Edit User Regional2x',
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
            console.log('Request received to addUser with data:', JSON.stringify(userData, null, 2));
    
            // Validasi data dasar
            if (!userData.nama_lengkap || !userData.kontrak_awal || !userData.kontrak_akhir) {
                console.error('Missing required fields in user data');
                return res.status(400).json({
                    success: false,
                    message: 'Data karyawan tidak lengkap - nama, kontrak_awal, dan kontrak_akhir wajib diisi'
                });
            }
            
            // Pastikan format tanggal benar sebelum mengirim ke model
            const dateFields = [
                'kontrak_awal', 'kontrak_akhir'
            ];
            
            // Buat salinan data untuk diproses
            const sanitizedData = { ...userData };
            
            try {
                dateFields.forEach(field => {
                    if (sanitizedData[field] && typeof sanitizedData[field] === 'string') {
                        // Log nilai asli untuk debugging
                        console.log(`Original ${field}:`, sanitizedData[field]);
                        
                        let formattedDate = sanitizedData[field];
                        
                        // Format DD/MM/YYYY ke YYYY-MM-DD
                        if (formattedDate.includes('/')) {
                            const [day, month, year] = formattedDate.split('/');
                            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        }
                        // Jika format dengan timestamp, ambil hanya bagian tanggal
                        else if (formattedDate.includes('T')) {
                            formattedDate = formattedDate.split('T')[0];
                        }
                        
                        // Validasi format hasil konversi (YYYY-MM-DD)
                        if (!formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            console.error(`Format tanggal tidak valid setelah konversi: ${formattedDate}`);
                            throw new Error(`Format tanggal tidak valid untuk ${field}: ${sanitizedData[field]}`);
                        }
                        
                        // Tetapkan tanggal yang sudah diformat
                        sanitizedData[field] = formattedDate;
                        console.log(`Formatted ${field}:`, formattedDate);
                    }
                });
            } catch (dateError) {
                console.error('Error saat memproses format tanggal:', dateError);
                return res.status(400).json({
                    success: false,
                    message: `Error validasi format tanggal: ${dateError.message}`
                });
            }
            
            // Pastikan field numerik benar-benar numerik
            const numericFields = ['gaji_net'];
            
            numericFields.forEach(field => {
                if (sanitizedData[field] === '' || sanitizedData[field] === undefined) {
                    sanitizedData[field] = null;
                } else if (sanitizedData[field] !== null) {
                    // Konversi ke number jika string
                    if (typeof sanitizedData[field] === 'string') {
                        sanitizedData[field] = Number(sanitizedData[field].replace(',', '.'));
                    }
                }
            });
            
            // PENTING: Hapus field-field yang mungkin tidak ada di database
            const invalidFields = ['tahun_masuk', 'tanggal_lahir', 'tahun_keluar', 'usia'];
            invalidFields.forEach(field => {
                if (field in sanitizedData) {
                    console.log(`Removing invalid field from submitted data: ${field}`);
                    delete sanitizedData[field];
                }
            });
            
            // Cek tanggal akhir kontrak
            if (sanitizedData.kontrak_akhir) {
                const endDate = new Date(sanitizedData.kontrak_akhir);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Jika tanggal akhir kontrak sudah lewat, otomatis isi sebab_na dengan 'EOC'
                if (endDate < today && !sanitizedData.sebab_na) {
                    sanitizedData.sebab_na = 'EOC';
                    console.log('Kontrak sudah berakhir, otomatis mengisi sebab_na dengan EOC');
                }
            }
            
            // Kirim ke model untuk disimpan
            try {
                console.log('Menyimpan data ke database:', JSON.stringify(sanitizedData, null, 2));
                const result = await Regional2x.addUser(sanitizedData);
                
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
                    res.redirect('/api/regional2x/na');
                } else {
                    res.redirect('/api/regional2x/edit');
                }
            } catch (dbError) {
                console.error('Error saat menyimpan ke database:', dbError);
                
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(500).json({
                        success: false,
                        message: `Gagal menyimpan data: ${dbError.message}`,
                        error: dbError.message
                    });
                }
                
                res.status(500).send('Terjadi Kesalahan dalam menambahkan user');
            }
        } catch (error) {
            console.error('Error pada addUser:', error);
            
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    success: false,
                    error: 'Server error',
                    message: error.message
                });
            }
            
            res.status(500).send('Terjadi Kesalahan dalam menambahkan user');
        }
    },

    getUserById: async (req, res) => {
        try {
            const id = req.params.id;
            const dataKaryawan = await Regional2x.getUserById(id);

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
            
            // Log data yang diterima dari client
            console.log(`Menerima request updateUser untuk ID ${userId}:`, JSON.stringify(userData, null, 2));
        
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
                'pkwt_filename', 'pkwt_filepath', 'pkwt_mimetype', 'pkwt_filesize'
            ];
            
            fileFields.forEach(field => {
                // Jika field ada dalam request dan nilainya null, proses sebagai null
                if (field in userData && userData[field] === null) {
                console.log(`Setting ${field} to null explicitly`);
                userData[field] = null;
                }
            });
        
            // Dapatkan data user lama untuk perbandingan
            const oldUserData = await Regional2x.getUserById(userId);
            if (!oldUserData) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User tidak ditemukan' 
                });
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
        
            // Buat salinan data untuk diproses
            const sanitizedData = { ...userData };
            
            // Format tanggal dengan benar (YYYY-MM-DD)
            const dateFields = ['kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 
            'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
            
            try {
                dateFields.forEach(field => {
                    if (sanitizedData[field] && typeof sanitizedData[field] === 'string') {
                        // Log nilai asli untuk debugging
                        console.log(`Nilai awal ${field}:`, sanitizedData[field]);
                        
                        let formattedDate = sanitizedData[field];
                        
                        // Konversi dari format DD/MM/YYYY ke YYYY-MM-DD
                        if (formattedDate.includes('/')) {
                            const [day, month, year] = formattedDate.split('/');
                            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        }
                        // Jika format dengan timestamp, ambil hanya bagian tanggalnya
                        else if (formattedDate.includes('T')) {
                            formattedDate = formattedDate.split('T')[0];
                        }
                        
                        // Validasi format tanggal hasil konversi (YYYY-MM-DD)
                        if (!formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            console.error(`Format tanggal tidak valid setelah konversi: ${formattedDate}`);
                            throw new Error(`Format tanggal tidak valid untuk ${field}: ${sanitizedData[field]}`);
                        }
                        
                        // Tetapkan tanggal yang sudah diformat
                        sanitizedData[field] = formattedDate;
                        console.log(`${field} setelah diformat:`, formattedDate);
                    }
                });
            } catch (dateError) {
                console.error('Error saat memproses format tanggal:', dateError);
                return res.status(400).json({
                    success: false,
                    message: `Error validasi format tanggal: ${dateError.message}`
                });
            }
            
            // PENTING: Hapus field-field yang mungkin tidak ada di database
            const invalidFields = ['tahun_masuk', 'tanggal_lahir', 'tahun_keluar', 'usia'];
            invalidFields.forEach(field => {
                if (field in sanitizedData) {
                    console.log(`Removing invalid field from update data: ${field}`);
                    delete sanitizedData[field];
                }
            });
        
            // Gunakan try/catch terpisah untuk operasi update database
            try {
                // Gunakan updateUserWithHistory untuk mencatat perubahan kontrak
                const result = await Regional2x.updateUserWithHistory(userId, sanitizedData, modifiedBy);
        
                // Jika mengembalikan dari NA, tambahkan pesan khusus
                let message = 'Data user berhasil diperbarui';
                if (isRestoring && contractChanged) {
                    message = 'User berhasil dipulihkan dan dikembalikan ke status aktif';
                }
                
                return res.status(200).json({
                    success: true,
                    message: message,
                    data: result
                });
            } catch (dbError) {
                console.error('Error saat update database:', dbError);
                return res.status(500).json({
                    success: false,
                    message: `Gagal memperbarui data user: ${dbError.message}`,
                    error: dbError.message
                });
            }
        } catch (error) {
            console.error('Error umum di updateUser controller:', error);
            return res.status(500).json({
                success: false,
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
            const userExists = await Regional2x.getUserById(id);
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
                const result = await Regional2x.updateUserStatus(id, sebab_na);
                
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
            const userData = await Regional2x.getUserById(id);
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
            const restoredUser = await Regional2x.restoreUser(id);

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
            res.redirect(`/api/regional2x/edit-user/${id}?restored=true&message=Perbarui tanggal kontrak dan nomor kontrak`);
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
            
            const result = await Regional2x.deleteUser(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json({
                    message: 'User berhasil dihapus',
                    data: result
                });
            }
            
            res.redirect('/api/regional2x/na');
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
     * Upload dokumen (CV, Ijazah, Sertifikat)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    // Then make sure your uploadDocument method uses validateDocType
    uploadDocument: async (req, res) => {
        console.log('=== UPLOAD CONTROLLER START ===');
        
        try {
            const { userId, docType } = req.params;

            console.log(`[DEBUG] Upload request details:`, {
            userId,
            docType,
            hasFile: !!req.file,
            fileInfo: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                fieldname: req.file.fieldname,
                path: req.file.path,
                filename: req.file.filename
            } : null
            });
            
            // Validate userId (should already be validated in route)
            const userIdInt = parseInt(userId, 10);
            if (!userIdInt || isNaN(userIdInt)) {
            console.error(`[ERROR] Invalid user ID: ${userId}`);
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID'
            });
            }
            
            // Validate docType (should already be validated in route)
            const validDocTypes = [
            'cv', 'ijazah', 'sertifikat', 'pkwt',
            'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 
            'bpjstk', 'no_rekening'
            ];
            
            if (!validDocTypes.includes(docType)) {
            console.error(`[ERROR] Invalid document type: ${docType}`);
            return res.status(400).json({ 
                success: false,
                error: 'Invalid document type'
            });
            }
            
            // Check if file exists (should already be validated in route)
            if (!req.file) {
            console.error(`[ERROR] No file received`);
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded'
            });
            }
            
            // Additional file validation
            if (!req.file.path || !fs.existsSync(req.file.path)) {
            console.error(`[ERROR] File path does not exist: ${req.file.path}`);
            return res.status(500).json({ 
                success: false,
                error: 'File upload failed - file not saved properly'
            });
            }

            console.log(`[DEBUG] Starting upload process for ${docType} file for user ${userIdInt}`);
            console.log(`[DEBUG] File details:`, {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
            });
            
            // Check if user exists
            console.log(`[DEBUG] Checking if user ${userIdInt} exists`);
            const checkUserSql = `SELECT id FROM project_pertamina_ep_regional2_eksplorasi WHERE id = $1`;
            const checkUserResult = await pool.query(checkUserSql, [userIdInt]);
            
            if (checkUserResult.rows.length === 0) {
            console.error(`[ERROR] User with ID ${userIdInt} not found`);
            
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log(`[DEBUG] Cleaned up uploaded file: ${req.file.path}`);
            }
            
            return res.status(404).json({ 
                success: false,
                error: 'User not found'
            });
            }
            
            // Upload document using model
            try {
            const result = await Regional2x.uploadDocument(userIdInt, docType, req.file);
            console.log(`[DEBUG] Upload successful for ${docType}`);
            
            return res.json({
                success: true,
                message: `${docType.toUpperCase()} file uploaded successfully`,
                data: {
                filename: result[`${docType}_filename`],
                filesize: result[`${docType}_filesize`],
                mimetype: result[`${docType}_mimetype`]
                }
            });
            } catch (modelError) {
            console.error(`[ERROR] Model error during upload:`, modelError);
            
            // Clean up uploaded file on model error
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                fs.unlinkSync(req.file.path);
                console.log(`[DEBUG] Cleaned up uploaded file after model error: ${req.file.path}`);
                } catch (cleanupError) {
                console.error(`[ERROR] Failed to cleanup file: ${cleanupError.message}`);
                }
            }
            
            return res.status(500).json({ 
                success: false,
                error: 'Database error during file upload', 
                details: modelError.message
            });
            }
        } catch (error) {
            console.error(`[ERROR] General error in upload controller:`, error);
            
            // Clean up uploaded file on general error
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`[DEBUG] Cleaned up uploaded file after general error: ${req.file.path}`);
            } catch (cleanupError) {
                console.error(`[ERROR] Failed to cleanup file: ${cleanupError.message}`);
            }
            }
            
            return res.status(500).json({ 
            success: false,
            error: 'Server error during file upload',
            message: error.message || 'Unknown server error' 
            });
        } finally {
            console.log('=== UPLOAD CONTROLLER END ===');
        }
    },

    getDocumentFile: async (req, res) => {
        try {
            const { userId, docType } = req.params;
            
            console.log(`Getting file for user ID ${userId}, document type ${docType}`);
            
            // Validate document type
            const validDocTypes = [
            'cv', 'ijazah', 'sertifikat', 'pkwt',
            'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 
            'bpjstk', 'no_rekening'
            ];
            
            if (!validDocTypes.includes(docType)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid document type' 
            });
            }
            
            // Get employee data
            const employee = await Regional2x.getUserById(userId);
            if (!employee) {
            console.log(`Employee with ID ${userId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
            }
            
            // Check if file exists in database
            const filePath = employee[`${docType}_filepath`];
            if (!filePath) {
            console.log(`File path for ${docType} not found in database`);
            return res.status(404).json({
                success: false,
                message: 'File not found in database'
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
            path.join('D:/dashboardadmin/server/src/uploads/', path.basename(normalizedPath))
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
                message: 'File not found on server'
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
                message: 'Failed to read file'
                });
            }
            });
            
            fileStream.pipe(res);
        } catch (error) {
            console.error(`Error getting file: ${error.message}`, error);
            res.status(500).json({
            success: false,
            message: 'Failed to access file',
            error: error.message
            });
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
            
            // Validate document type
            if (!validateDocType(docType)) {
            return res.status(400).json({ error: 'Tipe dokumen tidak valid' });
            }
            
            // Get document info from model
            const fileInfo = await Regional2x.getDocumentInfo(userId, docType);
            
            if (!fileInfo.filepath) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
            }
            
            // Check if file exists
            if (!fs.existsSync(fileInfo.filepath)) {
            return res.status(404).json({ error: 'File tidak ditemukan di server' });
            }
            
            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
            res.setHeader('Content-Type', fileInfo.mimetype);
            
            // Send file
            const fileStream = fs.createReadStream(fileInfo.filepath);
            fileStream.pipe(res);
        } catch (error) {
            console.error(`Error downloading document:`, error);
            res.status(500).json({ error: error.message || 'Server error' });
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
                expiredUsers = await Regional2x.checkExpiredKontrak();
            } catch (checkError) {
                console.error('Error saat mengecek kontrak kadaluarsa:', checkError);
                // Tetap lanjutkan meskipun check error
            }
        
            console.log(`Ditemukan ${expiredUsers.length} karyawan dengan kontrak berakhir`);
        
            const updateResults = [];
        
            // Update status for each expired user
            for (const user of expiredUsers) {
                try {
                    const updatedUser = await Regional2x.updateUserStatus(user.id, 'EOC');
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
                res.redirect('/api/regional2x/na');
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
        
            // Validasi data
            // ...
        
            // Update data pengguna
            const updatedUser = await Regional2x.updateUser(id, userData);
            
            // Cek apakah contract history perlu diperbarui
            const oldUser = await Regional2x.getUserById(id);
            const contractChanged = 
                oldUser.no_kontrak !== userData.no_kontrak ||
                oldUser.kontrak_awal !== userData.kontrak_awal ||
                oldUser.kontrak_akhir !== userData.kontrak_akhir;
            
            // Jika kontrak berubah, coba simpan ke history
            if (contractChanged) {
                try {
                    // Periksa apakah model Regional2xContractHistory ada
                    if (typeof Regional2xContractHistory !== 'undefined') {
                        await Regional2xContractHistory.addHistory({
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
                        console.warn('Regional2xContractHistory not defined, skipping history recording');
                        // Gunakan alternatif Regional2x.saveKontrakHistory jika ada
                        if (typeof Regional2x.saveKontrakHistory === 'function') {
                            await Regional2x.saveKontrakHistory(id, oldUser, userData);
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
            
            const history = await Regional2xContractHistory.getAllHistoryByUserId(userId);
            
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
                error: error.message
            });
        }
    },

    /**
     * Mendapatkan statistik perubahan kontrak
     */
    getContractChangeStats: async (req, res) => {
        try {
            const stats = await Regional2xContractHistory.getContractChangeStats();
            
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
            
            // Panggil method getKontrakHistory dari model Regional2x
            const history = await Regional2x.getKontrakHistory(userId);
            
            res.status(200).json({
                message: 'Riwayat kontrak berhasil diambil',
                data: history
            });
        } catch (error) {
            console.error('Error in getKontrakHistory controller:', error);
            res.status(500).json({
                message: 'Gagal mengambil riwayat kontrak',
                error: error.message
            });
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
            const personalData = await Regional2x.getPersonalData(id);
            
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
     * Hapus dokumen (CV, Ijazah, Sertifikat)
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

            // Validate input
            if (!userId || !docType) {
            return res.status(400).json({ 
                success: false,
                error: 'User ID dan tipe dokumen wajib diisi' 
            });
            }
            
            // Get document info from model
            const fileInfo = await Regional2x.getDocumentInfo(userId, docType);
            
            // If no file info, consider success but notify client
            if (!fileInfo || !fileInfo.filepath) {
            return res.json({ 
                success: true,
                message: `Tidak ada file ${docType} yang perlu dihapus`,
                warning: true 
            });
            }
            
            // Delete physical file if exists
            if (fileInfo.filepath && fs.existsSync(fileInfo.filepath)) {
            try {
                fs.unlinkSync(fileInfo.filepath);
                console.log(`File ${docType} berhasil dihapus: ${fileInfo.filepath}`);
            } catch (fsError) {
                console.error(`Gagal menghapus file fisik: ${fsError.message}`);
                // Continue process even if deleting file fails
            }
            } else {
            console.log(`File fisik tidak ditemukan: ${fileInfo.filepath}`);
            }
            
            // Delete file reference from database
            const result = await Regional2x.deleteDocument(userId, docType);
            
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
            // Definisi header CSV (kolom yang pasti ada di tabel)
            const headers = [
                "nama_lengkap", "jabatan", "nik_vendor", "no_kontrak", "paket_tender",
                "gaji_net", "tempat_tanggal_lahir", "jenis_kelamin", "status_pernikahan", 
                "no_telpon", "nama_ibu_kandung", "kontak_darurat", "email", "alamat_ktp", 
                "alamat_domisili", "nama_institute_pendidikan", "jurusan", "no_kk", "no_ktp", 
                "no_npwp", "nama_bank", "no_rekening", "nama_rekening", "bpjs_kesehatan", 
                "bpjs_kesehatan_keterangan", "bpjs_kesehatan_suami_istri", "bpjs_anak1", 
                "bpjs_anak2", "bpjs_anak3", "bpjstk", "kontrak_awal", "kontrak_akhir", 
                "sebab_na", "asuransi_lainnya", "cv"
            ];
            
            // Buat contoh data (satu baris contoh)
            const exampleData = [
                "John Doe", "Staff IT", "V12345", "KTR/2023/001", "Paket A",
                "5000000", "Jakarta 10/11/1990", "Laki-laki", "TK/0", 
                "08123456789", "Jane Doe", "08123456788", "john.doe@example.com", 
                "Jl. Contoh No. 123", "Jl. Contoh No. 123", "Universitas Contoh", 
                "Teknik Informatika", "1234567890", "1234567890123456", "12.345.678.9-012.345", 
                "Bank ABC", "1234567890", "John Doe", "1234567890", "Aktif", "1234567891", 
                "1234567892", "1234567893", "1234567894", "9876543210", "01/01/2023", 
                "31/12/2025", "", "123456", "done"
            ];
            
            // Buat content CSV
            let csvContent = headers.join(",") + "\n";
            csvContent += exampleData.join(",") + "\n";
            
            // Set header respons untuk CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=template_data_karyawan_regional2x.csv');
            
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
        const validation = Regional2x.validateCSVData(parsedData);
        
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
        
        // Proses bulk insert dengan data yang sudah dibersihkan
        console.log("Memulai proses bulk insert untuk", parsedData.length, "data");
        
        // Gunakan fungsi yang sudah ada di model Regional2x
        const processResult = await Regional2x.processBulkInsert(parsedData);
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
            const adminData = await Regional2x.getAdminData(id);
            
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
            const certificationData = await Regional2x.getCertificationData(id);
            
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

    //HSE

    getHSEData: async (req, res) => {
    try {
        console.log('Memulai getHSEData...');
        
        const dataHSE = await Regional2x.getHSEData();
        
        // Tambahkan log untuk debugging
        if (dataHSE.length > 0) {
        console.log('Sampel data HSE pertama:', JSON.stringify({
            id: dataHSE[0].id,
            nama: dataHSE[0].nama_lengkap,
            sebab_na: dataHSE[0].sebab_na // Periksa apakah sebab_na ada di data
        }));
        }
        
        console.log(`Mengambil ${dataHSE.length} data HSE karyawan`);
        
        // Kirim response dengan data lengkap
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
        const oldUserData = await Regional2x.getUserById(id);
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
        const isHSEChanged = Regional2xHSEHistory.isHSEDataChanged(oldUserData, hseUpdateData);
        
        // Mulai transaksi database
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Update data user di database
            const updatedUser = await Regional2x.updateUser(id, hseUpdateData);
            
            if (!updatedUser) {
            throw new Error('Gagal memperbarui data HSE');
            }
            
            // Jika data HSE berubah secara signifikan, catat dalam riwayat
            if (isHSEChanged) {
            try {
                // Siapkan data riwayat
                const historyData = Regional2xHSEHistory.prepareHistoryData(oldUserData, hseUpdateData, modifiedBy);
                
                // Tambahkan catatan ke riwayat
                await Regional2xHSEHistory.addHistory(historyData);
                
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
        const userExists = await Regional2X.getUserById(userId);
        if (!userExists) {
            return res.status(404).json({
            success: false,
            message: 'Karyawan tidak ditemukan'
            });
        }
        
        // Dapatkan catatan riwayat
        const history = await Regional2XHSEHistory.getAllHistoryByUserId(userId);
        
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
        const stats = await Regional2xHSEHistory.getHSEChangeStats();
        
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

    // Function to check if document columns exist
    checkDocumentColumns: async () => {
        try {
            const sql = `
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'project_pertamina_ep_regional2_eksplorasi' 
            AND column_name IN (
                'cv_filename', 'cv_filepath', 'cv_mimetype', 'cv_filesize',
                'ijazah_filename', 'ijazah_filepath', 'ijazah_mimetype', 'ijazah_filesize',
                'sertifikat_filename', 'sertifikat_filepath', 'sertifikat_mimetype', 'sertifikat_filesize',
                'pkwt_filename', 'pkwt_filepath', 'pkwt_mimetype', 'pkwt_filesize',
                'no_ktp_filename', 'no_ktp_filepath', 'no_ktp_mimetype', 'no_ktp_filesize',
                'no_kk_filename', 'no_kk_filepath', 'no_kk_mimetype', 'no_kk_filesize',
                'no_npwp_filename', 'no_npwp_filepath', 'no_npwp_mimetype', 'no_npwp_filesize',
                'bpjs_kesehatan_filename', 'bpjs_kesehatan_filepath', 'bpjs_kesehatan_mimetype', 'bpjs_kesehatan_filesize',
                'bpjstk_filename', 'bpjstk_filepath', 'bpjstk_mimetype', 'bpjstk_filesize',
                'no_rekening_filename', 'no_rekening_filepath', 'no_rekening_mimetype', 'no_rekening_filesize'
            )
            `;
            
            const result = await pool.query(sql);
            
            // If all the needed columns exist (24 columns = 6 document types * 4 fields per document)
            return result.rows.length === 24;
        } catch (error) {
            console.error("Error checking document columns:", error);
            return false;
        }
    },

    // Function to add document columns if they don't exist
    addDocumentColumns: async () => {
        try {
            const hasColumns = await Regional2x.checkDocumentColumns();
            
            if (hasColumns) {
            console.log("Document columns already exist");
            return true;
            }

            const sql = `
            ALTER TABLE project_pertamina_ep_regional2_eksplorasi
            ADD COLUMN IF NOT EXISTS cv_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS cv_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS cv_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS cv_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS ijazah_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS ijazah_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS ijazah_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS ijazah_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS sertifikat_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS sertifikat_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS sertifikat_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS sertifikat_filesize INTEGER,

            ADD COLUMN IF NOT EXISTS pkwt_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS pkwt_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS pkwt_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS pkwt_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS no_ktp_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_ktp_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_ktp_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS no_ktp_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS no_kk_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_kk_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_kk_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS no_kk_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS no_npwp_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_npwp_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_npwp_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS no_npwp_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS bpjstk_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjstk_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjstk_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bpjstk_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS no_rekening_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_rekening_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_rekening_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS no_rekening_filesize INTEGER
            `;
            
            await pool.query(sql);
            console.log("Document columns added successfully");
            return true;
        } catch (error) {
            console.error("Error adding document columns:", error);
            return false;
        }
    },

    // In regional2x.controller.js

    getDocumentFile: async (req, res) => {
        try {
            const { userId, docType } = req.params;
            
            console.log(`Getting file for user ID ${userId}, document type ${docType}`);
            
            // Validate document type
            if (!validateDocType(docType)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid document type' 
            });
            }
            
            // Get employee data
            const employee = await Regional2x.getUserById(userId);
            if (!employee) {
            console.log(`Employee with ID ${userId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
            }
            
            // Check if file exists in database
            const filePath = employee[`${docType}_filepath`];
            if (!filePath) {
            console.log(`File path for ${docType} not found in database`);
            return res.status(404).json({
                success: false,
                message: 'File not found in database'
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
            path.join('D:/dashboardadmin/server/src/uploads/', path.basename(normalizedPath))
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
                message: 'File not found on server'
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
                message: 'Failed to read file'
                });
            }
            });
            
            fileStream.pipe(res);
        } catch (error) {
            console.error(`Error getting file: ${error.message}`, error);
            res.status(500).json({
            success: false,
            message: 'Failed to access file',
            error: error.message
            });
        }
    },

    createSertifikatTable: async (req, res) => {
        try {
            await Regional2x.createSertifikatTable();
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

    // Add new certificate
    addSertifikat: async (req, res) => {
    try {
        const sertifikatData = req.body;
        
        // Validasi data
        if (!sertifikatData.user_id || !sertifikatData.judul_sertifikat) {
        return res.status(400).json({
            success: false,
            message: 'Data sertifikat tidak lengkap'
        });
        }
        
        // Pastikan tabel sertifikat ada
        await Regional2x.createSertifikatTable();
        
        // Tambahkan sertifikat
        const result = await Regional2x.addSertifikat(sertifikatData);
        
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
        
        // Pastikan tabel sertifikat ada
        await Regional2x.createSertifikatTable();
        
        // Dapatkan sertifikat
        const result = await Regional2x.getSertifikatByUserId(userId);
        
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
        
        // Dapatkan sertifikat
        const result = await Regional2x.getSertifikatById(id);
        
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
        
        // Update sertifikat
        const result = await Regional2x.updateSertifikat(id, sertifikatData);
        
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
        
        // Hapus sertifikat
        const result = await Regional2x.deleteSertifikat(id);
        
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

}