import pool from '../../config/db.js';
import fs from 'fs';

export class ManagementModel {
    
    // PERBAIKAN: Fungsi untuk mendapatkan semua dokumen manajemen dengan pagination yang lebih baik
    static async getAllDocuments(page = 1, limit = 20, searchTerm = '', sectionFilter = '') {
        try {
            let query = `
                SELECT d.id, d.title, s.name as section, d.file_name, d.file_path, 
                       d.file_type, d.upload_date, d.created_at, d.awal_berlaku, d.akhir_berlaku,
                       d.updated_at
                FROM management_documents d
                LEFT JOIN sections s ON d.section_id = s.id
                WHERE 1=1
            `;
            
            const params = [];
            let paramIndex = 1;
            
            // Terapkan filter pencarian jika ada
            if (searchTerm && searchTerm.trim() !== '') {
                query += ` AND (d.title ILIKE $${paramIndex} OR d.file_name ILIKE $${paramIndex})`;
                params.push(`%${searchTerm.trim()}%`);
                paramIndex++;
            }
            
            // Terapkan filter section jika ada
            if (sectionFilter && sectionFilter.trim() !== '' && sectionFilter !== 'all') {
                query += ` AND s.name = $${paramIndex}`;
                params.push(sectionFilter.trim());
                paramIndex++;
            }
            
            // Hitung total dokumen untuk pagination
            const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_docs`;
            const countResult = await pool.query(countQuery, params);
            const totalCount = parseInt(countResult.rows[0].count);
            
            // Tambahkan sorting dan pagination
            query += ` ORDER BY d.upload_date DESC, d.created_at DESC
                       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            
            // Calculate offset
            const offset = (page - 1) * limit;
            params.push(limit, offset);

            // Debug log untuk query
            console.log('Query SQL:', query);
            console.log('Parameters:', params);
            
            const result = await pool.query(query, params);
            
            return {
                data: result.rows,
                pagination: {
                    total: totalCount,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(totalCount / limit)
                }
            };
        } catch (error) {
            console.error('Error getting all documents:', error);
            throw error;
        }
    }
    
    // Fungsi untuk mendapatkan dokumen berdasarkan ID
    static async getDocumentById(id) {
        try {
            const query = `
                SELECT d.id, d.title, s.name as section, s.id as section_id, d.file_name, 
                       d.file_path, d.file_type, d.upload_date, d.awal_berlaku, d.akhir_berlaku,
                       d.created_at, d.updated_at
                FROM management_documents d
                LEFT JOIN sections s ON d.section_id = s.id
                WHERE d.id = $1
            `;
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error(`Error getting document with id ${id}:`, error);
            throw error;
        }
    }

