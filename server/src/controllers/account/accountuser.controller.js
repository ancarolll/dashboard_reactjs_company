import { AccountUserModel } from '../../models/account/accountuser.modal.js';
import pool from '../../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const AccountUserController = {
    // Handle preflight CORS requests
    handleOptionsRequest: (req, res) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.sendStatus(200);
    },
  
    // Get all user accounts
    getAllUsers: async (req, res) => {
      try {
        const accounts = await AccountUserModel.getAllUsers();
        
        // Filter out sensitive information for response
        const safeAccounts = accounts.map(account => ({
          id: account.id,
          username: account.username,
          password: account.password, // In production, don't return passwords
          role: account.role,
          accessPages: account.accessPages,
          category: account.category,
          createdAt: account.created_at,
          updatedAt: account.updated_at
        }));
        
        console.log(`Retrieved ${safeAccounts.length} user accounts`);
        res.status(200).json({
          success: true,
          data: safeAccounts
        });
      } catch (error) {
        console.error('Error in getAllUsers controller:', error);
        res.status(500).json({
          success: false,
          message: 'Error retrieving user accounts',
          error: error.message
        });
      }
    },
  
    // Get user account by ID
    getUserById: async (req, res) => {
      try {
        const id = req.params.id;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Account ID is required'
          });
        }
        
        const account = await AccountUserModel.getById(id);
        
        if (!account) {
          return res.status(404).json({
            success: false,
            message: `Account with ID ${id} not found`
          });
        }
        
        res.status(200).json({
          success: true,
          data: {
            id: account.id,
            username: account.username,
            password: account.password, // In production, don't return passwords
            role: account.role,
            accessPages: account.accessPages,
            category: account.category,
            createdAt: account.created_at,
            updatedAt: account.updated_at
          }
        });
      } catch (error) {
        console.error(`Error getting account with ID ${req.params.id}:`, error);
        res.status(500).json({
          success: false,
          message: 'Error retrieving user account',
          error: error.message
        });
      }
    },
  
    // Create a new user account
    createUser: async (req, res) => {
      try {
        const { username, password, role, accessPages, category } = req.body;
        
        // Validate required fields
        if (!username || !password) {
          return res.status(400).json({
            success: false,
            message: 'Username and password are required'
          });
        }
        
        // Check if username already exists
        const existingAccount = await AccountUserModel.getByUsername(username);
        if (existingAccount) {
          return res.status(400).json({
            success: false,
            message: `Username '${username}' is already taken`
          });
        }
        
        // Create the account
        const newAccount = await AccountUserModel.create({
          username,
          password,
          role,
          accessPages,
          category: category || 'user'
        });
        
        console.log(`User account created: ${username}`);
        res.status(201).json({
          success: true,
          message: 'User account created successfully',
          data: {
            id: newAccount.id,
            username: newAccount.username,
            role: newAccount.role,
            accessPages: newAccount.accessPages,
            category: newAccount.category,
            createdAt: newAccount.created_at,
            updatedAt: newAccount.updated_at
          }
        });
      } catch (error) {
        console.error('Error creating user account:', error);
        res.status(500).json({
          success: false,
          message: 'Error creating user account',
          error: error.message
        });
      }
    },
  
    // Update a user account
    updateUser: async (req, res) => {
      try {
        const id = req.params.id;
        const { username, password, role, accessPages, category } = req.body;
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Account ID is required'
          });
        }
        
        // Get existing account
        const existingAccount = await AccountUserModel.getById(id);
        if (!existingAccount) {
          return res.status(404).json({
            success: false,
            message: `Account with ID ${id} not found`
          });
        }
        
        // Check if new username already exists (if username is being changed)
        if (username !== existingAccount.username) {
          const usernameExists = await AccountUserModel.getByUsername(username);
          if (usernameExists) {
            return res.status(400).json({
              success: false,
              message: `Username '${username}' is already taken`
            });
          }
        }
        
        // Update the account
        const updatedAccount = await AccountUserModel.update(id, {
          username: username || existingAccount.username,
          password: password || existingAccount.password,
          role: role || existingAccount.role,
          accessPages: accessPages || existingAccount.accessPages,
          category: category || existingAccount.category || 'user'
        });
        
        res.status(200).json({
          success: true,
          message: 'User account updated successfully',
          data: {
            id: updatedAccount.id,
            username: updatedAccount.username,
            role: updatedAccount.role,
            accessPages: updatedAccount.accessPages,
            category: updatedAccount.category,
            createdAt: updatedAccount.created_at,
            updatedAt: updatedAccount.updated_at
          }
        });
      } catch (error) {
        console.error(`Error updating account with ID ${req.params.id}:`, error);
        res.status(500).json({
          success: false,
          message: 'Error updating user account',
          error: error.message
        });
      }
    },
  
    // Delete a user account
    deleteUser: async (req, res) => {
      try {
        const id = req.params.id;
        console.log(`Deleting user account with ID ${id}`);
        
        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Account ID is required'
          });
        }
        
        // Check if account exists
        const existingAccount = await AccountUserModel.getById(id);
        if (!existingAccount) {
          return res.status(404).json({
            success: false,
            message: `Account with ID ${id} not found`
          });
        }
        
        // Delete the account
        await AccountUserModel.delete(id);
        
        res.status(200).json({
          success: true,
          message: 'User account deleted successfully',
          data: { id }
        });
      } catch (error) {
        console.error(`Error deleting account with ID ${req.params.id}:`, error);
        res.status(500).json({
          success: false,
          message: 'Error deleting user account',
          error: error.message
        });
      }
    },
  
    // Verify token
    verifyToken: async (req, res) => {
      try {
        // Token sudah diverifikasi oleh middleware
        res.json({
          success: true,
          user: req.user
        });
      } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
          success: false,
          message: 'Token tidak valid'
        });
      }
    },
    
    // Verify access
    verifyAccess: async (req, res) => {
      try {
        const { requiredAccess } = req.query;
        const userId = req.user.id;
        
        // Dapatkan informasi user dari database
        const userQuery = `
          SELECT * FROM management_account_user 
          WHERE id = $1
        `;
        
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'User tidak ditemukan'
          });
        }
        
        const user = userResult.rows[0];
        
        // Cek akses berdasarkan access_pages
        // Pastikan format data access_pages konsisten (bisa string atau array)
        const accessPages = user.access_pages ? 
          (typeof user.access_pages === 'string' ? user.access_pages.split(',') : user.access_pages) : 
          [];
        
        const hasAccess = accessPages.includes(requiredAccess);
        
        if (!hasAccess) {
          return res.json({
            success: false,
            message: 'Tidak memiliki akses'
          });
        }
        
        res.json({
          success: true,
          message: 'Akses diizinkan'
        });
      } catch (error) {
        console.error('Access verification error:', error);
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat verifikasi akses'
        });
      }
    },
  
    // Login endpoint
    login: async (req, res) => {
      try {
        // Log untuk debugging
        console.log('Login attempt:', req.body.username);
  
        const { username, password, targetPage } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({
            success: false,
            message: 'Username and password are required'
          });
        }
        
        // Query yang lebih robust
        const query = `
          SELECT id, username, password, role, access_pages, category, 
            created_at, updated_at 
          FROM management_account_user 
          WHERE username = $1
        `;
        
        const result = await pool.query(query, [username]);
        console.log('Query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Username atau password salah'
          });
        }
        
        const user = result.rows[0];
        console.log('User found:', user.username, 'Role:', user.role);
        
        // Logging untuk debugging
        console.log('Stored password:', user.password);
        console.log('Input password:', password);
        
        // Cek apakah user menggunakan password_hash atau password biasa
        let isPasswordValid = false;
        if (user.password_hash) {
          // Jika menggunakan password hash (bcrypt)
          isPasswordValid = await bcrypt.compare(password, user.password_hash);
          console.log('Password hash check result:', isPasswordValid);
        } else if (user.password) {
          // Jika menggunakan password biasa (untuk kompatibilitas)
          isPasswordValid = password === user.password;
          console.log('Plain password check result:', isPasswordValid);
        }
        
        if (!isPasswordValid) {
          console.log('Password invalid for user:', username);
          return res.status(401).json({
            success: false,
            message: 'Username atau password salah'
          });
        }
        
        // If targetPage provided, verify access
        if (targetPage) {
          const accessPages = user.access_pages ? 
            (typeof user.access_pages === 'string' ? user.access_pages.split(',') : user.access_pages) : 
            [];
          
          const hasAccess = accessPages.includes(targetPage);
          
          if (!hasAccess) {
            return res.status(403).json({
              success: false,
              message: 'Anda tidak memiliki akses ke halaman ini'
            });
          }
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username,
            role: user.role
          }, 
          process.env.JWT_SECRET,
          { expiresIn: '2h' } // Token valid for 2 hours
        );
        
        // Remove password from response
        if (user.password_hash) delete user.password_hash;
        if (user.password) delete user.password;
        
        // Format accessPages correctly
        user.accessPages = user.access_pages ? 
          (typeof user.access_pages === 'string' ? user.access_pages.split(',') : user.access_pages) : 
          [];
        
        res.json({
          success: true,
          token,
          user
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat login'
        });
      }
    }
  };
  
  export default AccountUserController;

