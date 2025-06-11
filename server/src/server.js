// Pilih salah satu metode impor (ES Modules)
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import * as db from './config/db.js';
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import fs from 'fs';
import { initDatabase } from './config/db.js';

// Import controller ElnusaController untuk cron job
import { ElnusaController } from './controllers/perusahaan/elnusa.controller.js';
import { Regional4Controller } from './controllers/perusahaan/regional4.controller.js';
import { Regional2xController } from './controllers/perusahaan/regional2x.controller.js';
import { Regional2sController } from './controllers/perusahaan/regional2s.controller.js';
import { Regional2Z7DController } from './controllers/perusahaan/regional2Z7D.controller.js';
import { Regional2Z7WController } from './controllers/perusahaan/regional2Z7W.controller.js';
import { UmranController } from './controllers/perusahaan/umran.controller.js';
import { AccountController } from './controllers/account/account.controller.js';
import { AccountModel } from './models/account/account.model.js';
import { AccountUserModel } from './models/account/accountuser.modal.js';
import { DocFileModel } from './models/management/docfile.model.js';
import { TarMCU, HSETarHistory, DocumentsHSE } from './models/perusahaan/tar_mcu.model.js';
import { Reg2xBudgetModel } from './models/budget/reg2xbudget.model.js';
import { Reg2sBudgetModel } from './models/budget/reg2sbudget.model.js';
import { Reg2z7dBudgetModel } from './models/budget/reg2z7dbudget.model.js';
import { Reg2z7wBudgetModel } from './models/budget/reg2z7wbudget.model.js';
import { URPBudgetModel } from './models/budget/urpbudget.model.js';

// Import routes
import elnusaRoutes from './api/routes/perusahaan/elnusaroutes.js';
import regional4Routes from './api/routes/perusahaan/regional4.routes.js';
import regional2xRoutes from './api/routes/perusahaan/regional2x.routes.js';
import regional2sRoutes from './api/routes/perusahaan/regional2s.routes.js';
import regional2Z7DRoutes from './api/routes/perusahaan/regional2Z7D.routes.js';
import regional2Z7WRoutes from './api/routes/perusahaan/regional2Z7W.routes.js';
import umranRoutes from './api/routes/perusahaan/umran.routes.js';
import accountRoutes from './api/routes/account/account.routes.js';
import accountUserRoutes from './api/routes/account/accountuser.routes.js';
import managementRoutes from './api/routes/management/management.routes.js';
import docfileRoutes from './api/routes/management/docfile.routes.js';
import tarMcuRoutes from './api/routes/perusahaan/tarmcu.routes.js';
import reg2xbudgetRoutes from './api/routes/budget/reg2xbudget.routes.js';
import reg2sbudgetRoutes from './api/routes/budget/reg2sbudget.routes.js';
import reg2z7dbudgetRoutes from './api/routes/budget/reg2z7dbudget.routes.js';
import reg2z7wbudgetRoutes from './api/routes/budget/reg2z7wbudget.routes.js';
import urpbudgetRoutes from './api/routes/budget/urpbudget.routes.js';

dotenv.config(); // Ini harus di awal file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3005;

