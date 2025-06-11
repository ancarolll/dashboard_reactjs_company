import { query } from '../config/db.js';

export const getClients = async () => {
    try {
        const sql = "SELECT * FROM project_elnusa";
        const result = await query(sql);
        return result.rows;
    } catch (error) {
        console.error('Error in getClients service:', error);
        throw error;
    }
};

/**
 * Mengambil data karyawan berdasarkan nomor kontrak
 * @param {string} no_kontrak - Nomor kontrak karyawan
 * @returns {Promise<Object|null>} Data karyawan atau null jika tidak ditemukan
 */
export const getClientByContract = async (no_kontrak) => {
    try {
        // Changed from 'proyek' to 'no_kontrak' to match the frontend's expectation
        const sql = "SELECT * FROM project_elnusa WHERE no_kontrak = $1";
        const result = await query(sql, [no_kontrak]);
        
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error dalam getClientByContract service:', error);
        throw error;
    }
};

export const createClient = async (elnusaData) => {
    try {
        // Ambil semua key dari elnusaData untuk membuat query dinamis
        const keys = Object.keys(elnusaData);
        const values = keys.map(key => elnusaData[key]);
        
        // Buat placeholder untuk prepared statement ($1, $2, dst)
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        // Buat query SQL
        const sql = `
            INSERT INTO project_elnusa (${keys.join(', ')}) 
            VALUES (${placeholders})
            RETURNING *
        `;
        
        const result = await query(sql, values);
        console.log('Karyawan baru berhasil dibuat');
        return result.rows[0];
    } catch (error) {
        console.error('Error in createClient service:', error);
        throw error;
    }
};

export const updateClient = async (elnusaData, no_kontrak) => {
    try {
        // Ambil semua key dari elnusaData untuk membuat query dinamis
        const keys = Object.keys(elnusaData);
        
        // Buat set clause untuk update (column1 = $1, column2 = $2, dst)
        const setClauses = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
        
        // Siapkan values untuk prepared statement
        const values = [...keys.map(key => elnusaData[key]), no_kontrak];
        
        // Buat query SQL - Changed from 'proyek' to 'no_kontrak'
        const sql = `
            UPDATE project_elnusa
            SET ${setClauses}
            WHERE no_kontrak = $${keys.length + 1}
            RETURNING *
            `;
        const result = await query(sql, values);
        
        // Jika tidak ada baris yang diupdate, kembalikan null
        if (result.rowCount === 0) {
            console.log(`Tidak ada karyawan dengan nomor kontrak ${no_kontrak}`);
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error in updateClient service:', error);
        throw error;
    }
};

export const deleteClient = async (no_kontrak) => {
    try {
        // Buat query SQL untuk delete - Changed from 'proyek' to 'no_kontrak'
        const sql = `
            DELETE FROM project_elnusa
            WHERE no_kontrak = $1
            RETURNING *
            `;
        
        const result = await query(sql, [no_kontrak]);
        
        // Jika tidak ada baris yang dihapus, kembalikan false
        if (result.rowCount === 0) {
            console.log(`Tidak ada karyawan dengan nomor kontrak ${no_kontrak}`);
            return null;
        }
        
        console.log(`Karyawan dengan nomor kontrak ${no_kontrak} berhasil dihapus`);
        return result.rows[0];
    } catch (error) {
        console.error('Error dalam deleteClient service:', error);
        throw error;
    }
};


  // Tambahkan atau modifikasi pada clientServices.js
  export const getNonActiveClients = async () => {
    try {
      const sql = `
        SELECT * FROM project_elnusa 
        WHERE status_karyawan = 'Non-Aktif'
      `;
      
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('Error dalam getNonActiveClients service:', error);
      throw error;
    }
  };
  
  export const deleteNonActiveClient = async (no_kontrak) => {
    try {
      // Buat query SQL untuk delete karyawan non-aktif
      const sql = `
        DELETE FROM project_elnusa
        WHERE no_kontrak = $1
        AND (status_karyawan = 'Non-Aktif' 
             OR (kontrak_akhir IS NOT NULL AND kontrak_akhir < CURRENT_DATE))
        RETURNING *
      `;
      
      const result = await query(sql, [no_kontrak]);
      
      // Jika tidak ada baris yang dihapus, kembalikan null
      if (result.rowCount === 0) {
        console.log(`Tidak ada karyawan non-aktif dengan nomor kontrak ${no_kontrak}`);
        return null;
      }
      
      console.log(`Karyawan non-aktif dengan nomor kontrak ${no_kontrak} berhasil dihapus`);
      return result.rows[0];
    } catch (error) {
      console.error('Error dalam deleteNonActiveClient service:', error);
      throw error;
    }
  };

  export const restoreNonActiveClient = async (no_kontrak, userData) => {
    try {
      // Memastikan kontrak_akhir diperpanjang dan status diubah
      if (!userData.kontrak_akhir) {
        throw new Error('Tanggal kontrak akhir harus disediakan untuk pemulihan');
      }
      
      // Validasi tanggal akhir kontrak
      const endDate = new Date(userData.kontrak_akhir);
      const today = new Date();
      
      if (endDate <= today) {
        throw new Error('Tanggal akhir kontrak harus setelah hari ini');
      }
      
      // Update data karyawan
      const keys = Object.keys(userData);
      const setClauses = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
      const values = [...keys.map(key => userData[key]), no_kontrak];
      
      // Set status_karyawan menjadi 'Aktif'
      const sql = `
        UPDATE project_elnusa
        SET ${setClauses}, status_karyawan = 'Aktif'
        WHERE no_kontrak = $${keys.length + 1}
        RETURNING *
      `;
      
      const result = await query(sql, values);
      
      // Jika tidak ada baris yang diupdate, kembalikan null
      if (result.rowCount === 0) {
        console.log(`Tidak ada karyawan non-aktif dengan nomor kontrak ${no_kontrak}`);
        return null;
      }
      
      console.log(`Karyawan dengan nomor kontrak ${no_kontrak} berhasil dipulihkan`);
      return result.rows[0];
    } catch (error) {
      console.error('Error dalam restoreNonActiveClient service:', error);
      throw error;
    }
  };
  
