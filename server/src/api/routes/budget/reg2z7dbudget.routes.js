import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Reg2z7dBudgetController from '../../../controllers/budget/reg2z7dbudget.controller.js';

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
// GET /api/reg2z7dbudget - Get budget data (master + projects)
router.get('/', Reg2z7dBudgetController.getBudgetData);

// GET /api/reg2z7dbudget/summary - Get budget summary
router.get('/summary', Reg2z7dBudgetController.getBudgetSummary);

// GET /api/reg2z7dbudget/history - Get budget history
router.get('/history', Reg2z7dBudgetController.getBudgetHistory);

// GET /api/reg2z7dbudget/filters - Get filter options for dropdowns
router.get('/filters', Reg2z7dBudgetController.getFilterOptions);

// GET /api/reg2z7dbudget/export - Export data to Excel
router.get('/export', Reg2z7dBudgetController.exportExcel);

// POST /api/reg2z7dbudget/import - Import data from Excel
router.post('/import', upload.single('excelFile'), Reg2z7dBudgetController.importExcel);

// POST /api/reg2z7dbudget/master - Create or update master budget
router.post('/master', Reg2z7dBudgetController.createOrUpdateMaster);

// POST /api/reg2z7dbudget/project - Add or update project
router.post('/project', Reg2z7dBudgetController.addOrUpdateProject);

// DELETE /api/reg2z7dbudget/project/:id - Delete project
router.delete('/project/:id', Reg2z7dBudgetController.deleteProject);

// Routes for web pages
// GET /reg2z7dbudget/view - View budget data page
router.get('/view', (req, res) => {
  res.render('reg2z7dbudget/view', {
    title: 'Regional 2 Z7D Budget',
    pageTitle: 'View Budget Data',
    user: req.user || {}
  });
});

// GET /reg2z7dbudget/edit - Edit budget data page
router.get('/edit', (req, res) => {
  res.render('reg2z7dbudget/edit', {
    title: 'Regional 2 Z7D Budget',
    pageTitle: 'Edit Budget Data',
    user: req.user || {}
  });
});

// GET /reg2z7dbudget/import - Import budget data page
router.get('/import', (req, res) => {
  res.render('reg2z7dbudget/import', {
    title: 'Regional 2 Z7D Budget',
    pageTitle: 'Import Budget Data',
    user: req.user || {}
  });
});

export default router;