// Ensure upload directories exist
['uploads', 'uploads/documents', 'uploads/dashboard'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
});

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3005', 'http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// PERBAIKAN: Gabungkan middleware database initialization menjadi satu
app.use(async (req, res, next) => {
  try {
    await initDatabase();
    
    // Initialize all required tables
    await DocFileModel.initTable();
    await Reg2xBudgetModel.initTable();
    await Reg2sBudgetModel.initTable();
    await Reg2z7dBudgetModel.initTable();
    await Reg2z7wBudgetModel.initTable();
    await URPBudgetModel.initTable();
    
    // Pastikan tabel tar_mcu ada
    const tableExists = await TarMCU.checkTableExists();
    if (!tableExists) {
      console.log("Table tar_mcu needs to be created");
    }
    
    console.log("Database tables initialized");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// PERBAIKAN: Register routes dengan urutan yang benar untuk menghindari konflik
const routes = [
  { path: '/api/elnusa', router: elnusaRoutes, name: 'Elnusa' },
  { path: '/api/regional4', router: regional4Routes, name: 'Regional4' },
  { path: '/api/regional2x', router: regional2xRoutes, name: 'Regional2x' },
  { path: '/api/regional2s', router: regional2sRoutes, name: 'Regional2s' },
  { path: '/api/regional2Z7D', router: regional2Z7DRoutes, name: 'Regional2Z7D' },
  { path: '/api/regional2Z7W', router: regional2Z7WRoutes, name: 'Regional2Z7W' },
  { path: '/api/umran', router: umranRoutes, name: 'Umran' },
  { path: '/api/account', router: accountRoutes, name: 'Account' },
  { path: '/api/accountuser', router: accountUserRoutes, name: 'AccountUser' },
  { path: '/api/tar-mcu', router: tarMcuRoutes, name: 'TarMCU' },
  // PERBAIKAN: Management routes diletakkan setelah routes lain untuk menghindari konflik
  { path: '/api/management', router: managementRoutes, name: 'Management' },
  // PERBAIKAN: Dashboard routes diletakkan terpisah dari management
  { path: '/dashboard', router: docfileRoutes, name: 'Dashboard' },
  // Budget routes
  { path: '/api/reg2xbudget', router: reg2xbudgetRoutes, name: 'Reg2xBudget' },
  { path: '/api/reg2sbudget', router: reg2sbudgetRoutes, name: 'Reg2sBudget' },
  { path: '/api/reg2z7dbudget', router: reg2z7dbudgetRoutes, name: 'Reg2z7dBudget' },
  { path: '/api/reg2z7wbudget', router: reg2z7wbudgetRoutes, name: 'Reg2z7wBudget' },
  { path: '/api/urpbudget', router: urpbudgetRoutes, name: 'URPBudget' },
];

try {
  routes.forEach(route => {
    if (route.router) {
      app.use(route.path, route.router);
      console.log(`${route.name} routes loaded successfully at ${route.path}`);
    } else {
      console.error(`${route.name} routes not found`);
    }
  });
} catch (error) {
  console.error("Error loading routes:", error);
}

// Initialize master admin
(async () => {
  try {
    if (typeof AccountModel.initMasterAdmin === 'function') {
      await AccountModel.initMasterAdmin();
      console.log('Master admin account initialized');
    }
  } catch (error) {
    console.error('Error initializing master admin account:', error);
  }
})();

// Redirect routes
const redirects = [
  { from: '/', to: '/api/elnusa/edit' },
  { from: '/elnusa-edit', to: '/api/elnusa/edit' },
  { from: '/nonactive-elnusa', to: '/api/elnusa/na' },
  { from: '/regional2x-edit', to: '/api/regional2x/edit' },
  { from: '/nonactive-regional2x', to: '/api/regional2x/na' },
  { from: '/regional4-edit', to: '/api/regional4/edit' },
  { from: '/regional2s-edit', to: '/api/regional2s/edit' },
  { from: '/nonactive-regional2s', to: '/api/regional2s/na' },
  { from: '/nonactive-regional4', to: '/api/regional4/na' },
  { from: '/regional2Z7D-edit', to: '/api/regional2Z7D/edit' },
  { from: '/nonactive-regional2Z7D', to: '/api/regional2Z7D/na' },
  { from: '/regional2Z7W-edit', to: '/api/regional2Z7W/edit' },
  { from: '/nonactive-regional2Z7W', to: '/api/regional2Z7W/na' },
  { from: '/umran-edit', to: '/api/umran/edit' },
  { from: '/nonactive-umran', to: '/api/umran/na' },
  { from: '/admin-account', to: '/account-edit-ma' },
  { from: '/user-account', to: '/account-edit-user' },
  { from: '/management-edit', to: '/api/management/edit' },
  { from: '/add-management', to: '/api/management/add' },
  { from: '/dashboard-view', to: '/dashboard/view' },
  { from: '/dashboard-edit', to: '/dashboard/edit' },
  { from: '/dashboard-inactive', to: '/dashboard/inactive' },
  { from: '/dashboard-preview/:id', to: '/dashboard/preview/:id' },
  { from: '/account-edit-user', to: '/api/accountuser/users' },
  { from: '/tar-mcu-edit', to: '/api/tar-mcu/edit' },
  { from: '/tar-mcu-view', to: '/api/tar-mcu' },
  { from: '/tar-mcu-documents', to: '/api/tar-mcu/documents' },
  { from: '/regional2x-budget', to: '/reg2xbudget/view' },
  { from: '/regional2x-budget-edit', to: '/reg2xbudget/edit' },
  { from: '/regional2x-budget-import', to: '/reg2xbudget/import' }, 
  { from: '/regional2s-budget', to: '/reg2sbudget/view' },
  { from: '/regional2s-budget-edit', to: '/reg2sbudget/edit' },
  { from: '/regional2s-budget-import', to: '/reg2sbudget/import' }, 
  { from: '/regional2z7d-budget', to: '/reg2z7dbudget/view' },
  { from: '/regional2z7d-budget-edit', to: '/reg2z7dbudget/edit' },
  { from: '/regional2z7d-budget-import', to: '/reg2z7dbudget/import' }, 
  { from: '/regional2z7w-budget', to: '/reg2z7wbudget/view' },
  { from: '/regional2z7w-budget-edit', to: '/reg2z7wbudget/edit' },
  { from: '/regional2z7w-budget-import', to: '/reg2z7wbudget/import' }, 
  { from: '/urp-budget', to: '/urpbudget/view' },
  { from: '/urp-budget-edit', to: '/urpbudget/edit' },
  { from: '/urp-budget-import', to: '/urpbudget/import' }
];

redirects.forEach(redirect => {
  app.get(redirect.from, (req, res) => res.redirect(redirect.to));
});

// Special case for management with ID parameter
app.get('/edit-management/:id', (req, res) => {
  res.redirect(`/api/management/edit/${req.params.id}`);
});

app.get('/edit-dashboard/:id', (req, res) => {
  res.redirect(`/dashboard/edit/${req.params.id}`);
});

app.get('/preview-dashboard/:id', (req, res) => {
  res.redirect(`/dashboard/preview/${req.params.id}`);
});

// Safe controller execution helper
const safeControllerExecution = async (controller, method, ...args) => {
  try {
    if (controller && typeof controller[method] === 'function') {
      return await controller[method](...args);
    }
    console.error(`Controller method ${method} not found or not a function`);
    return { error: 'Method not found', count: 0 };
  } catch (error) {
    console.error(`Error executing ${method}:`, error);
    return { error: error.message, count: 0 };
  }
};

// Mock response object for cron jobs
const createMockResponse = (jobType) => ({
  json: (data) => {
    console.log(`[${jobType}] Result: ${JSON.stringify(data)}`);
    return { send: () => {} };
  },
  send: (msg) => {
    console.log(`[${jobType}] ${msg}`);
    return { status: () => ({ send: () => {} }) };
  },
  status: () => ({
    json: (data) => {
      console.error(`[${jobType}] Error: ${JSON.stringify(data)}`);
      return { send: () => {} };
    },
    send: (msg) => console.error(`[${jobType}] Error: ${msg}`)
  })
});

// ==================== PERBAIKAN: FUNGSI HELPER UNTUK DELETE FILE ====================

// PERBAIKAN: Tambahkan fungsi untuk menghapus file fisik secara manual
export const deletePhysicalFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File fisik berhasil dihapus: ${filePath}`);
      return true;
    } else {
      console.log(`File tidak ditemukan: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error menghapus file fisik ${filePath}:`, error);
    return false;
  }
};

// PERBAIKAN: Fungsi helper untuk mendapatkan path lengkap file
export const getFullFilePath = (relativePath, baseDir = 'uploads') => {
  if (!relativePath) return null;
  
  // Handle berbagai format path
  let cleanPath = relativePath;
  if (cleanPath.startsWith('/uploads/')) {
    cleanPath = cleanPath.substring('/uploads/'.length);
  }
  if (cleanPath.startsWith('documents/')) {
    cleanPath = cleanPath.substring('documents/'.length);
  }
  if (cleanPath.startsWith('dashboard/')) {
    cleanPath = cleanPath.substring('dashboard/'.length);
  }
  
  // Tentukan subdirectory berdasarkan original path
  let subDir = '';
  if (relativePath.includes('documents/') || relativePath.includes('/documents/')) {
    subDir = 'documents';
  } else if (relativePath.includes('dashboard/') || relativePath.includes('/dashboard/')) {
    subDir = 'dashboard';
  }
  
  // Gabungkan dengan direktori base
  if (subDir) {
    return path.join(__dirname, baseDir, subDir, cleanPath);
  } else {
    return path.join(__dirname, baseDir, cleanPath);
  }
};

// ==================== CRON JOBS CONTRACT CHECK ====================

// Cron job for daily Elnusa contract check
cron.schedule('1 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Elnusa automatic contract check...`);
    const result = await safeControllerExecution(
      ElnusaController, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-ELNUSA')
    );
    console.log(`[${new Date().toISOString()}] Elnusa contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Elnusa contract check:`, error);
  }
});

