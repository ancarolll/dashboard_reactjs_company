import pool from '../../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// account.controller.js
import { AccountModel } from '../../models/account/account.model.js';

// PERBAIKAN: Mapping akses halaman yang konsisten dengan frontend
const PAGE_ACCESS_MAP = {
  // Halaman Project Elnusa
  '/elnusa-edit': ['Admin Project PT. Elnusa', 'Master Admin'],
  '/nonactive-elnusa': ['Admin Project PT. Elnusa', 'Master Admin'],
  '/upload-massal-elnusa': ['Admin Project PT. Elnusa', 'Master Admin'],
  '/tambah-user-elnusa': ['Admin Project PT. Elnusa', 'Master Admin'],
  
  // Halaman Project Pertamina EP Reg 4
  '/regional4-edit': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  '/nonactive-regional4': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  '/upload-massal-regional4': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  '/tambah-user-regional4': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  
  // Halaman Project Pertamina EP Reg 2 Eksplorasi
  '/regional2x-edit': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  '/nonactive-regional2x': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  '/upload-massal-regional2x': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  '/tambah-user-regional2x': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  
  // Halaman Project Pertamina EP Reg 2 Subsurface
  '/regional2s-edit': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  '/nonactive-regional2s': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  '/tambah-user-regional2s': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  '/upload-massal-regional2s': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  
  // Halaman Project PT. Pertamina EP Reg 2 Zona 7 DevPlan
  '/regional2z7d-edit': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],
  '/nonactive-regional2z7d': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],
  '/tambah-user-regional2z7d': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],
  '/upload-massal-regional2z7d': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],

  // Halaman Project PT. Pertamina EP Reg 2 Zona 7 WOPDM
  '/regional2z7w-edit': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 WOPDM', 'Master Admin'],
  '/nonactive-regional2z7w': ['Admin Project PT. Pertamina EP Reg 2 Zona 7 WOPDM', 'Master Admin'],
  '/tambah-user-regional2z7w': ['Admin Project PT. Pertamina EP Reg 2 Zona 7 WOPDM', 'Master Admin'],
  '/upload-massal-regional2z7w': ['Admin Project PT. Pertamina EP Reg 2 Zona 7 WOPDM', 'Master Admin'],

  // Halaman Project PT. Umran Rubi Perkasa
  '/umran-edit': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  '/nonactive-umran': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  '/tambah-user-umran': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  '/upload-massal-umran': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  
  // PERBAIKAN UTAMA: Halaman HSE - Admin HSE HARUS bisa akses semua halaman ini
  '/hse-elnusa': ['Admin HSE', 'Master Admin'],
  '/hse-elnusa-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional4': ['Admin HSE', 'Master Admin'],
  '/hse-regional4-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2x': ['Admin HSE', 'Master Admin'],
  '/hse-regional2x-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2s': ['Admin HSE', 'Master Admin'],
  '/hse-regional2s-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7d': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7d-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7w': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7w-form': ['Admin HSE', 'Master Admin'],
  '/hse-tar': ['Admin HSE', 'Master Admin'],

  // Halaman Management
  '/management-edit': ['Admin Management', 'Master Admin'],
  '/add-management': ['Admin Management', 'Master Admin'],
  
  // Halaman User Account
  '/user-account': ['Master Admin'],
  
  // Halaman Admin Account
  '/admin-account': ['Master Admin']
};

// PERBAIKAN: Fungsi untuk normalize path dengan parameter dinamis
const normalizePathForAccess = (path) => {
  if (!path) return '';
  
  // Remove trailing slash
  path = path.replace(/\/$/, '');
  
  // Replace dynamic parameters dengan base pattern
  // Contoh: /hse-regional2x-form/123 -> /hse-regional2x-form
  path = path.replace(/\/\d+$/, '');
  
  return path;
};

