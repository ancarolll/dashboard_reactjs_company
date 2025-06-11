import api from "../../../codinganbaru/src/config/api";

class ManagementService {
    // Base API URL
    static BASE_URL = '/api/management';
    
    // Get all documents
    static async getAllDocuments(page = 1, perPage = 20, searchTerm = '', sectionFilter = 'all') {
        try {
            // Build URL with query parameters yang lebih robust
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('perPage', perPage);
            
            // Only add search parameter if not empty
            if (searchTerm && searchTerm.trim() !== '') {
                params.append('search', searchTerm.trim());
            }
            
            // Only add section parameter if not 'all'
            if (sectionFilter && sectionFilter !== 'all') {
                params.append('section', sectionFilter);
            }
            
            const queryString = params.toString();
            const url = `${this.BASE_URL}/documents${queryString ? `?${queryString}` : ''}`;
            
            const response = await api.get(url);
            
            // Debug untuk melihat data yang diterima
            
            // PERBAIKAN: Safe checking untuk nested properties
            if (response.data && 
                response.data.data && 
                response.data.data.data && 
                Array.isArray(response.data.data.data) && 
                response.data.data.data.length > 0) {
                
                const firstDocument = response.data.data.data[0];
                
                // PERBAIKAN: Safe Object.keys() dengan null check
                if (firstDocument && typeof firstDocument === 'object') {
                    try {
                    } catch (keyError) {

                    }
                } 
            } 
            
            return response.data;
        } catch (error) {
            // Tambahkan return dengan format error yang konsisten
            return { success: false, message: error.message };
        }
    }
    
    // Get document by ID
    static async getDocumentById(id) {
        try {
            // PERBAIKAN: Validasi ID sebelum request
            if (!id) {
                throw new Error('Document ID is required');
            }
            
            const response = await api.get(`${this.BASE_URL}/documents/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching document with id ${id}:`, error);
            return { success: false, message: error.message };
        }
    }
    
    // Get document file URL for viewing
    static getDocumentFileUrl(id) {
        if (!id) {
            return '';
        }
        return `${this.BASE_URL}/documents/${id}/view`;
    }
    
    // Get document file URL for downloading
    static getDocumentDownloadUrl(id) {
        if (!id) {
            return '';
        }
        return `${this.BASE_URL}/documents/${id}/download`;
    }
    
    // Add new document - mengambil logika pembuatan FormData dari versi original
    static async addDocument(documentData) {
        try {
            // PERBAIKAN: Validasi input data
            if (!documentData) {
                throw new Error('Document data is required');
            }
            
            
            // Buat FormData object untuk upload file
            const formData = new FormData();
            
            // PERBAIKAN: Safe append dengan null checks
            formData.append('section', documentData.section || '');
            formData.append('addSection', documentData.addSection || '');
            formData.append('nameFile', documentData.nameFile || '');
            formData.append('uploadDate', documentData.uploadDate || '');
            
            // PERBAIKAN: Pastikan selalu mengirim kedua field ini,
            // bahkan jika nilainya kosong, untuk konsistensi
            formData.append('awalBerlaku', documentData.awalBerlaku || '');
            formData.append('akhirBerlaku', documentData.akhirBerlaku || '');
            
            // Tambahkan file jika ada
            if (documentData.file && documentData.file instanceof File) {
                formData.append('file', documentData.file);
            }
            
            // Debug untuk melihat FormData
            for (let pair of formData.entries()) {
            }
            
            const response = await api.post(`${this.BASE_URL}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error adding document:', error);
            console.error('Error response:', error.response?.data);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message 
            };
        }
    }
    
    // Update document - mengambil logika pembuatan FormData dari versi original
    static async updateDocument(id, documentData) {
        try {
            // PERBAIKAN: Validasi input
            if (!id) {
                throw new Error('Document ID is required');
            }
            
            if (!documentData) {
                throw new Error('Document data is required');
            }
            
            // Debug untuk melihat data yang dikirim
            
            // Buat FormData object untuk upload file
            const formData = new FormData();
            
            // PERBAIKAN: Safe append dengan null checks
            formData.append('section', documentData.section || '');
            formData.append('addSection', documentData.addSection || '');
            formData.append('nameFile', documentData.nameFile || '');
            formData.append('uploadDate', documentData.uploadDate || '');
            
            // Kirim field baru walaupun kosong
            formData.append('awalBerlaku', documentData.awalBerlaku || '');
            formData.append('akhirBerlaku', documentData.akhirBerlaku || '');
            
            // Tambahkan file jika ada
            if (documentData.file && documentData.file instanceof File) {
                formData.append('file', documentData.file);
            }
            
            // Debug untuk melihat FormData
            for (let pair of formData.entries()) {
            }
            
            const response = await api.put(`${this.BASE_URL}/documents/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return response.data;
        } catch (error) {
            console.error(`Error updating document with id ${id}:`, error);
            console.error('Error response:', error.response?.data);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message 
            };
        }
    }
    
    // Delete document
    static async deleteDocument(id) {
        try {
            // PERBAIKAN: Validasi ID
            if (!id) {
                throw new Error('Document ID is required');
            }
            
            const response = await api.delete(`${this.BASE_URL}/documents/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting document with id ${id}:`, error);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message 
            };
        }
    }
    
    // Get all sections
    static async getAllSections() {
        try {
            const response = await api.get(`${this.BASE_URL}/sections`);
            
            // PERBAIKAN: Validasi response structure
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
            }
            
            return response.data;
        } catch (error) {
            console.error('Error fetching sections:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message,
                data: [] // Fallback empty array
            };
        }
    }
    
    // Add new section
    static async addSection(name) {
        try {
            // PERBAIKAN: Validasi nama section
            if (!name || name.trim() === '') {
                throw new Error('Section name is required');
            }
            
            const response = await api.post(`${this.BASE_URL}/sections`, { 
                name: name.trim() 
            });
            return response.data;
        } catch (error) {
            console.error('Error adding section:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message 
            };
        }
    }
    
    // PERBAIKAN: Enhanced utility function untuk memformat tanggal ke format DD/MM/YYYY
    static formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '-';
            }
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    }
    
    // PERBAIKAN: Tambahkan utility function untuk safe object keys
    static safeObjectKeys(obj) {
        if (obj === null || obj === undefined) {
            return [];
        }
        
        if (typeof obj !== 'object') {
            return [];
        }
        
        try {
            return Object.keys(obj);
        } catch (error) {
            console.error('Error getting object keys:', error);
            return [];
        }
    }
}

export default ManagementService;