// Cron job for daily Regional2x contract check
cron.schedule('3 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Regional2x automatic contract check...`);
    const result = await safeControllerExecution(
      Regional2xController, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-REGIONAL2X')
    );
    console.log(`[${new Date().toISOString()}] Regional2x contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Regional2x contract check:`, error);
  }
});

// Cron job for daily Regional2s contract check
cron.schedule('2 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Regional2s automatic contract check...`);
    const result = await safeControllerExecution(
      Regional2sController, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-REGIONAL2S')
    );
    console.log(`[${new Date().toISOString()}] Regional2s contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Regional2s contract check:`, error);
  }
});

// Cron job for daily Regional4 contract check
cron.schedule('5 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Regional4 automatic contract check...`);
    const result = await safeControllerExecution(
      Regional4Controller, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-REGIONAL4')
    );
    console.log(`[${new Date().toISOString()}] Regional4 contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Regional4 contract check:`, error);
  }
});

// Cron job for daily Regional2Z7D contract check
cron.schedule('4 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Regional2Z7D automatic contract check...`);
    const result = await safeControllerExecution(
      Regional2Z7DController, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-REGIONAL2Z7D')
    );
    console.log(`[${new Date().toISOString()}] Regional2Z7D contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Regional2Z7D contract check:`, error);
  }
});

