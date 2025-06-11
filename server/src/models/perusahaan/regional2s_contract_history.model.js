import pool from "../../config/db.js";

export const Regional2sContractHistory = {
    /**
     * Mencatat riwayat perubahan kontrak
     * @param {object} data - Data riwayat yang akan disimpan
     * @returns {object} Data riwayat yang tersimpan
     */
    addHistory: async (historyData) => {
        try {
            // Pastikan parameter yang diperlukan ada
            const requiredFields = [
            'user_id', 'nama_karyawan', 
            'no_kontrak_lama', 'kontrak_awal_lama', 'kontrak_akhir_lama',
            'no_kontrak_baru', 'kontrak_awal_baru', 'kontrak_akhir_baru'
            ];
            
            for (const field of requiredFields) {
            if (historyData[field] === undefined) {
                console.warn(`Missing required field: ${field}`);
            }
            }
            
            // Tambahkan waktu perubahan jika tidak ada
            if (!historyData.waktu_perubahan) {
            historyData.waktu_perubahan = new Date();
            }
            
            // Tambahkan modified_by jika tidak ada
            if (!historyData.modified_by) {
            historyData.modified_by = 'system';
            }
            
            const keys = Object.keys(historyData);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            
            const query = `
            INSERT INTO regional2s_contract_history 
            (${keys.join(', ')})
            VALUES (${placeholders})
            RETURNING *
            `;
            
            const values = keys.map(key => historyData[key]);
            
            console.log('Executing query:', query);
            console.log('With values:', values);
            
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error saat menyimpan riwayat kontrak:", error);
            throw error;
        }
    },
    
        /**
         * Mendapatkan riwayat kontrak berdasarkan user_id
         * @param {number} userId - ID karyawan
         * @returns {Array} Daftar riwayat kontrak
         */
        getHistoryByUserId: async (userId) => {
        try {
            // Add debug logs
            console.log(`Fetching contract history for user ID: ${userId} from database`);
            
            // Check if the table exists first
            const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' 
                AND table_name = 'regional2s_contract_history'
            );
            `;
            
            const tableExists = await pool.query(checkTableQuery);
            
            if (!tableExists.rows[0].exists) {
            console.error("Table regional2s_contract_history does not exist");
            return [];
            }
            
            // Use parameterized query with better formatting
            const query = `
            SELECT * FROM regional2s_contract_history
            WHERE user_id = $1
            ORDER BY waktu_perubahan DESC
            `;
            
            console.log('Executing SQL query:', query.replace(/\s+/g, ' ').trim());
            console.log('With parameters:', [userId]);
            
            const result = await pool.query(query, [userId]);
            
            console.log(`Query returned ${result.rowCount} rows for user ${userId}`);
            
            // If no results, perform a diagnostic query
            if (result.rowCount === 0) {
            const diagnosticQuery = `SELECT COUNT(*) FROM regional2s_contract_history`;
            const diagnosticResult = await pool.query(diagnosticQuery);
            console.log(`Total records in table: ${diagnosticResult.rows[0].count}`);
            
            if (parseInt(diagnosticResult.rows[0].count) > 0) {
                // Sample some records to see if the data structure is as expected
                const sampleQuery = `SELECT * FROM regional2s_contract_history LIMIT 1`;
                const sample = await pool.query(sampleQuery);
                console.log('Sample record structure:', sample.rows[0]);
            }
            }
            
            return result.rows;
        } catch (error) {
            console.error("Error in getHistoryByUserId:", error);
            throw error;
        }
    },
    
        /**
         * Mendapatkan semua riwayat kontrak untuk satu user
         */
        getAllContractHistory: async (req, res) => {
        try {
            const userId = req.params.id;
            console.log(`Getting all contract history for user ${userId}`);
            
            const history = await Regional2sContractHistory.getAllHistoryByUserId(userId);
            
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
         * Mendapatkan semua riwayat kontrak untuk satu user, termasuk dari tabel lama
         */
        getAllHistoryByUserId: async (userId) => {
        try {
            // Cek apakah tabel baru ada
            const newTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' 
                AND table_name = 'regional2s_contract_history'
            );
            `;
            const newTableExists = await pool.query(newTableQuery);
            
            // Cek apakah tabel lama ada
            const oldTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' 
                AND table_name = 'history_regional2s'
            );
            `;
            const oldTableExists = await pool.query(oldTableQuery);
            
            let combinedResults = [];
            
            // Ambil data dari tabel baru jika ada
            if (newTableExists.rows[0].exists) {
            const newHistoryQuery = `
                SELECT 
                id,
                user_id,
                nama_karyawan,
                no_kontrak_lama,
                kontrak_awal_lama,
                kontrak_akhir_lama,
                no_kontrak_baru,
                kontrak_awal_baru,
                kontrak_akhir_baru,
                modified_by,
                waktu_perubahan as tanggal_perubahan
                FROM regional2s_contract_history
                WHERE user_id = $1
            `;
            const newResult = await pool.query(newHistoryQuery, [userId]);
            combinedResults = [...newResult.rows];
            }
            
            // Ambil data dari tabel lama jika ada
            if (oldTableExists.rows[0].exists) {
            const oldHistoryQuery = `
                SELECT 
                id,
                user_id,
                null as nama_karyawan,
                no_kontrak_lama,
                kontrak_awal_lama,
                kontrak_akhir_lama,
                no_kontrak_baru,
                kontrak_awal_baru,
                kontrak_akhir_baru,
                'system' as modified_by,
                tanggal_perubahan
                FROM history_regional2s
                WHERE user_id = $1
            `;
            const oldResult = await pool.query(oldHistoryQuery, [userId]);
            combinedResults = [...combinedResults, ...oldResult.rows];
            }
            
            // Urutkan berdasarkan tanggal
            return combinedResults.sort((a, b) => {
            const dateA = new Date(a.tanggal_perubahan);
            const dateB = new Date(b.tanggal_perubahan);
            return dateB - dateA; // Descending order
            });
        } catch (error) {
            console.error("Error getting combined history:", error);
            throw error;
        }
    },
        
        /**
         * Menghitung jumlah perubahan kontrak per karyawan
         * @returns {Array} Statistik jumlah perubahan per karyawan
         */
        getContractChangeStats: async () => {
        try {
            const query = `
            SELECT user_id, nama_karyawan, COUNT(*) as change_count
            FROM regional2s_contract_history
            GROUP BY user_id, nama_karyawan
            ORDER BY change_count DESC
            `;
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error saat mengambil statistik perubahan kontrak:", error);
            throw error;
        }
    }
};