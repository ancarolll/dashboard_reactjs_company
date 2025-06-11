// elnusa.model.js - Fixed version

import pool from "../../config/db.js";
import fs from 'fs';
import { ElnusaContractHistory } from "./elnusa_contract_history.model.js";

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
      
      // Jika sanitas gagal, kembalikan format asli untuk ditangani oleh validator form
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

  /**
 * Fungsi untuk validasi format numerik yang lebih ketat
 * @param {string|number} value - Nilai yang akan divalidasi
 * @returns {boolean} True jika valid, false jika tidak valid
 */
const isValidNumeric = (value) => {
  if (!value || value === '' || value === null || value === undefined) {
    return true; // Kosong dianggap valid
  }
  
  // Konversi ke string dan hapus spasi di awal dan akhir
  const cleanValue = value.toString().trim();
  
  // Jika kosong setelah trim, dianggap valid
  if (cleanValue === '') return true;
  
  // Daftar kata-kata/simbol yang tidak diperbolehkan (case insensitive)
  const forbiddenWords = [
    'rp', 'idr', 'usd', 'eur', 'jpy', 'sgd', 'rupiah', 'dollar', 'euro',
    'ribu', 'juta', 'miliar', 'thousand', 'million', 'billion',
    'k', 'm', 'b', 'rb'
  ];
  
  // Cek apakah mengandung kata-kata terlarang
  const lowerValue = cleanValue.toLowerCase();
  const containsForbiddenWords = forbiddenWords.some(word => lowerValue.includes(word));
  
  if (containsForbiddenWords) {
    return false;
  }
  
  // Cek karakter-karakter yang tidak diperbolehkan
  // Termasuk huruf, simbol mata uang, dan karakter khusus lainnya
  const hasInvalidChars = /[a-zA-Z$₹£€¥₽₴₦₨₡₭₩₪₫₹₨₺₽₴₦₨₡₭₩₪₫\s%@#&*()_+=\[\]{}|\\:";'<>?\/~`!]/.test(cleanValue);
  
  if (hasInvalidChars) {
    return false;
  }
  
  // Pattern untuk angka valid: 
  // - Angka biasa: 1234, 1234.56
  // - Angka dengan koma sebagai pemisah ribuan: 1,234 atau 1,234.56
  // - Angka dengan koma sebagai desimal (format Eropa): 1234,56
  // - Negatif diperbolehkan
  const validNumericPatterns = [
    /^-?\d+$/, // Integer sederhana: 1234, -1234
    /^-?\d+\.\d+$/, // Desimal dengan titik: 1234.56, -1234.56
    /^-?\d+,\d+$/, // Desimal dengan koma: 1234,56, -1234,56
    /^-?\d{1,3}(,\d{3})*$/, // Ribuan dengan koma: 1,234 atau 1,234,567
    /^-?\d{1,3}(,\d{3})*\.\d+$/ // Ribuan dengan koma dan desimal: 1,234.56
  ];
  
  // Cek apakah cocok dengan salah satu pattern valid
  const isValidPattern = validNumericPatterns.some(pattern => pattern.test(cleanValue));
  
  if (!isValidPattern) {
    return false;
  }
  
  // Validasi akhir: coba konversi ke angka
  try {
    // Normalisasi: ganti koma dengan titik untuk konversi
    let normalizedValue = cleanValue;
    
    // Jika ada koma sebagai pemisah ribuan (contoh: 1,234.56)
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleanValue)) {
      // Hapus koma pemisah ribuan
      normalizedValue = cleanValue.replace(/,/g, '');
    }
    // Jika koma sebagai desimal (contoh: 1234,56 tanpa titik)
    else if (/^\d+,\d+$/.test(cleanValue)) {
      // Ganti koma dengan titik
      normalizedValue = cleanValue.replace(',', '.');
    }
    
    const numericValue = parseFloat(normalizedValue);
    return !isNaN(numericValue) && isFinite(numericValue);
    
  } catch (error) {
    return false;
  }
};

/**
 * Memvalidasi data CSV sebelum diproses dengan validasi numerik yang lebih ketat
 * @param {Array} csvData - Data CSV yang akan divalidasi
 * @returns {Object} Hasil validasi
 */
export const validateCSVData = (csvData) => {
  if (!Array.isArray(csvData)) {
    throw new Error('Data harus berupa array');
  }
  
  const results = {
    valid: true,
    rows: csvData.length,
    errors: []
  };
  
  // Validasi header dan kolom yang diperlukan
  const requiredColumns = ['nama_karyawan', 'kontrak_awal', 'kontrak_akhir'];
  
  if (csvData.length === 0) {
    results.valid = false;
    results.errors.push({
      message: 'CSV tidak memiliki data'
    });
    return results;
  }
  
  // Cek header
  const firstRow = csvData[0];
  const headers = Object.keys(firstRow);
  
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    results.valid = false;
    results.errors.push({
      message: `Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`
    });
  }
  
  // Validasi data di setiap baris
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNum = i + 2; // +2 untuk akun header dan 0-based index
    
    // Cek kolom yang diperlukan
    for (const column of requiredColumns) {
      if (!row[column] || row[column].toString().trim() === '') {
        results.valid = false;
        results.errors.push({
          row: rowNum,
          column,
          message: `Kolom ${column} wajib diisi`
        });
      }
    }
    
    // Validasi format tanggal
    const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir'];
    const dateRegexes = [
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
    ];
    
    for (const column of dateColumns) {
      if (row[column] && row[column].toString().trim() !== '') {
        const isValidFormat = dateRegexes.some(regex => regex.test(row[column]));
        if (!isValidFormat) {
          results.valid = false;
          results.errors.push({
            row: rowNum,
            column,
            message: `Format tanggal tidak valid untuk kolom ${column}: ${row[column]}. Gunakan DD/MM/YYYY atau YYYY-MM-DD`
          });
        }
      }
    }
    
    // Validasi nilai numerik dengan fungsi yang lebih ketat
    const numericColumns = [
      'honorarium', 'gaji_pokok', 'gaji_terupdate',
      't_variabel', 't_makan', 't_transport', 't_pulsa', 't_specialis', 't_lapangan',
      'thp', 'lemburan_otomatis', 't_posisi', 't_offshore', 't_lapangan_perhari',
      't_onshore', 't_onshore_eksp', 't_warehouse_office', 't_proyek', 't_karantina',
      'tunjangan_lembur', 't_supervisor', 'tahun_masuk', 'tahun_keluar', 'usia'
    ];
    
    for (const column of numericColumns) {
      if (row[column] && row[column].toString().trim() !== '') {
        if (!isValidNumeric(row[column])) {
          results.valid = false;
          
          // Berikan pesan error yang lebih spesifik
          let errorMsg = `Format numerik tidak valid untuk kolom ${column}: "${row[column]}". `;
          
          // Deteksi jenis error yang spesifik
          const value = row[column].toString().toLowerCase();
          if (value.includes('rp') || value.includes('idr') || value.includes('rupiah')) {
            errorMsg += 'Hapus simbol mata uang seperti "Rp", "IDR", atau "Rupiah". Gunakan hanya angka (contoh: 5000000 bukan "Rp 5.000.000")';
          } else if (/[a-zA-Z]/.test(value)) {
            errorMsg += 'Hapus semua teks. Gunakan hanya angka (contoh: 5000 bukan "5000 ribu")';
          } else if (value.includes('%')) {
            errorMsg += 'Hapus simbol persen. Gunakan hanya angka (contoh: 15 bukan "15%")';
          } else {
            errorMsg += 'Gunakan hanya angka dengan titik desimal opsional (contoh: 5000 atau 5000.50)';
          }
          
          results.errors.push({
            row: rowNum,
            column,
            message: errorMsg
          });
        }
      }
    }
  }
  
  return results;
};

