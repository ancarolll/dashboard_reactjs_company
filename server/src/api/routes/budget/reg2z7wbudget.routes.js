import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Reg2z7wBudgetController from '../../../controllers/budget/reg2z7wbudget.controller.js';

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
// GET /api/reg2z7wbudget - Get budget data (master + projects)
router.get('/', Reg2z7wBudgetController.getBudgetData);

// GET /api/reg2z7wbudget/summary - Get budget summary
router.get('/summary', Reg2z7wBudgetController.getBudgetSummary);

// GET /api/reg2z7wbudget/history - Get budget history
router.get('/history', Reg2z7wBudgetController.getBudgetHistory);

// GET /api/reg2z7wbudget/filters - Get filter options for dropdowns
router.get('/filters', Reg2z7wBudgetController.getFilterOptions);

// GET /api/reg2z7wbudget/export - Export data to Excel
router.get('/export', Reg2z7wBudgetController.exportExcel);

// POST /api/reg2z7wbudget/import - Import data from Excel
router.post('/import', upload.single('excelFile'), Reg2z7wBudgetController.importExcel);

// POST /api/reg2z7wbudget/master - Create or update master budget
router.post('/master', Reg2z7wBudgetController.createOrUpdateMaster);

// POST /api/reg2z7wbudget/project - Add or update project
router.post('/project', Reg2z7wBudgetController.addOrUpdateProject);

// DELETE /api/reg2z7wbudget/project/:id - Delete project
router.delete('/project/:id', Reg2z7wBudgetController.deleteProject);

// Routes for web pages
// GET /reg2z7wbudget/view - View budget data page
router.get('/view', (req, res) => {
  res.render('reg2z7wbudget/view', {
    title: 'Regional 2 Z7W Budget',
    pageTitle: 'View Budget Data',
    user: req.user || {}
  });
});

// GET /reg2z7wbudget/edit - Edit budget data page
router.get('/edit', (req, res) => {
  res.render('reg2z7wbudget/edit', {
    title: 'Regional 2 Z7W Budget',
    pageTitle: 'Edit Budget Data',
    user: req.user || {}
  });
});

// GET /reg2z7wbudget/import - Import budget data page
router.get('/import', (req, res) => {
  res.render('reg2z7wbudget/import', {
    title: 'Regional 2 Z7W Budget',
    pageTitle: 'Import Budget Data',
    user: req.user || {}
  });
});

export default router;