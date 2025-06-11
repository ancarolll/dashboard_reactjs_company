// middleware/history.middleware.js
const pool = require('../../config/db');

// Middleware untuk mendapatkan nama tabel history berdasarkan perusahaan
const getHistoryTable = (company) => {
  const historyTables = {
    'elnusa': 'elnusa_history',
    'regional4': 'regional4_history',
    'regional2eks': 'regional2eks_history',
    'regional2sub': 'regional2sub_history',
    'regional2zona7devplan': 'regional2zona7devplan_history',
    'regional2zona7wopdm': 'regional2zona7wopdm_history',
    'umran': 'umran_history'
  };
  
  return historyTables[company] || null;
};

// Middleware untuk mencatat perubahan kontrak
const trackKontrakChanges = (company) => {
  return async (req, res, next) => {
    // Hanya berlaku untuk metode PUT
    if (req.method !== 'PUT') {
      return next();
    }
    
    const { id } = req.params;
    const userData = req.body;
    
    // Cek apakah ada perubahan pada kontrak
    if (!userData.no_kontrak && !userData.awal_kontrak && !userData.akhir_kontrak) {
      return next();
    }
    
    try {
      // Dapatkan nama tabel untuk perusahaan
      const projectTable = `${company}_projects`;
      const historyTable = getHistoryTable(company);
      
      if (!historyTable) {
        return next();
      }
      
      // Dapatkan data lama sebelum diupdate
      const oldDataQuery = await pool.query(
        `SELECT no_kontrak, awal_kontrak, akhir_kontrak FROM ${projectTable} WHERE id = $1`,
        [id]
      );
      
      if (oldDataQuery.rows.length === 0) {
        return next();
      }
      
      const oldData = oldDataQuery.rows[0];
      
      // Simpan state lama agar bisa diakses di controller
      req.oldKontrakData = oldData;
      
      // Lanjutkan ke controller
      next();
    } catch (error) {
      console.error('Error in trackKontrakChanges middleware:', error);
      next();
    }
  };
};

module.exports = {
  trackKontrakChanges
};