import pool from '../../config/db.js';

export const AccountUserModel = {
    // Mendapatkan semua akun user
    getAllUsers: async () => {
      try {
        console.log('Getting all users from database');
        
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
              AND table_name = 'management_account_user'
            );
          `);
          
          if (!tableCheckResult.rows[0].exists) {
            console.error('Table management_account_user does not exist!');
            
            // Create table if not exists
            console.log('Attempting to create management_account_user table...');
            await pool.query(`
              CREATE TABLE IF NOT EXISTS management_account_user (
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
            console.log('Table management_account_user created successfully');
          } else {
            console.log('Table management_account_user exists');
          }
        } catch (tableError) {
          console.error('Error checking/creating table:', tableError);
        }
        
        const query = `
          SELECT id, username, password, role, access_pages, category, 
                 created_at, updated_at 
          FROM management_account_user
          ORDER BY id ASC
        `;
        
        console.log('Executing query:', query);
        const result = await pool.query(query);
        
        // Log query results
        console.log(`Found ${result.rows.length} user accounts`);
        
        // Konversi access_pages dari string ke array
        const accounts = result.rows.map(account => ({
          ...account,
          accessPages: account.access_pages ? account.access_pages.split(',') : []
        }));
        
        return accounts;
      } catch (error) {
        console.error('Error in getAllUsers:', error);
        throw error;
      }
    },
  
    // Mendapatkan akun by ID
    getById: async (id) => {
      try {
        console.log(`Getting user with ID: ${id}`);
        const query = `
          SELECT id, username, password, role, access_pages, category, 
                 created_at, updated_at 
          FROM management_account_user
          WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
          console.log(`No user found with ID: ${id}`);
          return null;
        }
        
        console.log(`User found: ${result.rows[0].username}`);
        const account = result.rows[0];
        return {
          ...account,
          accessPages: account.access_pages ? account.access_pages.split(',') : []
        };
      } catch (error) {
        console.error(`Error getting user with ID ${id}:`, error);
        throw error;
      }
    },
  
    // Mendapatkan akun by username
    getByUsername: async (username) => {
      try {
        console.log(`Getting user by username: ${username}`);
        const query = `
          SELECT id, username, password, role, access_pages, category, 
                 created_at, updated_at 
          FROM management_account_user
          WHERE username = $1
        `;
        const result = await pool.query(query, [username]);
        
        if (result.rows.length === 0) {
          console.log(`No user found with username: ${username}`);
          return null;
        }
        
        console.log(`User found with username: ${username}`);
        const account = result.rows[0];
        return {
          ...account,
          accessPages: account.access_pages ? account.access_pages.split(',') : []
        };
      } catch (error) {
        console.error(`Error getting user with username ${username}:`, error);
        throw error;
      }
    },
  
    // Menambahkan akun baru
    create: async (accountData) => {
      try {
        console.log('Creating new user account:', accountData.username);
        // Konversi array accessPages menjadi string untuk disimpan di database
        const accessPagesString = accountData.accessPages?.join(',') || '';
        
        const now = new Date();
        
        const query = `
          INSERT INTO management_account_user (
            username, password, role, access_pages, category, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, username, password, role, access_pages, category, created_at, updated_at
        `;
        
        const values = [
          accountData.username,
          accountData.password, // Note: In production, you should hash this password
          accountData.role,
          accessPagesString,
          accountData.category || 'user',
          now,
          now
        ];
        
        console.log('Executing query with values:', values);
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          throw new Error('Failed to create user account');
        }
        
        console.log(`User account created successfully: ${accountData.username}`);
        const newAccount = result.rows[0];
        return {
          ...newAccount,
          accessPages: newAccount.access_pages ? newAccount.access_pages.split(',') : []
        };
      } catch (error) {
        console.error('Error creating user account:', error);
        throw error;
      }
    },
  
    // Update akun
    update: async (id, accountData) => {
      try {
        console.log(`Updating user account ID ${id}`);
        // Konversi array accessPages menjadi string untuk disimpan di database
        const accessPagesString = accountData.accessPages?.join(',') || '';
        
        const now = new Date();
        
        const query = `
          UPDATE management_account_user SET
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
          accountData.category || 'user',
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
          throw new Error(`User account with ID ${id} not found`);
        }
        
        console.log(`User account updated successfully: ${accountData.username}`);
        const updatedAccount = result.rows[0];
        return {
          ...updatedAccount,
          accessPages: updatedAccount.access_pages ? updatedAccount.access_pages.split(',') : []
        };
      } catch (error) {
        console.error(`Error updating user account with ID ${id}:`, error);
        throw error;
      }
    },
  
    // Hapus akun
    delete: async (id) => {
      try {
        console.log(`Deleting user account ID ${id}`);
        
        const query = `
          DELETE FROM management_account_user WHERE id = $1
          RETURNING id
        `;
        
        console.log('Executing delete query for ID:', id);
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
          throw new Error(`User account with ID ${id} not found`);
        }
        
        console.log(`User account deleted successfully: ID ${id}`);
        return { id: result.rows[0].id };
      } catch (error) {
        console.error(`Error deleting user account with ID ${id}:`, error);
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
          FROM management_account_user
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
    }
  };
  
  export default AccountUserModel;

