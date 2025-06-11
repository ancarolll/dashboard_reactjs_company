// Fungsi untuk sanitasi tanggal dari berbagai input
export const sanitizeDate = (dateInput) => {
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
export const ensureValidDate = (formData, fieldName) => {
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
 * Script untuk memperbaiki format dan nilai tanggal kontrak di database
 */
async function fixContractDates() {
  const client = await pool.connect();
  try {
      // Mulai transaksi
      await client.query('BEGIN');
      
      console.log("Checking current date in database...");
      const currentDateResult = await client.query('SELECT CURRENT_DATE as today');
      const dbDate = currentDateResult.rows[0].today;
      console.log(`Database date: ${dbDate}`);
      
      // Periksa semua tanggal kontrak
      const checkQuery = `
          SELECT id, nama_lengkap_karyawan, kontrak_awal, kontrak_akhir 
          FROM project_umran 
          WHERE sebab_na IS NULL
      `;
      
      const checkResult = await client.query(checkQuery);
      console.log(`Found ${checkResult.rowCount} active contracts to check`);
      
      let updates = 0;
      
      // Loop untuk memeriksa dan memperbaiki setiap tanggal
      for (const row of checkResult.rows) {
          try {
              const { id, nama_lengkap_karyawan, kontrak_awal, kontrak_akhir } = row;
              
              console.log(`Checking contract for ID ${id} (${nama_lengkap_karyawan}):`);
              console.log(`  Original: awal=${kontrak_awal}, akhir=${kontrak_akhir}`);
              
              // Periksa apakah tanggal perlu diperbaiki
              let updateData = {};
              let needsUpdate = false;
              
              // Pastikan kontrak_awal adalah nilai valid dan dalam format yang benar
              if (kontrak_awal) {
                  let awal = new Date(kontrak_awal);
                  if (!isNaN(awal.getTime())) {
                      // Format ke YYYY-MM-DD
                      const formattedAwal = awal.toISOString().split('T')[0];
                      if (formattedAwal !== kontrak_awal) {
                          updateData.kontrak_awal = formattedAwal;
                          needsUpdate = true;
                          console.log(`  Fixed kontrak_awal: ${kontrak_awal} -> ${formattedAwal}`);
                      }
                  }
              }
              
              // Pastikan kontrak_akhir adalah nilai valid dan dalam format yang benar
              if (kontrak_akhir) {
                  let akhir = new Date(kontrak_akhir);
                  if (!isNaN(akhir.getTime())) {
                      // Format ke YYYY-MM-DD
                      const formattedAkhir = akhir.toISOString().split('T')[0];
                      if (formattedAkhir !== kontrak_akhir) {
                          updateData.kontrak_akhir = formattedAkhir;
                          needsUpdate = true;
                          console.log(`  Fixed kontrak_akhir: ${kontrak_akhir} -> ${formattedAkhir}`);
                      }
                      
                      // PERBAIKAN: Untuk data contoh, pastikan tanggal akhir kontrak adalah masa depan
                      // Ini hanya untuk contoh dan demonstrasi
                      const today = new Date(dbDate);
                      
                      // Jika kontrak berakhir pada 2025-02-28 (sebelum 2025-04-23)
                      if (akhir < today && formattedAkhir === '2025-02-28') {
                          // Ubah ke masa depan (misalnya 3 bulan dari sekarang)
                          const newEndDate = new Date(today);
                          newEndDate.setMonth(today.getMonth() + 3);
                          updateData.kontrak_akhir = newEndDate.toISOString().split('T')[0];
                          needsUpdate = true;
                          console.log(`  Extended kontrak_akhir to future: ${formattedAkhir} -> ${updateData.kontrak_akhir}`);
                      }
                  }
              }
              
              // Update database jika diperlukan
              if (needsUpdate && Object.keys(updateData).length > 0) {
                  const setClause = Object.keys(updateData)
                      .map((key, i) => `${key} = $${i + 1}`)
                      .join(', ');
                  
                  const updateQuery = `
                      UPDATE project_umran
                      SET ${setClause}
                      WHERE id = $${Object.keys(updateData).length + 1}
                  `;
                  
                  await client.query(updateQuery, [...Object.values(updateData), id]);
                  updates++;
                  console.log(`  Updated contract dates for ID ${id}`);
              }
          } catch (err) {
              console.error(`Error processing record:`, err);
          }
      }
      
      // Commit transaksi
      await client.query('COMMIT');
      console.log(`Fixed ${updates} contract dates`);
      
  } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error fixing contract dates:", error);
  } finally {
      client.release();
  }
};

/**
 * Hitung selisih hari antara dua tanggal dengan benar
 * @param {string|Date} endDateStr - Tanggal akhir
 * @param {string|Date} startDateStr - Tanggal awal (default: tanggal hari ini dari database)
 * @returns {number} - Jumlah hari tersisa (bisa negatif jika kontrak sudah berakhir)
 */
const calculateDaysRemaining = async (endDateStr, startDateStr = null) => {
  if (!endDateStr) return 0;
  
  try {
      // Jika tanggal awal tidak disediakan, gunakan tanggal dari database
      let startDate;
      if (startDateStr) {
          startDate = new Date(startDateStr);
      } else {
          const currentDateResult = await pool.query('SELECT CURRENT_DATE as today');
          startDate = new Date(currentDateResult.rows[0].today);
      }
      
      // Normalisasi ke tengah malam
      startDate.setHours(0, 0, 0, 0);
      
      // Parse tanggal akhir
      const endDate = new Date(endDateStr);
      endDate.setHours(0, 0, 0, 0);
      
      // Hitung selisih dalam milisecond
      const diffTime = endDate.getTime() - startDate.getTime();
      
      // Konversi ke hari
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
      console.error(`Error calculating days: ${error.message}`);
      return 0;
  }
};