    // Fungsi untuk mencari dokumen berdasarkan kata kunci
    static async searchDocuments(keyword, sectionFilter = 'all', page = 1, limit = 20) {
        try {
            let query = `
                SELECT d.id, d.title, s.name as section, d.file_name, d.file_path, 
                       d.file_type, d.upload_date, d.awal_berlaku, d.akhir_berlaku
                FROM management_documents d
                LEFT JOIN sections s ON d.section_id = s.id
                WHERE (d.title ILIKE $1 OR d.file_name ILIKE $1)
            `;
            const params = [`%${keyword}%`];
            
            if (sectionFilter !== 'all') {
                query += ` AND s.name = $2`;
                params.push(sectionFilter);
            }
            
            // Hitung total dokumen untuk pagination
            const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_docs`;
            const countResult = await pool.query(countQuery, params);
            const totalCount = parseInt(countResult.rows[0].count);
            
            // Tambahkan sorting dan pagination
            query += ` ORDER BY d.upload_date DESC, d.title
                       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            
            // Calculate offset
            const offset = (page - 1) * limit;
            params.push(limit, offset);
            
            const result = await pool.query(query, params);
            
            return {
                data: result.rows,
                pagination: {
                    total: totalCount,
                    page: page,
                    limit: limit,
                    pages: Math.ceil(totalCount / limit)
                }
            };
        } catch (error) {
            console.error('Error searching documents:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk menambahkan dokumen baru dengan validasi yang lebih baik
    static async addDocument(documentData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Validasi data
            if (!documentData.title || documentData.title.trim() === '') {
                throw new Error('Judul dokumen tidak boleh kosong');
            }
            
            // Debug data yang akan disimpan ke database
            console.log('Data being saved to database:', documentData);
            
            // Cek apakah section sudah ada, jika belum tambahkan
            let sectionId = null;
            if (documentData.section && documentData.section.trim() !== '') {
                // Cari section berdasarkan nama
                const sectionQuery = 'SELECT id FROM sections WHERE name = $1';
                const sectionResult = await client.query(sectionQuery, [documentData.section]);
                
                if (sectionResult.rows.length > 0) {
                    sectionId = sectionResult.rows[0].id;
                } else {
                    // Buat section baru
                    const newSectionQuery = 'INSERT INTO sections (name) VALUES ($1) RETURNING id';
                    const newSectionResult = await client.query(newSectionQuery, [documentData.section]);
                    sectionId = newSectionResult.rows[0].id;
                }
            }
            
            // Tambahkan dokumen baru
            const query = `
                INSERT INTO management_documents 
                (title, section_id, file_name, file_path, file_type, upload_date, awal_berlaku, akhir_berlaku, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            
            const params = [
                documentData.title.trim(),
                sectionId,
                documentData.fileName || null,
                documentData.filePath || null,
                documentData.fileType || null,
                documentData.uploadDate || new Date().toISOString().split('T')[0],
                documentData.awalBerlaku || null,
                documentData.akhirBerlaku || null
            ];
            
            // Debug the values being inserted
            console.log('Parameters for database insert:', params);
            
            const result = await client.query(query, params);
            await client.query('COMMIT');
            
            // Ambil dokumen lengkap yang baru dibuat
            const newDoc = await this.getDocumentById(result.rows[0].id);
            
            return newDoc;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error adding document:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // PERBAIKAN: Fungsi untuk mengupdate dokumen yang sudah ada dengan validasi yang lebih baik
    static async updateDocument(id, documentData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Validasi data
            if (!documentData.title || documentData.title.trim() === '') {
                throw new Error('Judul dokumen tidak boleh kosong');
            }
            
            // Cek apakah dokumen ada
            const existingQuery = 'SELECT * FROM management_documents WHERE id = $1';
            const existingResult = await client.query(existingQuery, [id]);
            
            if (existingResult.rows.length === 0) {
                throw new Error(`Dokumen dengan ID ${id} tidak ditemukan`);
            }
            
            // Cek apakah section sudah ada, jika belum tambahkan
            let sectionId = null;
            if (documentData.section && documentData.section.trim() !== '') {
                // Cari section berdasarkan nama
                const sectionQuery = 'SELECT id FROM sections WHERE name = $1';
                const sectionResult = await client.query(sectionQuery, [documentData.section]);
                
                if (sectionResult.rows.length > 0) {
                    sectionId = sectionResult.rows[0].id;
                } else {
                    // Buat section baru
                    const newSectionQuery = 'INSERT INTO sections (name) VALUES ($1) RETURNING id';
                    const newSectionResult = await client.query(newSectionQuery, [documentData.section]);
                    sectionId = newSectionResult.rows[0].id;
                }
            }
            
            // Perbarui dokumen
            let query = `
                UPDATE management_documents 
                SET title = $1, 
                    section_id = $2, 
                    upload_date = $3,
                    awal_berlaku = $4,
                    akhir_berlaku = $5,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            const params = [
                documentData.title.trim(),
                sectionId,
                documentData.uploadDate || new Date().toISOString().split('T')[0],
                documentData.awalBerlaku || null,
                documentData.akhirBerlaku || null
            ];
            
            // Jika ada file baru yang diupload
            if (documentData.fileName) {
                query += `, file_name = $6, file_path = $7, file_type = $8`;
                params.push(documentData.fileName, documentData.filePath, documentData.fileType);
            }
            
            query += ` WHERE id = $${params.length + 1} RETURNING *`;
            params.push(id);
            
            console.log('Update query:', query);
            console.log('Update parameters:', params);
            
            const result = await client.query(query, params);
            
            if (result.rows.length === 0) {
                throw new Error(`Dokumen dengan ID ${id} tidak ditemukan setelah update`);
            }
            
            await client.query('COMMIT');
            
            // Ambil dokumen lengkap yang baru diupdate
            const updatedDoc = await this.getDocumentById(id);
            
            return updatedDoc;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error updating document with id ${id}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    // PERBAIKAN: Fungsi untuk menghapus dokumen dengan return info file yang dihapus
    static async deleteDocument(id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Dapatkan informasi dokumen sebelum dihapus
            const getQuery = 'SELECT * FROM management_documents WHERE id = $1';
            const getResult = await client.query(getQuery, [id]);
            
            if (getResult.rows.length === 0) {
                throw new Error(`Dokumen dengan ID ${id} tidak ditemukan`);
            }
            
            const documentToDelete = getResult.rows[0];
            
            // Hapus dokumen
            const deleteQuery = 'DELETE FROM management_documents WHERE id = $1';
            const deleteResult = await client.query(deleteQuery, [id]);
            
            console.log(`✅ Document with ID ${id} deleted from database`);
            
            await client.query('COMMIT');
            
            return documentToDelete;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error deleting document with id ${id}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Fungsi untuk mendapatkan semua section
    static async getAllSections() {
        try {
            const query = 'SELECT id, name FROM sections ORDER BY name';
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting all sections:', error);
            throw error;
        }
    }

    // Fungsi untuk menambahkan section baru
    static async addSection(name) {
        try {
            // Validasi nama section
            if (!name || name.trim() === '') {
                throw new Error('Nama section tidak boleh kosong');
            }
            
            const query = 'INSERT INTO sections (name) VALUES ($1) RETURNING id, name';
            const result = await pool.query(query, [name.trim()]);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // PostgreSQL unique violation error code
                throw new Error(`Section dengan nama '${name}' sudah ada`);
            }
            console.error('Error adding section:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk mendapatkan semua file path yang terdaftar (untuk sistem cleanup)
    static async getAllRegisteredFilePaths() {
        try {
            const query = 'SELECT file_path FROM management_documents WHERE file_path IS NOT NULL';
            const result = await pool.query(query);
            
            const filePaths = new Set();
            
            result.rows.forEach(row => {
                if (row.file_path) {
                    filePaths.add(row.file_path);
                    
                    // Add basename
                    const basename = row.file_path.split('/').pop();
                    filePaths.add(basename);
                    
                    // Add various path formats
                    if (row.file_path.startsWith('/uploads/')) {
                        filePaths.add(row.file_path.substring('/uploads/'.length));
                    }
                    if (row.file_path.startsWith('documents/')) {
                        filePaths.add(row.file_path.substring('documents/'.length));
                    }
                    
                    filePaths.add(`documents/${basename}`);
                }
            });
            
            return Array.from(filePaths);
        } catch (error) {
            console.error('Error getting all registered file paths:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk mendapatkan statistik dokumen
    static async getDocumentStats() {
        try {
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_documents,
                    COUNT(CASE WHEN file_path IS NOT NULL THEN 1 END) as documents_with_files,
                    COUNT(CASE WHEN section_id IS NOT NULL THEN 1 END) as documents_with_sections,
                    COUNT(DISTINCT section_id) as unique_sections
                FROM management_documents
            `;
            
            const sectionStatsQuery = `
                SELECT 
                    s.name as section_name,
                    COUNT(d.id) as document_count
                FROM sections s
                LEFT JOIN management_documents d ON s.id = d.section_id
                GROUP BY s.id, s.name
                ORDER BY document_count DESC, s.name
            `;
            
            const [statsResult, sectionStatsResult] = await Promise.all([
                pool.query(statsQuery),
                pool.query(sectionStatsQuery)
            ]);
            
            return {
                overview: statsResult.rows[0],
                sections: sectionStatsResult.rows
            };
        } catch (error) {
            console.error('Error getting document stats:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk mendapatkan dokumen yang akan expired
    static async getExpiringDocuments(days = 30) {
        try {
            const query = `
                SELECT d.id, d.title, s.name as section, d.file_name, d.akhir_berlaku,
                       (d.akhir_berlaku - CURRENT_DATE) as days_until_expiry
                FROM management_documents d
                LEFT JOIN sections s ON d.section_id = s.id
                WHERE d.akhir_berlaku IS NOT NULL 
                  AND d.akhir_berlaku BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
                ORDER BY d.akhir_berlaku ASC
            `;
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting expiring documents:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk mendapatkan dokumen yang sudah expired
    static async getExpiredDocuments() {
        try {
            const query = `
                SELECT d.id, d.title, s.name as section, d.file_name, d.akhir_berlaku,
                       (CURRENT_DATE - d.akhir_berlaku) as days_expired
                FROM management_documents d
                LEFT JOIN sections s ON d.section_id = s.id
                WHERE d.akhir_berlaku IS NOT NULL 
                  AND d.akhir_berlaku < CURRENT_DATE
                ORDER BY d.akhir_berlaku DESC
            `;
            
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting expired documents:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk cleanup section yang tidak digunakan
    static async cleanupUnusedSections() {
        try {
            const query = `
                DELETE FROM sections 
                WHERE id NOT IN (
                    SELECT DISTINCT section_id 
                    FROM management_documents 
                    WHERE section_id IS NOT NULL
                )
                RETURNING name
            `;
            
            const result = await pool.query(query);
            return result.rows.map(row => row.name);
        } catch (error) {
            console.error('Error cleaning up unused sections:', error);
            throw error;
        }
    }

    // PERBAIKAN: Fungsi untuk bulk delete dokumen
    static async bulkDeleteDocuments(ids) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Validasi input
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new Error('Array ID dokumen harus disediakan');
            }
            
            // Dapatkan informasi dokumen sebelum dihapus
            const getQuery = `
                SELECT id, title, file_path 
                FROM management_documents 
                WHERE id = ANY($1)
            `;
            const getResult = await client.query(getQuery, [ids]);
            
            if (getResult.rows.length === 0) {
                throw new Error('Tidak ada dokumen yang ditemukan untuk dihapus');
            }
            
            const documentsToDelete = getResult.rows;
            
            // Hapus dokumen
            const deleteQuery = 'DELETE FROM management_documents WHERE id = ANY($1)';
            const deleteResult = await client.query(deleteQuery, [ids]);
            
            console.log(`✅ ${deleteResult.rowCount} documents deleted from database`);
            
            await client.query('COMMIT');
            
            return documentsToDelete;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error bulk deleting documents:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
}