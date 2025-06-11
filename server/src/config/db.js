import pg from 'pg';
import dotenv from 'dotenv';

let databaseInitialized = false;

dotenv.config();

const { Pool } = pg;

// Verifikasi variabel lingkungan database
const requiredEnvVars = ['PG_USER', 'PG_HOST', 'PG_DATABASE', 'PG_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1); // Keluar dengan error code
}

// PERBAIKAN: Override parsing tanggal untuk mencegah pergeseran timezone
// Ini akan menyimpan tanggal persis seperti yang diinput tanpa konversi timezone
pg.types.setTypeParser(1082, function(stringValue) {
  return stringValue; // Return string as is for DATE types
});

// Konfigurasi pool koneksi database
const pool = new Pool({
  user: process.env.PG_USER.trim(),
  host: process.env.PG_HOST.trim(),
  database: process.env.PG_DATABASE.trim(),
  password: process.env.PG_PASSWORD.trim(),
  port: parseInt(process.env.PG_PORT || '5432', 10),
  // PERBAIKAN: Tambahkan timezone explicit untuk mencegah pergeseran tanggal
  timezone: 'Asia/Jakarta', // Atau sesuaikan dengan timezone server Anda
});

// Log konfigurasi database (tanpa password untuk keamanan)
console.log('Database configuration:', {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT || 5432,
  timezone: 'Asia/Jakarta', // Menampilkan timezone yang digunakan
  idleTimeoutMillis: 30000 // Waktu maksimum koneksi idle dalam milisecond
});

// Function untuk test koneksi dan debugging
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    // Cek versi database untuk konfirmasi tambahan
    const pgVersion = await client.query('SELECT version()');
    console.log('PostgreSQL version:', pgVersion.rows[0].version);
    
    // PERBAIKAN: Cek timezone database untuk debugging
    const tzQuery = await client.query('SHOW timezone');
    console.log('Database timezone:', tzQuery.rows[0].timezone);
    
    // Test query to check if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_elnusa'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Table project_elnusa exists');
      // Check for data in the table
      const countQuery = await client.query('SELECT COUNT(*) FROM project_elnusa');
      console.log(`Table contains ${countQuery.rows[0].count} records`);
      
      // PERBAIKAN: Test samplekan data tanggal untuk melihat format
      const sampleDateQuery = await client.query(`
        SELECT id, nama_karyawan, kontrak_awal, kontrak_akhir 
        FROM project_elnusa 
        WHERE kontrak_awal IS NOT NULL 
        LIMIT 1
      `);
      
      if (sampleDateQuery.rows.length > 0) {
        console.log('Sample date format in database:', sampleDateQuery.rows[0]);
      }
    } else {
      console.error('❌ Table project_elnusa does not exist');
    }
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('Error details:', err);
    return false;
  }
};

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Tidak perlu exit process di production
  if (process.env.NODE_ENV !== 'production') {
    console.error('Database connection terminated');
  }
});

// Fungsi untuk inisialisasi tabel database jika belum ada
export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database tables...');
    
    // Buat tabel sections jika belum ada
    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Buat tabel management_documents jika belum ada
    await client.query(`
      CREATE TABLE IF NOT EXISTS management_documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        section_id INTEGER REFERENCES sections(id),
        file_name VARCHAR(255),
        file_path VARCHAR(255),
        file_type VARCHAR(100),
        upload_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    databaseInitialized = true;
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Tambahkan fungsi ini ke ekspor Anda
export const isDatabaseInitialized = () => {
  return databaseInitialized;
};

// Panggil test koneksi saat startup
testConnection();

// Fungsi untuk melakukan query ke database
export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms, rows: ${res.rowCount}, query: ${text.substring(0, 50)}...`);
    return res;
  } catch (error) {
    console.error('Error executing query:', error.message);
    console.error('Query text', text);
    console.error('Query params:', params);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;