// Cron job for daily Regional2Z7W contract check
cron.schedule('6 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Regional2Z7W automatic contract check...`);
    const result = await safeControllerExecution(
      Regional2Z7WController, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-REGIONAL2Z7W')
    );
    console.log(`[${new Date().toISOString()}] Regional2Z7W contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Regional2Z7W contract check:`, error);
  }
});

// Cron job for daily Umran contract check
cron.schedule('7 0 * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Umran automatic contract check...`);
    const result = await safeControllerExecution(
      UmranController, 
      'checkExpiredContracts',
      { params: {} },
      createMockResponse('CRON-UMRAN')
    );
    console.log(`[${new Date().toISOString()}] Umran contract check completed. ${result.count || 0} contracts updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Umran contract check:`, error);
  }
});

// Hourly contract check for all systems
cron.schedule('0 * * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Running hourly contract check...`);
    await Promise.allSettled([
      safeControllerExecution(ElnusaController, 'checkExpiredContracts', 
        { params: {} }, createMockResponse('HOURLY-ELNUSA')),
      safeControllerExecution(Regional2xController, 'checkExpiredContracts',  
        { params: {} }, createMockResponse('HOURLY-REGIONAL2X')),
      safeControllerExecution(Regional2sController, 'checkExpiredContracts', 
        { params: {} }, createMockResponse('HOURLY-REGIONAL2S')),
      safeControllerExecution(Regional2Z7DController, 'checkExpiredContracts', 
        { params: {} }, createMockResponse('HOURLY-REGIONAL2Z7D')),
      safeControllerExecution(Regional2Z7WController, 'checkExpiredContracts', 
        { params: {} }, createMockResponse('HOURLY-REGIONAL2Z7W')),
      safeControllerExecution(UmranController, 'checkExpiredContracts', 
        { params: {} }, createMockResponse('HOURLY-UMRAN')),
      safeControllerExecution(Regional4Controller, 'checkExpiredContracts', 
        { params: {} }, createMockResponse('HOURLY-REGIONAL4'))
    ]);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in hourly contract check:`, error);
  }
});

// ==================== PERBAIKAN: KODE PEMBERSIHAN FILE ====================

// PERBAIKAN: Fungsi untuk mengumpulkan semua path file terdaftar dari semua model
async function getAllRegisteredFilePaths() {
  try {
    const registeredFiles = new Set();
    
    // 1. Kumpulkan file dari DocFileModel
    try {
      const dashboardFiles = await DocFileModel.getAllFilenames();
      dashboardFiles.forEach(file => {
        registeredFiles.add(file);
        // Juga tambahkan variasi path
        if (!file.startsWith('dashboard/')) {
          registeredFiles.add(`dashboard/${file}`);
        }
      });
      console.log(`Ditemukan ${dashboardFiles.length} file dari DocFileModel`);
    } catch (error) {
      console.error('Error mengambil file dari DocFileModel:', error);
    }
    
    // 2. Kumpulkan file dari berbagai model perusahaan
    const models = [
      { name: 'Elnusa', table: 'project_elnusa' },
      { name: 'Regional4', table: 'project_pertamina_ep_regional4' },
      { name: 'Regional2x', table: 'project_pertamina_ep_regional2_eksplorasi' },
      { name: 'Regional2s', table: 'project_pertamina_ep_regional2_subsurface' },
      { name: 'Regional2Z7D', table: 'project_pertamina_ep_regional2zona7_devplan' },
      { name: 'Regional2Z7W', table: 'project_pertamina_ep_regional2zona7_wopdm' },
      { name: 'Umran', table: 'project_umran' }
    ];
    
    // Kolom file yang perlu diperiksa di setiap tabel
    const fileColumns = [
      'cv_filepath', 
      'ijazah_filepath', 
      'sertifikat_filepath', 
      'pkwt_filepath'
    ];
    
    // Query database untuk setiap model
    for (const model of models) {
      try {
        let columnsToSelect = fileColumns.join(', ');
        const query = `SELECT ${columnsToSelect} FROM ${model.table}`;
        const result = await db.pool.query(query);
        
        result.rows.forEach(row => {
          fileColumns.forEach(column => {
            if (row[column]) {
              const filePath = row[column];
              let fileName = filePath;
              
              // Handle berbagai format path
              if (filePath.startsWith('/uploads/')) {
                fileName = filePath.substring('/uploads/'.length);
              }
              
              registeredFiles.add(fileName);
              // Tambahkan juga nama file saja (tanpa direktori)
              const baseFileName = path.basename(fileName);
              registeredFiles.add(baseFileName);
            }
          });
        });
        console.log(`Ditemukan ${result.rowCount} record dari tabel ${model.table}`);
      } catch (error) {
        console.error(`Error mengambil file dari model ${model.name}:`, error);
      }
    }
    
    // 3. PERBAIKAN: Tambahkan file dari ManagementModel (tabel management_documents)
    try {
      const query = `SELECT file_path FROM management_documents WHERE file_path IS NOT NULL`;
      const result = await db.pool.query(query);
      
      result.rows.forEach(row => {
        if (row.file_path) {
          let fileName = row.file_path;
          
          // Handle berbagai format path
          if (fileName.startsWith('/uploads/')) {
            fileName = fileName.substring('/uploads/'.length);
          }
          if (fileName.startsWith('documents/')) {
            const baseFileName = fileName.substring('documents/'.length);
            registeredFiles.add(baseFileName);
          }
          
          registeredFiles.add(fileName);
          registeredFiles.add(`documents/${path.basename(fileName)}`);
          
          // Tambahkan nama file saja
          const baseFileName = path.basename(fileName);
          registeredFiles.add(baseFileName);
        }
      });
      console.log(`Ditemukan ${result.rowCount} file dari tabel management_documents`);
    } catch (error) {
      console.error('Error mengambil file dari ManagementModel:', error);
    }
    
    // 4. Tambahkan file dari documents_hse
    try {
      const query = `SELECT file_path, file_name FROM documents_hse`;
      const result = await db.pool.query(query);
      
      result.rows.forEach(row => {
        // Periksa file_path
        if (row.file_path) {
          let fileName = row.file_path;
          if (fileName.startsWith('/uploads/')) {
            fileName = fileName.substring('/uploads/'.length);
          }
          registeredFiles.add(fileName);
          registeredFiles.add(path.basename(fileName));
        }
        
        // Periksa juga file_name jika berbeda dari file_path
        if (row.file_name && row.file_name !== row.file_path) {
          let fileName = row.file_name;
          if (fileName.startsWith('/uploads/')) {
            fileName = fileName.substring('/uploads/'.length);
          }
          registeredFiles.add(fileName);
          registeredFiles.add(path.basename(fileName));
        }
      });
      console.log(`Ditemukan ${result.rowCount} file dari tabel documents_hse`);
    } catch (error) {
      console.error('Error mengambil file dari documents_hse:', error);
    }
    
    // 5. Tambahkan file dari TarMCU jika ada kolom file
    try {
      const query = `
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'tar_mcu' AND column_name LIKE '%filepath%'
      `;
      const columnsResult = await db.pool.query(query);
      
      if (columnsResult.rows.length > 0) {
        const fileColumns = columnsResult.rows.map(row => row.column_name);
        const columnsToSelect = fileColumns.join(', ');
        
        const dataQuery = `SELECT ${columnsToSelect} FROM tar_mcu`;
        const dataResult = await db.pool.query(dataQuery);
        
        dataResult.rows.forEach(row => {
          fileColumns.forEach(column => {
            if (row[column]) {
              let fileName = row[column];
              if (fileName.startsWith('/uploads/')) {
                fileName = fileName.substring('/uploads/'.length);
              }
              registeredFiles.add(fileName);
              registeredFiles.add(path.basename(fileName));
            }
          });
        });
        console.log(`Ditemukan ${dataResult.rowCount} record dari tabel tar_mcu`);
      }
    } catch (error) {
      console.error('Error mengambil file dari TarMCU:', error);
    }
    
    console.log(`Total file terdaftar: ${registeredFiles.size}`);
    return registeredFiles;
  } catch (error) {
    console.error('Error mengumpulkan path file terdaftar:', error);
    return new Set();
  }
}

// PERBAIKAN: Fungsi untuk menghapus file yang tidak terdaftar dalam database
async function cleanupOrphanedFiles() {
  try {
    console.log(`[${new Date().toISOString()}] Mulai pembersihan file yang tidak terdaftar...`);
    
    // Ambil semua file yang terdaftar di database
    const registeredFiles = await getAllRegisteredFilePaths();
    console.log(`Ditemukan ${registeredFiles.size} file terdaftar dalam database`);
    
    // Direktori yang akan diperiksa
    const directories = [
      { path: path.join(__dirname, 'uploads'), prefix: '' },
      { path: path.join(__dirname, 'uploads/documents'), prefix: 'documents/' },
      { path: path.join(__dirname, 'uploads/dashboard'), prefix: 'dashboard/' }
    ];
    
    let orphanedCount = 0;
    let skippedCount = 0;
    const deletedFiles = [];
    
    // Periksa setiap direktori
    for (const dir of directories) {
      if (!fs.existsSync(dir.path)) {
        console.log(`Direktori tidak ditemukan: ${dir.path}`);
        continue;
      }
      
      // Baca semua file dalam direktori
      const files = fs.readdirSync(dir.path);
      console.log(`Ditemukan ${files.length} item di direktori ${dir.path}`);
      
      // Periksa setiap file
      for (const file of files) {
        const filePath = path.join(dir.path, file);
        
        // Lewati direktori
        if (fs.statSync(filePath).isDirectory()) {
          console.log(`Melewati direktori: ${file}`);
          continue;
        }
        
        // Buat berbagai variasi path untuk pengecekan
        const pathVariations = [
          file, // nama file saja
          `${dir.prefix}${file}`, // dengan prefix direktori
          `/uploads/${file}`, // dengan prefix /uploads/
          `/uploads/${dir.prefix}${file}` // dengan prefix lengkap
        ];
        
        // Cek apakah file terdaftar dalam database
        const isRegistered = pathVariations.some(variation => 
          registeredFiles.has(variation)
        );
        
        if (!isRegistered) {
          console.log(`Menghapus file tidak terdaftar: ${filePath}`);
          console.log(`  - Variasi path yang dicek: ${pathVariations.join(', ')}`);
          try {
            fs.unlinkSync(filePath);
            orphanedCount++;
            deletedFiles.push(filePath);
          } catch (deleteError) {
            console.error(`Gagal menghapus file ${filePath}: ${deleteError.message}`);
          }
        } else {
          skippedCount++;
          console.log(`File dipertahankan: ${file}`);
        }
      }
    }
    
    console.log(`[${new Date().toISOString()}] Pembersihan selesai:`);
    console.log(`  - File tidak terdaftar dihapus: ${orphanedCount}`);
    console.log(`  - File yang dipertahankan: ${skippedCount}`);
    
    if (deletedFiles.length > 0) {
      console.log(`File yang dihapus (${Math.min(deletedFiles.length, 10)} dari ${deletedFiles.length}):`);
      deletedFiles.slice(0, 10).forEach(file => console.log(`  - ${file}`));
      if (deletedFiles.length > 10) {
        console.log(`  ... dan ${deletedFiles.length - 10} file lainnya`);
      }
    }
    
    return { count: orphanedCount, deletedFiles, skippedCount };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error dalam pembersihan file tidak terdaftar:`, error);
    return { error: error.message, count: 0, deletedFiles: [], skippedCount: 0 };
  }
}

