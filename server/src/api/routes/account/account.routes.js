// account.routes.js
import express from 'express';
import { AccountController } from '../../../controllers/account/account.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// CORS preflight handling
router.options('*', AccountController.handleOptionsRequest);

// ========== PUBLIC ROUTES (No authentication required) ==========

// Login endpoint - Main entry point for authentication
router.post('/login', AccountController.login);

// Database initialization - Setup master admin if not exists
router.post('/init-master-admin', AccountController.initMasterAdmin);

// Database statistics - Check current state
router.get('/stats', AccountController.getDatabaseStats);

// ========== PROTECTED ROUTES (Authentication required) ==========

// Token verification - Verify if current token is valid
router.get('/verify-token', authMiddleware, AccountController.verifyToken);

// Access verification - Check if user has access to specific page
router.get('/verify-access', authMiddleware, AccountController.verifyAccess);

// Update HSE access pages for existing users
router.post('/update-hse-access', authMiddleware, AccountController.updateHSEAccess);

// ========== ADMIN MANAGEMENT ROUTES (Authentication required) ==========

// Get all admin accounts
router.get('/admins', authMiddleware, AccountController.getAllAdmins);

// Get admin account by ID
router.get('/admins/:id', authMiddleware, AccountController.getAdminById);

// Get admin accounts by role
router.get('/admins/role/:role', authMiddleware, AccountController.getAdminsByRole);

// Create new admin account
router.post('/admins', authMiddleware, AccountController.createAdmin);

// Update admin account by ID
router.put('/admins/:id', authMiddleware, AccountController.updateAdmin);

// Delete admin account by ID
router.delete('/admins/:id', authMiddleware, AccountController.deleteAdmin);

// ========== ERROR HANDLING ==========

// Handle 404 for unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      public: [
        'POST /login',
        'POST /init-master-admin',
        'GET /stats'
      ],
      protected: [
        'GET /verify-token',
        'GET /verify-access',
        'POST /update-hse-access',
        'GET /admins',
        'GET /admins/:id',
        'GET /admins/role/:role',
        'POST /admins',
        'PUT /admins/:id',
        'DELETE /admins/:id'
      ]
    }
  });
});

export default router;