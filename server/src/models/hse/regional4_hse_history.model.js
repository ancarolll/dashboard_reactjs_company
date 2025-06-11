import pool from "../../config/db.js";

export const Regional4HSEHistory = {
    /**
     * Check if the HSE history table exists and create it if not
     * @returns {boolean} - True if successful
     */
    ensureTableExists: async () => {
        try {
        // First check if table exists
        const checkTableSql = `
            SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'hse_regional4_history'
            );
        `;
        
        const tableExists = await pool.query(checkTableSql);
        
        if (tableExists.rows[0].exists) {
            console.log("HSE history table already exists");
            return true;
        }
        
        // Create table if it doesn't exist
        const createTableSql = `
            CREATE TABLE hse_regional4_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            nama_karyawan VARCHAR(255) NOT NULL,
            no_kontrak VARCHAR(100),
            
            -- MCU data lama
            no_mcu_lama VARCHAR(255),
            awal_mcu_lama DATE,
            akhir_mcu_lama DATE,
            hasil_mcu_lama VARCHAR(255),
            vendor_mcu_lama VARCHAR(255),
            
            -- MCU data baru
            no_mcu_baru VARCHAR(255),
            awal_mcu_baru DATE,
            akhir_mcu_baru DATE,
            hasil_mcu_baru VARCHAR(255),
            vendor_mcu_baru VARCHAR(255),
            
            -- HSE Passport data lama
            no_hsepassport_lama VARCHAR(255),
            awal_hsepassport_lama DATE,
            akhir_hsepassport_lama DATE,
            
            -- HSE Passport data baru
            no_hsepassport_baru VARCHAR(255),
            awal_hsepassport_baru DATE,
            akhir_hsepassport_baru DATE,
            
            -- SIML data lama
            no_siml_lama VARCHAR(255),
            awal_siml_lama DATE,
            akhir_siml_lama DATE,
            
            -- SIML data baru
            no_siml_baru VARCHAR(255),
            awal_siml_baru DATE,
            akhir_siml_baru DATE,
            
            -- Metadata
            waktu_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            
            -- Foreign key relationship
            FOREIGN KEY (user_id) REFERENCES project_pertamina_ep_regional4(id) ON DELETE CASCADE
            );
        `;
        
        await pool.query(createTableSql);
        console.log("HSE history table created successfully");
        return true;
        } catch (error) {
        console.error("Error ensuring HSE history table exists:", error);
        return false;
        }
    },

    /**
     * Add HSE history record
     * @param {Object} historyData - History data to record
     * @returns {Object} - Inserted record
     */
    addHistory: async (historyData) => {
        try {
        // Ensure table exists
        await Regional4HSEHistory.ensureTableExists();
        
        // Validate required fields
        if (!historyData.user_id || !historyData.nama_karyawan) {
            throw new Error('user_id and nama_karyawan are required fields');
        }
        
        // Build dynamic query based on provided fields
        const keys = Object.keys(historyData);
        const values = Object.values(historyData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        const sql = `
            INSERT INTO hse_regional4_history (${keys.join(', ')})
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
     * @param {number} userId - User ID
     * @returns {Array} - History records
     */
    getAllHistoryByUserId: async (userId) => {
        try {
        // Ensure table exists
        await Regional4HSEHistory.ensureTableExists();
        
        const sql = `
            SELECT * FROM hse_regional4_history
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
     * Check if HSE data changed significantly to warrant history recording
     * @param {Object} oldData - Old HSE data
     * @param {Object} newData - New HSE data 
     * @returns {boolean} - True if significant changes detected
     */
    isHSEDataChanged: (oldData, newData) => {
        if (!oldData || !newData) return false;
        
        // Check MCU changes
        const mcuChanged = (
        oldData.hasil_mcu !== newData.hasil_mcu ||
        oldData.vendor_mcu !== newData.vendor_mcu ||
        oldData.awal_mcu !== newData.awal_mcu ||
        oldData.akhir_mcu !== newData.akhir_mcu
        );
        
        // Check HSE Passport changes
        const hsePassportChanged = (
        oldData.no_hsepassport !== newData.no_hsepassport ||
        oldData.awal_hsepassport !== newData.awal_hsepassport ||
        oldData.akhir_hsepassport !== newData.akhir_hsepassport
        );
        
        // Check SIML changes
        const simlChanged = (
        oldData.no_siml !== newData.no_siml ||
        oldData.awal_siml !== newData.awal_siml ||
        oldData.akhir_siml !== newData.akhir_siml
        );
        
        return mcuChanged || hsePassportChanged || simlChanged;
    },

    /**
     * Prepare HSE history data object by comparing old and new data
     * @param {Object} oldData - Old user data
     * @param {Object} newData - New user data
     * @param {string} modifiedBy - User who made the modification
     * @returns {Object} - Prepared history data object
     */
    prepareHistoryData: (oldData, newData, modifiedBy = 'system') => {
        return {
        user_id: oldData.id,
        nama_karyawan: oldData.nama_karyawan,
        no_kontrak: oldData.no_kontrak,
        
        // MCU old data
        no_mcu_lama: oldData.no_mcu,
        awal_mcu_lama: oldData.awal_mcu,
        akhir_mcu_lama: oldData.akhir_mcu,
        hasil_mcu_lama: oldData.hasil_mcu,
        vendor_mcu_lama: oldData.vendor_mcu,
        
        // MCU new data
        no_mcu_baru: newData.no_mcu,
        awal_mcu_baru: newData.awal_mcu,
        akhir_mcu_baru: newData.akhir_mcu,
        hasil_mcu_baru: newData.hasil_mcu,
        vendor_mcu_baru: newData.vendor_mcu,
        
        // HSE Passport old data
        no_hsepassport_lama: oldData.no_hsepassport,
        awal_hsepassport_lama: oldData.awal_hsepassport,
        akhir_hsepassport_lama: oldData.akhir_hsepassport,
        
        // HSE Passport new data
        no_hsepassport_baru: newData.no_hsepassport,
        awal_hsepassport_baru: newData.awal_hsepassport,
        akhir_hsepassport_baru: newData.akhir_hsepassport,
        
        // SIML old data
        no_siml_lama: oldData.no_siml,
        awal_siml_lama: oldData.awal_siml,
        akhir_siml_lama: oldData.akhir_siml,
        
        // SIML new data
        no_siml_baru: newData.no_siml,
        awal_siml_baru: newData.awal_siml,
        akhir_siml_baru: newData.akhir_siml,
        
        // Metadata
        waktu_perubahan: new Date(),
        modified_by: modifiedBy
        };
    },

    /**
     * Get statistics on HSE changes
     * @returns {Object} - Statistics object
     */
    getHSEChangeStats: async () => {
        try {
        // Ensure table exists
        await Regional4HSEHistory.ensureTableExists();
        
        const sql = `
            SELECT 
            COUNT(*) as total_changes,
            COUNT(DISTINCT user_id) as unique_users,
            MAX(waktu_perubahan) as last_change,
            MIN(waktu_perubahan) as first_change
            FROM hse_regional4_history
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