export const Elnusa = {

  // Pastikan fungsi-fungsi sanitasi tersedia untuk penggunaan eksternal
  sanitizeDate,
  ensureValidDate,

  // Fungsi dasar untuk membersihkan data
  _cleanData: (data) => {
    const cleanedData = {...data};
    
    // Definisi kolom tanggal
    const dateColumns = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir', 'waktu_sa'];
    
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
        // Jika tanggal dengan timestamp, hapus timestamp jika bukan waktu_sa
        else if (cleanedData[col].includes('T') && col !== 'waktu_sa') {
          cleanedData[col] = cleanedData[col].split('T')[0];
        }
      }
    });
    
    return cleanedData;
  },

  // Fungsi untuk membersihkan data numerik - perbaikan fungsi ini
  _cleanNumericData: (data) => {
    const cleanedData = {...data};
    
    // Definisi kolom numeric
    const numericColumns = [
      'tahun_masuk', 'tahun_keluar', 'usia', 
      'gaji_pokok', 'gaji_terupdate', 't_variabel', 't_makan', 't_transport', 
      't_pulsa', 't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis', 
      't_posisi', 't_offshore', 't_lapangan_perhari', 't_onshore', 
      't_onshore_eksp', 't_warehouse_office', 't_proyek', 't_karantina', 
      'tunjangan_lembur', 't_supervisor'
    ];

    const dateColumns = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
    
    // Periksa dan bersihkan nilai kosong untuk kolom numeric
    numericColumns.forEach(col => {
      if (cleanedData[col] === '' || cleanedData[col] === undefined) {
        cleanedData[col] = null;
      } else if (cleanedData[col] !== null && typeof cleanedData[col] === 'string') {
        // Konversi string ke number (mengganti koma dengan titik jika diperlukan)
        cleanedData[col] = Number(cleanedData[col].replace(',', '.'));
      }
    });

    // Periksa dan bersihkan nilai kosong untuk kolom tanggal
    dateColumns.forEach(col => {
      if (cleanedData[col] === '' || cleanedData[col] === undefined) {
        cleanedData[col] = null;
      } else if (cleanedData[col] && typeof cleanedData[col] === 'string') {
        // Pastikan format tanggal YYYY-MM-DD
        if (cleanedData[col].includes('T')) {
          cleanedData[col] = cleanedData[col].split('T')[0];
        }
      }
    });
    
    return cleanedData;
  },

  // Fungsi helper untuk membuat query dinamis
  _createInsertQuery: (data) => {
    // Buat salinan data dan hapus id jika ada (supaya bisa menggunakan SERIAL)
    const dataWithoutId = { ...data };
    if ('id' in dataWithoutId) {
      delete dataWithoutId.id;
    }
  
    // Bersihkan data
    const cleanData = Elnusa._cleanData ? Elnusa._cleanData(dataWithoutId) : dataWithoutId;
    
    // Fungsi pembersihan numerik inline jika _cleanNumericData tidak ada
    const numericColumns = [
      'tahun_masuk', 'tahun_keluar', 'usia', 
      'gaji_pokok', 'gaji_terupdate', 't_variabel', 't_makan', 't_transport', 
      't_pulsa', 't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis', 
      't_posisi', 't_offshore', 't_lapangan_perhari', 't_onshore', 
      't_onshore_eksp', 't_warehouse_office', 't_proyek', 't_karantina', 
      'tunjangan_lembur', 't_supervisor'
    ];
    
    numericColumns.forEach(col => {
      if (cleanData[col] === '' || cleanData[col] === undefined) {
        cleanData[col] = null;
      } else if (cleanData[col] !== null && typeof cleanData[col] === 'string') {
        cleanData[col] = Number(cleanData[col].replace(',', '.'));
      }
    });
  
    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
   
    const sql = `
      INSERT INTO project_elnusa (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
   
    return { sql, values };
  },
 
  _createUpdateQuery: (id, data) => {

    const cleanData = Elnusa._cleanData(data);

    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
   
    // Buat SET clause dinamis (column1 = $1, column2 = $2, ...)
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
   
    // Buat query SQL dinamis
    const sql = `
      UPDATE project_elnusa
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
      SELECT * FROM project_elnusa
      ${whereClause}
      ORDER BY ${orderBy}
    `;
   
    return { sql, values };
  },
 
  _createSelectColumnsQuery: (columns = [], conditions = {}, orderBy = 'id ASC') => {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
   
    // Pilih kolom yang akan ditampilkan
    const columnsClause = columns.length > 0 ? columns.join(', ') : '*';
   
    let whereClause = '';
    if (keys.length > 0) {
      // Buat WHERE clause dinamis
      whereClause = `WHERE ${keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')}`;
    }
   
    // Buat query SQL dinamis
    const sql = `
      SELECT ${columnsClause} FROM project_elnusa
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
      DELETE FROM project_elnusa
      ${whereClause}
      RETURNING *
    `;
   
    return { sql, values };
  },
  
  // Fungsi untuk cek apakah kolom dokumen ada di database
    checkDocumentColumns: async () => {
    try {
      const sql = `
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'project_elnusa' 
        AND column_name IN (
          'no_ktp_filename', 'no_ktp_filepath', 'no_ktp_mimetype', 'no_ktp_filesize',
          'no_kk_filename', 'no_kk_filepath', 'no_kk_mimetype', 'no_kk_filesize',
          'npwp_filename', 'npwp_filepath', 'npwp_mimetype', 'npwp_filesize',
          'no_bpjs_kesehatan_filename', 'no_bpjs_kesehatan_filepath', 'no_bpjs_kesehatan_mimetype', 'no_bpjs_kesehatan_filesize',
          'no_bpjs_tk_filename', 'no_bpjs_tk_filepath', 'no_bpjs_tk_mimetype', 'no_bpjs_tk_filesize',
          'no_rekening_filename', 'no_rekening_filepath', 'no_rekening_mimetype', 'no_rekening_filesize'
        )
      `;
      
      const result = await pool.query(sql);
      
      // All columns exist if we found all 24 (6 document types * 4 columns each)
      return result.rows.length === 24;
    } catch (error) {
      console.error("Error checking document columns:", error);
      return false;
    }
  },

    /**
   * Fungsi untuk validasi dan normalisasi data karyawan sebelum insert/update
   * @param {Object} userData - Data karyawan yang akan divalidasi
   * @returns {Object} Data yang sudah dinormalisasi
   */
  validateAndNormalizeUserData: (userData) => {
    try {
      // Buat salinan data untuk menghindari mutasi objek asli
      const normalizedData = { ...userData };
      
      // Validasi field yang wajib diisi
      const requiredFields = ['nama_karyawan', 'kontrak_awal', 'kontrak_akhir'];
      for (const field of requiredFields) {
        if (!normalizedData[field] || normalizedData[field].toString().trim() === '') {
          throw new Error(`Field ${field} wajib diisi`);
        }
      }
      
      // Normalisasi dan validasi tanggal
      const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
      for (const field of dateFields) {
        if (normalizedData[field]) {
          let validDate = false;
          let formattedDate = normalizedData[field].toString().trim();
          
          // Format DD/MM/YYYY ke YYYY-MM-DD
          if (formattedDate.includes('/')) {
            const parts = formattedDate.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              // Validasi komponen tanggal
              if (day && month && year 
                  && !isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year))
                  && parseInt(day) > 0 && parseInt(day) <= 31
                  && parseInt(month) > 0 && parseInt(month) <= 12
                  && parseInt(year) >= 1900 && parseInt(year) <= 2100) {
                
                formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                validDate = true;
              }
            }
          } 
          // Validasi YYYY-MM-DD
          else if (/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            validDate = true;
          }
          
          if (!validDate) {
            throw new Error(`Format tanggal tidak valid untuk ${field}: ${normalizedData[field]}`);
          }
          normalizedData[field] = formattedDate;
        }
      }
      
      return normalizedData;
    } catch (error) {
      // Re-throw dengan detail lebih informatif
      throw new Error(`Error validasi data: ${error.message}`);
    }
  },

  /**
   * Fungsi untuk memproses bulk insert data karyawan
   * @param {Array} usersData - Array berisi data karyawan untuk diproses
   * @returns {Object} Hasil dengan jumlah sukses, gagal, dan detail error
   */
  processBulkInsert: async (usersData) => {
    if (!Array.isArray(usersData)) {
      throw new Error('Data harus berupa array');
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      successData: []
    };
    
    // Mulai transaksi database untuk memastikan konsistensi data
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < usersData.length; i++) {
        const userData = usersData[i];
        const rowNum = i + 2; // +2 karena indeks 0-based dan baris pertama adalah header
        
        try {
          // Validasi dan normalisasi data
          const normalizedData = Elnusa.validateAndNormalizeUserData(userData);
          
          // Siapkan query untuk insert
          const { sql, values } = Elnusa._createInsertQuery(normalizedData);
          
          // Execute query
          const result = await client.query(sql, values);
          
          if (result.rows.length > 0) {
            results.success++;
            results.successData.push(result.rows[0]);
          } else {
            throw new Error('Tidak ada data yang diinsert');
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            data: userData,
            message: error.message
          });
          
          console.error(`Error processing row ${rowNum}:`, error);
        }
      }
      
      // Commit transaksi jika berhasil
      await client.query('COMMIT');
      
    } catch (error) {
      // Rollback transaksi jika terjadi error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client kembali ke pool
      client.release();
    }
    
    return results;
  },

  /**
   * Memvalidasi data CSV sebelum diproses
   * @param {Array} csvData - Data CSV yang akan divalidasi
   * @returns {Object} Hasil validasi
   */
  validateCSVData: (csvData) => {
    if (!Array.isArray(csvData)) {
      throw new Error('Data harus berupa array');
    }
    
    const results = {
      valid: true,
      rows: csvData.length,
      errors: []
    };
    
    // Validasi header dan kolom yang diperlukan
    const requiredColumns = ['nama_karyawan', 'kontrak_awal', 'kontrak_akhir'];
    
    if (csvData.length === 0) {
      results.valid = false;
      results.errors.push({
        message: 'CSV tidak memiliki data'
      });
      return results;
    }
    
    // Cek header
    const firstRow = csvData[0];
    const headers = Object.keys(firstRow);
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      results.valid = false;
      results.errors.push({
        message: `Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`
      });
    }
    
    // Validasi data di setiap baris
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2; // +2 untuk akun header dan 0-based index
      
      // Cek kolom yang diperlukan
      for (const column of requiredColumns) {
        if (!row[column] || row[column].toString().trim() === '') {
          results.valid = false;
          results.errors.push({
            row: rowNum,
            column,
            message: `Kolom ${column} wajib diisi`
          });
        }
      }
      
      // Validasi format tanggal
      const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir'];
      const dateRegexes = [
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
      ];
      
      for (const column of dateColumns) {
        if (row[column] && row[column].toString().trim() !== '') {
          const isValidFormat = dateRegexes.some(regex => regex.test(row[column]));
          if (!isValidFormat) {
            results.valid = false;
            results.errors.push({
              row: rowNum,
              column,
              message: `Format tanggal tidak valid untuk kolom ${column}: ${row[column]}. Gunakan DD/MM/YYYY atau YYYY-MM-DD`
            });
          }
        }
      }
      
      // Validasi nilai numerik
      const numericColumns = [
        'tahun_masuk', 'tahun_keluar', 'usia', 
        'gaji_pokok', 'gaji_terupdate', 't_variabel', 't_makan', 't_transport', 
        't_pulsa', 't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis', 
        't_posisi', 't_offshore', 't_lapangan_perhari', 't_onshore', 
        't_onshore_eksp', 't_warehouse_office', 't_proyek', 't_karantina', 
        'tunjangan_lembur', 't_supervisor'
      ];
      
      for (const column of numericColumns) {
        if (row[column] && row[column].toString().trim() !== '') {
          // Bersihkan nilai (ganti koma dengan titik)
          const cleanValue = row[column].toString().replace(',', '.');
          if (isNaN(parseFloat(cleanValue))) {
            results.valid = false;
            results.errors.push({
              row: rowNum,
              column,
              message: `Nilai tidak valid untuk kolom numerik ${column}: ${row[column]}`
            });
          }
        }
      }
    }
    
    return results;
  },
  
  // Fungsi untuk menambahkan kolom dokumen jika belum ada
  addDocumentColumns: async () => {
    try {
      const hasColumns = await Elnusa.checkDocumentColumns();
      
      if (hasColumns) {
        console.log("Document columns already exist");
        return true;
      }

      // Fix SQL query - there was a syntax error in your original code
      const sql = `
        ALTER TABLE project_elnusa
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
        
        ADD COLUMN IF NOT EXISTS npwp_filename VARCHAR(255),
        ADD COLUMN IF NOT EXISTS npwp_filepath VARCHAR(255),
        ADD COLUMN IF NOT EXISTS npwp_mimetype VARCHAR(100),
        ADD COLUMN IF NOT EXISTS npwp_filesize INTEGER,
        
        ADD COLUMN IF NOT EXISTS no_bpjs_kesehatan_filename VARCHAR(255),
        ADD COLUMN IF NOT EXISTS no_bpjs_kesehatan_filepath VARCHAR(255),
        ADD COLUMN IF NOT EXISTS no_bpjs_kesehatan_mimetype VARCHAR(100),
        ADD COLUMN IF NOT EXISTS no_bpjs_kesehatan_filesize INTEGER,
        
        ADD COLUMN IF NOT EXISTS no_bpjs_tk_filename VARCHAR(255),
        ADD COLUMN IF NOT EXISTS no_bpjs_tk_filepath VARCHAR(255),
        ADD COLUMN IF NOT EXISTS no_bpjs_tk_mimetype VARCHAR(100),
        ADD COLUMN IF NOT EXISTS no_bpjs_tk_filesize INTEGER,
        
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

  // Fungsi untuk memeriksa apakah tabel ada
  checkTableExists: async () => {
    try {
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'project_elnusa'
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
        SELECT pg_get_serial_sequence('project_elnusa', 'id') as seq_name;
      `;
      const sequenceResult = await pool.query(sequenceQuery);
      const sequenceName = sequenceResult.rows[0]?.seq_name;
      
      if (!sequenceName) {
        console.error('Cannot find sequence for project_elnusa.id');
        return false;
      }
      
      // Dapatkan nilai maksimal ID yang ada
      const maxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM project_elnusa`;
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

   // Fungsi untuk mengupload dokumen
    uploadDocument: async (userId, docType, fileInfo) => {
      try {
        console.log(`[DEBUG MODEL] Mulai upload dokumen ${docType} untuk user ${userId}`);
        
        // Validasi userId
        if (!userId || isNaN(parseInt(userId, 10))) {
          throw new Error(`User ID tidak valid: ${userId}`);
        }
        
        // Parse userId to integer
        userId = parseInt(userId, 10);
        
        if (!docType || !fileInfo) {
          throw new Error('Data tidak lengkap');
        }
        
        // Validasi tipe dokumen
        const validDocTypes = [
          'cv', 'ijazah', 'sertifikat', 'pkwt',
          'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'no_rekening'
        ];
        
        if (!validDocTypes.includes(docType)) {
          throw new Error('Tipe dokumen tidak valid');
        }
        
        // Pastikan kolom dokumen tersedia
        console.log(`[DEBUG MODEL] Memastikan kolom dokumen tersedia`);
        try {
          await Elnusa.addDocumentColumns();
        } catch (columnError) {
          console.error(`[ERROR MODEL] Gagal memastikan kolom dokumen: ${columnError}`);
          throw new Error(`Gagal mempersiapkan database: ${columnError.message}`);
        }
        
        // Cek apakah user ada
        console.log(`[DEBUG MODEL] Memeriksa keberadaan user ${userId}`);
        const checkUserSql = `SELECT id FROM project_elnusa WHERE id = $1`;
        const checkUserResult = await pool.query(checkUserSql, [userId]);
        
        if (checkUserResult.rows.length === 0) {
          throw new Error(`User dengan ID ${userId} tidak ditemukan`);
        }
        
        // Dapatkan info file lama jika ada
        console.log(`[DEBUG MODEL] Memeriksa file yang sudah ada untuk ${docType}`);
        const querySql = `
          SELECT ${docType}_filepath FROM project_elnusa
          WHERE id = $1
        `;
        
        const queryResult = await pool.query(querySql, [userId]);
        
        if (queryResult.rows.length === 0) {
          throw new Error('User tidak ditemukan');
        }
        
        const oldFilePath = queryResult.rows[0][`${docType}_filepath`];
        
        // Update info file di database
        console.log(`[DEBUG MODEL] Mengupdate informasi file di database`);
        const updateSql = `
          UPDATE project_elnusa 
          SET 
            ${docType}_filename = $1,
            ${docType}_filepath = $2,
            ${docType}_mimetype = $3,
            ${docType}_filesize = $4
          WHERE id = $5
          RETURNING *
        `;
        
        const updateResult = await pool.query(updateSql, [
          fileInfo.originalname,
          fileInfo.path,
          fileInfo.mimetype,
          fileInfo.size,
          userId
        ]);
        
        // Hapus file lama jika ada
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          console.log(`[DEBUG MODEL] Menghapus file lama: ${oldFilePath}`);
          fs.unlinkSync(oldFilePath);
        }
        
        console.log(`[DEBUG MODEL] Upload dokumen ${docType} untuk user ${userId} berhasil`);
        return updateResult.rows[0];
      } catch (error) {
        console.error(`[ERROR MODEL] Error upload ${docType}:`, error);
        throw error;
      }
    }, 
  
  // Fungsi untuk mendapatkan info dokumen
    getDocumentInfo: async (userId, docType) => {
    try {
      if (!userId || !docType) {
        throw new Error('Data tidak lengkap');
      }
      
      // Validate document type
      const validDocTypes = [
        'cv', 'ijazah', 'sertifikat', 'pkwt',
        'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'no_rekening'
      ];
      
      if (!validDocTypes.includes(docType)) {
        throw new Error('Tipe dokumen tidak valid');
      }
      
      const sql = `
        SELECT 
          ${docType}_filename as filename,
          ${docType}_filepath as filepath,
          ${docType}_mimetype as mimetype,
          ${docType}_filesize as filesize
        FROM project_elnusa 
        WHERE id = $1
      `;
      
      const result = await pool.query(sql, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User tidak ditemukan');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting ${docType} info:`, error);
      throw error;
    }
  },

  checkTableStructure: async () => {
    try {
      // Pertama periksa apakah tabel ada
      const tableExists = await Elnusa.checkTableExists();
      
      if (!tableExists) {
        console.error("Table project_elnusa does not exist!");
        return { error: "Table does not exist" };
      }
      
      const sql = `
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'project_elnusa'
        ORDER BY ordinal_position;
      `;
     
      const result = await pool.query(sql);
      return result.rows;
    } catch (error) {
      console.error("Error checking table structure:", error);
      throw error;
    }
  },

  /**
   * 1. Menampilkan semua data untuk halaman edit (elnusa_editprojectpage)
   * Data yang ditampilkan adalah karyawan yang tanggal akhir_kontrak belum melewati hari ini
   * DAN karyawan tanpa sebab_na
   * @returns {Array} Daftar karyawan untuk halaman edit
   */
  getAll: async () => {
    try {
      // Periksa apakah tabel ada
      const tableExists = await Elnusa.checkTableExists();
      
      if (!tableExists) {
        console.error("Table project_elnusa does not exist!");
        return [];
      }
      
      const sql = `
        SELECT * FROM project_elnusa
        WHERE (kontrak_akhir >= CURRENT_DATE) AND (sebab_na IS NULL)
        ORDER BY kontrak_akhir ASC
      `;
     
      console.log("Executing SQL:", sql);
     
      const result = await pool.query(sql);
     
      // Debug: log jumlah baris hasil query
      console.log(`Query returned ${result.rowCount} rows`);

      // If no rows returned, get all rows for debugging
      if (result.rowCount === 0) {
        console.log('No rows returned with filters, checking all rows for debugging');
        const allRows = await pool.query('SELECT id, nama_karyawan, kontrak_akhir, sebab_na FROM project_elnusa LIMIT 10');
        console.log('Sample data:', allRows.rows);
      }

      return result.rows;
    } catch (error) {
      console.error("Error in getAll():", error);
      if (error.code === '42P01') {
        console.error("Table project_elnusa doesn't exist");
        return [];
      }
      throw error;
    }
  },

  /**
   * Menampilkan user untuk halaman NA (elnusa_naprojectpage)
   * Data yang ditampilkan adalah karyawan yang tanggal akhir_kontrak sudah melewati hari ini
   * ATAU karyawan dengan sebab_na tidak kosong
   * @returns {Array} Daftar karyawan yang masuk kriteria NA
   */
  getNAUsers: async () => {
    try {
      // Periksa apakah tabel ada
      const tableExists = await Elnusa.checkTableExists();
      
      if (!tableExists) {
        console.error("Table project_elnusa does not exist!");
        return [];
      }
      
      const sql = `
        SELECT * FROM project_elnusa
        WHERE kontrak_akhir < CURRENT_DATE OR sebab_na IS NOT NULL
        ORDER BY kontrak_akhir DESC
      `;
     
      console.log("Executing SQL:", sql);
     
      const result = await pool.query(sql);
      console.log(`Query returned ${result.rowCount} rows`);
     
      return result.rows;
    } catch (error) {
      console.error("Error in getNAUsers():", error);
      if (error.code === '42P01') {
        console.error("Table project_elnusa doesn't exist");
        return [];
      }
      throw error;
    }
  },

  /**
   * Memulihkan user dari halaman NA ke halaman edit
   * @param {number} id - ID karyawan
   * @returns {Object} Data karyawan setelah dipulihkan
   */
  restoreUser: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      // Cek tanggal akhir_kontrak karyawan
      const userSql = `SELECT * FROM project_elnusa WHERE id = $1`;
      const userResult = await pool.query(userSql, [id]);
     
      if (userResult.rows.length === 0) {
        throw new Error('Karyawan tidak ditemukan');
      }
     
      const user = userResult.rows[0];
      console.log(`Memulihkan karyawan: ${user.nama_karyawan} (ID: ${id})`);
    
      // Sesuai kebutuhan: HANYA hapus sebab_na, TIDAK mengubah kontrak
      // Hal ini memaksa user untuk mengupdate kontrak di halaman edit
      const updateData = { 
        sebab_na: null 
      };
  
      // Update data
      const { sql, values } = Elnusa._createUpdateQuery(id, updateData);
      const result = await pool.query(sql, values);
  
      console.log(`Karyawan ${user.nama_karyawan} (ID: ${id}) berhasil dipulihkan (sebab_na dihapus)`);
      console.log(`User perlu mengubah tanggal kontrak dan nomor kontrak untuk kembali aktif`);
  
      // Kembalikan seluruh data, bukan hanya data yang baru diupdate
      // Ini memastikan data seperti tanggal_lahir tersimpan dan tidak kosong
      return await Elnusa.getUserById(id);
    } catch (error) {
      console.error(`Error in restoreUser() for ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * 2. Menambah user baru (tambahuser_elnusa)
   * @param {Object} userData - Data karyawan yang akan ditambahkan
   * @returns {Object} Data karyawan yang baru ditambahkan
   */
  addUser: async (userData) => {
    try {

      await Elnusa.resetSequence();
      
      if (!userData) {
        throw new Error('Data karyawan tidak boleh kosong');
      }

      // Validasi field yang wajib ada
      if (!userData.nama_karyawan) {
        throw new Error('Nama karyawan wajib diisi');
      }

      if (!userData.kontrak_awal) {
        throw new Error('Tanggal mulai kontrak wajib diisi');
      }
      
      if (!userData.kontrak_akhir) {
        throw new Error('Tanggal akhir kontrak wajib diisi');
      }
      
      // Cek tanggal akhir kontrak
      if (userData.kontrak_akhir) {
        const endDate = new Date(userData.kontrak_akhir);
        const today = new Date();
       
        // Jika tanggal akhir kontrak sudah lewat, otomatis isi sebab_na dengan 'EOC'
        if (endDate < today && !userData.sebab_na) {
          userData.sebab_na = 'EOC';
        }
      }
     
      const { sql, values } = Elnusa._createInsertQuery(userData);
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in addUser():', error);
      throw error;
    }
  },

  /**
   * 3. Mendapatkan data user berdasarkan ID
   * @param {number} id - ID karyawan
   * @returns {Object} Data karyawan dengan ID tersebut
   */
  getUserById: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const { sql, values } = Elnusa._createSelectQuery({ id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getUserById():', error);
      throw error;
    }
  },

  /**
   * 3. Mengedit user berdasarkan ID (tambahuser_elnusa)
   * @param {number} id - ID karyawan
   * @param {Object} userData - Data karyawan yang akan diupdate
   * @returns {Object} Data karyawan setelah diupdate
   */
  updateUser: async (id, userData) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      if (!userData) {
        throw new Error('Data karyawan tidak boleh kosong');
      }
      
      // Cek apakah data kontrak diubah (untuk history)
      const oldData = await Elnusa.getUserById(id);

      if (!oldData) {
        throw new Error(`User with ID ${id} not found`);
      }

      const cleanedUserData = Elnusa._cleanData(userData);

      const isKontrakChanged =
        userData.no_kontrak !== oldData.no_kontrak ||
        userData.kontrak_awal !== oldData.kontrak_awal ||
        userData.kontrak_akhir !== oldData.kontrak_akhir;
     
      // Update data user
      const { sql, values } = Elnusa._createUpdateQuery(id, cleanedUserData);
      const result = await pool.query(sql, values);
     
      // Jika kontrak berubah, simpan history
      if (isKontrakChanged) {
        await Elnusa.saveKontrakHistory(id, oldData, cleanedUserData);
      }
     
      return result.rows[0];
    } catch (error) {
      console.error('Error in updateUser():', error);
      throw error;
    }
  },

  /**
   * 4. Menyimpan riwayat perubahan kontrak
   * @param {number} userId - ID karyawan
   * @param {Object} oldData - Data kontrak lama
   * @param {Object} newData - Data kontrak baru
   * @returns {Object} Data history yang disimpan
   */
  saveKontrakHistory: async (userId, oldData, newData) => {
    try {
      if (!userId) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      // Periksa apakah tabel history_elnusa ada
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'history_elnusa'
        );
      `;
      const tableExists = await pool.query(sql);
      
      if (!tableExists.rows[0].exists) {
        console.error("Table history_elnusa does not exist!");
        // Jika tabel tidak ada, buat log tapi jangan gagalkan operasi utama
        console.log("Cannot save contract history as history_elnusa table doesn't exist");
        return null;
      }
      
      const historyData = {
        user_id: userId,
        no_kontrak_lama: oldData.no_kontrak,
        kontrak_awal_lama: oldData.kontrak_awal,
        kontrak_akhir_lama: oldData.kontrak_akhir,
        no_kontrak_baru: newData.no_kontrak,
        kontrak_awal_baru: newData.kontrak_awal,
        kontrak_akhir_baru: newData.kontrak_akhir,
        tanggal_perubahan: new Date()
      };
     
      // Buat query insert untuk history
      const keys = Object.keys(historyData);
      const values = Object.values(historyData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
     
      const historySql = `
        INSERT INTO history_elnusa (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
     
      const result = await pool.query(historySql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in saveKontrakHistory():', error);
      // Jangan gagalkan operasi utama jika history gagal
      return null;
    }
  },

  /**
   * Mendapatkan riwayat kontrak berdasarkan ID user
   * @param {number} userId - ID karyawan
   * @returns {Array} Daftar riwayat kontrak
   */
  getKontrakHistory: async (userId) => {
    try {
      if (!userId) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      // Periksa apakah tabel history_elnusa ada
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'history_elnusa'
        );
      `;
      const tableExists = await pool.query(sql);
      
      if (!tableExists.rows[0].exists) {
        console.error("Table history_elnusa does not exist!");
        return [];
      }
      
      const historySql = `
        SELECT * FROM history_elnusa
        WHERE user_id = $1
        ORDER BY tanggal_perubahan DESC
      `;
     
      const result = await pool.query(historySql, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getKontrakHistory():', error);
      return [];
    }
  },

  /**
   * 5. Memindahkan user ke halaman NA berdasarkan akhir_kontrak
   * @param {number} id - ID karyawan
   * @param {string} sebab_na - Alasan tidak aktif
   * @returns {Object} Data karyawan setelah diupdate
   */
  updateUserStatus: async (id, sebab_na = null) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      // Konversi ID ke integer untuk keamanan
      const userId = parseInt(id, 10);
      
      console.log(`Memulai updateUserStatus untuk ID ${userId} dengan sebab_na=${sebab_na || 'null'}`);
      
      // Cek data karyawan
      const userSql = `SELECT * FROM project_elnusa WHERE id = $1`;
      const userResult = await pool.query(userSql, [userId]);
     
      if (userResult.rows.length === 0) {
        throw new Error(`Karyawan dengan ID ${userId} tidak ditemukan`);
      }
     
      const user = userResult.rows[0];
      console.log(`Memeriksa status karyawan ${user.nama_karyawan} (ID: ${userId})`);
      
      // Buat query update yang lebih eksplisit
      const updateSql = `
        UPDATE project_elnusa 
        SET sebab_na = $1
        WHERE id = $2
        RETURNING *
      `;
      
      // Jalankan query dengan error handling
      try {
        const result = await pool.query(updateSql, [sebab_na, userId]);
        
        if (result.rows.length === 0) {
          throw new Error(`Update gagal untuk karyawan ID ${userId}`);
        }
        
        console.log(`Update berhasil untuk karyawan ID ${userId}`);
        return result.rows[0];
      } catch (dbError) {
        console.error(`Database error saat update:`, dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
    } catch (error) {
      console.error(`Error in updateUserStatus() for ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * 6. Menghapus user (elnusa_naprojectpage)
   * @param {number} id - ID karyawan
   * @returns {Object} Data karyawan yang dihapus
   */
  deleteUser: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      // Check if history_elnusa table exists before attempting to delete history records
      const checkHistoryTableSql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'history_elnusa'
        );
      `;
      const historyTableExists = await pool.query(checkHistoryTableSql);
      
      // Delete associated history records if table exists
      if (historyTableExists.rows[0].exists) {
        const historySql = `DELETE FROM history_elnusa WHERE user_id = $1`;
        await pool.query(historySql, [id]);
      }
     
      // Then delete the user
      const { sql, values } = Elnusa._createDeleteQuery({ id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in deleteUser():', error);
      throw error;
    }
  },

  /**
   * 7. Menampilkan sebagian kolom untuk halaman view (elnusa_viewprojectpage)
   * Data yang ditampilkan adalah karyawan yang tanggal akhir_kontrak belum melewati hari ini
   * @returns {Array} Daftar karyawan dengan kolom terbatas dan akhir_kontrak belum terlewati
   */
  getViewData: async () => {
    try {
      // Periksa apakah tabel ada
      const tableExists = await Elnusa.checkTableExists();
      
      if (!tableExists) {
        console.error("Table project_elnusa does not exist!");
        return [];
      }
      
      const columns = [
        'id', 'nama_karyawan', 'jabatan', 'sebab_na', 'nik_elnusa', 'nik_vendor',
        'no_kontrak', 'kontrak_awal', 'kontrak_akhir', 'status_karyawan',
        'proyek', 'unit', 'tanggal_lahir', 'alamat_email', 'nomor_telepon',
        // Tambahkan kolom dokumen CV
        'cv_filename', 'cv_filepath', 'cv_mimetype', 'cv_filesize',
        // Tambahkan kolom dokumen Ijazah
        'ijazah_filename', 'ijazah_filepath', 'ijazah_mimetype', 'ijazah_filesize',
        // Tambahkan kolom dokumen Sertifikat
        'sertifikat_filename', 'sertifikat_filepath', 'sertifikat_mimetype', 'sertifikat_filesize',
        'pkwt_filename', 'pkwt_filepath', 'pkwt_mimetype', 'pkwt_filesize',
      ];
      const columnsStr = columns.join(',');
     
      const sql = `
      SELECT ${columnsStr} FROM project_elnusa
      WHERE (kontrak_akhir >= CURRENT_DATE OR kontrak_akhir IS NULL) AND (sebab_na IS NULL)
      ORDER BY kontrak_akhir ASC`;
      
      const result = await pool.query(sql);
      return result.rows;
    } catch (error) {
      console.error('Error in getViewData():', error);
      if (error.code === '42P01') {
        console.error("Table project_elnusa doesn't exist");
        return [];
      }
      throw error;
    }
  },

  /**
   * Check untuk kontrak yang sudah lewat batas
   * @returns {Array} Daftar ID karyawan dengan kontrak yang sudah expired
   */
  checkExpiredKontrak: async () => {
    try {
      // Periksa apakah tabel ada
      const tableExists = await Elnusa.checkTableExists();
      
      if (!tableExists) {
        console.error("Table project_elnusa does not exist!");
        return [];
      }
      
      // Cetak tanggal hari ini dari database untuk debugging
      const currentDateResult = await pool.query('SELECT CURRENT_DATE as today');
      console.log('Tanggal dari database:', currentDateResult.rows[0].today);
      
      // Ambil data lengkap dari karyawan dengan kontrak kedaluwarsa
      const sql = `
        SELECT * FROM project_elnusa
        WHERE kontrak_akhir < CURRENT_DATE AND sebab_na IS NULL
        ORDER BY kontrak_akhir ASC
      `;
      
      console.log("Executing expired contract check query:", sql);
      
      const result = await pool.query(sql);
      console.log(`Query checkExpiredKontrak mengembalikan ${result.rowCount} kontrak yang berakhir`);
      
      if (result.rowCount > 0) {
        console.log('Detail kontrak berakhir:');
        result.rows.forEach(row => {
          console.log(`- ID: ${row.id}, Nama: ${row.nama_karyawan}, Kontrak Akhir: ${row.kontrak_akhir}`);
        });
      }
      
      return result.rows;
    } catch (error) {
      console.error('Error in checkExpiredKontrak():', error);
      if (error.code === '42P01') {
        console.error("Table project_elnusa doesn't exist");
        return [];
      }
      throw error;
    }
  },
 
  /**
   * Mendapatkan data pendapatan karyawan berdasarkan ID
   * @param {number} id - ID karyawan
   * @returns {Object} Data pendapatan karyawan
   */
  getSalaryData: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const columns = [
        'id', 'nama_karyawan', 'gaji_pokok', 'gaji_terupdate',
        't_variabel', 't_makan', 't_transport', 't_pulsa',
        't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis',
        't_posisi', 't_offshore', 't_lapangan_perhari', 't_onshore',
        't_onshore_eksp', 't_warehouse_office', 't_proyek',
        't_karantina', 'tunjangan_lembur', 't_supervisor',
        'honorarium'
      ];
     
      const { sql, values } = Elnusa._createSelectColumnsQuery(columns, { id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getSalaryData():', error);
      throw error;
    }
  },
 
  /**
   * Mendapatkan data personal karyawan berdasarkan ID
   * @param {number} id - ID karyawan
   * @returns {Object} Data personal karyawan
   */
  getPersonalData: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const columns = [
        'id', 'nama_karyawan', 'alamat_lengkap_domisili', 'jenis_kelamin', 'asuransi_lainnya', 'hse', 'cv',
        'tanggal_lahir', 'usia', 'agama', 'status_perkawinan',
        'pendidikan_terakhir', 'nama_instansi_pendidikan', 'jurusan',
        'tahun_masuk', 'tahun_keluar', 'alamat_email', 'nomor_telepon',
        'nomor_telepon_darurat', 'nama_telepon_darurat'
      ];
     
      const { sql, values } = Elnusa._createSelectColumnsQuery(columns, { id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getPersonalData():', error);
      throw error;
    }
  },

    /**
   * Membandingkan data kontrak lama dan baru untuk mendeteksi perubahan
   * @param {Object} oldData - Data kontrak lama
   * @param {Object} newData - Data kontrak baru
   * @returns {boolean} True jika ada perubahan, false jika tidak
   */
  _isContractChanged: (oldData, newData) => {
    if (!oldData || !newData) return false;
    
    return (
      oldData.no_kontrak !== newData.no_kontrak ||
      oldData.kontrak_awal !== newData.kontrak_awal ||
      oldData.kontrak_akhir !== newData.kontrak_akhir
    );
  },

  /**
   * Menghapus dokumen dari database dan filesystem
   * @param {number} userId - ID karyawan
   * @param {string} docType - Tipe dokumen (cv, ijazah, sertifika, pkwt)
   */
    deleteDocument: async (userId, docType) => {
    try {
      // Update file fields to null
      const updateFields = {
        [`${docType}_filename`]: null,
        [`${docType}_filepath`]: null,
        [`${docType}_mimetype`]: null,
        [`${docType}_filesize`]: null
      };
      
      const updateEntries = Object.entries(updateFields);
      const placeholders = updateEntries.map((_, i) => `${updateEntries[i][0]} = $${i + 1}`);
      
      const query = `
        UPDATE project_elnusa
        SET ${placeholders.join(', ')}
        WHERE id = $${updateEntries.length + 1}
        RETURNING *
      `;
      
      const values = [...Object.values(updateFields), userId];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User tidak ditemukan');
      }
      
      console.log(`Berhasil menghapus referensi dokumen ${docType} untuk user ID ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting ${docType} document:`, error);
      throw error;
    }
  },

  /**
   * Update user dan catat riwayat jika kontrak berubah
   * @param {number} id - ID karyawan
   * @param {Object} userData - Data karyawan yang akan diupdate
   * @param {string} modifiedBy - Nama/ID pengguna yang melakukan perubahan
   * @returns {Object} Data karyawan setelah update
   */
  updateUserWithHistory: async (id, userData, modifiedBy = 'system') => {
    try {
      // Get current user data
      const oldUserData = await Elnusa.getUserById(id);
      if (!oldUserData) {
        throw new Error(`User dengan ID ${id} tidak ditemukan`);
      }
      
      // Check if contract data is changed
      const isContractChanged = Elnusa._isContractChanged(oldUserData, userData);
      
      // Begin transaction
      await pool.query('BEGIN');
      
      // Update user data
      const updateResult = await Elnusa.updateUser(id, userData);
      
      // If contract changed, record the change history
      if (isContractChanged) {
        try {
          await ElnusaContractHistory.addHistory({
            user_id: id,
            nama_karyawan: userData.nama_karyawan || oldUserData.nama_karyawan,
            no_kontrak_lama: oldUserData.no_kontrak,
            kontrak_awal_lama: oldUserData.kontrak_awal,
            kontrak_akhir_lama: oldUserData.kontrak_akhir,
            no_kontrak_baru: userData.no_kontrak,
            kontrak_awal_baru: userData.kontrak_awal,
            kontrak_akhir_baru: userData.kontrak_akhir,
            modified_by: modifiedBy
          });
        } catch (historyError) {
          console.error('Error mencatat riwayat kontrak:', historyError);
          // Lanjutkan dengan update meskipun pencatatan riwayat gagal
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      return updateResult;
    } catch (error) {
      // Rollback jika terjadi error
      await pool.query('ROLLBACK');
      console.error('Error di updateUserWithHistory:', error);
      throw error;
    }
  }, 

  /**
   * Mendapatkan data administrasi karyawan berdasarkan ID
   * @param {number} id - ID karyawan
   * @returns {Object} Data administrasi karyawan
   */
  getAdminData: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const columns = [
        'id', 'nama_karyawan', 'no_ktp', 'no_kk', 'no_bpjs_kesehatan',
        'keterangan_bpjs_kesehatan', 'no_bpjs_tk', 'keterangan_bpjs_tk',
        'npwp', 'nama_pemilik_buku_tabungan', 'no_rekening', 'bank_penerbit',
        'hak_asuransi'
      ];
     
      const { sql, values } = Elnusa._createSelectColumnsQuery(columns, { id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getAdminData():', error);
      throw error;
    }
  },

  /**
   * Mendapatkan data sertifikasi karyawan berdasarkan ID
   * @param {number} id - ID karyawan
   * @returns {Object} Data sertifikasi karyawan
   */
  getCertificationData: async (id) => {
    try {
      if (!id) {
        throw new Error('ID karyawan tidak boleh kosong');
      }
      
      const columns = [
        'id', 'nama_karyawan', 
        'awal_mcu', 'akhir_mcu', 'hasil_mcu', 'vendor_mcu',
        'no_hsepassport', 'awal_hsepassport', 'akhir_hsepassport',
        'no_siml', 'awal_siml', 'akhir_siml', 'hse'
      ];
    
      const { sql, values } = Elnusa._createSelectColumnsQuery(columns, { id });
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getCertificationData:', error);
      throw error;
    }
  },

  //HSE

  /**
   * Mendapatkan data HSE untuk karyawan dengan hse = 'RIG EMR'
   * @returns {Array} Daftar karyawan RIG EMR dengan data HSE
   */
  getHSEData: async () => {
    try {
      // Periksa apakah tabel ada
      const tableExists = await Elnusa.checkTableExists();
      
      if (!tableExists) {
        console.error("Tabel project_elnusa tidak ditemukan!");
        return [];
      }
      
      // Ambil semua data karyawan dengan kolom-kolom yang relevan untuk HSE
      // dan filter khusus untuk yang memiliki hse = 'RIG EMR'
      const sql = `
        SELECT   id, nama_karyawan, jabatan, sebab_na, no_kontrak, no_ktp, nik_elnusa,
          tanggal_lahir, awal_mcu, akhir_mcu, hasil_mcu, vendor_mcu,
          alamat_lengkap_domisili, nomor_telepon, no_hsepassport, awal_hsepassport, akhir_hsepassport,
          no_siml, awal_siml, akhir_siml, hse
        FROM project_elnusa
        WHERE hse = 'RIG EMR'
        ORDER BY nama_karyawan ASC
      `;
    
      console.log("Executing SQL for Elnusa HSE data:", sql);
    
      const result = await pool.query(sql);
    
      // Debug: log jumlah baris hasil query
      console.log(`Query untuk data HSE Elnusa mengembalikan ${result.rowCount} baris`);

      return result.rows;
    } catch (error) {
      console.error("Error in getHSEData():", error);
      if (error.code === '42P01') {
        console.error("Tabel project_elnusa tidak ada");
        return [];
      }
      throw error;
    }
  },

  // Fungsi untuk memeriksa apakah tabel sertifikat_elnusa ada
checkSertifikatTableExists: async () => {
  try {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sertifikat_elnusa'
      );
    `;
    const result = await pool.query(sql);
    return result.rows[0].exists;
  } catch (error) {
    console.error("Error checking if sertifikat table exists:", error);
    throw error;
  }
},

  // Fungsi untuk membuat tabel sertifikat jika belum ada
  createSertifikatTable: async () => {
    try {
      // Periksa apakah tabel sudah ada
      const tableExists = await Elnusa.checkSertifikatTableExists();
      
      if (tableExists) {
        console.log("Table sertifikat_elnusa already exists");
        return true;
      }
      
      // Buat tabel jika belum ada
      const sql = `
        CREATE TABLE sertifikat_elnusa (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES project_elnusa(id) ON DELETE CASCADE,
          judul_sertifikat VARCHAR(255) NOT NULL,
          tanggal_awal_berlaku DATE,
          tanggal_akhir_berlaku DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(sql);
      console.log("Table sertifikat_elnusa created successfully");
      return true;
    } catch (error) {
      console.error("Error creating sertifikat table:", error);
      throw error;
    }
  },

  // Fungsi untuk menambahkan sertifikat baru
  addSertifikat: async (sertifikatData) => {
    try {
      // Validasi data
      if (!sertifikatData.user_id || !sertifikatData.judul_sertifikat) {
        throw new Error('Data sertifikat tidak lengkap');
      }
      
      // Pastikan tanggal dalam format YYYY-MM-DD
      if (sertifikatData.tanggal_awal_berlaku) {
        sertifikatData.tanggal_awal_berlaku = sanitizeDate(sertifikatData.tanggal_awal_berlaku);
      }
      if (sertifikatData.tanggal_akhir_berlaku) {
        sertifikatData.tanggal_akhir_berlaku = sanitizeDate(sertifikatData.tanggal_akhir_berlaku);
      }
      
      const sql = `
        INSERT INTO sertifikat_elnusa (
          user_id, judul_sertifikat, tanggal_awal_berlaku, tanggal_akhir_berlaku
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        sertifikatData.user_id,
        sertifikatData.judul_sertifikat,
        sertifikatData.tanggal_awal_berlaku,
        sertifikatData.tanggal_akhir_berlaku
      ];
      
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding sertifikat:', error);
      throw error;
    }
  },

  // Fungsi untuk mendapatkan sertifikat berdasarkan user_id
  getSertifikatByUserId: async (userId) => {
    try {
      if (!userId) {
        throw new Error('ID user tidak boleh kosong');
      }
      
      const sql = `
        SELECT * FROM sertifikat_elnusa
        WHERE user_id = $1
        ORDER BY tanggal_akhir_berlaku ASC
      `;
      
      const result = await pool.query(sql, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting sertifikat by userId:', error);
      throw error;
    }
  },

  // Fungsi untuk mendapatkan sertifikat berdasarkan id
  getSertifikatById: async (id) => {
    try {
      if (!id) {
        throw new Error('ID sertifikat tidak boleh kosong');
      }
      
      const sql = `
        SELECT * FROM sertifikat_elnusa
        WHERE id = $1
      `;
      
      const result = await pool.query(sql, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting sertifikat by id:', error);
      throw error;
    }
  },

  // Fungsi untuk mengupdate sertifikat
  updateSertifikat: async (id, sertifikatData) => {
    try {
      if (!id) {
        throw new Error('ID sertifikat tidak boleh kosong');
      }
      
      if (!sertifikatData) {
        throw new Error('Data sertifikat tidak boleh kosong');
      }
      
      // Pastikan tanggal dalam format YYYY-MM-DD
      if (sertifikatData.tanggal_awal_berlaku) {
        sertifikatData.tanggal_awal_berlaku = sanitizeDate(sertifikatData.tanggal_awal_berlaku);
      }
      if (sertifikatData.tanggal_akhir_berlaku) {
        sertifikatData.tanggal_akhir_berlaku = sanitizeDate(sertifikatData.tanggal_akhir_berlaku);
      }
      
      const sql = `
        UPDATE sertifikat_elnusa
        SET 
          judul_sertifikat = $1,
          tanggal_awal_berlaku = $2,
          tanggal_akhir_berlaku = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const values = [
        sertifikatData.judul_sertifikat,
        sertifikatData.tanggal_awal_berlaku,
        sertifikatData.tanggal_akhir_berlaku,
        id
      ];
      
      const result = await pool.query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Sertifikat tidak ditemukan');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating sertifikat:', error);
      throw error;
    }
  },

  // Fungsi untuk menghapus sertifikat
  deleteSertifikat: async (id) => {
    try {
      if (!id) {
        throw new Error('ID sertifikat tidak boleh kosong');
      }
      
      const sql = `
        DELETE FROM sertifikat_elnusa
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(sql, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Sertifikat tidak ditemukan');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting sertifikat:', error);
      throw error;
    }
  }
};



/// upload.controller

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