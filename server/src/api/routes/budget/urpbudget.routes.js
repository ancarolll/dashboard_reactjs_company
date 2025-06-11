import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import URPBudgetController from '../../../controllers/budget/urpbudget.controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'temp');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only Excel files
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

// API routes
// GET /api/urpbudget - Get budget data (master + absorptions)
router.get('/', URPBudgetController.getBudgetData);

// GET /api/urpbudget/summary - Get budget summary
router.get('/summary', URPBudgetController.getBudgetSummary);

// GET /api/urpbudget/history - Get budget history
router.get('/history', URPBudgetController.getBudgetHistory);

// GET /api/urpbudget/filters - Get filter options for dropdowns
router.get('/filters', URPBudgetController.getFilterOptions);

// GET /api/urpbudget/export - Export data to Excel
router.get('/export', URPBudgetController.exportExcel);

// POST /api/urpbudget/import - Import data from Excel
router.post('/import', upload.single('excelFile'), URPBudgetController.importExcel);

// POST /api/urpbudget/master - Create or update master budget
router.post('/master', URPBudgetController.createOrUpdateMaster);

// POST /api/urpbudget/absorption - Add period absorption
router.post('/absorption', URPBudgetController.addPeriodAbsorption);

// DELETE /api/urpbudget/absorption/:id - Delete period absorption
router.delete('/absorption/:id', URPBudgetController.deleteAbsorption);

// Routes for web pages
// GET /urpbudget/view - View budget data page
router.get('/view', (req, res) => {
  res.render('urpbudget/view', {
    title: 'URP Budget',
    pageTitle: 'View Budget Data',
    user: req.user || {}
  });
});

// GET /urpbudget/edit - Edit budget data page
router.get('/edit', (req, res) => {
  res.render('urpbudget/edit', {
    title: 'URP Budget',
    pageTitle: 'Edit Budget Data',
    user: req.user || {}
  });
});

// GET /urpbudget/import - Import budget data page
router.get('/import', (req, res) => {
  res.render('urpbudget/import', {
    title: 'URP Budget',
    pageTitle: 'Import Budget Data',
    user: req.user || {}
  });
});

export default router;