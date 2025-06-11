import pool from "../../config/db.js";
import fs from 'fs';
import path from 'path';

// Fungsi untuk membersihkan dan memformat tanggal
const sanitizeDate = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    // Jika sudah dalam bentuk Date object
    if (dateInput instanceof Date) {
      // Cek apakah Date valid
      if (isNaN(dateInput.getTime())) {
        console.error('Invalid Date object');
        return null;
      }
      
      // Format ke YYYY-MM-DD
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Jika dalam bentuk string
    if (typeof dateInput === 'string') {
      // Format DD/MM/YYYY
      if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateInput.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Format YYYY-MM-DD
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateInput;
      }
      
      // Format dengan timestamp (ISO)
      if (dateInput.includes('T')) {
        return dateInput.split('T')[0];
      }
      
      // Coba parse berbagai format dengan pendekatan failsafe
      const possibleFormats = [
        // 31/12/2023
        (str) => {
          const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (match) {
            const [_, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return null;
        },
        // 31-12-2023
        (str) => {
          const match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
          if (match) {
            const [_, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return null;
        },
        // 2023/12/31
        (str) => {
          const match = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
          if (match) {
            const [_, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return null;
        }
      ];
      
      // Coba semua format yang mungkin
      for (const formatFn of possibleFormats) {
        const result = formatFn(dateInput);
        if (result) return result;
      }
      
      // Jika tidak ada format yang cocok, coba dengan Date
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      console.error(`Tidak dapat mengenali format tanggal: ${dateInput}`);
      return null;
    }
    
    // Jika tipe data tidak didukung
    console.error(`Tipe data tanggal tidak didukung: ${typeof dateInput}`);
    return null;
  } catch (error) {
    console.error(`Error saat sanitasi tanggal: ${error.message}`, error);
    return null;
  }
};

// Fungsi untuk memastikan tanggal selalu valid di form
const ensureValidDate = (formData, fieldName) => {
  try {
    if (!formData[fieldName]) return formData;
    
    const sanitized = sanitizeDate(formData[fieldName]);
    
    // Jika sanitasi gagal, kembalikan format asli untuk ditangani oleh validator form
    if (sanitized === null) return formData;
    
    // Gunakan spread operator untuk tidak memodifikasi objek asli
    return {
      ...formData,
      [fieldName]: sanitized
    };
  } catch (error) {
    console.error(`Error saat memastikan tanggal valid: ${error.message}`, error);
    return formData; // Kembalikan formData asli jika terjadi error
  }
};

// Fungsi untuk menghitung usia berdasarkan tanggal lahir
const hitungUsia = (tanggalLahir) => {
  if (!tanggalLahir) return null;
  
  try {
    const birthDate = new Date(tanggalLahir);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Jika belum ulang tahun di tahun ini
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age}`;
  } catch (error) {
    console.error(`Error saat menghitung usia: ${error.message}`);
    return null;
  }
};

// Model TarMCU untuk akses tabel tar_mcu
export const TarMCU = {
  // Fungsi dasar untuk membersihkan data
  _cleanData: (data) => {
    const cleanedData = {...data};
    
    // Definisi kolom tanggal
    const dateColumns = ['tanggal_lahir', 'awal_mcu', 'akhir_mcu', 'kontrak_awal', 'kontrak_akhir'];
    
    // Periksa dan bersihkan nilai kosong untuk kolom tanggal
    dateColumns.forEach(col => {
      if (cleanedData[col] === '' || cleanedData[col] === undefined) {
        cleanedData[col] = null;
      } else if (typeof cleanedData[col] === 'string') {
        // Pastikan format tanggal adalah YYYY-MM-DD
        if (cleanedData[col].includes('/')) {
          // Jika dalam format DD/MM/YYYY, konversi ke YYYY-MM-DD
          const [day, month, year] = cleanedData[col].split('/');
          cleanedData[col] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } 
        // Jika tanggal dengan timestamp, hapus timestamp
        else if (cleanedData[col].includes('T')) {
          cleanedData[col] = cleanedData[col].split('T')[0];
        }
      }
    });
    
    // Hitung usia jika tanggal_lahir ada
    if (cleanedData.tanggal_lahir) {
      cleanedData.usia = hitungUsia(cleanedData.tanggal_lahir);
    }

    // Handle new text fields
  const textFields = [
    'status_karyawan', 'nik', 'nik_tar', 'kk', 'npwp', 'kpj', 'bpjs', 'norek', 'bank', 
    'status_pernikahan', 'alamat_rumah', 'no_hp', 'pendidikan_terakhir', 
    'jurusan', 'universitas_sekolah'
  ];
  
  textFields.forEach(field => {
    if (cleanedData[field] === undefined) {
      cleanedData[field] = null;
    }
  });
  
  // Handle file-related fields
  const fileFields = ['bpjs', 'nik', 'kk', 'npwp', 'norek', 'kpj'];
  
  fileFields.forEach(field => {
    const fileMetaFields = [
      `${field}_filename`, 
      `${field}_filepath`, 
      `${field}_mimetype`, 
      `${field}_filesize`
    ];
    
    fileMetaFields.forEach(metaField => {
      if (cleanedData[metaField] === undefined) {
        cleanedData[metaField] = null;
      }
    });
  });
    
    return cleanedData;
  },
  
  // Helper function untuk membuat query dinamis
  _createInsertQuery: (data) => {
    // Buat salinan data dan hapus id jika ada (supaya bisa menggunakan SERIAL)
    const dataWithoutId = { ...data };
    if ('id' in dataWithoutId) {
      delete dataWithoutId.id;
    }
  
    // Bersihkan data
    const cleanData = TarMCU._cleanData(dataWithoutId);
    
    // Hanya ambil kolom dan nilai yang tidak null/undefined
    const filteredKeys = [];
    const filteredValues = [];
    
    Object.entries(cleanData).forEach(([key, value]) => {
      // Hanya masukkan field yang memiliki nilai (bukan undefined atau null)
      if (value !== undefined && value !== null && value !== '') {
        filteredKeys.push(key);
        filteredValues.push(value);
      }
    });
    
    const placeholders = filteredKeys.map((_, i) => `$${i + 1}`).join(', ');
  
    const sql = `
      INSERT INTO tar_mcu (${filteredKeys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
  
    return { sql, values: filteredValues };
  },
  
  _createUpdateQuery: (id, data) => {
    const cleanData = TarMCU._cleanData(data);
    
    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
    
    // Buat SET clause dinamis (column1 = $1, column2 = $2, ...)
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      
    // Buat query SQL dinamis
    const sql = `
      UPDATE tar_mcu
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
   
    return { sql, values: [...values, id] };
  },
  
  _createSelectQuery: (conditions = {}, orderBy = 'id ASC') => {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
   
    let whereClause = '';
    if (keys.length > 0) {
      // Buat WHERE clause dinamis (column1 = $1 AND column2 = $2 ...)
      whereClause = `WHERE ${keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')}`;
    }
   
    // Buat query SQL dinamis
    const sql = `
      SELECT * FROM tar_mcu
      ${whereClause}
      ORDER BY ${orderBy}
    `;
   
    return { sql, values };
  },
  
  _createDeleteQuery: (conditions = {}) => {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
   
    let whereClause = '';
    if (keys.length > 0) {
      // Buat WHERE clause dinamis
      whereClause = `WHERE ${keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')}`;
    }
   
    // Buat query SQL dinamis
    const sql = `
      DELETE FROM tar_mcu
      ${whereClause}
      RETURNING *
    `;
   
    return { sql, values };
  },
  
  // Fungsi untuk memeriksa apakah tabel ada
  checkTableExists: async () => {
    try {
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tar_mcu'
        );
      `;
      const result = await pool.query(sql);
      return result.rows[0].exists;
    } catch (error) {
      console.error("Error checking if table exists:", error);
      throw error;
    }
  },
  
  // Fungsi untuk mereset sequence ID
  resetSequence: async () => {
    try {
      // Cek sequence yang digunakan
      const sequenceQuery = `
        SELECT pg_get_serial_sequence('tar_mcu', 'id') as seq_name;
      `;
      const sequenceResult = await pool.query(sequenceQuery);
      const sequenceName = sequenceResult.rows[0]?.seq_name;
      
      if (!sequenceName) {
        console.error('Cannot find sequence for tar_mcu.id');
        return false;
      }
      
      // Dapatkan nilai maksimal ID yang ada
      const maxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM tar_mcu`;
      const maxIdResult = await pool.query(maxIdQuery);
      const nextId = maxIdResult.rows[0]?.next_id || 1;
      
      // Reset sequence
      const resetQuery = `SELECT setval('${sequenceName}', ${nextId}, false)`;
      await pool.query(resetQuery);
      
      console.log(`Sequence ${sequenceName} reset to ${nextId}`);
      return true;
    } catch (error) {
      console.error('Error resetting sequence:', error);
      return false;
    }
  },
  
  // Fungsi untuk validasi dan normalisasi data sebelum insert/update
  validateAndNormalizeData: (userData) => {
  try {
    // Buat salinan data untuk menghindari mutasi objek asli
    const normalizedData = { ...userData };
    
    // Validasi field yang wajib diisi
    const requiredFields = ['nama_karyawan'];
    for (const field of requiredFields) {
      if (!normalizedData[field] || normalizedData[field].toString().trim() === '') {
        throw new Error(`Field ${field} required`);
      }
    }
    
    // Normalisasi dan validasi tanggal
    const dateFields = ['tanggal_lahir', 'awal_mcu', 'akhir_mcu', 'kontrak_awal', 'kontrak_akhir'];
    for (const field of dateFields) {
      if (normalizedData[field]) {
        const sanitizedDate = sanitizeDate(normalizedData[field]);
        if (!sanitizedDate) {
          throw new Error(`Format tanggal tidak valid untuk ${field}: ${normalizedData[field]}`);
        }
        normalizedData[field] = sanitizedDate;
      }
    }
    
    // Hitung usia jika tanggal_lahir ada
    if (normalizedData.tanggal_lahir) {
      normalizedData.usia = hitungUsia(normalizedData.tanggal_lahir);
    }
    
    // PERBAIKAN: Validate format of specific fields
    if (normalizedData.bpjs && normalizedData.bpjs.length > 0 && normalizedData.bpjs.length !== 13) {
      throw new Error('BPJS must contain 13 digits');
    }
    
    if (normalizedData.kpj && normalizedData.kpj.length > 0 && normalizedData.kpj.length !== 11) {
      throw new Error('KPJ must contain 11 digits');
    }
    
    if (normalizedData.nik && normalizedData.nik.length > 0 && normalizedData.nik.length !== 16) {
      throw new Error('NIK must contain 16 digits');
    }
    
    if (normalizedData.kk && normalizedData.kk.length > 0 && normalizedData.kk.length !== 16) {
      throw new Error('Family Card Number must contain 16 digits');
    } 
    
    // PERBAIKAN: Ganti normalizedData.kk.length dengan normalizedData.npwp.length
    if (normalizedData.npwp && normalizedData.npwp.length > 0 && (normalizedData.npwp.length !== 15 && normalizedData.npwp.length !== 16)) {
      throw new Error('NPWP must contain 15-16 digits');
    }
    
    return normalizedData;
  } catch (error) {
    throw new Error(`Error validasi data: ${error.message}`);
  }
},
  
  // Fungsi untuk menampilkan semua data MCU
  getAll: async () => {
    try {
      // Periksa apakah tabel ada
      const tableExists = await TarMCU.checkTableExists();
      
      if (!tableExists) {
        console.error("Table tar_mcu does not exist!");
        return [];
      }
      
      const sql = `
        SELECT * FROM tar_mcu
        ORDER BY nama_karyawan ASC
      `;
     
      const result = await pool.query(sql);
      return result.rows;
    } catch (error) {
      console.error("Error in getAll():", error);
      if (error.code === '42P01') {
        console.error("Table tar_mcu doesn't exist");
        return [];
      }
      throw error;
    }
  },
  
  // Fungsi untuk mendapatkan data MCU berdasarkan ID
  getById: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const { sql, values } = TarMCU._createSelectQuery({ id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getById():', error);
      throw error;
    }
  },
  
  // Fungsi untuk menambah data MCU baru
  add: async (userData) => {
    try {
      await TarMCU.resetSequence();
      
      if (!userData) {
        throw new Error('Data karyawan tidak boleh kosong');
      }

      // Validasi field yang wajib ada
      if (!userData.nama_karyawan) {
        throw new Error('Nama karyawan wajib diisi');
      }
      
      // Validasi dan normalisasi data
      const normalizedData = TarMCU.validateAndNormalizeData(userData);
      
      // Siapkan dan jalankan query
      const { sql, values } = TarMCU._createInsertQuery(normalizedData);
      console.log("SQL Insert Query:", sql);
      console.log("Values:", values);
      
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in add():', error);
      throw error;
    }
  },
  
  // Fungsi untuk mengupdate data MCU
  update: async (id, userData) => {
  try {
    if (!id) {
      throw new Error('ID karyawan tidak boleh kosong');
    }
    
    if (!userData) {
      throw new Error('Data karyawan tidak boleh kosong');
    }
    
    // Cek apakah data MCU diubah (untuk history)
    const oldData = await TarMCU.getById(id);

    if (!oldData) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Pastikan nilai numerik tidak dikirim sebagai string kosong
    const processedData = { ...userData };
    
    // Periksa dan koreksi bidang numerik (contoh: usia)
    if (processedData.usia === '' || processedData.usia === null || processedData.usia === undefined) {
      processedData.usia = '0'; // gunakan nilai default
    }
    
    // Validasi dan normalisasi data
    const normalizedData = TarMCU.validateAndNormalizeData(processedData);
    
    // Buat query update yang aman
    const { sql, values } = TarMCU._createUpdateQuery(id, normalizedData);
    
    console.log("SQL Update Query:", sql);
    console.log("Values:", values);
    
    const result = await pool.query(sql, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in update():', error);
    throw error;
  }
}, 
  
  // Fungsi untuk menghapus data MCU
  delete: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const { sql, values } = TarMCU._createDeleteQuery({ id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in delete():', error);
      throw error;
    }
  },
  
  // Fungsi untuk mencari data MCU berdasarkan keyword
  search: async (keyword) => {
    try {
      if (!keyword) {
        return await TarMCU.getAll();
      }
      
      const sql = `
        SELECT * FROM tar_mcu
        WHERE 
          nama_karyawan ILIKE $1 OR
          jabatan ILIKE $1 OR
          no_kontrak ILIKE $1 OR
          jenis_kelamin ILIKE $1 OR
          usia ILIKE $1 OR
          hasil_mcu ILIKE $1 OR
          vendor_mcu ILIKE $1
        ORDER BY nama_karyawan ASC
      `;
      
      const result = await pool.query(sql, [`%${keyword}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error in search():', error);
      throw error;
    }
  },
  
  // Check apakah MCU data berubah secara signifikan
  isMCUDataChanged: (oldData, newData) => {
    if (!oldData || !newData) return false;
    
    return (
      oldData.awal_mcu !== newData.awal_mcu ||
      oldData.akhir_mcu !== newData.akhir_mcu ||
      oldData.hasil_mcu !== newData.hasil_mcu ||
      oldData.vendor_mcu !== newData.vendor_mcu ||
      oldData.keterangan_mcu !== newData.keterangan_mcu
    );
  }
};

// Model HSETarHistory untuk akses tabel hse_tar_history
export const HSETarHistory = {
  /**
   * Check if the HSE history table exists and create it if not
   */
  ensureTableExists: async () => {
    try {
      // First check if table exists
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'hse_tar_history'
        );
      `;
      
      const tableExists = await pool.query(checkTableSql);
      
      if (tableExists.rows[0].exists) {
        console.log("HSE history table already exists");
        return true;
      }
      
      // Create table if it doesn't exist
      const createTableSql = `
        CREATE TABLE hse_tar_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          nama_karyawan VARCHAR(255) NOT NULL,
          
          -- MCU data lama
          no_mcu_lama VARCHAR(255),
          awal_mcu_lama DATE,
          akhir_mcu_lama DATE,
          hasil_mcu_lama VARCHAR(255),
          vendor_mcu_lama VARCHAR(255),
          keterangan_mcu_lama TEXT,
          
          -- MCU data baru
          no_mcu_baru VARCHAR(255),
          awal_mcu_baru DATE,
          akhir_mcu_baru DATE,
          hasil_mcu_baru VARCHAR(255),
          vendor_mcu_baru VARCHAR(255),
          keterangan_mcu_baru TEXT,
          
          -- Metadata
          waktu_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          modified_by VARCHAR(100),
          
          -- Foreign key relationship
          FOREIGN KEY (user_id) REFERENCES tar_mcu(id) ON DELETE CASCADE
        );
      `;
      
      await pool.query(createTableSql);
      console.log("HSE tar history table created successfully");
      return true;
    } catch (error) {
      console.error("Error ensuring HSE history table exists:", error);
      return false;
    }
  },
  
  /**
   * Add HSE history record
   */
  addHistory: async (historyData) => {
    try {
      // Ensure table exists
      await HSETarHistory.ensureTableExists();
      
      // Validate required fields
      if (!historyData.user_id || !historyData.nama_karyawan) {
        throw new Error('user_id and nama_karyawan are required fields');
      }
      
      // Build dynamic query based on provided fields
      const keys = Object.keys(historyData);
      const values = Object.values(historyData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `
        INSERT INTO hse_tar_history (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding HSE history:', error);
      throw error;
    }
  },
  
  /**
   * Get all HSE history records for a user
   */
  getAllHistoryByUserId: async (userId) => {
    try {
      // Ensure table exists
      await HSETarHistory.ensureTableExists();
      
      const sql = `
        SELECT * FROM hse_tar_history
        WHERE user_id = $1
        ORDER BY waktu_perubahan DESC
      `;
      
      const result = await pool.query(sql, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting HSE history:', error);
      return [];
    }
  },
  
  /**
   * Check if MCU data changed significantly to warrant history recording
   */
  isMCUDataChanged: (oldData, newData) => {
    return TarMCU.isMCUDataChanged(oldData, newData);
  },
  
  /**
   * Prepare HSE history data object by comparing old and new data
   */
  prepareHistoryData: (oldData, newData, modifiedBy = 'system') => {
    return {
      user_id: oldData.id,
      nama_karyawan: oldData.nama_karyawan,
      
      // MCU old data
      no_mcu_lama: oldData.no_kontrak,
      awal_mcu_lama: oldData.awal_mcu,
      akhir_mcu_lama: oldData.akhir_mcu,
      hasil_mcu_lama: oldData.hasil_mcu,
      vendor_mcu_lama: oldData.vendor_mcu,
      keterangan_mcu_lama: oldData.keterangan_mcu,
      
      // MCU new data
      no_mcu_baru: newData.no_kontrak,
      awal_mcu_baru: newData.awal_mcu,
      akhir_mcu_baru: newData.akhir_mcu,
      hasil_mcu_baru: newData.hasil_mcu,
      vendor_mcu_baru: newData.vendor_mcu,
      keterangan_mcu_baru: newData.keterangan_mcu,
      
      // Metadata
      waktu_perubahan: new Date(),
      modified_by: modifiedBy
    };
  },
  
  /**
   * Get statistics on HSE changes
   */
  getHSEChangeStats: async () => {
    try {
      // Ensure table exists
      await HSETarHistory.ensureTableExists();
      
      const sql = `
        SELECT 
          COUNT(*) as total_changes,
          COUNT(DISTINCT user_id) as unique_users,
          MAX(waktu_perubahan) as last_change,
          MIN(waktu_perubahan) as first_change
        FROM hse_tar_history
      `;
      
      const result = await pool.query(sql);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting HSE change statistics:', error);
      return {
        total_changes: 0,
        unique_users: 0,
        last_change: null,
        first_change: null
      };
    }
  }
};

// Model DocumentsHSE untuk akses tabel documents_hse
export const DocumentsHSE = {
  /**
   * Check if the documents_hse table exists and create it if not
   */
  ensureTableExists: async () => {
    try {
      // First check if table exists
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'documents_hse'
        );
      `;
      
      const tableExists = await pool.query(checkTableSql);
      
      if (tableExists.rows[0].exists) {
        console.log("Documents HSE table already exists");
        return true;
      }
      
      // Create table if it doesn't exist
      const createTableSql = `
        CREATE TABLE documents_hse (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          file_name VARCHAR(255),
          file_path VARCHAR(255),
          file_type VARCHAR(100),
          upload_date DATE NOT NULL,
          awal_berlaku DATE,
          akhir_berlaku DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createTableSql);
      console.log("Documents HSE table created successfully");
      return true;
    } catch (error) {
      console.error("Error ensuring documents_hse table exists:", error);
      return false;
    }
  },
  
  /**
   * Get all documents
   */
  getAllDocuments: async (page = 1, limit = 20, searchTerm = '') => {
    try {
      // Ensure table exists
      await DocumentsHSE.ensureTableExists();
      
      let query = `
        SELECT id, title, file_name, file_path, file_type, 
          upload_date, awal_berlaku, akhir_berlaku, created_at, updated_at
        FROM documents_hse
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Terapkan filter pencarian jika ada
      if (searchTerm && searchTerm.trim() !== '') {
        query += ` AND title ILIKE $${paramIndex}`;
        params.push(`%${searchTerm.trim()}%`);
        paramIndex++;
      }
      
      // Hitung total dokumen untuk pagination
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_docs`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);
      
      // Tambahkan sorting dan pagination
      query += ` ORDER BY upload_date DESC, created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      
      // Calculate offset
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      
      // Debug log untuk query
      console.log('Query SQL:', query);
      console.log('Parameters:', params);
      
      const result = await pool.query(query, params);
      
      return {
        data: result.rows,
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  },
  
  /**
   * Get document by ID
   */
  getDocumentById: async (id) => {
    try {
      // Ensure table exists
      await DocumentsHSE.ensureTableExists();
      
      const query = `
        SELECT id, title, file_name, file_path, file_type, 
          upload_date, awal_berlaku, akhir_berlaku, created_at, updated_at
        FROM documents_hse
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting document with id ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Search documents by keyword
   */
  searchDocuments: async (keyword, page = 1, limit = 20) => {
    try {
      // Ensure table exists
      await DocumentsHSE.ensureTableExists();
      
      const query = `
        SELECT id, title, file_name, file_path, file_type, 
          upload_date, awal_berlaku, akhir_berlaku, created_at
        FROM documents_hse
        WHERE title ILIKE $1
        ORDER BY upload_date DESC, title
        LIMIT $2 OFFSET $3
      `;
      
      const offset = (page - 1) * limit;
      const params = [`%${keyword}%`, limit, offset];
      
      const result = await pool.query(query, params);
      
      // Hitung total untuk pagination
      const countQuery = `
        SELECT COUNT(*) FROM documents_hse
        WHERE title ILIKE $1
      `;
      
      const countResult = await pool.query(countQuery, [`%${keyword}%`]);
      const totalCount = parseInt(countResult.rows[0].count);
      
      return {
        data: result.rows,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  },
  
  /**
   * Add new document
   */
  addDocument: async (documentData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure table exists
      await DocumentsHSE.ensureTableExists();
      
      // Validasi data
      if (!documentData.title || documentData.title.trim() === '') {
        throw new Error('Judul dokumen tidak boleh kosong');
      }
      
      // Debug data yang akan disimpan ke database
      console.log('Data being saved to database:', documentData);
      
      // Prepare date fields
      const uploadDate = documentData.uploadDate || new Date().toISOString().split('T')[0];
      const awalBerlaku = documentData.awalBerlaku || null;
      const akhirBerlaku = documentData.akhirBerlaku || null;
      
      // Tambahkan dokumen baru
      const query = `
        INSERT INTO documents_hse 
        (title, file_name, file_path, file_type, upload_date, awal_berlaku, akhir_berlaku)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const params = [
        documentData.title,
        documentData.fileName || null,
        documentData.filePath || null,
        documentData.fileType || null,
        uploadDate,
        awalBerlaku,
        akhirBerlaku
      ];
      
      const result = await client.query(query, params);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding document:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Update existing document
   */
  updateDocument: async (id, documentData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure table exists
      await DocumentsHSE.ensureTableExists();
      
      // Validasi data
      if (!documentData.title || documentData.title.trim() === '') {
        throw new Error('Judul dokumen tidak boleh kosong');
      }
      
      // Perbarui dokumen
      let query = `
        UPDATE documents_hse 
        SET title = $1, 
          upload_date = $2,
          awal_berlaku = $3,
          akhir_berlaku = $4,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const params = [
        documentData.title,
        documentData.uploadDate || new Date().toISOString().split('T')[0],
        documentData.awalBerlaku || null,
        documentData.akhirBerlaku || null
      ];
      
      // Jika ada file baru yang diupload
      if (documentData.fileName) {
        query += `, file_name = $5, file_path = $6, file_type = $7`;
        params.push(documentData.fileName, documentData.filePath, documentData.fileType);
      }
      
      query += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(id);
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Dokumen dengan ID ${id} tidak ditemukan`);
      }
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error updating document with id ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Delete document
   */
  deleteDocument: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure table exists
      await DocumentsHSE.ensureTableExists();
      
      // Dapatkan informasi dokumen sebelum dihapus
      const getQuery = 'SELECT * FROM documents_hse WHERE id = $1';
      const getResult = await client.query(getQuery, [id]);
      
      if (getResult.rows.length === 0) {
        throw new Error(`Dokumen dengan ID ${id} tidak ditemukan`);
      }
      
      const documentToDelete = getResult.rows[0];
      
      // Hapus dokumen
      const deleteQuery = 'DELETE FROM documents_hse WHERE id = $1';
      await client.query(deleteQuery, [id]);
      
      await client.query('COMMIT');
      
      return documentToDelete;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error deleting document with id ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
};
  
  // Model IsoDocumentsHSE untuk akses tabel iso_documents_hse
export const IsoDocumentsHSE = {
  /**
   * Check if the iso_documents_hse table exists and create it if not
   */
  ensureTableExists: async () => {
    try {
      // First check if table exists
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'iso_documents_hse'
        );
      `;
      
      const tableExists = await pool.query(checkTableSql);
      
      if (tableExists.rows[0].exists) {
        console.log("ISO documents HSE table already exists");
        return true;
      }
      
      // Create table if it doesn't exist
      const createTableSql = `
        CREATE TABLE iso_documents_hse (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          file_name VARCHAR(255),
          file_path VARCHAR(255),
          file_type VARCHAR(100),
          upload_date DATE NOT NULL,
          initial_registration_date DATE,
          first_surveillance_date DATE,
          second_surveillance_date DATE,
          expiry_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createTableSql);
      console.log("ISO documents HSE table created successfully");
      
      // Check if history table exists
      const checkHistoryTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'iso_documents_hse_history'
        );
      `;
      
      const historyTableExists = await pool.query(checkHistoryTableSql);
      
      if (!historyTableExists.rows[0].exists) {
        // Create history table
        const createHistoryTableSql = `
          CREATE TABLE iso_documents_hse_history (
            id SERIAL PRIMARY KEY,
            document_id INTEGER NOT NULL,
            title VARCHAR(255),
            initial_registration_date_old DATE,
            initial_registration_date_new DATE,
            first_surveillance_date_old DATE,
            first_surveillance_date_new DATE,
            second_surveillance_date_old DATE,
            second_surveillance_date_new DATE,
            expiry_date_old DATE,
            expiry_date_new DATE,
            modified_by VARCHAR(100),
            change_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES iso_documents_hse(id) ON DELETE CASCADE
          );
        `;
        
        await pool.query(createHistoryTableSql);
        console.log("ISO documents HSE history table created successfully");
      }
      
      return true;
    } catch (error) {
      console.error("Error ensuring ISO documents HSE tables exist:", error);
      return false;
    }
  },
  
  /**
   * Get all ISO documents
   */
  getAllDocuments: async (page = 1, limit = 20, searchTerm = '') => {
    try {
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      let query = `
        SELECT id, title, file_name, file_path, file_type, 
          upload_date, initial_registration_date, first_surveillance_date, second_surveillance_date, expiry_date, 
          created_at, updated_at
        FROM iso_documents_hse
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Apply search filter if exists
      if (searchTerm && searchTerm.trim() !== '') {
        query += ` AND title ILIKE $${paramIndex}`;
        params.push(`%${searchTerm.trim()}%`);
        paramIndex++;
      }
      
      // Count total documents for pagination
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_docs`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);
      
      // Add sorting and pagination
      query += ` ORDER BY upload_date DESC, created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      
      // Calculate offset
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      
      // Debug log for query
      console.log('Query SQL:', query);
      console.log('Parameters:', params);
      
      const result = await pool.query(query, params);
      
      return {
        data: result.rows,
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all ISO documents:', error);
      throw error;
    }
  },
  
  /**
   * Get ISO document by ID
   */
  getDocumentById: async (id) => {
    try {
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      const query = `
        SELECT id, title, file_name, file_path, file_type, 
          upload_date, initial_registration_date, first_surveillance_date, second_surveillance_date, expiry_date, 
          created_at, updated_at
        FROM iso_documents_hse
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting ISO document with id ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Add new ISO document
   */
  addDocument: async (documentData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      // Validate data
      if (!documentData.title || documentData.title.trim() === '') {
        throw new Error('Document title is required');
      }
      
      // Debug data being saved to database
      console.log('ISO document data being saved to database:', documentData);
      
      // Prepare date fields
      const uploadDate = documentData.uploadDate || new Date().toISOString().split('T')[0];
      const initialRegistrationDate = documentData.initialRegistrationDate || null;
      const firstSurveillanceDate = documentData.firstSurveillanceDate || null;
      const secondSurveillanceDate = documentData.secondSurveillanceDate || null;
      const expiryDate = documentData.expiryDate || null;
      
      // Add new document
      const query = `
        INSERT INTO iso_documents_hse 
        (title, file_name, file_path, file_type, upload_date, 
        initial_registration_date, first_surveillance_date, second_surveillance_date, expiry_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const params = [
        documentData.title,
        documentData.fileName || null,
        documentData.filePath || null,
        documentData.fileType || null,
        uploadDate,
        initialRegistrationDate,
        firstSurveillanceDate,
        secondSurveillanceDate,
        expiryDate
      ];
      
      const result = await client.query(query, params);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding ISO document:', error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Update existing ISO document
   */
  updateDocument: async (id, documentData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      // Get original document for history tracking
      const originalDoc = await IsoDocumentsHSE.getDocumentById(id);
      if (!originalDoc) {
        throw new Error(`ISO document with ID ${id} not found`);
      }
      
      // Validate data
      if (!documentData.title || documentData.title.trim() === '') {
        throw new Error('Document title is required');
      }
      
      // Update document
      let query = `
        UPDATE iso_documents_hse 
        SET title = $1, 
          upload_date = $2,
          initial_registration_date = $3,
          first_surveillance_date = $4,
          second_surveillance_date = $5,
          expiry_date = $6,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const params = [
        documentData.title,
        documentData.uploadDate || originalDoc.upload_date,
        documentData.initialRegistrationDate || null,
        documentData.firstSurveillanceDate || null,
        documentData.secondSurveillanceDate || null,
        documentData.expiryDate || null
      ];
      
      // If there's a new file uploaded
      if (documentData.fileName) {
        query += `, file_name = $7, file_path = $8, file_type = $9`;
        params.push(documentData.fileName, documentData.filePath, documentData.fileType);
      }
      
      query += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(id);
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`ISO document with ID ${id} not found`);
      }
      
      // Check if any date fields changed for history tracking
      const dateFieldsChanged = 
        originalDoc.initial_registration_date !== documentData.initialRegistrationDate || 
        originalDoc.first_surveillance_date !== documentData.firstSurveillanceDate ||
        originalDoc.second_surveillance_date !== documentData.secondSurveillanceDate ||
        originalDoc.expiry_date !== documentData.expiryDate;
      
      // Add to history if dates changed
      if (dateFieldsChanged) {
        const historyQuery = `
          INSERT INTO iso_documents_hse_history (
            document_id,
            title,
            initial_registration_date_old,
            initial_registration_date_new,
            first_surveillance_date_old,
            first_surveillance_date_new,
            second_surveillance_date_old,
            second_surveillance_date_new,
            expiry_date_old,
            expiry_date_new,
            modified_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        
        const historyParams = [
          id,
          documentData.title,
          originalDoc.initial_registration_date,
          documentData.initialRegistrationDate || null,
          originalDoc.first_surveillance_date,
          documentData.firstSurveillanceDate || null,
          originalDoc.second_surveillance_date,
          documentData.secondSurveillanceDate || null,
          originalDoc.expiry_date,
          documentData.expiryDate || null,
          'system' // Replace with actual user if available
        ];
        
        await client.query(historyQuery, historyParams);
      }
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error updating ISO document with id ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Delete ISO document
   */
  deleteDocument: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      // Get document info before deleting
      const getQuery = 'SELECT * FROM iso_documents_hse WHERE id = $1';
      const getResult = await client.query(getQuery, [id]);
      
      if (getResult.rows.length === 0) {
        throw new Error(`ISO document with ID ${id} not found`);
      }
      
      const documentToDelete = getResult.rows[0];
      
      // Delete document
      const deleteQuery = 'DELETE FROM iso_documents_hse WHERE id = $1';
      await client.query(deleteQuery, [id]);
      
      await client.query('COMMIT');
      
      return documentToDelete;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error deleting ISO document with id ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Get document history
   */
  getDocumentHistory: async (id) => {
    try {
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      const query = `
        SELECT * FROM iso_documents_hse_history
        WHERE document_id = $1
        ORDER BY change_time DESC
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting ISO document history with id ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Check if a date is within 6 months
   */
  isWithinSixMonths: (dateStr) => {
    if (!dateStr) return false;
    
    try {
      const targetDate = new Date(dateStr);
      const today = new Date();
      
      // Calculate diff in milliseconds
      const diffTime = targetDate.getTime() - today.getTime();
      
      // Convert to days
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Check if within 6 months (approx 180 days)
      return diffDays >= 0 && diffDays <= 180;
    } catch (error) {
      console.error("Error checking if date is within six months:", error);
      return false;
    }
  },
  
  /**
   * Get counts for statbox
   */
  getDocumentCounts: async () => {
    try {
      // Ensure table exists
      await IsoDocumentsHSE.ensureTableExists();
      
      // Get all documents
      const query = `
        SELECT id, first_surveillance_date, second_surveillance_date, expiry_date
        FROM iso_documents_hse
      `;
      
      const result = await pool.query(query);
      const documents = result.rows;
      
      // Initialize counts
      const counts = {
        total: documents.length,
        firstSurveillance: 0,
        secondSurveillance: 0,
        expiry: 0
      };
      
      // Count documents with dates within 6 months
      documents.forEach(doc => {
        if (IsoDocumentsHSE.isWithinSixMonths(doc.first_surveillance_date)) {
          counts.firstSurveillance++;
        }
        
        if (IsoDocumentsHSE.isWithinSixMonths(doc.second_surveillance_date)) {
          counts.secondSurveillance++;
        }
        
        if (IsoDocumentsHSE.isWithinSixMonths(doc.expiry_date)) {
          counts.expiry++;
        }
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting ISO document counts:', error);
      return {
        total: 0,
        firstSurveillance: 0,
        secondSurveillance: 0,
        expiry: 0
      };
    }
  }
};

// Model HistoryTar untuk akses tabel history_tar
export const HistoryTar = {
  /**
   * Check if the history_tar table exists and create it if not
   */
  ensureTableExists: async () => {
    try {
      // First check if table exists
      const checkTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'history_tar'
        );
      `;
      
      const tableExists = await pool.query(checkTableSql);
      
      if (tableExists.rows[0].exists) {
        console.log("History kontrak table already exists");
        return true;
      }
      
      // Create table if it doesn't exist
      const createTableSql = `
        CREATE TABLE history_tar (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          nama_karyawan VARCHAR(255) NOT NULL,
          
          -- Kontrak data lama
          no_kontrak_lama VARCHAR(255),
          kontrak_awal_lama DATE,
          kontrak_akhir_lama DATE,
          
          -- Kontrak data baru
          no_kontrak_baru VARCHAR(255),
          kontrak_awal_baru DATE,
          kontrak_akhir_baru DATE,
          
          -- Metadata
          waktu_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          modified_by VARCHAR(100),
          
          -- Foreign key relationship
          FOREIGN KEY (user_id) REFERENCES tar_mcu(id) ON DELETE CASCADE
        );
      `;
      
      await pool.query(createTableSql);
      console.log("History kontrak table created successfully");
      return true;
    } catch (error) {
      console.error("Error ensuring history kontrak table exists:", error);
      return false;
    }
  },
  
  /**
   * Add history record
   */
  addHistory: async (historyData) => {
    try {
      // Ensure table exists
      await HistoryTar.ensureTableExists();
      
      // Validate required fields
      if (!historyData.user_id || !historyData.nama_karyawan) {
        throw new Error('user_id and nama_karyawan are required fields');
      }
      
      // Build dynamic query based on provided fields
      const keys = Object.keys(historyData);
      const values = Object.values(historyData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `
        INSERT INTO history_tar (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding contract history:', error);
      throw error;
    }
  },
  
  /**
   * Get all history records for a user
   */
  getAllHistoryByUserId: async (userId) => {
    try {
      // Ensure table exists
      await HistoryTar.ensureTableExists();
      
      const sql = `
        SELECT * FROM history_tar
        WHERE user_id = $1
        ORDER BY waktu_perubahan DESC
      `;
      
      const result = await pool.query(sql, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting contract history:', error);
      return [];
    }
  },
  
  /**
   * Check if contract data changed significantly to warrant history recording
   */
  isContractDataChanged: (oldData, newData) => {
    if (!oldData || !newData) return false;
    
    return (
      oldData.no_kontrak !== newData.no_kontrak ||
      oldData.kontrak_awal !== newData.kontrak_awal ||
      oldData.kontrak_akhir !== newData.kontrak_akhir
    );
  },
  
  /**
   * Prepare history data object by comparing old and new data
   */
  prepareHistoryData: (oldData, newData, modifiedBy = 'system') => {
    return {
      user_id: oldData.id,
      nama_karyawan: oldData.nama_karyawan,
      
      // Contract old data
      no_kontrak_lama: oldData.no_kontrak,
      kontrak_awal_lama: oldData.kontrak_awal,
      kontrak_akhir_lama: oldData.kontrak_akhir,
      
      // Contract new data
      no_kontrak_baru: newData.no_kontrak,
      kontrak_awal_baru: newData.kontrak_awal,
      kontrak_akhir_baru: newData.kontrak_akhir,
      
      // Metadata
      waktu_perubahan: new Date(),
      modified_by: modifiedBy
    };
  },
  
  /**
   * Get statistics on contract changes
   */
  getContractChangeStats: async () => {
    try {
      // Ensure table exists
      await HistoryTar.ensureTableExists();
      
      const sql = `
        SELECT 
          COUNT(*) as total_changes,
          COUNT(DISTINCT user_id) as unique_users,
          MAX(waktu_perubahan) as last_change,
          MIN(waktu_perubahan) as first_change
        FROM history_tar
      `;
      
      const result = await pool.query(sql);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting contract change statistics:', error);
      return {
        total_changes: 0,
        unique_users: 0,
        last_change: null,
        first_change: null
      };
    }
  }
};