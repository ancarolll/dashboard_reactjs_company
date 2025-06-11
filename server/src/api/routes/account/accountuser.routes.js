import express from 'express';
import { authUserMiddleware } from '../../middlewares/authuser.middleware.js';
import { AccountUserController } from '../../../controllers/account/accountuser.controller.js';

const router = express.Router();

// Handle CORS preflight requests
router.options('*', AccountUserController.handleOptionsRequest);

// Get all user accounts
router.get('/users', AccountUserController.getAllUsers);

// Get user by ID
router.get('/users/:id', AccountUserController.getUserById);

// Create new user account
router.post('/users', AccountUserController.createUser);

// Update user account
router.put('/users/:id', AccountUserController.updateUser);

// Delete user account
router.delete('/users/:id', AccountUserController.deleteUser);

// Login endpoint
router.post('/login', AccountUserController.login);

// Protected routes
router.get('/verify-token', authUserMiddleware, AccountUserController.verifyToken);
router.get('/verify-access', authUserMiddleware, AccountUserController.verifyAccess);

export default router;

