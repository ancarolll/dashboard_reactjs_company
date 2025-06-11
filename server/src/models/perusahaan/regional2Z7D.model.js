import pool from "../../config/db.js";
import fs from 'fs';
import { Regional2Z7DContractHistory } from "./regional2Z7D_contract_history.model.js";

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

const formatDateToISOString = (dateValue) => {
    if (!dateValue) return null;
    
    try {
        // Jika sudah dalam format Date
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0]; // Format YYYY-MM-DD
        }
        
        // Jika string format DD/MM/YYYY
        if (typeof dateValue === 'string' && dateValue.includes('/')) {
            const [day, month, year] = dateValue.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Jika sudah format YYYY-MM-DD
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateValue;
        }
        
        // Coba parse berbagai format
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
        }
        
        return null;
        } catch (error) {
        console.error(`Error formatting date: ${error.message}`);
        return null;
        }
};

    export const Regional2Z7D = {
        
        // Pastikan fungsi-fungsi sanitasi tersedia untuk penggunaan eksternal
        sanitizeDate,
        ensureValidDate,

        // Fungsi dasar untuk membersihkan data
        _cleanData: (data) => {
        const cleanedData = {...data};
        
        // Definisi kolom tanggal
        const dateColumns = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
        
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

        // Fungsi untuk membersihkan data numerik
        _cleanNumericData: (data) => {
        const cleanedData = {...data};
        
        // Definisi kolom numeric (sesuaikan dengan struktur tabel Regional2Z7D)
        const numericColumns = [
            'id'
            // Kolom numerik lainnya jika ada
        ];

        const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
        
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
        const cleanData = Regional2Z7D._cleanData(dataWithoutId);
        
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
            INSERT INTO project_pertamina_ep_regional2zona7_devplan (${filteredKeys.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;
        
        return { sql, values: filteredValues };
        },

        _createUpdateQuery: (id, data) => {

        // Buat salinan data
        const cleanData = { ...data };
        
        // Hapus field yang tidak ada di tabel
        const fieldsThatDoNotExist = ['gaji_net']; // tambahkan field lain jika ada
        fieldsThatDoNotExist.forEach(field => {
          if (field in cleanData) {
            delete cleanData[field];
            console.log(`Field ${field} dihapus karena tidak ada di tabel`);
          }
        });

        const cleanedData = Regional2Z7D._cleanData(cleanData);

        // Pastikan field file null tetap null (tidak di-strip)
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
            UPDATE project_pertamina_ep_regional2zona7_devplan
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
            SELECT * FROM project_pertamina_ep_regional2zona7_devplan
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
            SELECT ${columnsClause} FROM project_pertamina_ep_regional2zona7_devplan
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
            DELETE FROM project_pertamina_ep_regional2zona7_devplan
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
            WHERE table_name = 'project_pertamina_ep_regional2zona7_devplan' 
            AND column_name IN (
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
        const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
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
                const normalizedData = Regional2Z7D.validateAndNormalizeUserData(userData);
                
                // Siapkan query untuk insert
                const { sql, values } = Regional2Z7D._createInsertQuery(normalizedData);
                
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
            const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
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
        }
        
        return results;
        },

        /**
         * Fungsi untuk menambahkan kolom dokumen jika belum ada
         */
        addDocumentColumns: async () => {
            try {
            const hasColumns = await Regional2Z7D.checkDocumentColumns();
            
            if (hasColumns) {
            console.log("Document columns already exist");
            return true;
            }
            
            const sql = `
            ALTER TABLE project_pertamina_ep_regional2zona7_devplan
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
            
            -- New document fields
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
            
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_karyawan_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_karyawan_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_karyawan_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bpjs_kesehatan_karyawan_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS bpjstk_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjstk_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bpjstk_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bpjstk_filesize INTEGER,
            
            ADD COLUMN IF NOT EXISTS no_rekening_mandiri_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_rekening_mandiri_filepath VARCHAR(255),
            ADD COLUMN IF NOT EXISTS no_rekening_mandiri_mimetype VARCHAR(100),
            ADD COLUMN IF NOT EXISTS no_rekening_mandiri_filesize INTEGER
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
                AND table_name = 'project_pertamina_ep_regional2zona7_devplan'
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
            SELECT pg_get_serial_sequence('project_pertamina_ep_regional2zona7_devplan', 'id') as seq_name;
            `;
            const sequenceResult = await pool.query(sequenceQuery);
            const sequenceName = sequenceResult.rows[0]?.seq_name;
            
            if (!sequenceName) {
            console.error('Cannot find sequence for project_pertamina_ep_regional2zona7_devplan.id');
            return false;
            }
            
            // Dapatkan nilai maksimal ID yang ada
            const maxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM project_pertamina_ep_regional2zona7_devplan`;
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
            // Pastikan userId adalah integer
            if (!userId || isNaN(parseInt(userId, 10))) {
            throw new Error(`User ID tidak valid: ${userId}`);
            }
            
            // Parse userId ke integer untuk memastikan
            userId = parseInt(userId, 10);
            
            if (!docType || !fileInfo) {
            throw new Error('Data tidak lengkap');
            }
            
            // Validasi tipe dokumen
            const validDocTypes = [
              'cv', 'ijazah', 'sertifikat', 'pkwt',
              'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan_karyawan', 'bpjstk', 'no_rekening_mandiri'
            ];
            
            if (!validDocTypes.includes(docType)) {
            throw new Error(`Tipe dokumen tidak valid: ${docType}`);
            }
            
            // Pastikan kolom-kolom dokumen tersedia
            await Regional2Z7D.addDocumentColumns();
            
            // Pertama periksa apakah user dengan ID ini ada
            const checkUserSql = `SELECT id FROM project_pertamina_ep_regional2zona7_devplan WHERE id = $1`;
            const checkUserResult = await pool.query(checkUserSql, [userId]);
            
            if (checkUserResult.rows.length === 0) {
            throw new Error(`User dengan ID ${userId} tidak ditemukan`);
            }
            
            // Ambil info file lama jika ada
            const querySql = `
            SELECT ${docType}_filepath FROM project_pertamina_ep_regional2zona7_devplan
            WHERE id = $1
            `;
            
            const queryResult = await pool.query(querySql, [userId]);
            
            if (queryResult.rows.length === 0) {
            throw new Error('User tidak ditemukan');
            }
            
            const oldFilePath = queryResult.rows[0][`${docType}_filepath`];
            
            // Update info file di database
            const updateSql = `
            UPDATE project_pertamina_ep_regional2zona7_devplan 
            SET 
                ${docType}_filename = $1,
                ${docType}_filepath = $2,
                ${docType}_mimetype = $3,
                ${docType}_filesize = $4
            WHERE id = $5
            RETURNING *
            `;
            
            console.log(`Updating database with file info: ${fileInfo.originalname}`);
            
            const updateResult = await pool.query(updateSql, [
            fileInfo.originalname,
            fileInfo.path,
            fileInfo.mimetype,
            fileInfo.size,
            userId
            ]);
            
            // Hapus file lama jika ada
            if (oldFilePath && fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`File lama berhasil dihapus: ${oldFilePath}`);
            }
            
            return updateResult.rows[0];
        } catch (error) {
            console.error(`Error uploading ${docType}:`, error);
            throw error;
        }
        },

        // Fungsi untuk mendapatkan info dokumen
        getDocumentInfo: async (userId, docType) => {
            try {
            if (!userId || !docType) {
                throw new Error('Data tidak lengkap');
            }
            
            // Validasi tipe dokumen
            const validDocTypes = [
              'cv', 'ijazah', 'sertifikat', 'pkwt',
              'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan_karyawan', 'bpjstk', 'no_rekening_mandiri'
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
                FROM project_pertamina_ep_regional2zona7_devplan 
                WHERE id = $1
            `;
            
            const result = await pool.query(sql, [userId]);
            
            if (result.rows.length === 0) {
                throw new Error ('User tidak ditemukan');
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
            const tableExists = await Regional2Z7D.checkTableExists();
            
            if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2zona7_devplan does not exist!");
            return { error: "Table does not exist" };
            }
            
            const sql = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'project_pertamina_ep_regional2zona7_devplan'
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
            const tableExists = await Regional2Z7D.checkTableExists();
            
            if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2zona7_devplan does not exist!");
            return [];
            }
            
            const sql = `
            SELECT * FROM project_pertamina_ep_regional2zona7_devplan
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
            const allRows = await pool.query('SELECT id, nama_lengkap, kontrak_akhir, sebab_na FROM project_pertamina_ep_regional2zona7_devplan LIMIT 10');
            console.log('Sample data:', allRows.rows);
            }

            return result.rows;
        } catch (error) {
            console.error("Error in getAll():", error);
            if (error.code === '42P01') {
            console.error("Table project_pertamina_ep_regional2zona7_devplan doesn't exist");
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
            const tableExists = await Regional2Z7D.checkTableExists();
            
            if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2zona7_devplan does not exist!");
            return [];
            }
            
            const sql = `
            SELECT * FROM project_pertamina_ep_regional2zona7_devplan
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
            console.error("Table project_pertamina_ep_regional2zona7_devplan doesn't exist");
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
            const userSql = `SELECT * FROM project_pertamina_ep_regional2zona7_devplan WHERE id = $1`;
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
            const { sql, values } = Regional2Z7D._createUpdateQuery(id, updateData);
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
            await Regional2Z7D.resetSequence();
            
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
            
        const { sql, values } = Regional2Z7D._createInsertQuery(userData);
        console.log("SQL Insert Query:", sql);
        console.log("Values:", values);
        
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
            
            const { sql, values } = Regional2Z7D._createSelectQuery({ id });
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
            const oldData = await Regional2Z7D.getUserById(id);
            if (!oldData) {
            throw new Error(`User with ID ${id} not found`);
            }

            // Jaga nilai tanggal lahir
            if (!userData.tanggal_lahir && oldData.tanggal_lahir) {
                console.log(`Tanggal lahir tidak ada di request, mempertahankan nilai lama: ${oldData.tanggal_lahir}`);
                userData.tanggal_lahir = oldData.tanggal_lahir;
            }
            
            // Standarisasi format tanggal
            if (userData.tanggal_lahir) {
                userData.tanggal_lahir = formatDateToISOString(userData.tanggal_lahir);
            }

            const cleanedUserData = Regional2Z7D._cleanData(userData);
            const isKontrakChanged =
            userData.no_kontrak !== oldData.no_kontrak ||
            userData.kontrak_awal !== oldData.kontrak_awal ||
            userData.kontrak_akhir !== oldData.kontrak_akhir;
        
            // Update data user
            const { sql, values } = Regional2Z7D._createUpdateQuery(id, cleanedUserData);
            const result = await pool.query(sql, values);
        
            // Jika kontrak berubah, simpan history
            if (isKontrakChanged) {
            await Regional2Z7D.saveKontrakHistory(id, oldData, cleanedUserData);
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
            
            // Periksa apakah tabel history_regional2z7d ada
            const sql = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'history_regional2z7d'
            );
            `;
            const tableExists = await pool.query(sql);
            
            if (!tableExists.rows[0].exists) {
            console.error("Table history_regional2z7d does not exist!");
            // Jika tabel tidak ada, buat log tapi jangan gagalkan operasi utama
            console.log("Cannot save contract history as history_regional2z7d table doesn't exist");
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
            INSERT INTO history_regional2z7d (${keys.join(', ')})
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
            
            // Periksa apakah tabel history_regional2z7d ada
            const sql = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'history_regional2z7d'
            );
            `;
            const tableExists = await pool.query(sql);
            
            if (!tableExists.rows[0].exists) {
            console.error("Table history_regional2z7d does not exist!");
            return [];
            }
            
            const historySql = `
            SELECT * FROM history_regional2z7d
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
            const userSql = `SELECT * FROM project_pertamina_ep_regional2zona7_devplan WHERE id = $1`;
            const userResult = await pool.query(userSql, [userId]);
        
            if (userResult.rows.length === 0) {
            throw new Error(`Karyawan dengan ID ${userId} tidak ditemukan`);
            }
        
            const user = userResult.rows[0];
            console.log(`Memeriksa status karyawan ${user.nama_lengkap} (ID: ${userId})`);
            
            // Buat query update yang lebih eksplisit
            const updateSql = `
            UPDATE project_pertamina_ep_regional2zona7_devplan 
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
            
            // Check if history_regional2z7d table exists before attempting to delete history records
            const checkHistoryTableSql = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'history_regional2z7d'
            );
            `;
            const historyTableExists = await pool.query(checkHistoryTableSql);
            
            // Delete associated history records if table exists
            if (historyTableExists.rows[0].exists) {
            const historySql = `DELETE FROM history_regional2z7d WHERE user_id = $1`;
            await pool.query(historySql, [id]);
            }
        
            // Then delete the user
            const { sql, values } = Regional2Z7D._createDeleteQuery({ id });
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
            const tableExists = await Regional2Z7D.checkTableExists();
            
            if (!tableExists) {
            console.error("Table project_pertamina_ep_regional2zona7_devplan does not exist!");
            return [];
            }
            
            const columns = [
            'id', 'nama_lengkap', 'jabatan', 'sebab_na', 'tempat_lahir', 'tanggal_lahir',
            'no_kontrak', 'kontrak_awal', 'kontrak_akhir',
            'tanggal_lahir', 'alamat_domisili', 'no_telpon', 'email',
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
            SELECT ${columnsStr} FROM project_pertamina_ep_regional2zona7_devplan
            WHERE (kontrak_akhir >= CURRENT_DATE OR kontrak_akhir IS NULL) AND (sebab_na IS NULL)
            ORDER BY kontrak_akhir ASC`;
            
            const result = await pool.query(sql);
            return result.rows;
        } catch (error) {
            console.error('Error in getViewData():', error);
            if (error.code === '42P01') {
            console.error("Table project_pertamina_ep_regional2zona7_devplan doesn't exist");
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
                const tableExists = await Regional2Z7D.checkTableExists();
                
                if (!tableExists) {
                console.error("Table project_pertamina_ep_regional2zona7_devplan does not exist!");
                return [];
                }
                
                // Cetak tanggal hari ini dari database untuk debugging
                const currentDateResult = await pool.query('SELECT CURRENT_DATE as today');
                console.log('Tanggal dari database:', currentDateResult.rows[0].today);
                
                // Ambil data lengkap dari karyawan dengan kontrak kedaluwarsa
                const sql = `
                SELECT * FROM project_pertamina_ep_regional2zona7_devplan
                WHERE kontrak_akhir < CURRENT_DATE AND sebab_na IS NULL
                ORDER BY kontrak_akhir ASC
                `;
                
                console.log("Executing expired contract check query:", sql);
                
                const result = await pool.query(sql);
                console.log(`Query checkExpiredKontrak mengembalikan ${result.rowCount} kontrak yang berakhir`);
                
                if (result.rowCount > 0)  {
                console.log('Detail kontrak berakhir:');
                result.rows.forEach(row => {
                    console.log(`- ID: ${row.id}, Nama: ${row.nama_lengkap}, Kontrak Akhir: ${row.kontrak_akhir}`);
                });
            }
                
                return result.rows;
            } catch (error) {
                console.error('Error in checkExpiredKontrak():', error);
                if (error.code === '42P01') {
                console.error("Table project_pertamina_ep_regional2zona7_devplan doesn't exist");
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
            'id', 'nama_lengkap', 'alamat_domisili', 'asuransi_lainnya', 'cv',
            'tanggal_lahir', 'no_telpon', 'kontak_darurat',
            'email', 'status_pernikahan', 'tempat_lahir',
            'jenis_kelamin', 'alamat_ktp', 'nama_ibu_kandung'
            ];

            const { sql, values } = Regional2Z7D._createSelectColumnsQuery(columns, { id });
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
            // Struktur query yang lebih aman dan jelas
            const query = `
            UPDATE project_pertamina_ep_regional2zona7_devplan
            SET 
            ${docType}_filename = NULL,
            ${docType}_filepath = NULL,
            ${docType}_mimetype = NULL,
            ${docType}_filesize = NULL
            WHERE id = $1
            RETURNING *
        `;
        
        const values = [userId];
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
                const oldUserData = await Regional2Z7D.getUserById(id);
                if (!oldUserData) {
                throw new Error(`User dengan ID ${id} tidak ditemukan`);
                }
                
                // Check if contract data is changed
                const isContractChanged = Regional2Z7D._isContractChanged(oldUserData, userData);
                
                // Begin transaction
                await pool.query('BEGIN');
                
                // Update user data
                const updateResult = await Regional2Z7D.updateUser(id, userData);
                
                // If contract changed, record the change history
                if (isContractChanged) {
                try {
                    await Regional2Z7DContractHistory.addHistory({
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
                'bpjs_kesehatan_karyawan', 'bpjstk',
                'no_npwp', 'no_rekening_mandiri',
                'bpjs_kesehatan_suami_istri', 
                'bpjs_anak1', 'bpjs_anak2', 'bpjs_anak3'
                ];
            
                const { sql, values } = Regional2Z7D._createSelectColumnsQuery(columns, { id });
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
            
                const { sql, values } = Regional2Z7D._createSelectColumnsQuery(columns, { id });
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
            const tableExists = await Regional2Z7D.checkTableExists();
            
            if (!tableExists) {
                console.error("Tabel project_pertamina_ep_regional2zona7_devplan tidak ditemukan!");
                return [];
            }
            
            // Ambil semua data karyawan dengan kolom-kolom yang relevan untuk HSE
            const sql = `
                SELECT id, nama_lengkap, jabatan, sebab_na, no_ktp,
                tanggal_lahir, awal_mcu, akhir_mcu, hasil_mcu, vendor_mcu,
                alamat_domisili, no_telpon, no_hsepassport, awal_hsepassport, akhir_hsepassport,
                no_siml, awal_siml, akhir_siml
                FROM project_pertamina_ep_regional2zona7_devplan
                ORDER BY nama_lengkap ASC
            `;
            
            console.log("Executing SQL for HSE data:", sql);
            
            const result = await pool.query(sql);
            
            // Debug: log jumlah baris hasil query
            console.log(`Query untuk data HSE mengembalikan ${result.rowCount} baris`);

            return result.rows;
            } catch (error) {
            console.error("Error in getHSEData():", error);
            if (error.code === '42P01') {
                console.error("Tabel project_pertamina_ep_regional2zona7_devplan tidak ada");
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
                AND table_name = 'regional2z7d_sertifikat'
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
            const tableExists = await Regional2Z7D.checkSertifikatTableExists();
            
            if (tableExists) {
              console.log("Table regional2z7d_sertifikat already exists");
              return true;
            }
            
            // Create table if it doesn't exist
            const sql = `
              CREATE TABLE regional2z7d_sertifikat (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES project_pertamina_ep_regional2zona7_devplan(id) ON DELETE CASCADE,
                judul_sertifikat VARCHAR(255) NOT NULL,
                tanggal_awal_berlaku DATE,
                tanggal_akhir_berlaku DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );
              CREATE INDEX IF NOT EXISTS idx_regional2z7d_sertifikat_user_id ON regional2z7d_sertifikat(user_id);
            `;
            
            await pool.query(sql);
            console.log("Table regional2z7d_sertifikat created successfully");
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
            
            // Ensure dates are in correct format
            if (sertifikatData.tanggal_awal_berlaku) {
              sertifikatData.tanggal_awal_berlaku = sanitizeDate(sertifikatData.tanggal_awal_berlaku);
            }
            if (sertifikatData.tanggal_akhir_berlaku) {
              sertifikatData.tanggal_akhir_berlaku = sanitizeDate(sertifikatData.tanggal_akhir_berlaku);
            }
            
            const sql = `
              INSERT INTO regional2z7d_sertifikat (
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
              SELECT * FROM regional2z7d_sertifikat
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
              SELECT * FROM regional2z7d_sertifikat
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
            
            // Ensure dates are in correct format
            if (sertifikatData.tanggal_awal_berlaku) {
              sertifikatData.tanggal_awal_berlaku = sanitizeDate(sertifikatData.tanggal_awal_berlaku);
            }
            if (sertifikatData.tanggal_akhir_berlaku) {
              sertifikatData.tanggal_akhir_berlaku = sanitizeDate(sertifikatData.tanggal_akhir_berlaku);
            }
            
            const sql = `
              UPDATE regional2z7d_sertifikat
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
              DELETE FROM regional2z7d_sertifikat
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