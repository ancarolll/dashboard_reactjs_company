import pool from "../../config/db.js";
import fs from 'fs';
import { Regional2xContractHistory } from "./regional2x_contract_history.model.js";

const validTypes = [
  'cv', 'ijazah', 'sertifikat', 'pkwt',
  'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk', 'no_rekening'
];

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
    
    export const Regional2x = {
    
    // Pastikan fungsi-fungsi sanitasi tersedia untuk penggunaan eksternal
    sanitizeDate,
    ensureValidDate,
    
    // Fungsi dasar untuk membersihkan data
    _cleanData: (data) => {
        const cleanedData = {...data};
        
        // Definisi kolom tanggal
        const dateColumns = ['kontrak_awal', 'kontrak_akhir'];
        
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
    
        const dateColumns = ['kontrak_awal', 'kontrak_akhir'];
        
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
    const cleanData = Regional2x._cleanData ? Regional2x._cleanData(dataWithoutId) : dataWithoutId;
    
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
        INSERT INTO project_pertamina_ep_regional2_eksplorasi (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
    `;
    
    return { sql, values };
    },
    
    _createUpdateQuery: (id, data) => {

        const cleanData = Regional2x._cleanData(data);

        // Pastikan field file null tetap null (tidak di-strip)
        const fileFields = [
        'cv_filename', 'cv_filepath', 'cv_mimetype', 'cv_filesize',
        'ijazah_filename', 'ijazah_filepath', 'ijazah_mimetype', 'ijazah_filesize',
        'sertifikat_filename', 'sertifikat_filepath', 'sertifikat_mimetype', 'sertifikat_filesize',
        'pkwt_filename', 'pkwt_filepath', 'pkwt_mimetype', 'pkwt_filesize'
        ];
    
        fileFields.forEach(field => {
        if (field in data && data[field] === null) {
            cleanData[field] = null;
        }
        });

        const keys = Object.keys(cleanData);
        const values = Object.values(cleanData);
        
        // Buat SET clause dinamis (column1 = $1, column2 = $2, ...)
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        
        // Buat query SQL dinamis
        const sql = `
            UPDATE project_pertamina_ep_regional2_eksplorasi
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
        SELECT * FROM project_pertamina_ep_regional2_eksplorasi
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
        SELECT ${columnsClause} FROM project_pertamina_ep_regional2_eksplorasi
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
        DELETE FROM project_pertamina_ep_regional2_eksplorasi
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
            
            // Check if all required columns exist (40 columns = 10 document types × 4 attributes)
            return result.rows.length === 40;
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
        const requiredFields = ['nama_lengkap', 'kontrak_awal', 'kontrak_akhir'];
        for (const field of requiredFields) {
          if (!normalizedData[field] || normalizedData[field].toString().trim() === '') {
            throw new Error(`Field ${field} wajib diisi`);
          }
        }
        
        // Normalisasi dan validasi tanggal
        const dateFields = ['kontrak_awal', 'kontrak_akhir'];
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
        
        // Dapatkan kolom yang valid di database
        const tableInfoQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'project_pertamina_ep_regional2_eksplorasi'
        `;
        const tableInfo = await client.query(tableInfoQuery);
        const validColumns = tableInfo.rows.map(row => row.column_name);
        
        console.log(`Daftar kolom valid di database: ${validColumns.slice(0, 5).join(', ')}... (total ${validColumns.length} kolom)`);
        
        // Kolom yang akan dihapus (yang mungkin menyebabkan error)
        const columnsToRemove = ['tahun_masuk', 'tanggal_lahir', 'tahun_keluar', 'usia'];
        
        for (let i = 0; i < usersData.length; i++) {
            const userData = usersData[i];
            const rowNum = i + 2; // +2 karena indeks 0-based dan baris pertama adalah header
            
            try {
                // Filter kolom yang tidak valid
                const filteredData = {};
                for (const [key, value] of Object.entries(userData)) {
                    // Hilangkan kolom yang tidak ada di database
                    if (validColumns.includes(key) && !columnsToRemove.includes(key)) {
                        // Handle nilai null atau kosong
                        if (value === null || value === undefined || value === '') {
                            filteredData[key] = null;
                        } else {
                            filteredData[key] = value;
                        }
                    }
                }
                
                // Log data yang telah difilter
                console.log(`Data baris ${rowNum} setelah difilter: ${Object.keys(filteredData).length} kolom`);
                
                // Format tanggal untuk kontrak_awal dan kontrak_akhir
                const dateFields = ['kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 
                                   'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
                
                dateFields.forEach(field => {
                    if (filteredData[field] && typeof filteredData[field] === 'string') {
                        // Format DD/MM/YYYY ke YYYY-MM-DD
                        if (filteredData[field].includes('/')) {
                            const parts = filteredData[field].split('/');
                            if (parts.length === 3) {
                                filteredData[field] = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                        }
                    }
                });
                
                // Konversi nilai numerik
                if (filteredData.gaji_net !== undefined && filteredData.gaji_net !== null) {
                    filteredData.gaji_net = parseFloat(filteredData.gaji_net.toString().replace(/,/g, ''));
                }
                
                // Validasi data penting
                if (!filteredData.nama_lengkap) {
                    throw new Error('Nama lengkap wajib diisi');
                }
                
                if (!filteredData.kontrak_awal) {
                    throw new Error('Tanggal mulai kontrak wajib diisi');
                }
                
                if (!filteredData.kontrak_akhir) {
                    throw new Error('Tanggal akhir kontrak wajib diisi');
                }
                
                // Persiapkan query INSERT dinamis
                const keys = Object.keys(filteredData);
                const values = Object.values(filteredData);
                
                if (keys.length === 0) {
                    throw new Error('Tidak ada data valid untuk disimpan');
                }
                
                const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
                
                const insertQuery = `
                    INSERT INTO project_pertamina_ep_regional2_eksplorasi 
                    (${keys.join(', ')})
                    VALUES (${placeholders})
                    RETURNING *
                `;
                
                // Log query untuk debug
                console.log(`Menjalankan query untuk baris ${rowNum}`);
                
                const result = await client.query(insertQuery, values);
                
                if (result.rows.length > 0) {
                    results.success++;
                    results.successData.push(result.rows[0]);
                    console.log(`Baris ${rowNum} berhasil disimpan dengan ID: ${result.rows[0].id}`);
                } else {
                    throw new Error('Tidak ada data yang diinsert');
                }
            } catch (error) {
                console.error(`Error processing row ${rowNum}:`, error);
                results.errors.push({
                    row: rowNum,
                    message: error.message
                });
            }
        }
        
        // Commit transaksi jika berhasil
        await client.query('COMMIT');
        console.log(`Transaksi commit: ${results.success} data berhasil disimpan`);
        
    } catch (error) {
        // Rollback transaksi jika terjadi error
        await client.query('ROLLBACK');
        console.error("Error dalam processBulkInsert:", error);
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
        const requiredColumns = ['nama_lengkap', 'kontrak_awal', 'kontrak_akhir'];
        
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
        const dateColumns = ['kontrak_awal', 'kontrak_akhir'];
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
            'gaji_net'
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

    // Fungsi untuk memeriksa apakah tabel ada
    checkTableExists: async () => {
        try {
        const sql = `
            SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'project_pertamina_ep_regional2_eksplorasi'
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
            SELECT pg_get_serial_sequence('project_pertamina_ep_regional2_eksplorasi', 'id') as seq_name;
        `;
        const sequenceResult = await pool.query(sequenceQuery);
        const sequenceName = sequenceResult.rows[0]?.seq_name;
        
        if (!sequenceName) {
            console.error('Cannot find sequence for project_pertamina_ep_regional2_eksplorasi.id');
            return false;
        }
        
        // Dapatkan nilai maksimal ID yang ada
        const maxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM project_pertamina_ep_regional2_eksplorasi`;
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
            console.log(`[DEBUG MODEL] Starting upload for ${docType} document for user ${userId}`);
            
            // Validate inputs
            if (!userId || isNaN(parseInt(userId, 10))) {
            throw new Error(`Invalid user ID: ${userId}`);
            }
            
            if (!docType || !fileInfo) {
            throw new Error('Missing document type or file information');
            }
            
            // Parse userId to integer
            userId = parseInt(userId, 10);
            
            // Validate document type
            const validDocTypes = [
            'cv', 'ijazah', 'sertifikat', 'pkwt',
            'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 
            'bpjstk', 'no_rekening'
            ];
            
            if (!validDocTypes.includes(docType)) {
            throw new Error(`Invalid document type: ${docType}`);
            }
            
            // Validate file info
            if (!fileInfo.originalname || !fileInfo.path || !fileInfo.mimetype || !fileInfo.size) {
            throw new Error('Incomplete file information');
            }
            
            // Check if file actually exists
            if (!fs.existsSync(fileInfo.path)) {
            throw new Error(`File does not exist at path: ${fileInfo.path}`);
            }
            
            console.log(`[DEBUG MODEL] File validation passed:`, {
            originalname: fileInfo.originalname,
            path: fileInfo.path,
            mimetype: fileInfo.mimetype,
            size: fileInfo.size
            });
            
            // Ensure document columns exist
            console.log(`[DEBUG MODEL] Ensuring document columns exist`);
            try {
            await Regional2x.addDocumentColumns();
            } catch (columnError) {
            console.error(`[ERROR MODEL] Failed to ensure document columns: ${columnError}`);
            throw new Error(`Failed to prepare database: ${columnError.message}`);
            }
            
            // Check if user exists
            console.log(`[DEBUG MODEL] Checking if user ${userId} exists`);
            const checkUserSql = `SELECT id FROM project_pertamina_ep_regional2_eksplorasi WHERE id = $1`;
            const checkUserResult = await pool.query(checkUserSql, [userId]);
            
            if (checkUserResult.rows.length === 0) {
            throw new Error(`User with ID ${userId} not found`);
            }
            
            // Get existing file info to delete old file if exists
            console.log(`[DEBUG MODEL] Getting existing file info for ${docType}`);
            const getExistingFileSql = `
            SELECT ${docType}_filepath as filepath 
            FROM project_pertamina_ep_regional2_eksplorasi
            WHERE id = $1
            `;
            
            const existingFileResult = await pool.query(getExistingFileSql, [userId]);
            const oldFilePath = existingFileResult.rows[0]?.filepath;
            
            // Update file info in database
            console.log(`[DEBUG MODEL] Updating file information in database`);
            const updateSql = `
            UPDATE project_pertamina_ep_regional2_eksplorasi 
            SET 
                ${docType}_filename = $1,
                ${docType}_filepath = $2,
                ${docType}_mimetype = $3,
                ${docType}_filesize = $4
            WHERE id = $5
            RETURNING *
            `;
            
            const updateValues = [
            fileInfo.originalname,
            fileInfo.path,
            fileInfo.mimetype,
            fileInfo.size,
            userId
            ];
            
            console.log(`[DEBUG MODEL] Executing update query with values:`, updateValues);
            
            const updateResult = await pool.query(updateSql, updateValues);
            
            if (updateResult.rows.length === 0) {
            throw new Error('Failed to update file information in database');
            }
            
            // Delete old file if it exists and is different from new file
            if (oldFilePath && oldFilePath !== fileInfo.path && fs.existsSync(oldFilePath)) {
            try {
                fs.unlinkSync(oldFilePath);
                console.log(`[DEBUG MODEL] Deleted old file: ${oldFilePath}`);
            } catch (deleteError) {
                console.error(`[WARNING MODEL] Failed to delete old file: ${deleteError.message}`);
                // Don't throw error here, just log warning
            }
            }
            
            console.log(`[DEBUG MODEL] Upload successful for ${docType} document for user ${userId}`);
            return updateResult.rows[0];
        } catch (error) {
            console.error(`[ERROR MODEL] Error in uploadDocument:`, error);
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
        'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk', 'no_rekening'
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
        FROM project_pertamina_ep_regional2_eksplorasi 
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
        const tableExists = await Regional2x.checkTableExists();
        
        if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2_eksplorasi does not exist!");
            return { error: "Table does not exist" };
        }
        
        const sql = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'project_pertamina_ep_regional2_eksplorasi'
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
     * 1. Menampilkan semua data untuk halaman edit
     * Data yang ditampilkan adalah karyawan yang tanggal akhir_kontrak belum melewati hari ini
     * DAN karyawan tanpa sebab_na
     * @returns {Array} Daftar karyawan untuk halaman edit
     */
    getAll: async () => {
        try {
        // Periksa apakah tabel ada
        const tableExists = await Regional2x.checkTableExists();
        
        if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2_eksplorasi does not exist!");
            return [];
        }
        
        const sql = `
            SELECT * FROM project_pertamina_ep_regional2_eksplorasi
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
            const allRows = await pool.query('SELECT id, nama_lengkap, kontrak_akhir, sebab_na FROM project_pertamina_ep_regional2_eksplorasi LIMIT 10');
            console.log('Sample data:', allRows.rows);
        }

        return result.rows;
        } catch (error) {
        console.error("Error in getAll():", error);
        if (error.code === '42P01') {
            console.error("Table project_pertamina_ep_regional2_eksplorasi doesn't exist");
            return [];
        }
        throw error;
        }
    },

    /**
     * Menampilkan user untuk halaman NA
     * Data yang ditampilkan adalah karyawan yang tanggal akhir_kontrak sudah melewati hari ini
     * ATAU karyawan dengan sebab_na tidak kosong
     * @returns {Array} Daftar karyawan yang masuk kriteria NA
     */
    getNAUsers: async () => {
        try {
        // Periksa apakah tabel ada
        const tableExists = await Regional2x.checkTableExists();
        
        if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2_eksplorasi does not exist!");
            return [];
        }
        
        const sql = `
            SELECT * FROM project_pertamina_ep_regional2_eksplorasi
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
            console.error("Table project_pertamina_ep_regional2_eksplorasi doesn't exist");
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
        const userSql = `SELECT * FROM project_pertamina_ep_regional2_eksplorasi WHERE id = $1`;
        const userResult = await pool.query(userSql, [id]);
        
        if (userResult.rows.length === 0) {
            throw new Error('Karyawan tidak ditemukan');
        }
        
        const user = userResult.rows[0];
        console.log(`Memulihkan karyawan: ${user.nama_lengkap} (ID: ${id})`);
        
        // Sesuai kebutuhan: HANYA hapus sebab_na, TIDAK mengubah kontrak
        // Hal ini memaksa user untuk mengupdate kontrak di halaman edit
        const updateData = { 
            sebab_na: null 
        };

        // Update data
        const { sql, values } = Regional2x._createUpdateQuery(id, updateData);
        const result = await pool.query(sql, values);

        console.log(`Karyawan ${user.nama_lengkap} (ID: ${id}) berhasil dipulihkan (sebab_na dihapus)`);
        console.log(`User perlu mengubah tanggal kontrak dan nomor kontrak untuk kembali aktif`);

        return result.rows[0];
        } catch (error) {
        console.error(`Error in restoreUser() for ID ${id}:`, error);
        throw error;
        }
    },

    /**
     * 2. Menambah user baru
     * @param {Object} userData - Data karyawan yang akan ditambahkan
     * @returns {Object} Data karyawan yang baru ditambahkan
     */
    addUser: async (userData) => {
        try {
            await Regional2x.resetSequence();
            
            if (!userData) {
                throw new Error('Data karyawan tidak boleh kosong');
            }
    
            // Validasi field yang wajib ada
            if (!userData.nama_lengkap) {
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
            
            // PENTING: Bersihkan data dari properti-properti yang tidak ada di database
            const dataToSave = { ...userData };
            
            // Hapus properti yang tidak ada di database
            const invalidColumns = ['tahun_masuk', 'tanggal_lahir', 'tahun_keluar', 'usia'];
            invalidColumns.forEach(col => {
                if (col in dataToSave) {
                    console.log(`Removing invalid column from data: ${col}`);
                    delete dataToSave[col];
                }
            });
            
            // Gunakan query yang aman dengan hanya kolom yang valid
            try {
                // Dapatkan list kolom yang ada di tabel
                const tableInfoQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'project_pertamina_ep_regional2_eksplorasi'
                `;
                const tableInfo = await pool.query(tableInfoQuery);
                const validColumns = tableInfo.rows.map(row => row.column_name);
                
                // Filter data yang akan disimpan agar hanya berisi kolom yang valid
                const filteredData = {};
                
                for (const [key, value] of Object.entries(dataToSave)) {
                    if (validColumns.includes(key)) {
                        filteredData[key] = value;
                    } else {
                        console.log(`Skipping invalid column: ${key}`);
                    }
                }
                
                console.log(`Data yang akan disimpan (setelah filter):`, filteredData);
                
                // Buat query INSERT dinamis hanya dengan kolom valid
                const keys = Object.keys(filteredData);
                const values = Object.values(filteredData);
                const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
                
                const insertQuery = `
                    INSERT INTO project_pertamina_ep_regional2_eksplorasi 
                    (${keys.join(', ')})
                    VALUES (${placeholders})
                    RETURNING *
                `;
                
                const result = await pool.query(insertQuery, values);
                return result.rows[0];
            } catch (dbError) {
                console.error('Error saat eksekusi query database:', dbError);
                throw dbError;
            }
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
        
        const { sql, values } = Regional2x._createSelectQuery({ id });
        const result = await pool.query(sql, values);
        return result.rows[0];
        } catch (error) {
        console.error('Error in getUserById():', error);
        throw error;
        }
    },

    /**
     * 3. Mengedit user berdasarkan ID
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
            const oldData = await Regional2x.getUserById(id);
    
            if (!oldData) {
                throw new Error(`User with ID ${id} not found`);
            }
    
            // PENTING: Bersihkan data dari properti-properti yang tidak ada di database
            const dataToUpdate = { ...userData };
            
            // Hapus properti yang tidak ada di database
            const invalidColumns = ['tahun_masuk', 'tanggal_lahir', 'tahun_keluar', 'usia'];
            invalidColumns.forEach(col => {
                if (col in dataToUpdate) {
                    console.log(`Removing invalid column from update data: ${col}`);
                    delete dataToUpdate[col];
                }
            });
            
            try {
                // Dapatkan list kolom yang ada di tabel
                const tableInfoQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'project_pertamina_ep_regional2_eksplorasi'
                `;
                const tableInfo = await pool.query(tableInfoQuery);
                const validColumns = tableInfo.rows.map(row => row.column_name);
                
                // Filter data yang akan diupdate agar hanya berisi kolom yang valid
                const filteredData = {};
                
                for (const [key, value] of Object.entries(dataToUpdate)) {
                    if (validColumns.includes(key)) {
                        filteredData[key] = value;
                    } else {
                        console.log(`Skipping invalid column in update: ${key}`);
                    }
                }
                
                console.log(`Data yang akan diupdate (setelah filter):`, filteredData);
                
                // Buat query UPDATE dinamis hanya dengan kolom valid
                const keys = Object.keys(filteredData);
                const values = Object.values(filteredData);
                
                // Jika tidak ada data yang valid untuk diupdate
                if (keys.length === 0) {
                    throw new Error('Tidak ada data valid untuk diupdate');
                }
                
                const setClause = keys.map((key, i) => `${key} = $${i+1}`).join(', ');
                
                const updateQuery = `
                    UPDATE project_pertamina_ep_regional2_eksplorasi
                    SET ${setClause}
                    WHERE id = $${keys.length + 1}
                    RETURNING *
                `;
                
                const result = await pool.query(updateQuery, [...values, id]);
                
                if (result.rows.length === 0) {
                    throw new Error(`User dengan ID ${id} tidak ditemukan`);
                }
                
                // Cek perubahan kontrak untuk riwayat
                const isKontrakChanged =
                    userData.no_kontrak !== oldData.no_kontrak ||
                    userData.kontrak_awal !== oldData.kontrak_awal ||
                    userData.kontrak_akhir !== oldData.kontrak_akhir;
                
                // Jika kontrak berubah, simpan history
                if (isKontrakChanged) {
                    await Regional2x.saveKontrakHistory(id, oldData, userData);
                }
                
                return result.rows[0];
            } catch (dbError) {
                console.error('Error saat eksekusi query database update:', dbError);
                throw dbError;
            }
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
        
        // Periksa apakah tabel history_regional2x ada
        const sql = `
            SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'history_regional2x'
            );
        `;
        const tableExists = await pool.query(sql);
        
        if (!tableExists.rows[0].exists) {
            console.error("Table history_regional2x does not exist!");
            // Jika tabel tidak ada, buat log tapi jangan gagalkan operasi utama
            console.log("Cannot save contract history as history_regional2x table doesn't exist");
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
        const placeholders = keys.map((_, i) => `${i + 1}`).join(', ');
        
        const historySql = `
            INSERT INTO history_regional2x (${keys.join(', ')})
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
        
        // Periksa apakah tabel history_regional2x ada
        const sql = `
            SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'history_regional2x'
            );
        `;
        const tableExists = await pool.query(sql);
        
        if (!tableExists.rows[0].exists) {
            console.error("Table history_regional2x does not exist!");
            return [];
        }
        
        const historySql = `
            SELECT * FROM history_regional2x
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
        const userSql = `SELECT * FROM project_pertamina_ep_regional2_eksplorasi WHERE id = $1`;
        const userResult = await pool.query(userSql, [userId]);
        
        if (userResult.rows.length === 0) {
            throw new Error(`Karyawan dengan ID ${userId} tidak ditemukan`);
        }
        
        const user = userResult.rows[0];
        console.log(`Memeriksa status karyawan ${user.nama_lengkap} (ID: ${userId})`);
        
        // Buat query update yang lebih eksplisit
        const updateSql = `
            UPDATE project_pertamina_ep_regional2_eksplorasi 
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
     * 6. Menghapus user
     * @param {number} id - ID karyawan
     * @returns {Object} Data karyawan yang dihapus
     */
    deleteUser: async (id) => {
        try {
        if (!id) {
            throw new Error('ID karyawan tidak boleh kosong');
        }
        
        // Check if history_regional2x table exists before attempting to delete history records
        const checkHistoryTableSql = `
            SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'history_regional2x'
            );
        `;
        const historyTableExists = await pool.query(checkHistoryTableSql);
        
        // Delete associated history records if table exists
        if (historyTableExists.rows[0].exists) {
            const historySql = `DELETE FROM history_regional2x WHERE user_id = $1`;
            await pool.query(historySql, [id]);
        }
        
        // Then delete the user
        const { sql, values } = Regional2x._createDeleteQuery({ id });
        const result = await pool.query(sql, values);
        return result.rows[0];
        } catch (error) {
        console.error('Error in deleteUser():', error);
        throw error;
        }
    },

    /**
     * 7. Menampilkan sebagian kolom untuk halaman view
     * Data yang ditampilkan adalah karyawan yang tanggal akhir_kontrak belum melewati hari ini
     * @returns {Array} Daftar karyawan dengan kolom terbatas dan akhir_kontrak belum terlewati
     */
    getViewData: async () => {
        try {
        // Periksa apakah tabel ada
        const tableExists = await Regional2x.checkTableExists();
        
        if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2_eksplorasi does not exist!");
            return [];
        }
        
        const columns = [
            'id', 'nama_lengkap', 'jabatan', 'sebab_na', 'nik_vendor', 
            'no_kontrak', 'kontrak_awal', 'kontrak_akhir',
            'paket_tender', 'tempat_tanggal_lahir', 'email', 'no_telpon',
            // Tambahkan kolom dokumen CV
            'cv_filename', 'cv_filepath', 'cv_mimetype', 'cv_filesize',
            // Tambahkan kolom dokumen Ijazah
            'ijazah_filename', 'ijazah_filepath', 'ijazah_mimetype', 'ijazah_filesize',
            // Tambahkan kolom dokumen Sertifikat
            'sertifikat_filename', 'sertifikat_filepath', 'sertifikat_mimetype', 'sertifikat_filesize', 
            // Tambahkan kolom dokumen PKWT
            'pkwt_filename', 'pkwt_filepath', 'pkwt_mimetype', 'pkwt_filesize'
        ];
        const columnsStr = columns.join(',');
        
        const sql = `
        SELECT ${columnsStr} FROM project_pertamina_ep_regional2_eksplorasi
        WHERE (kontrak_akhir >= CURRENT_DATE OR kontrak_akhir IS NULL) AND (sebab_na IS NULL)
        ORDER BY kontrak_akhir ASC`;
        
        const result = await pool.query(sql);
        return result.rows;
        } catch (error) {
        console.error('Error in getViewData():', error);
        if (error.code === '42P01') {
            console.error("Table project_pertamina_ep_regional2_eksplorasi doesn't exist");
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
        const tableExists = await Regional2x.checkTableExists();
        
        if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2_eksplorasi does not exist!");
            return [];
        }
        
        // Cetak tanggal hari ini dari database untuk debugging
        const currentDateResult = await pool.query('SELECT CURRENT_DATE as today');
        console.log('Tanggal dari database:', currentDateResult.rows[0].today);
        
        // Ambil data lengkap dari karyawan dengan kontrak kedaluwarsa
        const sql = `
            SELECT * FROM project_pertamina_ep_regional2_eksplorasi
            WHERE kontrak_akhir < CURRENT_DATE AND sebab_na IS NULL
            ORDER BY kontrak_akhir ASC
        `;
        
        console.log("Executing expired contract check query:", sql);
        
        const result = await pool.query(sql);
        console.log(`Query checkExpiredKontrak mengembalikan ${result.rowCount} kontrak yang berakhir`);
        
        if (result.rowCount > 0) {
            console.log('Detail kontrak berakhir:');
            result.rows.forEach(row => {
            console.log(`- ID: ${row.id}, Nama: ${row.nama_lengkap}, Kontrak Akhir: ${row.kontrak_akhir}`);
            });
        }
        
        return result.rows;
        } catch (error) {
        console.error('Error in checkExpiredKontrak():', error);
        if (error.code === '42P01') {
            console.error("Table project_pertamina_ep_regional2_eksplorasi doesn't exist");
            return [];
        }
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
            'id', 'nama_lengkap', 'asuransi_lainnya', 'alamat_domisili', 'cv',
            'tempat_tanggal_lahir', 'no_telpon', 'nama_ibu_kandung', 
            'kontak_darurat', 
            'nama_institute_pendidikan', 'jurusan',
            'email', 'status_pernikahan',
            'jenis_kelamin', 'alamat_ktp'
        ];
        
        const { sql, values } = Regional2x._createSelectColumnsQuery(columns, { id });
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
     * @param {string} docType - Tipe dokumen (cv, ijazah, sertifikat, pkwt)
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
        UPDATE project_pertamina_ep_regional2_eksplorasi
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
        const oldUserData = await Regional2x.getUserById(id);
        if (!oldUserData) {
            throw new Error(`User dengan ID ${id} tidak ditemukan`);
        }
        
        // Check if contract data is changed
        const isContractChanged = Regional2x._isContractChanged(oldUserData, userData);
        
        // Begin transaction
        await pool.query('BEGIN');
        
        // Update user data
        const updateResult = await Regional2x.updateUser(id, userData);
        
        // If contract changed, record the change history
        if (isContractChanged) {
            try {
            await Regional2xContractHistory.addHistory({
                user_id: id,
                nama_karyawan: userData.nama_lengkap || oldUserData.nama_lengkap,
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
            'id', 'nama_lengkap', 'no_ktp', 'no_kk',
            'bpjs_kesehatan', 'bpjs_kesehatan_keterangan',
            'bpjs_kesehatan_suami_istri', 'bpjs_anak1',
            'bpjs_anak2', 'bpjs_anak3', 'bpjstk',
            'no_npwp', 'no_rekening', 'nama_rekening',
            'nama_bank', 'gaji_net'
        ];
        
        const { sql, values } = Regional2x._createSelectColumnsQuery(columns, { id });
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
            'id', 'nama_lengkap', 
            'awal_mcu', 'akhir_mcu', 'hasil_mcu', 'vendor_mcu',
            'no_hsepassport', 'awal_hsepassport', 'akhir_hsepassport',
            'no_siml', 'awal_siml', 'akhir_siml'
        ];
        
        const { sql, values } = Regional2x._createSelectColumnsQuery(columns, { id });
        const result = await pool.query(sql, values);
        return result.rows[0];
        } catch (error) {
        console.error('Error in getCertificationData():', error);
        throw error;
        }
    },

    //HSE
    /**
 * Mendapatkan data HSE untuk semua karyawan (baik yang sudah terisi maupun belum)
 * @returns {Array} Daftar karyawan dengan data HSE
 */
getHSEData: async () => {
    try {
        // Periksa apakah tabel ada
        const tableExists = await Regional2x.checkTableExists();
        
        if (!tableExists) {
            console.error("Tabel project_pertamina_ep_regional2_eksplorasi tidak ditemukan!");
            return [];
        }
        
        // Ambil semua data karyawan dengan kolom-kolom yang relevan untuk HSE
        // PERBAIKAN: Tambahkan koma antara sebab_na dan nik_vendor
        const sql = `
            SELECT id, nama_lengkap, jabatan, sebab_na, nik_vendor, no_ktp, no_kontrak,
            tempat_tanggal_lahir, awal_mcu, akhir_mcu, hasil_mcu, vendor_mcu,
            alamat_domisili, no_telpon, no_hsepassport, awal_hsepassport, akhir_hsepassport,
            no_siml, awal_siml, akhir_siml
            FROM project_pertamina_ep_regional2_eksplorasi
            ORDER BY nama_lengkap ASC
        `;
        
        console.log("Executing SQL for HSE data:", sql);
        
        const result = await pool.query(sql);
        
        // Debug: log jumlah baris hasil query dan sampel data pertama untuk verifikasi
        console.log(`Query untuk data HSE mengembalikan ${result.rowCount} baris`);
        if (result.rowCount > 0) {
            console.log("Sample data (first row):", {
                id: result.rows[0].id,
                nama: result.rows[0].nama_lengkap,
                sebab_na: result.rows[0].sebab_na // Verifikasi sebab_na ada
            });
        }
        
        return result.rows;
    } catch (error) {
        console.error("Error in getHSEData():", error);
        if (error.code === '42P01') {
            console.error("Tabel project_pertamina_ep_regional2_eksplorasi tidak ada");
            return [];
        }
        throw error;
    }
    },

    checkSertifikatTableExists: async () => {
        try {
            const sql = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'regional2x_sertifikat'
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
        // Check if table already exists
        const tableExists = await Regional2x.checkSertifikatTableExists();
        
        if (tableExists) {
        console.log("Table regional2x_sertifikat already exists");
        return true;
        }
        
        // Create table if it doesn't exist
        const sql = `
        CREATE TABLE regional2x_sertifikat (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES project_pertamina_ep_regional2_eksplorasi(id) ON DELETE CASCADE,
            judul_sertifikat VARCHAR(255) NOT NULL,
            tanggal_awal_berlaku DATE,
            tanggal_akhir_berlaku DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_regional2x_sertifikat_user_id ON regional2x_sertifikat(user_id);
        `;
        
        await pool.query(sql);
        console.log("Table regional2x_sertifikat created successfully");
        return true;
    } catch (error) {
        console.error("Error creating sertifikat table:", error);
        throw error;
    }
    },

    // Fungsi untuk menambahkan sertifikat baru
    addSertifikat: async (sertifikatData) => {
    try {
        // Validate data
        if (!sertifikatData.user_id || !sertifikatData.judul_sertifikat) {
        throw new Error('Data sertifikat tidak lengkap');
        }
        
        // Ensure dates are in YYYY-MM-DD format
        if (sertifikatData.tanggal_awal_berlaku) {
        sertifikatData.tanggal_awal_berlaku = sanitizeDate(sertifikatData.tanggal_awal_berlaku);
        }
        if (sertifikatData.tanggal_akhir_berlaku) {
        sertifikatData.tanggal_akhir_berlaku = sanitizeDate(sertifikatData.tanggal_akhir_berlaku);
        }
        
        const sql = `
        INSERT INTO regional2x_sertifikat (
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
        SELECT * FROM regional2x_sertifikat
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
        SELECT * FROM regional2x_sertifikat
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
        
        // Ensure dates are in YYYY-MM-DD format
        if (sertifikatData.tanggal_awal_berlaku) {
        sertifikatData.tanggal_awal_berlaku = sanitizeDate(sertifikatData.tanggal_awal_berlaku);
        }
        if (sertifikatData.tanggal_akhir_berlaku) {
        sertifikatData.tanggal_akhir_berlaku = sanitizeDate(sertifikatData.tanggal_akhir_berlaku);
        }
        
        const sql = `
        UPDATE regional2x_sertifikat
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
        DELETE FROM regional2x_sertifikat
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