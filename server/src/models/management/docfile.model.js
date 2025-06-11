import pool from "../../config/db.js";

export class DocFileModel {
    // Inisialisasi tabel jika belum ada
    static async initTable() {
    try {
    const checkTableQuery = `
        SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'dashboard_info'
        );
    `;
    const tableExists = await pool.query(checkTableQuery);
    
    if (!tableExists.rows[0].exists) {
        const createTableQuery = `
        CREATE TABLE dashboard_info (
            id SERIAL PRIMARY KEY,
            image_path VARCHAR(255) NOT NULL,
            image_title VARCHAR(100) NOT NULL,
            image_description TEXT,
            file_type VARCHAR(10) NOT NULL,
            file_size INTEGER NOT NULL,
            external_link VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_dashboard_info_title ON dashboard_info(image_title);
        CREATE INDEX idx_dashboard_info_active ON dashboard_info(is_active);
        
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_dashboard_info_modtime
        BEFORE UPDATE ON dashboard_info
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
        `;
        
        await pool.query(createTableQuery);
        console.log('Tabel dashboard_info berhasil dibuat');
    }
    } catch (error) {
    console.error('Error saat inisialisasi tabel dashboard_info:', error);
    throw error;
    }
}

// Mendapatkan semua data aktif
static async getAllData(includeInactive = false) {
    try {
    let query = 'SELECT * FROM dashboard_info';
    if (!includeInactive) {
        query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query);
    return result.rows;
    } catch (error) {
    console.error('Error saat mengambil data dashboard:', error);
    throw error;
    }
}

// Mendapatkan data berdasarkan ID
static async getDataById(id) {
    try {
    const query = 'SELECT * FROM dashboard_info WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
    } catch (error) {
    console.error(`Error saat mengambil data dengan ID ${id}:`, error);
    throw error;
    }
}

// Menambahkan data baru
static async addData(data) {
    try {
    const { 
        image_path, 
        image_title, 
        image_description, 
        file_type, 
        file_size, 
        external_link,
        is_active 
    } = data;
    
    const query = `
        INSERT INTO dashboard_info (
        image_path, 
        image_title, 
        image_description, 
        file_type, 
        file_size, 
        external_link, 
        is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    
    const values = [
        image_path, 
        image_title, 
        image_description, 
        file_type, 
        file_size, 
        external_link || null,
        is_active !== undefined ? is_active : true
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
    } catch (error) {
    console.error('Error saat menambahkan data baru:', error);
    throw error;
    }
}

// Memperbarui data yang sudah ada
static async updateData(id, data) {
    try {
    const { 
        image_path, 
        image_title, 
        image_description, 
        file_type, 
        file_size, 
        external_link,
        is_active 
    } = data;
    
    let query = 'UPDATE dashboard_info SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Hanya update field yang disediakan
    if (image_path !== undefined) {
        updateFields.push(`image_path = $${paramIndex++}`);
        values.push(image_path);
    }
    
    if (image_title !== undefined) {
        updateFields.push(`image_title = $${paramIndex++}`);
        values.push(image_title);
    }
    
    if (image_description !== undefined) {
        updateFields.push(`image_description = $${paramIndex++}`);
        values.push(image_description);
    }
    
    if (file_type !== undefined) {
        updateFields.push(`file_type = $${paramIndex++}`);
        values.push(file_type);
    }
    
    if (file_size !== undefined) {
        updateFields.push(`file_size = $${paramIndex++}`);
        values.push(file_size);
    }
    
    if (external_link !== undefined) {
        updateFields.push(`external_link = $${paramIndex++}`);
        values.push(external_link);
    }
    
    if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
    }
    
    // Jika tidak ada field yang diupdate, return data lama
    if (updateFields.length === 0) {
        return await this.getDataById(id);
    }
    
    query += updateFields.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const result = await pool.query(query, values);
    return result.rows[0];
    } catch (error) {
    console.error(`Error saat memperbarui data dengan ID ${id}:`, error);
    throw error;
    }
}

// Mengubah status aktif/nonaktif
static async toggleActive(id, isActive) {
    try {
    const query = `
        UPDATE dashboard_info
        SET is_active = $1
        WHERE id = $2
        RETURNING *
    `;
    
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0];
    } catch (error) {
    console.error(`Error saat mengubah status aktif data dengan ID ${id}:`, error);
    throw error;
    }
}

// Menghapus data
static async deleteData(id) {
    try {
    const query = 'DELETE FROM dashboard_info WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
    } catch (error) {
    console.error(`Error saat menghapus data dengan ID ${id}:`, error);
    throw error;
    }
}
}
  
export default DocFileModel;