// Cron job untuk membersihkan file mingguan (setiap hari Minggu jam 4 pagi)
cron.schedule('0 4 * * 0', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Memulai cron job pembersihan file mingguan...`);
    const result = await cleanupOrphanedFiles();
    console.log(`[${new Date().toISOString()}] Cron job pembersihan file selesai. ${result.count} file dihapus.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error dalam cron job pembersihan file:`, error);
  }
});

// ==================== PERBAIKAN: API ENDPOINTS UNTUK FILE MANAGEMENT ====================

// PERBAIKAN: Endpoint API untuk menjalankan pembersihan file secara manual
app.post('/api/admin/cleanup-files', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Pembersihan file dijalankan secara manual oleh admin...`);
    const result = await cleanupOrphanedFiles();
    res.json({
      success: true,
      message: `Pembersihan file selesai. ${result.count} file tidak terdaftar dihapus, ${result.skippedCount} file dipertahankan.`,
      count: result.count,
      skippedCount: result.skippedCount,
      deletedFiles: result.deletedFiles || []
    });
  } catch (error) {
    console.error('Error pada endpoint pembersihan file:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membersihkan file',
      error: error.message
    });
  }
});

// PERBAIKAN: Endpoint untuk menghapus file tertentu secara manual
app.delete('/api/admin/delete-file', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Path file harus disediakan'
      });
    }
    
    // Pastikan file berada dalam direktori uploads
    const fullPath = getFullFilePath(filePath);
    
    if (!fullPath || !fullPath.includes(path.join(__dirname, 'uploads'))) {
      return res.status(400).json({
        success: false,
        message: 'Path file tidak valid atau di luar direktori uploads'
      });
    }
    
    const deleted = deletePhysicalFile(fullPath);
    
    res.json({
      success: deleted,
      message: deleted ? 'File berhasil dihapus' : 'File tidak ditemukan atau gagal dihapus',
      filePath: filePath,
      fullPath: fullPath
    });
  } catch (error) {
    console.error('Error pada endpoint delete file:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus file',
      error: error.message
    });
  }
});

