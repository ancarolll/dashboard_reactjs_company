import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';

export const authUserMiddleware = async (req, res, next) => {
    try {
      // Ambil token dari header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Dapatkan data user dari database
        const query = `
            SELECT id, username, role, access_pages FROM management_account_user 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [decoded.id]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({
            success: false,
            message: 'User tidak ditemukan'
            });
        }
        
        // Tambahkan data user ke request
        const user = result.rows[0];
        req.user = {
            ...user,
            accessPages: user.access_pages ? user.access_pages.split(',') : []
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
            success: false,
            message: 'Token expired'
            });
        }
        
        res.status(401).json({
            success: false,
            message: 'Token tidak valid'
        });
    }
};