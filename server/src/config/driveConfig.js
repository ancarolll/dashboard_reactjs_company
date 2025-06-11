// config/driveConfig.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

// Path ke file service account credentials
const KEYFILE_PATH = path.join(__dirname, 'serviceAccountKey.json');

// ID Folder untuk setiap kategori
const FOLDER_IDS = {
  dokumen: process.env.FOLDER_DOKUMEN_ID,
  gambar: process.env.FOLDER_GAMBAR_ID,
  laporan: process.env.FOLDER_LAPORAN_ID
};

// Buat JWT client dengan service account
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: ['https://www.googleapis.com/auth/drive']
});

// Buat instance Drive API
const drive = google.drive({ version: 'v3', auth });

/**
 * Upload file ke Google Drive ke folder tertentu
 * @param {Object} fileObject - File dari multer
 * @param {string} folderType - Jenis folder (dokumen, gambar, laporan)
 * @returns {Promise<Object>} - Informasi file yang diupload
 */
const uploadFile = async (fileObject, folderType) => {
  try {
    // Validasi jenis folder
    if (!FOLDER_IDS[folderType]) {
      throw new Error(`Jenis folder tidak valid: ${folderType}`);
    }

    const folderId = FOLDER_IDS[folderType];
    
    // Buat metadata file
    const fileMetadata = {
      name: fileObject.originalname,
      parents: [folderId] // ID folder tujuan
    };
    
    // Media untuk diupload
    const media = {
      mimeType: fileObject.mimetype,
      body: fs.createReadStream(fileObject.path)
    };
    
    // Upload file ke Google Drive
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink'
    });
    
    // Hapus file temporary
    await fs.unlink(fileObject.path);
    
    // Set permission publik (opsional - hanya jika file perlu diakses publik)
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    // Dapatkan URL publik
    const fileInfo = await drive.files.get({
      fileId: response.data.id,
      fields: 'webViewLink, webContentLink'
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      viewLink: fileInfo.data.webViewLink,
      downloadLink: fileInfo.data.webContentLink
    };
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
};

/**
 * Hapus file dari Google Drive
 * @param {string} fileId - ID file di Google Drive
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const deleteFile = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId
    });
    return true;
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw error;
  }
};

/**
 * Mendapatkan informasi file dari Google Drive
 * @param {string} fileId - ID file di Google Drive
 * @returns {Promise<Object>} - Informasi file
 */
const getFileInfo = async (fileId) => {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink'
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      viewLink: response.data.webViewLink,
      downloadLink: response.data.webContentLink
    };
  } catch (error) {
    console.error('Error getting file from Google Drive:', error);
    throw error;
  }
};

/**
 * Dapatkan daftar file dalam folder tertentu
 * @param {string} folderType - Jenis folder (dokumen, gambar, laporan)
 * @returns {Promise<Array>} - Daftar file
 */
const listFiles = async (folderType) => {
  try {
    // Validasi jenis folder
    if (!FOLDER_IDS[folderType]) {
      throw new Error(`Jenis folder tidak valid: ${folderType}`);
    }

    const folderId = FOLDER_IDS[folderType];
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'createdTime desc'
    });
    
    return response.data.files;
  } catch (error) {
    console.error('Error listing files from Google Drive:', error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileInfo,
  listFiles,
  FOLDER_IDS
};