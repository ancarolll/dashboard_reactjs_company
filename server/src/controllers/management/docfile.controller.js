import { DocFileModel } from '../../models/management/docfile.model.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/dashboard');

// Memastikan direktori upload ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Direktori dibuat: ${UPLOAD_DIR}`);
}

export class DocFileController {
  // Halaman untuk melihat semua data aktif
  static async viewDashboard(req, res) {
    try {
      const dashboardData = await DocFileModel.getAllData();
      res.render('dashboard/view', { 
        title: 'Dashboard Informasi', 
        data: dashboardData,
        active: true
      });
    } catch (error) {
      console.error('Error saat menampilkan halaman dashboard:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data dashboard', 
        error: error.message 
      });
    }
  }

   // Halaman untuk preview konten dashboard berdasarkan ID
   static async previewDashboard(req, res) {
    try {
      const id = req.params.id;
      const dashboardItem = await DocFileModel.getDataById(id);
      
      if (!dashboardItem) {
        return res.status(404).json({
          success: false,
          message: 'Konten tidak ditemukan'
        });
      }
      
      // Jika ini adalah API endpoint
      res.json({
        success: true,
        data: dashboardItem
      });
      
      // Jika ingin merender halaman view
      // res.render('dashboard/preview', {
      //   title: dashboardItem.image_title,
      //   content: dashboardItem
      // });
    } catch (error) {
      console.error(`Error saat menampilkan preview dengan ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data preview',
        error: error.message
      });
    }
  }

  // Halaman untuk melihat data nonaktif
  static async viewInactiveDashboard(req, res) {
    try {
      const dashboardData = await DocFileModel.getAllData(true);
      const inactiveData = dashboardData.filter(item => !item.is_active);
      
      res.render('dashboard/view', { 
        title: 'Dashboard Informasi (Nonaktif)', 
        data: inactiveData,
        active: false
      });
    } catch (error) {
      console.error('Error saat menampilkan halaman dashboard nonaktif:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data dashboard nonaktif', 
        error: error.message 
      });
    }
  }

  // Halaman untuk menambah/edit data
  // Halaman untuk menambah/edit data
  static async editDashboard(req, res) {
    try {
      let dashboardData = null;
      if (req.params.id) {
        dashboardData = await DocFileModel.getDataById(req.params.id);
        if (!dashboardData) {
          return res.status(404).json({ 
            success: false, 
            message: 'Data dashboard tidak ditemukan' 
          });
        }
      }
      res.render('dashboard/edit', { 
        title: dashboardData ? 'Edit Informasi Dashboard' : 'Tambah Informasi Dashboard', 
        data: dashboardData 
      });
    } catch (error) {
      console.error('Error saat menampilkan halaman edit dashboard:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat memuat halaman edit', 
        error: error.message 
      });
    }
  }

  // API untuk mendapatkan semua data
  // API untuk mendapatkan semua data
  static async getAllData(req, res) {
    try {
      const includeInactive = req.query.all === 'true';
      const dashboardData = await DocFileModel.getAllData(includeInactive);
      
      res.json({ 
        success: true, 
        data: dashboardData 
      });
    } catch (error) {
      console.error('Error saat mengambil data dashboard:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data dashboard', 
        error: error.message 
      });
    }
  }

  // API untuk mendapatkan data berdasarkan ID
  static async getDataById(req, res) {
    try {
      const id = req.params.id;
      const dashboardData = await DocFileModel.getDataById(id);
      
      if (!dashboardData) {
        return res.status(404).json({ 
          success: false, 
          message: 'Data dashboard tidak ditemukan' 
        });
      }
      
      res.json({ 
        success: true, 
        data: dashboardData 
      });
    } catch (error) {
      console.error(`Error saat mengambil data dengan ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data dashboard', 
        error: error.message 
      });
    }
  }

  // API untuk menambahkan data baru
  static async addData(req, res) {
    try {
      // Validasi file gambar
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gambar harus diunggah' 
        });
      }

      // Validasi ukuran file (batas 2MB)
      if (req.file.size > 2 * 1024 * 1024) {
        // Hapus file jika melebihi batas
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: 'Ukuran gambar tidak boleh melebihi 2MB' 
        });
      }

      // Validasi data lainnya
      if (!req.body.image_title) {
        // Hapus file jika data tidak lengkap
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: 'Judul gambar harus diisi' 
        });
      }

      // Dapatkan tipe file (ekstensi)
      const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      if (!['jpg', 'jpeg', 'png'].includes(fileType)) {
        // Hapus file jika tipe tidak valid
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: 'Format file tidak didukung. Gunakan format JPG, JPEG, atau PNG' 
        });
      }

      // Siapkan data untuk disimpan
      const data = {
        image_path: `/uploads/dashboard/${req.file.filename}`,
        image_title: req.body.image_title,
        image_description: req.body.image_description || '',
        file_type: fileType,
        file_size: req.file.size,
        external_link: req.body.external_link || null,
        is_active: req.body.is_active === 'false' ? false : true
      };

      // Simpan data ke database
      const result = await DocFileModel.addData(data);
      
      res.status(201).json({ 
        success: true, 
        message: 'Data dashboard berhasil ditambahkan',
        data: result 
      });
    } catch (error) {
      // Hapus file jika terjadi error dalam proses
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('Error saat menambahkan data baru:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat menambahkan data dashboard', 
        error: error.message 
      });
    }
  }

  // API untuk memperbarui data
  static async updateData(req, res) {
    try {
      const id = req.params.id;
      
      // Periksa apakah data ada
      const existingData = await DocFileModel.getDataById(id);
      if (!existingData) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ 
          success: false, 
          message: 'Data dashboard tidak ditemukan' 
        });
      }

      // Siapkan data untuk diperbarui
      const data = {
        image_title: req.body.image_title || existingData.image_title,
        image_description: req.body.image_description || existingData.image_description,
        external_link: req.body.external_link || existingData.external_link
      };

      // Perbarui status aktif jika disediakan
      if (req.body.is_active !== undefined) {
        data.is_active = req.body.is_active === 'false' ? false : true;
      }

      // Jika ada file gambar baru
      if (req.file) {
        // Validasi ukuran file (batas 2MB)
        if (req.file.size > 2 * 1024 * 1024) {
          // Hapus file jika melebihi batas
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            success: false, 
            message: 'Ukuran gambar tidak boleh melebihi 2MB' 
          });
        }

        // Validasi tipe file
        const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
        if (!['jpg', 'jpeg', 'png'].includes(fileType)) {
          // Hapus file jika tipe tidak valid
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            success: false, 
            message: 'Format file tidak didukung. Gunakan format JPG, JPEG, atau PNG' 
          });
        }

        // Hapus file lama jika ada
        if (existingData.image_path) {
          const oldFilePath = path.join(__dirname, '../../', existingData.image_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // Update dengan path gambar baru dan informasi file
        data.image_path = `/uploads/dashboard/${req.file.filename}`;
        data.file_type = fileType;
        data.file_size = req.file.size;
      }

      // Update data di database
      const result = await DocFileModel.updateData(id, data);
      
      res.json({ 
        success: true, 
        message: 'Data dashboard berhasil diperbarui',
        data: result 
      });
    } catch (error) {
      // Hapus file baru jika terjadi error dalam proses
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error(`Error saat memperbarui data dengan ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat memperbarui data dashboard', 
        error: error.message 
      });
    }
  }

  // API untuk mengubah status aktif/nonaktif
  static async toggleActive(req, res) {
    try {
      const id = req.params.id;
      const isActive = req.body.is_active === 'false' ? false : true;
      
      // Periksa apakah data ada
      const existingData = await DocFileModel.getDataById(id);
      if (!existingData) {
        return res.status(404).json({ 
          success: false, 
          message: 'Data dashboard tidak ditemukan' 
        });
      }

      // Update status aktif di database
      const result = await DocFileModel.toggleActive(id, isActive);
      
      res.json({ 
        success: true, 
        message: `Data dashboard berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        data: result 
      });
    } catch (error) {
      console.error(`Error saat mengubah status aktif data dengan ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengubah status aktif data dashboard', 
        error: error.message 
      });
    }
  }

  // API untuk menghapus data
  static async deleteData(req, res) {
    try {
      const id = req.params.id;
      
      // Periksa apakah data ada
      const existingData = await DocFileModel.getDataById(id);
      if (!existingData) {
        return res.status(404).json({ 
          success: false, 
          message: 'Data dashboard tidak ditemukan' 
        });
      }

      // Hapus file gambar jika ada
      if (existingData.image_path) {
        const filePath = path.join(__dirname, '../../', existingData.image_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Hapus data dari database
      await DocFileModel.deleteData(id);
      
      res.json({ 
        success: true, 
        message: 'Data dashboard berhasil dihapus' 
      });
    } catch (error) {
      console.error(`Error saat menghapus data dengan ID ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat menghapus data dashboard', 
        error: error.message 
      });
    }
  }

}

export default DocFileController;

