import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Reg2sBudgetController from '../../../controllers/budget/reg2sbudget.controller.js';

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
// GET /api/reg2sbudget - Get budget data (master + absorptions)
router.get('/', Reg2sBudgetController.getBudgetData);

// GET /api/reg2sbudget/summary - Get budget summary
router.get('/summary', Reg2sBudgetController.getBudgetSummary);

// GET /api/reg2sbudget/history - Get budget history
router.get('/history', Reg2sBudgetController.getBudgetHistory);

// GET /api/reg2sbudget/filters - Get filter options for dropdowns
router.get('/filters', Reg2sBudgetController.getFilterOptions);

// GET /api/reg2sbudget/export - Export data to Excel
router.get('/export', Reg2sBudgetController.exportExcel);

// POST /api/reg2sbudget/import - Import data from Excel
router.post('/import', upload.single('excelFile'), Reg2sBudgetController.importExcel);

// POST /api/reg2sbudget/master - Create or update master budget
router.post('/master', Reg2sBudgetController.createOrUpdateMaster);

// POST /api/reg2sbudget/absorption - Add period absorption
router.post('/absorption', Reg2sBudgetController.addPeriodAbsorption);

// DELETE /api/reg2sbudget/absorption/:id - Delete period absorption
router.delete('/absorption/:id', Reg2sBudgetController.deleteAbsorption);

// Routes for web pages
// GET /reg2sbudget/view - View budget data page
router.get('/view', (req, res) => {
  res.render('reg2sbudget/view', {
    title: 'Regional 2 Subsurface Budget',
    pageTitle: 'View Budget Data',
    user: req.user || {}
  });
});

// GET /reg2sbudget/edit - Edit budget data page
router.get('/edit', (req, res) => {
  res.render('reg2sbudget/edit', {
    title: 'Regional 2 Subsurface Budget',
    pageTitle: 'Edit Budget Data',
    user: req.user || {}
  });
});

// GET /reg2sbudget/import - Import budget data page
router.get('/import', (req, res) => {
  res.render('reg2sbudget/import', {
    title: 'Regional 2 Subsurface Budget',
    pageTitle: 'Import Budget Data',
    user: req.user || {}
  });
});

export default router;