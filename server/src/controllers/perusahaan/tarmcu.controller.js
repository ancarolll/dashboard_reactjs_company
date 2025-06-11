import { TarMCU, HSETarHistory, DocumentsHSE, IsoDocumentsHSE, HistoryTar } from "../../models/perusahaan/tar_mcu.model.js";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";

// Mendapatkan __dirname di ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Controller untuk TarMCU
export const TarMCUController = {
  /**
   * Menampilkan halaman utama dengan data MCU
   */
  index: async (req, res) => {
    try {
      // Jika meminta format JSON
      if (req.query.format === 'json') {
        const dataMCU = await TarMCU.getAll();
        return res.json(dataMCU);
      }
      
      // Redirect ke halaman edit sebagai fallback
      res.redirect('/api/tar-mcu/edit');
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

  // Add this to the TarMCUController object
/**
 * Handle file uploads when adding new employee data
 */
addMCUWithFiles: async (req, res) => {
  try {
    const userData = req.body;
    const files = req.files;
    
    // Pastikan id tidak dikirimkan dari frontend
    if (userData.id) {
      delete userData.id;
    }
    
    // Validasi data dasar
    if (!userData.nama_karyawan) {
      return res.status(400).json({
        success: false,
        message: 'MCU Data Incomplete - employee_name is required'
      });
    }
    
    // Process uploaded files if any
    if (files) {
      const fileFields = ['bpjs', 'nik', 'kk', 'npwp', 'norek', 'kpj'];
      
      fileFields.forEach(field => {
        if (files[field] && files[field][0]) {
          const file = files[field][0];
          
          // Add file metadata to userData
          userData[`${field}_filename`] = file.originalname;
          userData[`${field}_filepath`] = file.path.replace('public', '');
          userData[`${field}_mimetype`] = file.mimetype;
          userData[`${field}_filesize`] = file.size;
        }
      });
    }
    
    // Reset sequence and save to database
    await TarMCU.resetSequence();
    const result = await TarMCU.add(userData);
    
    res.status(201).json({
      success: true,
      message: 'Employee data added successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in addMCUWithFiles:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: error.message
    });
  }
},

/**
 * Update only the editable MCU fields (start date, end date, result, vendor, comments)
 */
updateEditableMCUFields: async (req, res) => {
  try {
    const id = req.params.id;
    const mcuUpdateData = req.body;
    const modifiedBy = req.user?.username || 'system';
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Employee ID is required' 
      });
    }
    
    console.log(`Updating MCU fields for employee ID: ${id}`);
    
    // Get existing data before update for comparison
    const oldUserData = await TarMCU.getById(id);
    if (!oldUserData) {
      console.log(`Employee with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // IMPORTANT: Only allow updating the specified MCU fields
    // Extract only the fields that are allowed to be updated
    const allowedFields = {
      awal_mcu: mcuUpdateData.awal_mcu,
      akhir_mcu: mcuUpdateData.akhir_mcu,
      hasil_mcu: mcuUpdateData.hasil_mcu,
      vendor_mcu: mcuUpdateData.vendor_mcu,
      keterangan_mcu: mcuUpdateData.keterangan_mcu
    };
    
    // Filter out undefined fields to avoid overwriting with undefined
    const editableMcuData = {};
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] !== undefined) {
        editableMcuData[key] = allowedFields[key];
      }
    });
    
    console.log('Fields being updated:', Object.keys(editableMcuData));
    
    // Check if data MCU changed significantly
    const isMCUChanged = HSETarHistory.isMCUDataChanged(oldUserData, editableMcuData);
    
    try {
      // Update only the editable fields in the database
      const updatedUser = await TarMCU.update(id, editableMcuData);
      
      if (!updatedUser) {
        throw new Error('Failed to update MCU data');
      }
      
      // Record in history if MCU changed significantly
      if (isMCUChanged) {
        try {
          // Prepare history data
          const historyData = HSETarHistory.prepareHistoryData(oldUserData, {
            ...oldUserData, // Include all old data
            ...editableMcuData // Override with only the updated fields
          }, modifiedBy);
          
          // Add record to history
          await HSETarHistory.addHistory(historyData);
          
          console.log(`Successfully recorded MCU changes in history for employee ID ${id}`);
        } catch (historyError) {
          console.error(`Error recording MCU history: ${historyError.message}`);
          // Continue operation even if history recording fails
        }
      } else {
        console.log(`No significant changes to MCU data for employee ID ${id}`);
      }
      
      console.log(`Successfully updated MCU data for employee: ${updatedUser.nama_karyawan}`);
      
      res.status(200).json({
        success: true,
        message: 'MCU data successfully updated',
        data: updatedUser,
        historyUpdated: isMCUChanged
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in updateEditableMCUFields:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update MCU data',
      error: error.message
    });
  }
},

/**
 * Fetch MCU data for view-only access
 */
viewMcuData: async (req, res) => {
  try {
    console.log('Fetching MCU data for view-only access');
    
    const mcuData = await TarMCU.getAll();
    
    res.status(200).json({
      success: true,
      data: mcuData
    });
  } catch (error) {
    console.error('Error fetching MCU data for view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MCU data',
      error: error.message
    });
  }
},

/**
 * Get MCU history for a specific employee (read-only)
 */
viewMcuHistory: async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    // Check if employee exists
    const userExists = await TarMCU.getById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Get history records
    const history = await HSETarHistory.getAllHistoryByUserId(userId);
    
    res.status(200).json({
      success: true,
      message: 'MCU history retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error('Error retrieving MCU history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve MCU history',
      error: error.message
    });
  }
},

  /**
   * Handle file uploads when updating employee data
   */
  /**
 * Handle file uploads when updating employee data - PERBAIKAN
 */
updateMCUWithFilesAndHistory: async (req, res) => {
  try {
    const id = req.params.id;
    const userData = req.body;
    const files = req.files;
    const modifiedBy = req.user?.username || 'system';
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID karyawan diperlukan' 
      });
    }
    
    console.log('Received data for update:', {
      id,
      hasFiles: !!files,
      userDataKeys: Object.keys(userData)
    });
    
    // Get existing data for comparison
    const oldUserData = await TarMCU.getById(id);
    if (!oldUserData) {
      return res.status(404).json({
        success: false,
        message: 'Karyawan tidak ditemukan'
      });
    }
    
    // Process uploaded files if any
    if (files) {
      const fileFields = ['bpjs', 'nik', 'kk', 'npwp', 'norek', 'kpj'];
      
      fileFields.forEach(field => {
        if (files[field] && files[field][0]) {
          const file = files[field][0];
          
          // Delete old file if exists
          if (oldUserData[`${field}_filepath`]) {
            const oldFilePath = path.join(__dirname, '../../public', oldUserData[`${field}_filepath`]);
            if (fs.existsSync(oldFilePath)) {
              try {
                fs.unlinkSync(oldFilePath);
                console.log(`Deleted old file: ${oldFilePath}`);
              } catch (err) {
                console.warn(`Could not delete old file: ${oldFilePath}`, err.message);
              }
            }
          }
          
          // Add file metadata to userData
          userData[`${field}_filename`] = file.originalname;
          userData[`${field}_filepath`] = file.path.replace('public', '');
          userData[`${field}_mimetype`] = file.mimetype;
          userData[`${field}_filesize`] = file.size;
        }
      });
    }
    
    // PERBAIKAN: Handle explicit file deletions
    const fileFields = ['bpjs', 'nik', 'kk', 'npwp', 'norek', 'kpj'];
    fileFields.forEach(field => {
      // Check if this field is marked for deletion (empty filename means delete)
      if (userData[`${field}_filename`] === '') {
        // Delete old file if exists
        if (oldUserData[`${field}_filepath`]) {
          const oldFilePath = path.join(__dirname, '../../public', oldUserData[`${field}_filepath`]);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
              console.log(`Deleted file for field ${field}: ${oldFilePath}`);
            } catch (err) {
              console.warn(`Could not delete file for field ${field}: ${oldFilePath}`, err.message);
            }
          }
        }
        
        // Set all file-related fields to null
        userData[`${field}_filename`] = null;
        userData[`${field}_filepath`] = null;
        userData[`${field}_mimetype`] = null;
        userData[`${field}_filesize`] = null;
      }
    });
    
    // PERBAIKAN: Pastikan nilai numerik tidak berupa string kosong
    if (userData.usia === '' || userData.usia === undefined) {
      userData.usia = '0';
    }
    
    // PERBAIKAN: Bersihkan data sebelum validasi
    Object.keys(userData).forEach(key => {
      if (userData[key] === '' && !key.includes('filename') && !key.includes('filepath') && !key.includes('mimetype')) {
        userData[key] = null;
      }
    });
    
    console.log('Processed userData before update:', {
      hasNullValues: Object.values(userData).some(v => v === null),
      fileFields: fileFields.map(f => ({
        field: f,
        hasFilename: !!userData[`${f}_filename`],
        filename: userData[`${f}_filename`]
      }))
    });
    
    // Check if MCU data has changed significantly
    const isMCUChanged = HSETarHistory.isMCUDataChanged(oldUserData, userData);

    // Check if contract data has changed significantly
    const isContractChanged = HistoryTar.isContractDataChanged(oldUserData, userData);
    
    // Update user data
    const updatedUser = await TarMCU.update(id, userData);
    
    if (!updatedUser) {
      throw new Error('Gagal memperbarui data karyawan');
    }
    
    // Add to history if MCU data changed
    if (isMCUChanged) {
      try {
        const historyData = HSETarHistory.prepareHistoryData(oldUserData, userData, modifiedBy);
        await HSETarHistory.addHistory(historyData);
        console.log(`MCU history recorded for employee ID ${id}`);
      } catch (historyError) {
        console.error(`Error recording MCU history: ${historyError.message}`);
      }
    }

    if (isContractChanged) {
      try {
        const contractHistoryData = HistoryTar.prepareHistoryData(oldUserData, userData, modifiedBy);
        await HistoryTar.addHistory(contractHistoryData);
        console.log(`Contract history recorded for employee ID ${id}`);
      } catch (historyError) {
        console.error(`Error recording contract history: ${historyError.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Data karyawan berhasil diperbarui',
      data: updatedUser,
      historyUpdated: isMCUChanged || isContractChanged
    });
  } catch (error) {
    console.error('Error pada updateMCUWithFilesAndHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data karyawan',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
},

/**
 * Get document file from employee data
 */
// File: controllers/perusahaan/tarmcu.controller.js - perbaikan untuk getFile
getFile: async (req, res) => {
  try {
    const id = req.params.id;
    const field = req.params.field;
    
    console.log(`Mencoba mengakses file untuk ID ${id}, field ${field}`);
    
    // Validasi field
    const validFields = ['bpjs', 'nik', 'kk', 'npwp', 'norek', 'kpj'];
    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Jenis dokumen tidak valid'
      });
    }
    
    // Dapatkan data karyawan
    const employee = await TarMCU.getById(id);
    if (!employee) {
      console.log(`Data karyawan dengan ID ${id} tidak ditemukan`);
      return res.status(404).json({
        success: false,
        message: 'Data karyawan tidak ditemukan'
      });
    }
    
    // Periksa apakah file ada
    const filePath = employee[`${field}_filepath`];
    if (!filePath) {
      console.log(`Path file untuk field ${field} tidak ada di database`);
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan dalam database'
      });
    }
    
    console.log(`File path dari database: ${filePath}`);
    
    // Normalisasi path (hapus 'public/' jika ada, dan ubah / menjadi \ untuk Windows)
    let normalizedPath = filePath;
    if (normalizedPath.startsWith('public/')) {
      normalizedPath = normalizedPath.substring(7);
    }
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }
    
    // Coba beberapa kemungkinan lokasi file
    const possiblePaths = [
      path.join(__dirname, '../../', normalizedPath), // path relatif terhadap controller
      path.join(__dirname, '../../../', normalizedPath), // path relatif ke root project
      path.join(__dirname, '../../public', normalizedPath), // dengan folder public
      path.join(__dirname, '../../uploads', normalizedPath), // dengan folder uploads
      path.join('D:/dashboardadmin/server/src/uploads/tar-mcu-files', path.basename(normalizedPath)) // path absolut ke folder upload
    ];
    
    let fullPath = null;
    // Periksa semua kemungkinan path
    for (const testPath of possiblePaths) {
      console.log(`Memeriksa path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        console.log(`File ditemukan di: ${testPath}`);
        fullPath = testPath;
        break;
      }
    }
    
    // Jika file tidak ditemukan di semua kemungkinan path
    if (!fullPath) {
      console.error(`File tidak ditemukan di server. Path dari database: ${filePath}`);
      console.error(`Path yang dicoba: ${JSON.stringify(possiblePaths)}`);
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan di server'
      });
    }
    
    // Set header yang tepat
    const fileName = employee[`${field}_filename`] || `${field}_document`;
    const mimeType = employee[`${field}_mimetype`] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Length', fs.statSync(fullPath).size);
    
    // Kirim file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.on('error', (error) => {
      console.error(`Error saat streaming file: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Gagal membaca file'
        });
      }
    });
    
    fileStream.pipe(res);
  } catch (error) {
    console.error(`Error mendapatkan file: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengakses file',
      error: error.message
    });
  }
}, 

  /**
   * Mendapatkan semua data MCU
   */
  getAll: async (req, res) => {
    try {
      const dataMCU = await TarMCU.getAll();
      res.json(dataMCU || []);
    } catch (error) {
      console.error('Error pada getAll:', error);
      res.status(500).json({
        error: 'Database error',
        message: 'Terjadi kesalahan dalam mengambil data MCU'
      });
    }
  },

  /**
   * Mendapatkan data MCU berdasarkan ID
   */
  getById: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID tidak valid'
        });
      }

      const dataMCU = await TarMCU.getById(id);

      if (!dataMCU) {
        return res.status(404).json({
          success: false,
          message: 'Data MCU tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: dataMCU
      });
    } catch (error) {
      console.error('Error pada getById:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan dalam mengambil data MCU',
        error: error.message
      });
    }
  },

  /**
   * Menambahkan data MCU baru
   */
  addMCU: async (req, res) => {
    try {
      const userData = req.body;

      // Pastikan id tidak dikirimkan dari frontend
      if (userData.id) {
        delete userData.id;
      }

      // Validasi data dasar
      if (!userData.nama_karyawan) {
        return res.status(400).json({
          success: false,
          message: 'Data MCU tidak lengkap - nama_karyawan wajib diisi'
        });
      }
  
      // Reset sequence jika diperlukan sebelum insert
      await TarMCU.resetSequence();
      
      // Kirim ke model untuk disimpan
      const result = await TarMCU.add(userData);
      
      // Jika client meminta JSON
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(201).json({
          success: true,
          message: 'Data MCU berhasil ditambahkan',
          data: result
        });
      }
      
      // Redirect ke halaman utama
      res.redirect('/api/tar-mcu');
    } catch (error) {
      console.error('Error pada addMCU:', error);
      
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message
        });
      }
      
      res.status(500).send('Terjadi Kesalahan dalam menambahkan data MCU');
    }
  },

  /**
   * Mengupdate data MCU dengan pencatatan riwayat
   */
  updateMCUWithHistory: async (req, res) => {
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
      
      console.log(`Memperbarui data MCU untuk karyawan ID: ${id}`);
      
      // Dapatkan data user sebelum pembaruan untuk perbandingan
      const oldUserData = await TarMCU.getById(id);
      if (!oldUserData) {
        console.log(`User dengan ID ${id} tidak ditemukan`);
        return res.status(404).json({
          success: false,
          message: 'Karyawan tidak ditemukan'
        });
      }
      
      // Filter hanya data MCU yang perlu diupdate
      const mcuUpdateData = {
        no_kontrak: userData.no_kontrak,
        nama_karyawan: userData.nama_karyawan,
        jabatan: userData.jabatan,
        tanggal_lahir: userData.tanggal_lahir,
        jenis_kelamin: userData.jenis_kelamin,
        usia: userData.usia,
        awal_mcu: userData.awal_mcu,
        akhir_mcu: userData.akhir_mcu,
        hasil_mcu: userData.hasil_mcu,
        vendor_mcu: userData.vendor_mcu,
        keterangan_mcu: userData.keterangan_mcu
      };
      
      // Periksa apakah data MCU berubah secara signifikan
      const isMCUChanged = HSETarHistory.isMCUDataChanged(oldUserData, mcuUpdateData);
      
      // Mulai transaksi database
      try {
        // Update data user di database
        const updatedUser = await TarMCU.update(id, mcuUpdateData);
        
        if (!updatedUser) {
          throw new Error('Gagal memperbarui data MCU');
        }
        
        // Jika data MCU berubah secara signifikan, catat dalam riwayat
        if (isMCUChanged) {
          try {
            // Siapkan data riwayat
            const historyData = HSETarHistory.prepareHistoryData(oldUserData, mcuUpdateData, modifiedBy);
            
            // Tambahkan catatan ke riwayat
            await HSETarHistory.addHistory(historyData);
            
            console.log(`Berhasil mencatat perubahan MCU dalam riwayat untuk karyawan ID ${id}`);
          } catch (historyError) {
            console.error(`Error saat mencatat riwayat MCU: ${historyError.message}`);
            // Lanjutkan operasi meskipun pencatatan riwayat gagal
          }
        } else {
          console.log(`Tidak ada perubahan signifikan pada data MCU untuk karyawan ID ${id}`);
        }
        
        console.log(`Berhasil memperbarui data MCU untuk karyawan: ${updatedUser.nama_karyawan}`);
        
        res.status(200).json({
          success: true,
          message: 'Data MCU berhasil diperbarui',
          data: updatedUser,
          historyUpdated: isMCUChanged
        });
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error pada updateMCUWithHistory:', error);
      
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data MCU',
        error: error.message
      });
    }
  },

  /**
   * Menghapus data MCU
   */
  deleteMCU: async (req, res) => {
    try {
      const id = req.params.id;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID tidak valid'
        });
      }

      // Periksa apakah data ada
      const mcuExists = await TarMCU.getById(id);
      if (!mcuExists) {
        return res.status(404).json({
          success: false,
          message: 'Data MCU tidak ditemukan'
        });
      }

      // Hapus data MCU
      const result = await TarMCU.delete(id);
      
      res.json({
        success: true,
        message: 'Data MCU berhasil dihapus',
        data: result
      });
    } catch (error) {
      console.error('Error pada deleteMCU:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus data MCU',
        error: error.message
      });
    }
  },

  /**
   * Mencari data MCU berdasarkan keyword
   */
  searchMCU: async (req, res) => {
    try {
      const keyword = req.query.keyword || '';
      
      const result = await TarMCU.search(keyword);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error pada searchMCU:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mencari data MCU',
        error: error.message
      });
    }
  },

  /**
   * Mendapatkan riwayat MCU untuk user tertentu
   */
  getMCUHistory: async (req, res) => {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID karyawan diperlukan'
        });
      }
      
      console.log(`Mengambil riwayat MCU untuk user ID: ${userId}`);
      
      // Pastikan user ada
      const userExists = await TarMCU.getById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'Karyawan tidak ditemukan'
        });
      }
      
      // Dapatkan catatan riwayat
      const history = await HSETarHistory.getAllHistoryByUserId(userId);
      
      console.log(`Mengambil ${history.length} catatan riwayat MCU untuk user ID ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Riwayat MCU berhasil diambil',
        data: history
      });
    } catch (error) {
      console.error('Error saat mengambil riwayat MCU:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat MCU',
        error: error.message
      });
    }
  },

  /**
   * Mendapatkan statistik riwayat MCU
   */
  getMCUHistoryStats: async (req, res) => {
    try {
      console.log('Mengambil statistik riwayat MCU');
      
      // Dapatkan statistik
      const stats = await HSETarHistory.getHSEChangeStats();
      
      res.status(200).json({
        success: true,
        message: 'Statistik MCU berhasil diambil',
        data: stats
      });
    } catch (error) {
      console.error('Error saat mengambil statistik riwayat MCU:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik MCU',
        error: error.message
      });
    }
  },

    /**
   * Mendapatkan riwayat kontrak untuk karyawan tertentu
   */
  getContractHistory: async (req, res) => {
    try {
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID karyawan diperlukan'
        });
      }
      
      // Pastikan user ada
      const userExists = await TarMCU.getById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'Karyawan tidak ditemukan'
        });
      }
      
      // Dapatkan catatan riwayat
      const history = await HistoryTar.getAllHistoryByUserId(userId);
      
      console.log(`Mengambil ${history.length} catatan riwayat kontrak untuk user ID ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Riwayat kontrak berhasil diambil',
        data: history
      });
    } catch (error) {
      console.error('Error saat mengambil riwayat kontrak:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat kontrak',
        error: error.message
      });
    }
  }

};

// Controller untuk DocumentsHSE
export const DocumentsHSEController = {
  /**
   * Mendapatkan semua dokumen HSE
   */
  getAllDocuments: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 20;
      const searchTerm = req.query.search || '';
      
      // Logging untuk debugging
      console.log('Request parameters:', {
        page,
        perPage,
        searchTerm
      });
      
      const documents = await DocumentsHSE.getAllDocuments(
        page,
        perPage,
        searchTerm
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
  },

  /**
   * Mendapatkan dokumen berdasarkan ID
   */
  getDocumentById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await DocumentsHSE.getDocumentById(id);
      
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
  },

  /**
   * Menambahkan dokumen baru
   */
  addDocument: async (req, res) => {
    try {
      // Debug form data yang diterima
      console.log('Received form data:', req.body);
      
      const { title, uploadDate, awalBerlaku, akhirBerlaku } = req.body;
      
      let fileName = '';
      let filePath = '';
      let fileType = '';
      
      // Jika ada file yang diupload
      if (req.file) {
        fileName = req.file.originalname;
        filePath = `/uploads/documents/${req.file.filename}`;
        fileType = req.file.mimetype;
      }
      
      // PERBAIKAN: Penanganan string kosong menjadi null
      // Tanggal yang dikirim sebagai string kosong harus diubah menjadi null
      const parsedAwalBerlaku = awalBerlaku && awalBerlaku !== '' ? awalBerlaku : null;
      const parsedAkhirBerlaku = akhirBerlaku && akhirBerlaku !== '' ? akhirBerlaku : null;
      
      console.log('Parsed date values:', {
        original: { awalBerlaku, akhirBerlaku },
        parsed: { parsedAwalBerlaku, parsedAkhirBerlaku }
      });
      
      const documentData = {
        title: title,
        fileName: fileName,
        filePath: filePath,
        fileType: fileType,
        uploadDate: uploadDate || new Date().toISOString().split('T')[0],
        awalBerlaku: parsedAwalBerlaku,
        akhirBerlaku: parsedAkhirBerlaku
      };
      
      const result = await DocumentsHSE.addDocument(documentData);
      
      res.json({ 
        success: true, 
        message: 'Dokumen berhasil ditambahkan', 
        data: result 
      });
    } catch (error) {
      console.error('Error adding document:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat menambahkan dokumen: ' + error.message 
      });
    }
  },

  /**
   * Mengupdate dokumen yang sudah ada
   */
  updateDocument: async (req, res) => {
    try {
      console.log('Received update form data:', req.body);
      
      const id = parseInt(req.params.id);
      const { title, uploadDate, awalBerlaku, akhirBerlaku } = req.body;
      
      // Cek apakah dokumen ada
      const existingDocument = await DocumentsHSE.getDocumentById(id);
      if (!existingDocument) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen tidak ditemukan' 
        });
      }
      
      let fileName = existingDocument.file_name;
      let filePath = existingDocument.file_path;
      let fileType = existingDocument.file_type;
      
      // Jika ada file baru yang diupload
      if (req.file) {
        // Hapus file lama jika ada
        if (existingDocument.file_path) {
          const oldFilePath = path.join(__dirname, '../../public', existingDocument.file_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        fileName = req.file.originalname;
        filePath = `/uploads/documents/${req.file.filename}`;
        fileType = req.file.mimetype;
      }
      
      // PERBAIKAN: Penanganan string kosong menjadi null
      const parsedAwalBerlaku = awalBerlaku && awalBerlaku !== '' ? awalBerlaku : null;
      const parsedAkhirBerlaku = akhirBerlaku && akhirBerlaku !== '' ? akhirBerlaku : null;
      
      console.log('Parsed update date values:', {
        original: { awalBerlaku, akhirBerlaku },
        parsed: { parsedAwalBerlaku, parsedAkhirBerlaku }
      });
      
      const documentData = {
        title: title,
        fileName: fileName,
        filePath: filePath,
        fileType: fileType,
        uploadDate: uploadDate || existingDocument.upload_date,
        awalBerlaku: parsedAwalBerlaku,
        akhirBerlaku: parsedAkhirBerlaku
      };
      
      const result = await DocumentsHSE.updateDocument(id, documentData);
      
      res.json({ 
        success: true, 
        message: 'Dokumen berhasil diperbarui', 
        data: result 
      });
    } catch (error) {
      console.error(`Error updating document with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat memperbarui dokumen: ' + error.message 
      });
    }
  },

  /**
   * Menghapus dokumen
   */
  deleteDocument: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Cek apakah dokumen ada
      const document = await DocumentsHSE.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen tidak ditemukan' 
        });
      }
      
      // Hapus file terkait jika ada
      if (document.file_path) {
        const filePath = path.join(__dirname, '../../public', document.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Hapus dokumen dari database
      await DocumentsHSE.deleteDocument(id);
      
      res.json({ 
        success: true, 
        message: 'Dokumen berhasil dihapus' 
      });
    } catch (error) {
      console.error(`Error deleting document with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat menghapus dokumen' 
      });
    }
  },

  /**
   * Melihat file dokumen
   */
  getDocumentFile: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log(`Processing file view request for document ID: ${id}`);
      
      // Cek apakah dokumen ada
      const document = await DocumentsHSE.getDocumentById(id);
      if (!document) {
        console.error(`Document with ID ${id} not found`);
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen tidak ditemukan' 
        });
      }
      
      // Cek apakah dokumen memiliki file
      if (!document.file_path) {
        console.error(`Document with ID ${id} has no file`);
        return res.status(404).json({ 
          success: false, 
          message: 'File tidak ditemukan untuk dokumen ini' 
        });
      }
      
      // Perbaiki path file
      const filePath = path.join(__dirname, '../..', document.file_path);
      console.log(`Looking for file at: ${filePath}`);
      
      // Cek apakah file ada
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
  },

  /**
   * Mengunduh file dokumen
   */
  downloadDocumentFile: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log(`Processing file download request for document ID: ${id}`);
      
      // Cek apakah dokumen ada
      const document = await DocumentsHSE.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen tidak ditemukan' 
        });
      }
      
      // Perbaiki path file
      const filePath = path.join(__dirname, '../..', document.file_path);
      console.log(`Downloading file from: ${filePath}`);
      
      // Cek apakah file ada
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          success: false, 
          message: 'File tidak ditemukan di server' 
        });
      }
      
      // Ekstrak ekstensi file dan pastikan ada dalam nama file
      let fileName = document.file_name || 'document';
      const fileExtension = path.extname(fileName).toLowerCase();
      
      // Jika file tidak memiliki ekstensi, coba derive dari MIME type
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
      
      // Pastikan Content-Type diset dengan benar
      let contentType = document.file_type;
      
      // Jika content type tidak ada, derive dari ekstensi file
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
      
      // Tambahkan header yang diperlukan
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${safeFileName}`);
      res.setHeader('Content-Length', fs.statSync(filePath).size);
      
      // Header tambahan untuk browser dan proxy
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
        message: 'Terjadi kesalahan saat mengunduh file dokumen' 
      });
    }
  },

  /**
   * Mencari dokumen berdasarkan keyword
   */
  searchDocuments: async (req, res) => {
    try {
      const { keyword } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const results = await DocumentsHSE.searchDocuments(keyword || '', page, limit);
      
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
};

export const IsoDocumentsHSEController = {
  /**
   * Mendapatkan semua dokumen ISO
   */
  getAllDocuments: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 20;
      const searchTerm = req.query.search || '';
      
      // Logging untuk debugging
      console.log('Request parameters for ISO documents:', {
        page,
        perPage,
        searchTerm
      });
      
      const documents = await IsoDocumentsHSE.getAllDocuments(
        page,
        perPage,
        searchTerm
      );
      
      console.log(`Returning ${documents.data?.length || 0} ISO documents out of ${documents.pagination?.total || 0} total`);
      
      res.json({ 
        success: true, 
        data: documents 
      });
    } catch (error) {
      console.error('Error getting all ISO documents:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data dokumen ISO: ' + error.message
      });
    }
  },

  /**
   * Mendapatkan dokumen ISO berdasarkan ID
   */
  getDocumentById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await IsoDocumentsHSE.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen ISO tidak ditemukan' 
        });
      }
      
      res.json({ 
        success: true, 
        data: document 
      });
    } catch (error) {
      console.error(`Error getting ISO document with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data dokumen ISO' 
      });
    }
  },

  /**
   * Menambahkan dokumen ISO baru
   */
  addDocument: async (req, res) => {
    try {
      // Debug form data yang diterima
      console.log('Received ISO document form data:', req.body);
      
      const { 
        title, 
        uploadDate, 
        initialRegistrationDate, 
        firstSurveillanceDate, 
        secondSurveillanceDate, 
        expiryDate 
      } = req.body;
      
      let fileName = '';
      let filePath = '';
      let fileType = '';
      
      // Jika ada file yang diupload
      if (req.file) {
        fileName = req.file.originalname;
        filePath = `/uploads/iso-documents/${req.file.filename}`;
        fileType = req.file.mimetype;
      }
      
      // Penanganan string kosong menjadi null
      const parsedInitialRegistrationDate = initialRegistrationDate && initialRegistrationDate !== '' ? initialRegistrationDate : null;
      const parsedFirstSurveillanceDate = firstSurveillanceDate && firstSurveillanceDate !== '' ? firstSurveillanceDate : null;
      const parsedSecondSurveillanceDate = secondSurveillanceDate && secondSurveillanceDate !== '' ? secondSurveillanceDate : null;
      const parsedExpiryDate = expiryDate && expiryDate !== '' ? expiryDate : null;
      
      console.log('Parsed ISO date values:', {
        original: { initialRegistrationDate, firstSurveillanceDate, secondSurveillanceDate, expiryDate },
        parsed: { parsedInitialRegistrationDate, parsedFirstSurveillanceDate, parsedSecondSurveillanceDate, parsedExpiryDate }
      });
      
      const documentData = {
        title: title,
        fileName: fileName,
        filePath: filePath,
        fileType: fileType,
        uploadDate: uploadDate || new Date().toISOString().split('T')[0],
        initialRegistrationDate: parsedInitialRegistrationDate,
        firstSurveillanceDate: parsedFirstSurveillanceDate,
        secondSurveillanceDate: parsedSecondSurveillanceDate,
        expiryDate: parsedExpiryDate
      };
      
      const result = await IsoDocumentsHSE.addDocument(documentData);
      
      res.json({ 
        success: true, 
        message: 'Dokumen ISO berhasil ditambahkan', 
        data: result 
      });
    } catch (error) {
      console.error('Error adding ISO document:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat menambahkan dokumen ISO: ' + error.message 
      });
    }
  },

  /**
   * Mengupdate dokumen ISO yang sudah ada
   */
  updateDocument: async (req, res) => {
    try {
      console.log('Received update ISO document form data:', req.body);
      
      const id = parseInt(req.params.id);
      const { 
        title, 
        uploadDate, 
        initialRegistrationDate, 
        firstSurveillanceDate, 
        secondSurveillanceDate, 
        expiryDate 
      } = req.body;
      
      // Cek apakah dokumen ada
      const existingDocument = await IsoDocumentsHSE.getDocumentById(id);
      if (!existingDocument) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen ISO tidak ditemukan' 
        });
      }
      
      let fileName = existingDocument.file_name;
      let filePath = existingDocument.file_path;
      let fileType = existingDocument.file_type;
      
      // Jika ada file baru yang diupload
      if (req.file) {
        // Hapus file lama jika ada
        if (existingDocument.file_path) {
          const oldFilePath = path.join(__dirname, '../../public', existingDocument.file_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        
        fileName = req.file.originalname;
        filePath = `/uploads/iso-documents/${req.file.filename}`;
        fileType = req.file.mimetype;
      }
      
      // Penanganan string kosong menjadi null
      const parsedInitialRegistrationDate = initialRegistrationDate && initialRegistrationDate !== '' ? initialRegistrationDate : null;
      const parsedFirstSurveillanceDate = firstSurveillanceDate && firstSurveillanceDate !== '' ? firstSurveillanceDate : null;
      const parsedSecondSurveillanceDate = secondSurveillanceDate && secondSurveillanceDate !== '' ? secondSurveillanceDate : null;
      const parsedExpiryDate = expiryDate && expiryDate !== '' ? expiryDate : null;
      
      console.log('Parsed ISO update date values:', {
        original: { initialRegistrationDate, firstSurveillanceDate, secondSurveillanceDate, expiryDate },
        parsed: { parsedInitialRegistrationDate, parsedFirstSurveillanceDate, parsedSecondSurveillanceDate, parsedExpiryDate }
      });
      
      const documentData = {
        title: title,
        fileName: fileName,
        filePath: filePath,
        fileType: fileType,
        uploadDate: uploadDate || existingDocument.upload_date,
        initialRegistrationDate: parsedInitialRegistrationDate,
        firstSurveillanceDate: parsedFirstSurveillanceDate,
        secondSurveillanceDate: parsedSecondSurveillanceDate,
        expiryDate: parsedExpiryDate
      };
      
      const result = await IsoDocumentsHSE.updateDocument(id, documentData);
      
      res.json({ 
        success: true, 
        message: 'Dokumen ISO berhasil diperbarui', 
        data: result 
      });
    } catch (error) {
      console.error(`Error updating ISO document with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat memperbarui dokumen ISO: ' + error.message 
      });
    }
  },

  /**
   * Menghapus dokumen ISO
   */
  deleteDocument: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Cek apakah dokumen ada
      const document = await IsoDocumentsHSE.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen ISO tidak ditemukan' 
        });
      }
      
      // Hapus file terkait jika ada
      if (document.file_path) {
        const filePath = path.join(__dirname, '../../public', document.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Hapus dokumen dari database
      await IsoDocumentsHSE.deleteDocument(id);
      
      res.json({ 
        success: true, 
        message: 'Dokumen ISO berhasil dihapus' 
      });
    } catch (error) {
      console.error(`Error deleting ISO document with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat menghapus dokumen ISO' 
      });
    }
  },

  /**
   * Melihat file dokumen ISO
   */
  getDocumentFile: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log(`Processing ISO file view request for document ID: ${id}`);
      
      // Cek apakah dokumen ada
      const document = await IsoDocumentsHSE.getDocumentById(id);
      if (!document) {
        console.error(`ISO document with ID ${id} not found`);
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen ISO tidak ditemukan' 
        });
      }
      
      // Cek apakah dokumen memiliki file
      if (!document.file_path) {
        console.error(`ISO document with ID ${id} has no file`);
        return res.status(404).json({ 
          success: false, 
          message: 'File tidak ditemukan untuk dokumen ISO ini' 
        });
      }
      
      // Perbaiki path file
      const filePath = path.join(__dirname, '../..', document.file_path);
      console.log(`Looking for ISO file at: ${filePath}`);
      
      // Cek apakah file ada
      if (!fs.existsSync(filePath)) {
        console.error(`ISO file not found at path: ${filePath}`);
        return res.status(404).json({ 
          success: false, 
          message: 'File ISO tidak ditemukan di server' 
        });
      }
      
      console.log(`Sending ISO file ${document.file_name} (${document.file_type})`);
      
      // Set content-type yang sesuai
      res.setHeader('Content-Type', document.file_type);
      res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
      
      // Kirim file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error(`Error getting ISO document file with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil file dokumen ISO' 
      });
    }
  },

  /**
   * Mengunduh file dokumen ISO
   */
  downloadDocumentFile: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log(`Processing ISO file download request for document ID: ${id}`);
      
      // Cek apakah dokumen ada
      const document = await IsoDocumentsHSE.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen ISO tidak ditemukan' 
        });
      }
      
      // Perbaiki path file
      const filePath = path.join(__dirname, '../..', document.file_path);
      console.log(`Downloading ISO file from: ${filePath}`);
      
      // Cek apakah file ada
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          success: false, 
          message: 'File ISO tidak ditemukan di server' 
        });
      }
      
      // Ekstrak ekstensi file dan pastikan ada dalam nama file
      let fileName = document.file_name || 'document';
      const fileExtension = path.extname(fileName).toLowerCase();
      
      // Jika file tidak memiliki ekstensi, coba derive dari MIME type
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
      
      // Pastikan Content-Type diset dengan benar
      let contentType = document.file_type;
      
      // Jika content type tidak ada, derive dari ekstensi file
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
      
      // Tambahkan header yang diperlukan
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${safeFileName}`);
      res.setHeader('Content-Length', fs.statSync(filePath).size);
      
      // Header tambahan untuk browser dan proxy
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.setHeader('Pragma', 'public');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      console.log(`Sending ISO file ${fileName} with Content-Type: ${contentType}`);
      
      // Kirim file
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (error) => {
        console.error(`Error streaming ISO file: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat membaca file ISO'
          });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      console.error(`Error downloading ISO document file with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengunduh file dokumen ISO' 
      });
    }
  },

  /**
   * Mendapatkan riwayat dokumen ISO
   */
  getDocumentHistory: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Cek apakah dokumen ada
      const document = await IsoDocumentsHSE.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dokumen ISO tidak ditemukan' 
        });
      }
      
      const history = await IsoDocumentsHSE.getDocumentHistory(id);
      
      res.json({ 
        success: true, 
        message: 'Riwayat dokumen ISO berhasil diambil',
        data: history
      });
    } catch (error) {
      console.error(`Error getting ISO document history with id ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil riwayat dokumen ISO' 
      });
    }
  },

  /**
   * Mendapatkan jumlah dokumen ISO untuk statbox
   */
  getDocumentCounts: async (req, res) => {
    try {
      const counts = await IsoDocumentsHSE.getDocumentCounts();
      
      res.json({ 
        success: true, 
        data: counts 
      });
    } catch (error) {
      console.error('Error getting ISO document counts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil jumlah dokumen ISO' 
      });
    }
  }
};