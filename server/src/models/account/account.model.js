// account.model.js
import pool from '../../config/db.js';

export const AccountModel = {
  // Mendapatkan semua akun admin
  getAllAdmins: async () => {
    try {
      console.log('Getting all admins from database');
      
      // Check database connection first
      try {
        await pool.query('SELECT 1');
        console.log('Database connection is working');
      } catch (connError) {
        console.error('Database connection failed!', connError);
        throw new Error('Database connection failed: ' + connError.message);
      }
      
      // Check if table exists
      try {
        const tableCheckResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'management_account_admin'
          );
        `);
        
        if (!tableCheckResult.rows[0].exists) {
          console.error('Table management_account_admin does not exist!');
          
          // Create table if not exists
          console.log('Attempting to create management_account_admin table...');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS management_account_admin (
              id SERIAL PRIMARY KEY,
              username VARCHAR(100),
              password VARCHAR(200),
              role VARCHAR(100),
              access_pages TEXT,
              category VARCHAR(50),
              created_at TIMESTAMP WITHOUT TIME ZONE,
              updated_at TIMESTAMP WITHOUT TIME ZONE
            )
          `);
          console.log('Table management_account_admin created successfully');
        } else {
          console.log('Table management_account_admin exists');
        }
      } catch (tableError) {
        console.error('Error checking/creating table:', tableError);
      }
      
      const query = `
        SELECT id, username, password, role, access_pages, category, 
               created_at, updated_at 
        FROM management_account_admin
        ORDER BY id ASC
      `;
      
      console.log('Executing query:', query);
      const result = await pool.query(query);
      
      // Log query results
      console.log(`Found ${result.rows.length} admin accounts`);
      
      // Konversi access_pages dari string ke array
      const accounts = result.rows.map(account => ({
        ...account,
        accessPages: account.access_pages ? account.access_pages.split(',') : []
      }));
      
      return accounts;
    } catch (error) {
      console.error('Error in getAllAdmins:', error);
      throw error;
    }
  },

  // Mendapatkan akun by ID
  getById: async (id) => {
    try {
      console.log(`Getting admin with ID: ${id}`);
      const query = `
        SELECT id, username, password, role, access_pages, category, 
               created_at, updated_at 
        FROM management_account_admin
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log(`No admin found with ID: ${id}`);
        return null;
      }
      
      console.log(`Admin found: ${result.rows[0].username}`);
      const account = result.rows[0];
      return {
        ...account,
        accessPages: account.access_pages ? account.access_pages.split(',') : []
      };
    } catch (error) {
      console.error(`Error getting account with ID ${id}:`, error);
      throw error;
    }
  },

  // Mendapatkan akun by username
  getByUsername: async (username) => {
    try {
      console.log(`Getting admin by username: ${username}`);
      const query = `
        SELECT id, username, password, role, access_pages, category, 
               created_at, updated_at 
        FROM management_account_admin
        WHERE username = $1
      `;
      const result = await pool.query(query, [username]);
      
      if (result.rows.length === 0) {
        console.log(`No admin found with username: ${username}`);
        return null;
      }
      
      console.log(`Admin found with username: ${username}`);
      const account = result.rows[0];
      return {
        ...account,
        accessPages: account.access_pages ? account.access_pages.split(',') : []
      };
    } catch (error) {
      console.error(`Error getting account with username ${username}:`, error);
      throw error;
    }
  },

  // Menambahkan akun baru
  create: async (accountData) => {
    try {
      console.log('Creating new admin account:', accountData.username);
      // Konversi array accessPages menjadi string untuk disimpan di database
      const accessPagesString = accountData.accessPages?.join(',') || '';
      
      const now = new Date();
      
      const query = `
        INSERT INTO management_account_admin (
          username, password, role, access_pages, category, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, username, password, role, access_pages, category, created_at, updated_at
      `;
      
      const values = [
        accountData.username,
        accountData.password, // Note: In production, you should hash this password
        accountData.role,
        accessPagesString,
        accountData.category,
        now,
        now
      ];
      
      console.log('Executing query with values:', values);
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create account');
      }
      
      console.log(`Admin account created successfully: ${accountData.username}`);
      const newAccount = result.rows[0];
      return {
        ...newAccount,
        accessPages: newAccount.access_pages ? newAccount.access_pages.split(',') : []
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Update akun
  update: async (id, accountData) => {
    try {
      console.log(`Updating admin account ID ${id}`);
      // Konversi array accessPages menjadi string untuk disimpan di database
      const accessPagesString = accountData.accessPages?.join(',') || '';
      
      const now = new Date();
      
      const query = `
        UPDATE management_account_admin SET
          username = $1,
          password = $2,
          role = $3,
          access_pages = $4,
          category = $5,
          updated_at = $6
        WHERE id = $7
        RETURNING id, username, password, role, access_pages, category, created_at, updated_at
      `;
      
      const values = [
        accountData.username,
        accountData.password,
        accountData.role,
        accessPagesString,
        accountData.category,
        now,
        id
      ];
      
      console.log('Executing update query with values:', {
        username: accountData.username,
        role: accountData.role,
        accessPages: accessPagesString.substring(0, 50) + '...',
        id
      });
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Account with ID ${id} not found`);
      }
      
      console.log(`Admin account updated successfully: ${accountData.username}`);
      const updatedAccount = result.rows[0];
      return {
        ...updatedAccount,
        accessPages: updatedAccount.access_pages ? updatedAccount.access_pages.split(',') : []
      };
    } catch (error) {
      console.error(`Error updating account with ID ${id}:`, error);
      throw error;
    }
  },

  // Hapus akun
  delete: async (id) => {
    try {
      console.log(`Deleting admin account ID ${id}`);
      // First check if the user is the master admin
      const checkQuery = `
        SELECT username FROM management_account_admin WHERE id = $1
      `;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        throw new Error(`Account with ID ${id} not found`);
      }
      
      if (checkResult.rows[0].username === 'master_admin') {
        throw new Error('Cannot delete master_admin account');
      }
      
      const query = `
        DELETE FROM management_account_admin WHERE id = $1
        RETURNING id
      `;
      
      console.log('Executing delete query for ID:', id);
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Account with ID ${id} not found`);
      }
      
      console.log(`Admin account deleted successfully: ID ${id}`);
      return { id: result.rows[0].id };
    } catch (error) {
      console.error(`Error deleting account with ID ${id}:`, error);
      throw error;
    }
  },

  // Login
  login: async (username, password) => {
    try {
      console.log(`Login attempt for username: ${username}`);
      const query = `
        SELECT id, username, password, role, access_pages, category,
               created_at, updated_at
        FROM management_account_admin
        WHERE username = $1 AND password = $2
      `;
      
      const result = await pool.query(query, [username, password]);
      
      if (result.rows.length === 0) {
        console.log(`Login failed for username: ${username}`);
        return null;
      }
      
      console.log(`Login successful for username: ${username}`);
      const account = result.rows[0];
      return {
        ...account,
        accessPages: account.access_pages ? account.access_pages.split(',') : []
      };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  },

  // PERBAIKAN: Hanya setup tabel dan master admin minimal, bukan hardcode users
  initMasterAdmin: async () => {
    try {
      console.log('Initializing database and checking master admin...');
      
      // Check if table exists first
      try {
        const tableCheckResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'management_account_admin'
          );
        `);
        
        if (!tableCheckResult.rows[0].exists) {
          console.log('Table management_account_admin does not exist, creating it...');
          
          await pool.query(`
            CREATE TABLE IF NOT EXISTS management_account_admin (
              id SERIAL PRIMARY KEY,
              username VARCHAR(100) UNIQUE NOT NULL,
              password VARCHAR(200) NOT NULL,
              role VARCHAR(100) NOT NULL,
              access_pages TEXT,
              category VARCHAR(50),
              created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            )
          `);
          console.log('✅ Table management_account_admin created successfully');
        } else {
          console.log('✅ Table management_account_admin already exists');
        }
      } catch (tableError) {
        console.error('Error checking/creating table:', tableError);
        throw new Error('Could not check/create table: ' + tableError.message);
      }
      
      // Cek apakah ada master_admin - hanya buat jika benar-benar tidak ada
      const checkMasterQuery = `
        SELECT id, username, role FROM management_account_admin WHERE username = 'master_admin'
      `;
      
      const checkMasterResult = await pool.query(checkMasterQuery);
      
      if (checkMasterResult.rows.length === 0) {
        // Buat master_admin minimal jika benar-benar belum ada
        console.log('No master_admin found, creating minimal master_admin account...');
        const now = new Date();
        
        // Minimal access pages untuk master admin
        const masterAccessPages = ['/admin-account', '/user-account'].join(',');
        
        const masterQuery = `
          INSERT INTO management_account_admin (
            username, password, role, access_pages, category, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, username, role
        `;
        
        const masterValues = [
          'master_admin',
          'master123', // HANYA untuk fallback - di production harus di-hash
          'Master Admin',
          masterAccessPages,
          'master',
          now,
          now
        ];
        
        const masterResult = await pool.query(masterQuery, masterValues);
        console.log('✅ Master admin account created successfully');
        console.log('🔑 Fallback Master Admin: username=master_admin, password=master123');
        console.log('⚠️  NOTE: Please change the password immediately in production!');
      } else {
        console.log('✅ Master admin account already exists');
        console.log(`👤 Existing master admin: ${checkMasterResult.rows[0].username} (${checkMasterResult.rows[0].role})`);
      }
      
      // PERBAIKAN: Update access pages untuk users yang sudah ada dengan role "Admin HSE"
      await AccountModel.updateHSEAccessPages();
      
      // PERBAIKAN: Log informasi akun yang tersedia dari database
      const allAccountsQuery = `
        SELECT username, role, access_pages FROM management_account_admin ORDER BY id
      `;
      const allAccountsResult = await pool.query(allAccountsQuery);
      
      console.log('\n📋 Available accounts from database:');
      console.log('=====================================');
      if (allAccountsResult.rows.length === 0) {
        console.log('❌ No accounts found in database');
        console.log('Please add accounts through admin panel or database directly');
      } else {
        allAccountsResult.rows.forEach(account => {
          const pages = account.access_pages ? account.access_pages.split(',').length : 0;
          console.log(`👤 ${account.username} (${account.role}) - ${pages} access pages`);
        });
      }
      console.log('=====================================\n');
      
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },

  // PERBAIKAN: Fungsi untuk update access pages HSE untuk users yang sudah ada
  updateHSEAccessPages: async () => {
    try {
      console.log('Checking and updating HSE access pages for existing users...');
      
      // Daftar halaman HSE yang harus bisa diakses oleh role "Admin HSE"
      const hseAccessPages = [
        '/hse-elnusa',
        '/hse-elnusa-form',
        '/hse-regional4',
        '/hse-regional4-form',
        '/hse-regional2x',
        '/hse-regional2x-form',
        '/hse-regional2s',
        '/hse-regional2s-form',
        '/hse-regional2z7d',
        '/hse-regional2z7d-form',
        '/hse-regional2z7w',
        '/hse-regional2z7w-form',
        '/hse-tar'
      ];
      
      // Cari semua user dengan role "Admin HSE"
      const findHSEUsersQuery = `
        SELECT id, username, access_pages FROM management_account_admin 
        WHERE role = 'Admin HSE'
      `;
      
      const hseUsersResult = await pool.query(findHSEUsersQuery);
      
      if (hseUsersResult.rows.length > 0) {
        console.log(`Found ${hseUsersResult.rows.length} Admin HSE users`);
        
        for (const user of hseUsersResult.rows) {
          const currentPages = user.access_pages ? user.access_pages.split(',') : [];
          
          // Gabungkan dengan halaman HSE baru (hapus duplikasi)
          const allPages = [...new Set([...currentPages, ...hseAccessPages])];
          const updatedAccessPages = allPages.join(',');
          
          // Update access pages untuk user ini
          const updateQuery = `
            UPDATE management_account_admin 
            SET access_pages = $1, updated_at = $2 
            WHERE id = $3
          `;
          
          await pool.query(updateQuery, [updatedAccessPages, new Date(), user.id]);
          console.log(`✅ Updated access pages for Admin HSE: ${user.username}`);
        }
      } else {
        console.log('ℹ️  No existing Admin HSE users found in database');
      }
      
    } catch (error) {
      console.error('Error updating HSE access pages:', error);
      // Don't throw error, just log it as this is not critical
    }
  },

  // PERBAIKAN: Fungsi untuk mendapatkan akun berdasarkan role
  getByRole: async (role) => {
    try {
      console.log(`Getting accounts with role: ${role}`);
      const query = `
        SELECT id, username, password, role, access_pages, category, 
               created_at, updated_at 
        FROM management_account_admin
        WHERE role = $1
        ORDER BY created_at ASC
      `;
      const result = await pool.query(query, [role]);
      
      console.log(`Found ${result.rows.length} accounts with role: ${role}`);
      
      // Konversi access_pages dari string ke array
      const accounts = result.rows.map(account => ({
        ...account,
        accessPages: account.access_pages ? account.access_pages.split(',') : []
      }));
      
      return accounts;
    } catch (error) {
      console.error(`Error getting accounts with role ${role}:`, error);
      throw error;
    }
  },

  // PERBAIKAN: Fungsi untuk check apakah ada user dengan role tertentu
  hasUserWithRole: async (role) => {
    try {
      const query = `
        SELECT COUNT(*) as count FROM management_account_admin WHERE role = $1
      `;
      const result = await pool.query(query, [role]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error(`Error checking user with role ${role}:`, error);
      return false;
    }
  }
};

export default AccountModel;