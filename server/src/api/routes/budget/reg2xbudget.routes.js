import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Reg2xBudgetController from '../../../controllers/budget/reg2xbudget.controller.js';


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
// GET /api/reg2xbudget - Get budget data (master + absorptions)
router.get('/', Reg2xBudgetController.getBudgetData);

// GET /api/reg2xbudget/summary - Get budget summary
router.get('/summary', Reg2xBudgetController.getBudgetSummary);

// GET /api/reg2xbudget/history - Get budget history
router.get('/history', Reg2xBudgetController.getBudgetHistory);

// GET /api/reg2xbudget/filters - Get filter options for dropdowns
router.get('/filters', Reg2xBudgetController.getFilterOptions);

// GET /api/reg2xbudget/export - Export data to Excel
router.get('/export', Reg2xBudgetController.exportExcel);

// POST /api/reg2xbudget/import - Import data from Excel
router.post('/import', upload.single('excelFile'), Reg2xBudgetController.importExcel);

// POST /api/reg2xbudget/master - Create or update master budget
router.post('/master', Reg2xBudgetController.createOrUpdateMaster);

// POST /api/reg2xbudget/absorption - Add period absorption
router.post('/absorption', Reg2xBudgetController.addPeriodAbsorption);

// DELETE /api/reg2xbudget/absorption/:id - Delete period absorption
router.delete('/absorption/:id', Reg2xBudgetController.deleteAbsorption);

// Routes for web pages
// GET /reg2xbudget/view - View budget data page
router.get('/view', (req, res) => {
  res.render('reg2xbudget/view', {
    title: 'Regional 2 Eksplorasi Budget',
    pageTitle: 'View Budget Data',
    user: req.user || {}
  });
});

// GET /reg2xbudget/edit - Edit budget data page
router.get('/edit', (req, res) => {
  res.render('reg2xbudget/edit', {
    title: 'Regional 2 Eksplorasi Budget',
    pageTitle: 'Edit Budget Data',
    user: req.user || {}
  });
});

// GET /reg2xbudget/import - Import budget data page
router.get('/import', (req, res) => {
  res.render('reg2xbudget/import', {
    title: 'Regional 2 Eksplorasi Budget',
    pageTitle: 'Import Budget Data',
    user: req.user || {}
  });
});

export default router;