// PERBAIKAN: Endpoint untuk mendapatkan statistik file
app.get('/api/admin/file-stats', async (req, res) => {
  try {
    const registeredFiles = await getAllRegisteredFilePaths();
    
    // Scan direktori fisik
    const directories = [
      { path: path.join(__dirname, 'uploads'), name: 'uploads' },
      { path: path.join(__dirname, 'uploads/documents'), name: 'documents' },
      { path: path.join(__dirname, 'uploads/dashboard'), name: 'dashboard' }
    ];
    
    const physicalStats = {};
    let totalPhysicalFiles = 0;
    let totalPhysicalSize = 0;
    
    for (const dir of directories) {
      if (fs.existsSync(dir.path)) {
        const files = fs.readdirSync(dir.path).filter(file => {
          const filePath = path.join(dir.path, file);
          return fs.statSync(filePath).isFile();
        });
        
        let dirSize = 0;
        files.forEach(file => {
          const filePath = path.join(dir.path, file);
          const stats = fs.statSync(filePath);
          dirSize += stats.size;
        });
        
        physicalStats[dir.name] = {
          fileCount: files.length,
          totalSize: dirSize
        };
        
        totalPhysicalFiles += files.length;
        totalPhysicalSize += dirSize;
      } else {
        physicalStats[dir.name] = {
          fileCount: 0,
          totalSize: 0
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        registeredFilesCount: registeredFiles.size,
        physicalStats: physicalStats,
        totalPhysicalFiles: totalPhysicalFiles,
        totalPhysicalSize: totalPhysicalSize,
        summary: {
          registered: registeredFiles.size,
          physical: totalPhysicalFiles,
          difference: totalPhysicalFiles - registeredFiles.size
        }
      }
    });
  } catch (error) {
    console.error('Error pada endpoint file stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik file',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestedPath: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`==== SERVER ERROR ==== ${req.originalUrl} (${req.method}): ${err.message}\n${err.stack}\n====================`);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'production' ? null : {
      message: err.message,
      stack: err.stack
    }
  });
});


// Handle uncaught errors
['uncaughtException', 'unhandledRejection'].forEach(event => {
  process.on(event, (error) => {
    console.error(`Uncaught error (${event}):`, error);
  });
});

// Mulai server
app.listen(port, (err) => {
  if (err) throw err;
  console.log(`Server berjalan di port: ${port}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`URL: http://localhost:${port}`);
});
