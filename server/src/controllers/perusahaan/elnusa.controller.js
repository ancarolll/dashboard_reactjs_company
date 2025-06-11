import { Elnusa } from '../../models/perusahaan/elnusa.model.js';
import fs from 'fs';
import path from 'path'
import { ElnusaContractHistory } from '../../models/perusahaan/elnusa_contract_history.model.js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Fungsi validasi tipe dokumen
const validateDocType = (docType) => {
  const validTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'no_rekening'
  ];
  return validTypes.includes(docType);
};

export const ElnusaController = {
  
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
              const dataKaryawan = await Elnusa.getAll();
              return res.json(dataKaryawan);
          }
          
          res.redirect('/api/elnusa/edit');
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
            const tableStructure = await Elnusa.checkTableStructure();
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
            const dataKaryawan = await Elnusa.getAll();
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            // Jika tidak meminta JSON, render tampilan normal
            res.render('ElnusaEditProjectPage', {
                title: 'Edit Project Elnusa',
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
            const dataKaryawan = await Elnusa.getAll();
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
            
            const dataKaryawan = await Elnusa.getViewData();
            console.log(`Retrieved ${dataKaryawan.length} karyawan records for view page`);
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('ElnusaViewProjectPage', {
                title: 'View Project Elnusa',
                karyawan: dataKaryawan,
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('ElnusaViewProjectPage rendered successfully');
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
            
            const dataKaryawan = await Elnusa.getNAUsers();
            console.log(`Retrieved ${dataKaryawan.length} non-active karyawan records`);
            
            // Format waktu_sa untuk WIB jika ada
            dataKaryawan.forEach(karyawan => {
                if (karyawan.waktu_sa) {
                    // Sudah ditangani oleh PostgreSQL dengan timezone Asia/Jakarta
                    console.log(`Karyawan ${karyawan.nama_karyawan} memiliki waktu_sa: ${karyawan.waktu_sa}`);
                }
            });
            
            // Jika meminta format JSON
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }

            res.render('ElnusaNAProjectPage', {
                title: 'NA Project Elnusa',
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
            
            res.render('TambahUserElnusa', {
                title: 'Tambah User Elnusa',
                karyawan: {},
                debugMode: process.env.NODE_ENV !== 'production'
            });
            
            console.log('TambahUserElnusa form rendered successfully');
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
            
            const dataKaryawan = await Elnusa.getUserById(id);
            
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
            
            console.log(`User data retrieved: ${dataKaryawan.nama_karyawan}`);
            
            if (req.query.format === 'json') {
                return res.json(dataKaryawan);
            }
            
            res.render('TambahUserElnusa', {
                title: 'Edit User Elnusa',
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

            // Validasi data dasar
    if (!userData.nama_karyawan || !userData.kontrak_awal || !userData.kontrak_akhir) {
        return res.status(400).json({
          success: false,
          message: 'Data karyawan tidak lengkap - nama, kontrak_awal, dan kontrak_akhir wajib diisi'
        });
      }
      
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
        'tahun_masuk', 'tahun_keluar', 'usia', 
        'gaji_pokok', 'gaji_terupdate', 't_variabel', 't_makan', 't_transport', 
        't_pulsa', 't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis', 
        't_posisi', 't_offshore', 't_lapangan_perhari', 't_onshore', 
        't_onshore_eksp', 't_warehouse_office', 't_proyek', 't_karantina', 
        'tunjangan_lembur', 't_supervisor'
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
      const result = await Elnusa.addUser(userData);
      
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
        res.redirect('/api/elnusa/na');
      } else {
        res.redirect('/api/elnusa/edit');
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
          const dataKaryawan = await Elnusa.getUserById(id);

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
            return res.status(400).json({ message: 'ID User diperlukan' });
          }

          // Dapatkan data user lama untuk perbandingan
          const oldUserData = await Elnusa.getUserById(userId);
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
          });

          // Jika mengembalikan dari NA, verifikasi tanggal kontrak akhir masih valid
          if (isRestoring) {
            const kontrakAkhir = new Date(userData.kontrak_akhir);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (kontrakAkhir <= today) {
              return res.status(400).json({
                success: false,
                message: 'Tanggal akhir kontrak harus setelah hari ini untuk mengaktifkan kembali karyawan'
              });
            }
          }

          // Gunakan updateUserWithHistory untuk mencatat perubahan kontrak
          const result = await Elnusa.updateUserWithHistory(userId, userData, modifiedBy);

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
        const userExists = await Elnusa.getUserById(id);
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
          const result = await Elnusa.updateUserStatus(id, sebab_na);
          
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
        const userData = await Elnusa.getUserById(id);
        if (!userData) {
          console.log(`User dengan ID ${id} tidak ditemukan`);
          return res.status(404).json({
            success: false,
            message: 'User tidak ditemukan'
          });
        }
    
        console.log(`User ditemukan: ${userData.nama_karyawan}, sebab_na: ${userData.sebab_na || 'tidak ada'}`);
    
        // Periksa apakah user memang memiliki status non-aktif
        if (!userData.sebab_na) {
          console.log(`User ${userData.nama_karyawan} sudah aktif (sebab_na kosong)`);
          return res.status(400).json({
            success: false,
            message: 'User sudah dalam status aktif'
          });
        }
            
        // PENTING: Simpan data asli sebelum pemulihan
        const originalUserData = {...userData};
        
        // Lakukan pemulihan (hanya menghapus sebab_na)
        const restoredUser = await Elnusa.restoreUser(id);
    
        if (!restoredUser) {
          throw new Error('Gagal memulihkan user');
        }
        
        console.log(`Pemulihan berhasil untuk ${userData.nama_karyawan}`);
        
        // Kembalikan data lengkap asli, tapi dengan sebab_na = null
        // Ini memastikan semua data seperti tanggal_lahir tetap terisi
        const responseData = {
          success: true,
          message: 'User successfully restored (sebab_na field has been cleared)',
          data: {
            ...originalUserData,
            sebab_na: null
          },
          fieldsToUpdate: ['no_kontrak', 'kontrak_akhir'], // Spesifik field yang perlu diupdate
          instructions: 'To reactivate an employee, you must update the contract number and contract end date'
        };
        
        // Jika client meminta JSON
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          console.log('Mengirim respons JSON untuk pemulihan user');
          return res.json(responseData);
        }
        
        // Redirect ke halaman edit dengan data yang diperlukan
        console.log('Melakukan redirect ke halaman edit user');
        res.redirect(`/api/elnusa/edit-user/${id}?restored=true&message=Please update the contract date and contract number`);
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
            
            const result = await Elnusa.deleteUser(id);
            
            // Jika client meminta JSON
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.json({
                    message: 'User berhasil dihapus',
                    data: result
                });
            }
            
            res.redirect('/api/elnusa/na');
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
     * Upload document (CV, Ijazah, Sertifikat, PKWT, KTP, KK, NPWP, BPJS, Account)
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    uploadDocument: async (req, res) => {
      try {
        const { userId, docType } = req.params;

        console.log(`[DEBUG] Menerima permintaan upload file ${docType} untuk user ${userId}`);
        console.log(`[DEBUG] Info file:`, req.file ? {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path
        } : 'Tidak ada file');
        
        // Validate userId as integer
        if (!userId || isNaN(parseInt(userId, 10))) {
          console.log(`[ERROR] User ID tidak valid: ${userId}`);
          return res.status(400).json({ 
            error: 'User ID tidak valid',
            userId: userId
          });
        }
        
        // Validasi tipe dokumen
        if (!validateDocType(docType)) {
          console.log(`[ERROR] Tipe dokumen tidak valid: ${docType}`);
          return res.status(400).json({ error: 'Tipe dokumen tidak valid' });
        }
        
        if (!req.file) {
          console.log(`[ERROR] Tidak ada file yang diunggah`);
          return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
        }

        // Convert userId to integer
        const userIdInt = parseInt(userId, 10);
        
        // Check if user exists
        const userExists = await Elnusa.getUserById(userIdInt);
        if (!userExists) {
          console.log(`[ERROR] User dengan ID ${userIdInt} tidak ditemukan`);
          return res.status(404).json({ 
            error: 'User tidak ditemukan',
            userId: userIdInt
          });
        }
        
        console.log(`[DEBUG] Memulai upload dokumen ke database untuk ${docType}`);
        
        // Tangani error dari model dengan lebih baik
        try {
          const result = await Elnusa.uploadDocument(userId, docType, req.file);
          console.log(`[DEBUG] Upload berhasil untuk ${docType}`);
          
          return res.json({
            message: `${docType.toUpperCase()} berhasil diunggah`,
            data: result
          });
        } catch (modelError) {
          console.error(`[ERROR] Error model saat upload ${docType}:`, modelError);
          
          // Hapus file yang baru diupload jika terjadi error
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log(`[DEBUG] File sementara dihapus: ${req.file.path}`);
          }
          
          return res.status(500).json({ 
            error: 'Database error saat upload file', 
            details: modelError.message
          });
        }
      } catch (error) {
        console.error(`[ERROR] Error umum saat upload ${req.params.docType}:`, error);
        
        // Hapus file yang baru diupload jika terjadi error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
            console.log(`[DEBUG] File sementara dihapus: ${req.file.path}`);
          } catch (deleteError) {
            console.error('[ERROR] Error menghapus file sementara:', deleteError);
          }
        }
        
        return res.status(500).json({ 
          error: 'Server error saat upload file',
          message: error.message || 'Unknown server error' 
        });
      }
    },
    
    /**
     * Download document (CV, Ijazah, Sertifikat, PKWT, KTP, KK, NPWP, BPJS, Account)
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
        const fileInfo = await Elnusa.getDocumentInfo(userId, docType);
        
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
            expiredUsers = await Elnusa.checkExpiredKontrak();
          } catch (checkError) {
            console.error('Error saat mengecek kontrak kadaluarsa:', checkError);
            // Tetap lanjutkan meskipun check error
          }
      
          console.log(`Ditemukan ${expiredUsers.length} karyawan dengan kontrak berakhir`);
      
          const updateResults = [];
        
        // Update status for each expired user
        for (const user of expiredUsers) {
          try {
            const updatedUser = await Elnusa.updateUserStatus(user.id, 'EOC');
            console.log(`Berhasil mengupdate karyawan ID ${user.id} (${updatedUser.nama_karyawan}) dengan sebab_na='EOC'`);
            updateResults.push({
              id: user.id,
              nama_karyawan: updatedUser.nama_karyawan,
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
          res.redirect('/api/elnusa/na');
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
    updateUser: async (req, res) => {
      try {
        const userId = req.params.id;
        let userData = req.body;
        const modifiedBy = req.user?.username || 'system';

        if (!userId) {
          return res.status(400).json({ message: 'ID User diperlukan' });
        }

        // Dapatkan data user lama untuk perbandingan
        const oldUserData = await Elnusa.getUserById(userId);
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
        const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
        dateFields.forEach(field => {
          if (userData[field] && typeof userData[field] === 'string') {
            // Log format tanggal untuk debugging
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
        const result = await Elnusa.updateUserWithHistory(userId, userData, modifiedBy);

        // Jika mengembalikan dari NA, tambahkan pesan khusus
        let message = 'Data user berhasil diperbarui';
        if (isRestoring && contractChanged) {
          message = 'User berhasil dipulihkan dan dikembalikan ke status aktif';
        }
        
        res.status(200).json({
          success: true,
          message: message,
          data: result
        });
      } catch (error) {
        console.error('Error in updateUser controller:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal memperbarui data user',
          error: error.message
        });
      }
    }, 

    updateUserWithHistory: async (req, res) => {
      try {
        const id = req.params.id;
        const userData = req.body;
        const modifiedBy = req.user?.username || 'system';
    
        // Validasi data
        // ...
    
        // Update data pengguna
        const updatedUser = await Elnusa.updateUser(id, userData);
        
        // Cek apakah contract history perlu diperbarui
        const oldUser = await Elnusa.getUserById(id);
        const contractChanged = 
          oldUser.no_kontrak !== userData.no_kontrak ||
          oldUser.kontrak_awal !== userData.kontrak_awal ||
          oldUser.kontrak_akhir !== userData.kontrak_akhir;
        
        // Jika kontrak berubah, coba simpan ke history
        if (contractChanged) {
          try {
            // Periksa apakah model ElnusaContractHistory ada
            if (typeof ElnusaContractHistory !== 'undefined') {
              await ElnusaContractHistory.addHistory({
                user_id: id,
                nama_karyawan: userData.nama_karyawan,
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
              console.warn('ElnusaContractHistory not defined, skipping history recording');
              // Gunakan alternatif Elnusa.saveKontrakHistory jika ada
              if (typeof Elnusa.saveKontrakHistory === 'function') {
                await Elnusa.saveKontrakHistory(id, oldUser, userData);
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
        
        const history = await ElnusaContractHistory.getAllHistoryByUserId(userId);
        
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
        const stats = await ElnusaContractHistory.getContractChangeStats();
        
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
        
        // Panggil method getKontrakHistory dari model Elnusa
        const history = await Elnusa.getKontrakHistory(userId);
        
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
     * Mendapatkan detail pendapatan karyawan
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getSalaryData: async (req, res) => {
      try {
          const id = req.params.id;
          const salaryData = await Elnusa.getSalaryData(id);
          
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
            const personalData = await Elnusa.getPersonalData(id);
            
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
     * Delete document file
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
        const fileInfo = await Elnusa.getDocumentInfo(userId, docType);
        
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
        const result = await Elnusa.deleteDocument(userId, docType);
        
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
        // Definisi header CSV
        const headers = [
          "nama_karyawan", "jabatan", "nik_vendor", "nik_elnusa", "no_kontrak", 
          "wbs_cctr", "proyek", "unit", "unit_temp", "lokasi_penerimaan", "user_name",
          "kontrak_awal", "kontrak_akhir", "no_ktp", "no_kk", "no_bpjs_kesehatan",
          "keterangan_bpjs_kesehatan", "no_bpjs_tk", "keterangan_bpjs_tk", "asuransi_lainnya", 
          "npwp", "alamat_lengkap_domisili", "jenis_kelamin", "tanggal_lahir", "usia",
          "agama", "status_perkawinan", "pendidikan_terakhir", "nama_instansi_pendidikan", 
          "jurusan", "tahun_masuk", "tahun_keluar", "alamat_email", "nomor_telepon",
          "nomor_telepon_darurat", "nama_telepon_darurat", "nama_pemilik_buku_tabungan",
          "no_rekening", "bank_penerbit", "honorarium", "gaji_pokok", "gaji_terupdate",
          "t_variabel", "t_makan", "t_transport", "t_pulsa", "t_specialis", "t_lapangan",
          "thp", "lemburan_otomatis", "t_posisi", "t_offshore", "t_lapangan_perhari",
          "t_onshore", "t_onshore_eksp", "t_warehouse_office", "t_proyek", "t_karantina",
          "tunjangan_lembur", "t_supervisor", "status_karyawan", "hak_asuransi", "hse", "cv"
        ];
        
        // Buat contoh data (satu baris contoh)
        const exampleData = [
          "John Doe", "Staff", "V12345", "E54321", "KTR/2023/001",
          "WBS123", "Proyek A", "Unit IT", "IT Support", "Jakarta", "john_doe",
          "12/11/2023", "31/12/2025", "4343434444444444", "1234567843434343", "4444444444444",
          "777777dfsdsd", "87654321", "44444444444", "Asuransi - 123", "4444444444444444", "Jl. Contoh No. 123",
          "Laki-laki", "10/11/1990", "33", "Islam", "Menikah", "S1", "Universitas Contoh",
          "Teknik Informatika", "2008", "2012", "john.doe@example.com", "08123456789",
          "08123456788", "Jane Doe", "John Doe", "1234567890", "Bank ABC", "50000",
          "5000000.00", "5500000.00", "250000.00", "300000.00", "400000.00", "100000.00",
          "0.00", "0.00", "6550000.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00",
          "0.00", "0.00", "0.00", "0.00", "0.00", "Kontrak", "BPJS", "RIG EMR", "done"
        ];
        
        // Buat content CSV
        let csvContent = headers.join(",") + "\n";
        csvContent += exampleData.join(",") + "\n";
        
        // Set header respons untuk CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=template_data_karyawan_elnusa.csv');
        
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
      
      // Validasi data sebelum diproses dengan validasi yang lebih ketat
      const validation = Elnusa.validateCSVData(parsedData);
      
      // Log validation result untuk debugging
      console.log(`Validasi: ${validation.valid ? 'Valid' : 'Invalid'}, Errors: ${validation.errors.length}`);
      
      // Kategorikan error berdasarkan tingkat keparahan
      const criticalErrors = validation.errors.filter(error => 
        error.message.includes('wajib diisi') || 
        error.message.includes('tidak ditemukan') ||
        error.message.includes('CSV tidak memiliki data')
      );
      
      const warningErrors = validation.errors.filter(error => 
        !criticalErrors.includes(error) && (
          error.message.includes('Format numerik tidak valid') ||
          error.message.includes('Format tanggal tidak valid')
        )
      );
      
      // Jika ada error kritis yang banyak, tolak upload
      if (criticalErrors.length > 0) {
        return res.status(400).json({
          success: 0,
          errors: criticalErrors,
          total: parsedData.length,
          message: `Terdapat ${criticalErrors.length} error kritis. Perbaiki data sebelum mengupload.`
        });
      }
      
      // Jika ada terlalu banyak warning errors, beri tahu user tapi tetap izinkan upload
      if (warningErrors.length > Math.floor(parsedData.length * 0.5)) { // Jika lebih dari 50% data bermasalah
        return res.status(400).json({
          success: 0,
          errors: warningErrors.slice(0, 20), // Batasi jumlah error yang ditampilkan
          total: parsedData.length,
          message: `Terdapat ${warningErrors.length} peringatan validasi (${Math.round(warningErrors.length/parsedData.length*100)}% dari data). Disarankan untuk memperbaiki data terlebih dahulu. Error yang paling umum: format numerik mengandung teks (contoh: "Rp 5000" harus menjadi "5000").`
        });
      }
      
      // Proses bulk insert
      console.log("Memulai proses bulk insert untuk", parsedData.length, "data");
      const processResult = await Elnusa.processBulkInsert(parsedData);
      console.log(`Hasil pemrosesan: ${processResult.success} berhasil, ${processResult.errors.length} gagal`);
      
      // Enhance error messages untuk response
      const enhancedErrors = processResult.errors.map(error => {
        let enhancedMessage = error.message;
        
        // Jika error berkaitan dengan numerik, berikan saran perbaikan
        if (error.message.includes('numerik') || error.message.includes('numeric')) {
          enhancedMessage += '. Tips: Pastikan kolom numerik hanya berisi angka tanpa teks, simbol mata uang, atau karakter lain. Contoh yang benar: 5000000, bukan "Rp 5.000.000".';
        }
        
        return {
          ...error,
          message: enhancedMessage
        };
      });
      
      // Return hasil dengan informasi yang lebih lengkap
      const responseData = {
        success: processResult.success,
        errors: enhancedErrors,
        total: parsedData.length,
        warnings: warningErrors.length,
        summary: {
          successful_records: processResult.success,
          failed_records: processResult.errors.length,
          total_records: parsedData.length,
          success_rate: Math.round((processResult.success / parsedData.length) * 100)
        }
      };
      
      // Jika ada data yang berhasil, berikan feedback positif
      if (processResult.success > 0) {
        responseData.message = `Upload berhasil! ${processResult.success} dari ${parsedData.length} data berhasil diproses (${responseData.summary.success_rate}%).`;
        
        if (processResult.errors.length > 0) {
          responseData.message += ` ${processResult.errors.length} data gagal diproses karena error validasi.`;
        }
      } else {
        responseData.message = `Upload gagal. Semua ${parsedData.length} data mengalami error validasi. Periksa format data dan coba lagi.`;
      }
      
      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('Error detail pada uploadBulkData:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: 0,
        errors: [{ message: `Server error: ${error.message}` }],
        total: 0,
        message: 'Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator.'
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
            const adminData = await Elnusa.getAdminData(id);
            
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
     * Mendapatkan data sertifikasi karyawan berdasarkan ID
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getCertificationData: async (req, res) => {
      try {
        const id = req.params.id;
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID karyawan tidak boleh kosong'
          });
        }
        
        const certificationData = await Elnusa.getCertificationData(id);
        
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

  //HSE FUNGSI CONTROLLER

    /**
     * Mendapatkan data HSE karyawan untuk halaman monitoring HSE
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     */
    getHSEData: async (req, res) => {
      try {
        console.log('Memulai getHSEData untuk Elnusa...');
        
        // Gunakan fungsi khusus untuk mendapatkan data HSE (hanya RIG EMR)
        const dataHSE = await Elnusa.getHSEData();
        
        console.log(`Mengambil ${dataHSE.length} data HSE karyawan Elnusa dengan status RIG EMR`);
        
        // Jika meminta format JSON
        if (req.query.format === 'json' || req.headers.accept.includes('application/json')) {
          console.log('Mengirim respons JSON untuk data HSE Elnusa');
          return res.json(dataHSE);
        }
        
        // Jika memerlukan render view, bisa ditambahkan di sini
        // Untuk saat ini, selalu kirim JSON karena data ini akan diakses dari frontend React
        res.json(dataHSE);
      } catch (error) {
        console.error('Error pada getHSEData Elnusa:', error);
        
        res.status(500).json({
          error: 'Database error',
          message: error.message
        });
      }
    },

    // Controller functions untuk sertifikat

    // Membuat tabel sertifikat jika belum ada
    createSertifikatTable: async (req, res) => {
      try {
        await Elnusa.createSertifikatTable();
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
        
        // Validasi data
        if (!sertifikatData.user_id || !sertifikatData.judul_sertifikat) {
          return res.status(400).json({
            success: false,
            message: 'Data sertifikat tidak lengkap'
          });
        }
        
        // Pastikan tabel sertifikat ada
        await Elnusa.createSertifikatTable();
        
        // Tambahkan sertifikat
        const result = await Elnusa.addSertifikat(sertifikatData);
        
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
        await Elnusa.createSertifikatTable();
        
        // Dapatkan sertifikat
        const result = await Elnusa.getSertifikatByUserId(userId);
        
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
        const result = await Elnusa.getSertifikatById(id);
        
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
        const result = await Elnusa.updateSertifikat(id, sertifikatData);
        
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
        const result = await Elnusa.deleteSertifikat(id);
        
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