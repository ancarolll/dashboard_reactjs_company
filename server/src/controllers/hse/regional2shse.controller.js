import { Regional2SHSEHistory } from "../../models/hse/regional2s_hse_history.model.js";
import { Regional2S } from "../../models/perusahaan/regional2s.model.js";
import pool from "../../config/db.js";

/**
 * Update data HSE karyawan (MCU, HSE Passport, dan SIM) with history tracking
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const updateHSEDataWithHistory = async (req, res) => {
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

// Get current user data before update for comparison
const oldUserData = await Regional2S.getUserById(id);
if (!oldUserData) {
    console.log(`User dengan ID ${id} tidak ditemukan`);
    return res.status(404).json({
    success: false,
    message: 'Karyawan tidak ditemukan'
    });
}

// Format dates properly
const dateFields = ['awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
dateFields.forEach(field => {
    if (userData[field] && typeof userData[field] === 'string') {
    // Log format for debugging
    console.log(`Format ${field} sebelum pemrosesan:`, userData[field]);
    
    // Convert DD/MM/YYYY to YYYY-MM-DD if needed
    if (userData[field].includes('/')) {
        const [day, month, year] = userData[field].split('/');
        userData[field] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Remove timestamp if present
    else if (userData[field].includes('T')) {
        userData[field] = userData[field].split('T')[0];
    }
    
    // Log the result for debugging
    console.log(`Format tanggal ${field} sesudah:`, userData[field]);
    }
});

// Filter only HSE data that needs to be updated
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

// Check if HSE data changed significantly
const isHSEChanged = Regional2SHSEHistory.isHSEDataChanged(oldUserData, hseUpdateData);

// Begin transaction
const client = await pool.connect();

try {
    await client.query('BEGIN');
    
    // Update the user data in the database
    const updatedUser = await Regional2S.updateUser(id, hseUpdateData);
    
    if (!updatedUser) {
    throw new Error('Gagal memperbarui data HSE');
    }
    
    if (isHSEChanged) {
        try {
          // Prepare history data
          const historyData = Regional2SHSEHistory.prepareHistoryData(oldUserData, hseUpdateData, modifiedBy);
          
          // Add record to history
          const historyResult = await Regional2SHSEHistory.addHistory(historyData);
          
          console.log(`Berhasil mencatat perubahan HSE dalam history untuk karyawan ID ${id}`);
          console.log(`History record ID: ${historyResult.id}`);
        } catch (historyError) {
          console.error(`Error saat mencatat history HSE: ${historyError.message}`);
          console.error(historyError.stack);
          // Continue with the operation even if history recording fails
        }
      } else {
        console.log(`Tidak ada perubahan signifikan pada data HSE untuk karyawan ID ${id}`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
    
    console.log(`Berhasil memperbarui data HSE untuk karyawan: ${updatedUser.nama_lengkap}`);
    
    res.status(200).json({
    success: true,
    message: 'Data HSE berhasil diperbarui',
    data: updatedUser,
    historyUpdated: isHSEChanged
    });
} catch (error) {
    // Rollback transaction on error
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
};

/**
 * Get HSE history for a specific user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getHSEHistory = async (req, res) => {
try {
const userId = req.params.id;

if (!userId) {
    return res.status(400).json({
    success: false,
    message: 'ID karyawan diperlukan'
    });
}

console.log(`Fetching HSE history for user ID: ${userId}`);

// Ensure user exists
const userExists = await Regional2S.getUserById(userId);
if (!userExists) {
    return res.status(404).json({
    success: false,
    message: 'Karyawan tidak ditemukan'
    });
}

// Get history records
const history = await Regional2SHSEHistory.getAllHistoryByUserId(userId);

console.log(`Retrieved ${history.length} HSE history records for user ID ${userId}`);

// Format dates for display if needed
const formattedHistory = history.map(record => {
    // Create a copy to avoid mutating the original
    const formatted = { ...record };
    
    // Format date fields if needed
    const dateFields = [
    'awal_mcu_lama', 'akhir_mcu_lama', 'awal_mcu_baru', 'akhir_mcu_baru',
    'awal_hsepassport_lama', 'akhir_hsepassport_lama', 'awal_hsepassport_baru', 'akhir_hsepassport_baru',
    'awal_siml_lama', 'akhir_siml_lama', 'awal_siml_baru', 'akhir_siml_baru'
    ];
    
    dateFields.forEach(field => {
    if (formatted[field]) {
        // Already handled by the database driver, but just to be safe
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
console.error('Error getting HSE history:', error);
res.status(500).json({
    success: false,
    message: 'Gagal mengambil riwayat HSE',
    error: error.message
});
}
};

/**
 * Get HSE history statistics
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getHSEHistoryStats = async (req, res) => {
try {
console.log('Fetching HSE history statistics');

// Get statistics
const stats = await Regional2SHSEHistory.getHSEChangeStats();

res.status(200).json({
    success: true,
    message: 'Statistik HSE berhasil diambil',
    data: stats
});
} catch (error) {
console.error('Error getting HSE history stats:', error);
res.status(500).json({
    success: false,
    message: 'Gagal mengambil statistik HSE',
    error: error.message
});
}
};

// Export the functions
export const Regional2SHSEController = {
    updateHSEDataWithHistory,
    getHSEHistory,
    getHSEHistoryStats
};