// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Buat direktori uploads jika belum ada
const uploadDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadDir);

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Buat nama file yang unik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filter file berdasarkan jenis
const fileFilter = (req, file, cb) => {
  // Mendapatkan jenis folder dari parameter URL
  const folderType = req.params.folderType;
  
  // Atur tipe file yang diizinkan berdasarkan jenis folder
  let allowedMimeTypes = [];
  
  switch (folderType) {
    case 'dokumen':
      allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      break;
    case 'gambar':
      allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      break;
    case 'laporan':
      allowedMimeTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      break;
    default:
      allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
  }
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file tidak didukung untuk folder ${folderType}. Format yang didukung: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Konfigurasi multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // Maksimal 10MB
  }
});

module.exports = upload;