// PERBAIKAN: Fungsi untuk check akses berdasarkan role dan halaman
const checkUserAccess = (userRole, targetPage) => {
  console.log('Checking access:', { userRole, targetPage });
  
  // Normalize target page
  const normalizedPath = normalizePathForAccess(targetPage);
  console.log('Normalized path:', normalizedPath);
  
  // Master Admin dapat akses semua halaman
  if (userRole === 'Master Admin') {
    console.log('Access granted: Master Admin');
    return true;
  }
  
  // Check specific page access
  const allowedRoles = PAGE_ACCESS_MAP[normalizedPath] || [];
  console.log('Required roles for page:', allowedRoles);
  
  const hasAccess = allowedRoles.includes(userRole);
  console.log('Access result:', hasAccess);
  
  return hasAccess;
};

// PERBAIKAN: Fungsi untuk mendapatkan required roles
const getRequiredRoles = (targetPage) => {
  const normalizedPath = normalizePathForAccess(targetPage);
  return PAGE_ACCESS_MAP[normalizedPath] || [];
};

export const AccountController = {
  // Handle preflight CORS requests
  handleOptionsRequest: (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  },

  // PERBAIKAN: Get all admin accounts - INCLUDE PASSWORD for admin management
  getAllAdmins: async (req, res) => {
    try {
      const accounts = await AccountModel.getAllAdmins();
      
      // PERBAIKAN: Include password for admin management interface
      // WARNING: This should only be accessible by Master Admin
      const safeAccounts = accounts.map(account => ({
        id: account.id,
        username: account.username,
        password: account.password, // INCLUDE PASSWORD for admin management
        role: account.role,
        accessPages: account.accessPages,
        category: account.category,
        createdAt: account.created_at,
        updatedAt: account.updated_at
      }));
      
      console.log(`Retrieved ${safeAccounts.length} admin accounts with passwords for management`);
      res.status(200).json({
        success: true,
        data: safeAccounts,
        warning: 'Passwords included for admin management - handle with care'
      });
    } catch (error) {
      console.error('Error in getAllAdmins controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving admin accounts',
        error: error.message
      });
    }
  },

  // PERBAIKAN: Get admin account by ID - INCLUDE PASSWORD
  getAdminById: async (req, res) => {
    try {
      const id = req.params.id;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required'
        });
      }
      
      const account = await AccountModel.getById(id);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Account with ID ${id} not found`
        });
      }
      
      // PERBAIKAN: Include password for admin management
      const safeAccount = {
        id: account.id,
        username: account.username,
        password: account.password, // INCLUDE PASSWORD
        role: account.role,
        accessPages: account.accessPages,
        category: account.category,
        createdAt: account.created_at,
        updatedAt: account.updated_at
      };
      
      res.status(200).json({
        success: true,
        data: safeAccount
      });
    } catch (error) {
      console.error(`Error getting account with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving admin account',
        error: error.message
      });
    }
  },

  // Get accounts by role
  getAdminsByRole: async (req, res) => {
    try {
      const { role } = req.params;
      
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required'
        });
      }
      
      const accounts = await AccountModel.getByRole(role);
      
      // PERBAIKAN: Include password for admin management
      const safeAccounts = accounts.map(account => ({
        id: account.id,
        username: account.username,
        password: account.password, // INCLUDE PASSWORD
        role: account.role,
        accessPages: account.accessPages,
        category: account.category,
        createdAt: account.created_at,
        updatedAt: account.updated_at
      }));
      
      res.status(200).json({
        success: true,
        data: safeAccounts,
        count: safeAccounts.length
      });
    } catch (error) {
      console.error(`Error getting accounts with role ${req.params.role}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving accounts by role',
        error: error.message
      });
    }
  },

  // Create a new admin account
  createAdmin: async (req, res) => {
    try {
      const { username, password, role, accessPages, category } = req.body;
      
      // Validate required fields
      if (!username || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, and role are required'
        });
      }
      
      // Check if username already exists
      const existingAccount = await AccountModel.getByUsername(username);
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: `Username '${username}' is already taken`
        });
      }
      
      // Create the account
      const newAccount = await AccountModel.create({
        username,
        password,
        role,
        accessPages,
        category
      });
      
      // PERBAIKAN: Include password in response for admin management
      const safeAccount = {
        id: newAccount.id,
        username: newAccount.username,
        password: newAccount.password, // INCLUDE PASSWORD
        role: newAccount.role,
        accessPages: newAccount.accessPages,
        category: newAccount.category,
        createdAt: newAccount.createdAt,
        updatedAt: newAccount.updatedAt
      };
      
      console.log(`Admin account created: ${username}`);
      res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
        data: safeAccount
      });
    } catch (error) {
      console.error('Error creating admin account:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating admin account',
        error: error.message
      });
    }
  },

  // Update an admin account
  updateAdmin: async (req, res) => {
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
      const existingAccount = await AccountModel.getById(id);
      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          message: `Account with ID ${id} not found`
        });
      }
      
      // Check if trying to update master_admin username
      if (existingAccount.username === 'master_admin' && username !== 'master_admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change master_admin username'
        });
      }
      
      // Check if new username already exists (if username is being changed)
      if (username && username !== existingAccount.username) {
        const usernameExists = await AccountModel.getByUsername(username);
        if (usernameExists) {
          return res.status(400).json({
            success: false,
            message: `Username '${username}' is already taken`
          });
        }
      }
      
      // Update the account
      const updatedAccount = await AccountModel.update(id, {
        username: username || existingAccount.username,
        password: password || existingAccount.password,
        role: role || existingAccount.role,
        accessPages: accessPages || existingAccount.accessPages,
        category: category || existingAccount.category
      });
      
      // PERBAIKAN: Include password in response for admin management
      const safeAccount = {
        id: updatedAccount.id,
        username: updatedAccount.username,
        password: updatedAccount.password, // INCLUDE PASSWORD
        role: updatedAccount.role,
        accessPages: updatedAccount.accessPages,
        category: updatedAccount.category,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt
      };
      
      res.status(200).json({
        success: true,
        message: 'Admin account updated successfully',
        data: safeAccount
      });
    } catch (error) {
      console.error(`Error updating account with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error updating admin account',
        error: error.message
      });
    }
  },

  // Delete an admin account
  deleteAdmin: async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`Deleting admin account with ID ${id}`);
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required'
        });
      }
      
      // Check if account exists
      const existingAccount = await AccountModel.getById(id);
      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          message: `Account with ID ${id} not found`
        });
      }
      
      // Prevent deletion of master_admin
      if (existingAccount.username === 'master_admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete master_admin account'
        });
      }
      
      // Delete the account
      await AccountModel.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Admin account deleted successfully',
        data: { id }
      });
    } catch (error) {
      console.error(`Error deleting account with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error deleting admin account',
        error: error.message
      });
    }
  },

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
  
  // PERBAIKAN: Fungsi verifyAccess yang diperbaiki untuk database-based approach
  verifyAccess: async (req, res) => {
    try {
      const { requiredAccess, currentPath } = req.query;
      const userId = req.user.id;
      
      console.log('Verify access request:', { requiredAccess, currentPath, userId });
      
      // Dapatkan informasi user dari database menggunakan model
      const user = await AccountModel.getById(userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      console.log('User found:', { username: user.username, role: user.role });
      
      // PERBAIKAN: Gunakan fungsi checkUserAccess yang sudah diperbaiki
      const targetPage = requiredAccess || currentPath;
      const hasAccess = checkUserAccess(user.role, targetPage);
      
      if (hasAccess) {
        res.json({
          success: true,
          message: 'Akses diberikan',
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      } else {
        const requiredRoles = getRequiredRoles(targetPage);
        res.status(403).json({
          success: false,
          message: 'Akses ditolak',
          requiredRoles: requiredRoles,
          userRole: user.role
        });
      }
    } catch (error) {
      console.error('Error verifikasi akses:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat verifikasi akses'
      });
    }
  },

  // PERBAIKAN: Login endpoint yang menggunakan database yang sudah ada
  login: async (req, res) => {
    try {
      console.log('Login attempt:', req.body.username);
  
      const { username, password, targetPage } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password diperlukan'
        });
      }
      
      // PERBAIKAN: Gunakan model untuk mencari user
      const user = await AccountModel.getByUsername(username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }
      
      console.log('User found:', { username: user.username, role: user.role });
      
      // Periksa validitas password
      let isPasswordValid = false;
      
      // Support untuk password yang di-hash maupun plain text (backward compatibility)
      if (user.password_hash) {
        // Jika ada password_hash, gunakan bcrypt
        isPasswordValid = await bcrypt.compare(password, user.password_hash);
      } else if (user.password) {
        // Jika password plain text (untuk backward compatibility)
        isPasswordValid = password === user.password;
      }
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }
      
      // PERBAIKAN: Jika targetPage disediakan, verifikasi akses menggunakan fungsi yang sudah diperbaiki
      if (targetPage) {
        console.log('Checking access for target page:', targetPage);
        
        const hasAccess = checkUserAccess(user.role, targetPage);
        
        if (!hasAccess) {
          const requiredRoles = getRequiredRoles(targetPage);
          return res.status(403).json({
            success: false,
            message: `Access denied. Your role (${user.role}) does not have permission to access this page. Required roles: ${requiredRoles.join(' or ')}`,
            requiredRoles: requiredRoles,
            userRole: user.role
          });
        }
        
        console.log('Access granted for target page:', targetPage);
      }
      
      // Generate token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          role: user.role
        }, 
        process.env.JWT_SECRET || 'default-secret-key-please-change-in-production',
        { expiresIn: '2h' }
      );
      
      // Prepare response data (without password)
      const userResponse = {
        id: user.id,
        username: user.username,
        role: user.role,
        accessPages: user.accessPages || [],
        category: user.category,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
      
      console.log('Login successful for:', username);
      res.json({
        success: true,
        token,
        user: userResponse
      });
    } catch (error) {
      console.error('Error login:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login'
      });
    }
  },
  
  // PERBAIKAN: Initialize database - hanya setup minimal
  initMasterAdmin: async (req, res) => {
    try {
      console.log('Initializing database and master admin...');
      
      // Setup database dan master admin minimal
      await AccountModel.initMasterAdmin();
      
      res.status(200).json({
        success: true,
        message: 'Database initialized successfully. Master admin checked/created.'
      });
    } catch (error) {
      console.error('Error initializing database:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing database',
        error: error.message
      });
    }
  },

  // PERBAIKAN: Fungsi baru untuk update HSE access pages
  updateHSEAccess: async (req, res) => {
    try {
      console.log('Updating HSE access pages for existing users...');
      
      await AccountModel.updateHSEAccessPages();
      
      res.status(200).json({
        success: true,
        message: 'HSE access pages updated successfully for existing Admin HSE users'
      });
    } catch (error) {
      console.error('Error updating HSE access:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating HSE access pages',
        error: error.message
      });
    }
  },

  // PERBAIKAN: Get database statistics
  getDatabaseStats: async (req, res) => {
    try {
      const allAccounts = await AccountModel.getAllAdmins();
      
      // Group by role
      const roleStats = allAccounts.reduce((acc, account) => {
        acc[account.role] = (acc[account.role] || 0) + 1;
        return acc;
      }, {});
      
      res.status(200).json({
        success: true,
        data: {
          totalAccounts: allAccounts.length,
          roleDistribution: roleStats,
          hasAdminHSE: await AccountModel.hasUserWithRole('Admin HSE'),
          hasMasterAdmin: await AccountModel.hasUserWithRole('Master Admin')
        }
      });
    } catch (error) {
      console.error('Error getting database stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving database statistics',
        error: error.message
      });
    }
  }
};

export default AccountController;