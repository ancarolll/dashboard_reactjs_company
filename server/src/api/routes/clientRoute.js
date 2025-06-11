import express from 'express';
import * as clientController from "../../controllers/clientController.js";

const router = express.Router();

// Rute untuk data karyawan aktif
// GET /api/elnusa - Mendapatkan semua data klien
router.get('/elnusa', clientController.getClients);


router.get('/elnusa/:no_kontrak', clientController.getClientByContract);

// POST /api/elnusa - Membuat data klien baru
router.post('/elnusa', clientController.createClient);

// PUT /api/elnusa/:no_kontrak - Memperbarui data klien berdasarkan nomor kontrak
router.put('/elnusa/:no_kontrak', clientController.updateClient);

// DELETE /api/elnusa/:no_kontrak - Menghapus data klien berdasarkan nomor kontrak
router.delete('/elnusa/:no_kontrak', clientController.deleteClient);


// Rute baru untuk karyawan non-aktif
// Tambahkan rute nonactive sebelum rute dengan parameter
router.get('/elnusa/nonactive', clientController.getNonActiveClients);
router.delete('/elnusa/nonactive/:no_kontrak', clientController.deleteNonActiveClient);
router.post('/elnusa/restore/:no_kontrak', clientController.restoreNonActiveClient);

// Rute dengan parameter harus setelah rute spesifik
router.get('/elnusa/:no_kontrak', clientController.getClientByContract);
router.put('/elnusa/:no_kontrak', clientController.updateClient);
router.delete('/elnusa/:no_kontrak', clientController.deleteClient);

export default router;