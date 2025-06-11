import React, { useState, useEffect } from 'react';
import StatBoxTarComponents from './StatBoxTarComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTrashCan, faDownload, faUpload, faFileAlt, faUser, faEye, faPlus, faHistory, faSync, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://localhost:3005/api';

const TarSection = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Data state
  const [mcuData, setMcuData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('totemployes');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Document modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalField, setDocModalField] = useState(null);
  const [docModalId, setDocModalId] = useState(null);
  const [docModalValue, setDocModalValue] = useState('');
  const [docModalFile, setDocModalFile] = useState(null);

  // State for history
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState(null);
  const [contractHistory, setContractHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    nama_karyawan: '', jabatan: '', tanggal_lahir: '', jenis_kelamin: '', usia: '', no_kontrak: '', awal_mcu: '', akhir_mcu: '',
    hasil_mcu: '', vendor_mcu: '', keterangan_mcu: '', kontrak_awal: '', kontrak_akhir: '', status_karyawan: '', nik: '',
    nik_tar: '', kk: '', npwp: '', kpj: '', bpjs: '', norek: '', bank: '', status_pernikahan: '', alamat_rumah: '', no_hp: '',
    pendidikan_terakhir: '', jurusan: '', universitas_sekolah: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    bpjs: '', kpj: '', nik: '', kk: '', npwp: ''
  });

  // IMPROVED: Enhanced file upload state
  const [files, setFiles] = useState({
    bpjs: null, nik: null, kk: null, npwp: null, norek: null, kpj: null
  });

  // IMPROVED: State untuk tracking file yang akan dihapus
  const [filesToDelete, setFilesToDelete] = useState(new Set());
  
  // IMPROVED: State untuk tracking file yang sudah dihapus dari form
  const [deletedFiles, setDeletedFiles] = useState(new Set());

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    show: false, fileUrl: null, fileType: null, fieldName: '', fileName: ''
  });
  
  // Fungsi untuk validasi field
  const validateField = (name, value) => {
    let error = '';
    
    if (name === 'bpjs' && value) {
      if (value.length > 0 && value.length !== 13) {
        error = 'BPJS Health  must consist of 13 characters';
      }
    }
    
    if (name === 'kpj' && value) {
      if (value.length > 0 && value.length !== 11) {
        error = 'BPJS Social Security must consist of 11 characters';
      }
    }
    
    if (name === 'nik' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'KTP Number must be 16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'KTP Number must contain only numbers';
      }
    }
    
    if (name === 'kk' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'Family Card Number must be 16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'Family Card Number must contain only numbers';
      }
    }
    
    if (name === 'npwp' && value) {
      if (value.length > 0 && value.length !== 15 && value.length !== 16) {
        error = 'NPWP must be 15–16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'NPWP must contain only numbers';
      }
    }
    
    return error;
  };
 
  // Fetch data on component mount
  useEffect(() => {
    fetchEmployeeData();
  }, []);
  
  // Fetch employee data from API
  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/mcu`);
      
      // Process data to ensure no null values
      const processedData = (response.data || []).map(employee => {
        const processed = {...employee};
        
        // Replace null values with empty strings
        Object.keys(processed).forEach(key => {
          if (processed[key] === null || processed[key] === undefined) {
            processed[key] = '';
          }
        });
        
        return processed;
      });
      
      setMcuData(processedData);
      setFilteredData(processedData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError('Failed to load employee data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil riwayat kontrak dari API
  const fetchContractHistory = async (id) => {
    if (!id) return;
    
    setLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/mcu/${id}/contract-history`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setContractHistory(response.data.data);
      } else {
        setContractHistory([]);
        setHistoryError('Response format is invalid');
      }
    } catch (err) {
      console.error('Error fetching contract history:', err);
      setHistoryError(err.response?.data?.message || 'Failed to fetch contract history data');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Cek apakah field hanya boleh berisi angka (kecuali BPJS dan KPJ)
    const numericFields = ['nik', 'kk', 'npwp', 'norek'];
    if (numericFields.includes(name) && value !== '' && !/^\d*$/.test(value)) {
      return; // Jangan terima input non-angka untuk field numerik
    }
    
    // Batasi panjang maksimum sesuai field
    if (name === 'bpjs' && value.length > 13) return;
    if (name === 'kpj' && value.length > 11) return;
    if (name === 'nik' && value.length > 16) return;
    if (name === 'kk' && value.length > 16) return;
    if (name === 'npwp' && value.length > 16) return;
    
    // Perbarui state formData dengan nilai baru
    setFormData({
      ...formData,
      [name]: value || ''
    });
    
    // Validasi field dan perbarui state error
    const error = validateField(name, value);
    setFormErrors({
      ...formErrors,
      [name]: error
    });
  };
  
  // IMPROVED: Enhanced file change handler
  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    if (uploadedFiles && uploadedFiles[0]) {
      setFiles({
        ...files,
        [name]: uploadedFiles[0]
      });
      
      // Remove from delete list if user uploads new file
      if (filesToDelete.has(name)) {
        const newFilesToDelete = new Set(filesToDelete);
        newFilesToDelete.delete(name);
        setFilesToDelete(newFilesToDelete);
      }

      // Remove from deleted files list if user uploads new file
      if (deletedFiles.has(name)) {
        const newDeletedFiles = new Set(deletedFiles);
        newDeletedFiles.delete(name);
        setDeletedFiles(newDeletedFiles);
      }
    }
  };

  // IMPROVED: Function to remove new file from form
  const removeNewFile = (fieldName) => {
    setFiles({
      ...files,
      [fieldName]: null
    });
    
    // Reset file input
    const fileInput = document.querySelector(`input[name="${fieldName}"]`);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // IMPROVED: Function to mark existing file for deletion
  const markFileForDeletion = (fieldName) => {
    const newDeletedFiles = new Set(deletedFiles);
    newDeletedFiles.add(fieldName);
    setDeletedFiles(newDeletedFiles);
  };

  // IMPROVED: Function to restore file from deletion
  const restoreFileFromDeletion = (fieldName) => {
    const newDeletedFiles = new Set(deletedFiles);
    newDeletedFiles.delete(fieldName);
    setDeletedFiles(newDeletedFiles);
  };
  
  // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // If already in DD/MM/YYYY format
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      
      // If in YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // If with timestamp, take only the date part
      if (dateString.includes('T')) {
        const [datePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Fungsi untuk membuka preview file
  const openFilePreview = (id, field, filename, mimetype) => {
    // Jika tidak ada file, tidak buka preview
    if (!filename) {
      setMessage({
        text: `No file for ${field}`,
        type: 'info'
      });
      return;
    }
    
    const fileUrl = `${API_BASE_URL}/tar-mcu/mcu/file/${id}/${field}`;
    
    // Format nama field untuk display
    const fieldDisplayNames = {
      bpjs: 'BPJS Health', nik: 'KTP Number', kk: 'Family Card', npwp: 'NPWP', kpj: 'BPJS Social Security', norek: 'Bank Account Number'
    };
    
    setPreviewModal({
      show: true, 
      fileUrl, 
      fileType: mimetype, 
      fieldName: fieldDisplayNames[field] || field, 
      fileName: filename
    });
  };
  
  // Open document modal for a specific field
  const openDocumentModal = (id, field, value) => {
    const employee = mcuData.find(emp => emp.id === id);
    
    // Jika ada file dan user mengklik di bagian bukan tombol
    if (employee && employee[`${field}_filename`]) {
      // Buka preview file
      openFilePreview(
        id,
        field,
        employee[`${field}_filename`],
        employee[`${field}_mimetype`]
      );
    } else {
      // Buka modal view-only
      setDocModalId(id);
      setDocModalField(field);
      setDocModalValue(value || '');
      setDocModalFile(null);
      setShowDocModal(true);
    }
  };
  
  // Close document modal
  const closeDocumentModal = () => {
    setShowDocModal(false);
    setDocModalId(null);
    setDocModalField(null);
    setDocModalValue('');
    setDocModalFile(null);
  };

  // Fungsi untuk menghapus file dari server
  const deleteFileFromServer = async (id, field) => {
    if (!window.confirm(`Are you sure you want to delete the file ${field}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get existing employee data
      const employee = mcuData.find(emp => emp.id === id);
      if (!employee) {
        throw new Error('Employee data not found');
      }
      
      // Check if file exists in database
      if (!employee[`${field}_filename`]) {
        throw new Error(`No ${field} file is saved`);
      }
      
      // PERBAIKAN: Prepare form data dengan method yang lebih simple
      const formData = new FormData();
      
      // Copy semua existing employee data kecuali field file yang akan dihapus
      Object.entries(employee).forEach(([key, value]) => {
        if (key !== 'id') {
          // PERBAIKAN: Handle file fields yang akan dihapus
          if (key === field || 
              key === `${field}_filename` || 
              key === `${field}_filepath` || 
              key === `${field}_mimetype` || 
              key === `${field}_filesize`) {
            
            if (key === field) {
              formData.append(key, value || ''); // Keep the original field value
            } else if (key === `${field}_filename`) {
              formData.append(key, ''); // Mark for deletion
            } else if (key === `${field}_filepath`) {
              formData.append(key, '');
            } else if (key === `${field}_mimetype`) {
              formData.append(key, '');
            } else if (key === `${field}_filesize`) {
              formData.append(key, '0');
            }
          } else {
            // PERBAIKAN: Handle nilai null/undefined dengan lebih baik
            if (value !== null && value !== undefined) {
              formData.append(key, value);
            } else {
              // Untuk field numerik, gunakan nilai default
              if (key === 'usia') {
                formData.append(key, '0');
              } else {
                formData.append(key, '');
              }
            }
          }
        }
      });
      
      // Update employee data
      const response = await axios.put(`${API_BASE_URL}/tar-mcu/mcu/${id}/with-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh data
      await fetchEmployeeData();
      
      // Show success message
      setMessage({
        text: `File ${field} successfully deleted`,
        type: 'success'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting file ${field}:`, error);
      
      let errorMessage = `Failed to delete file: `;
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      
      setMessage({
        text: errorMessage,
        type: 'error'
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Open form for adding or editing employee
  const openForm = (employee = null) => {
    if (employee) {
      // Edit mode
      setFormMode('edit');
      setSelectedEmployee(employee);
      
      // Populate form with employee data
      const populatedForm = {};
      Object.keys(formData).forEach(key => {
        // Ensure all values are properly initialized
        if (employee[key] !== undefined && employee[key] !== null) {
          // Convert dates to YYYY-MM-DD for input elements
          if (['tanggal_lahir', 'awal_mcu', 'akhir_mcu', 'kontrak_awal', 'kontrak_akhir'].includes(key) && employee[key]) {
            // Check if date is already in YYYY-MM-DD format
            if (employee[key].match(/^\d{4}-\d{2}-\d{2}$/)) {
              populatedForm[key] = employee[key];
            } 
            // If date is in format with timestamp
            else if (employee[key].includes('T')) {
              populatedForm[key] = employee[key].split('T')[0];
            } 
            // Otherwise try to parse and format
            else {
              try {
                const date = new Date(employee[key]);
                populatedForm[key] = date.toISOString().split('T')[0];
              } catch (e) {
                populatedForm[key] = ''; // Use empty string instead of null
              }
            }
          } else {
            // Convert any non-date value to string if not null
            populatedForm[key] = String(employee[key]);
          }
        } else {
          // Use empty string for undefined or null values
          populatedForm[key] = '';
        }
      });
      
      setFormData(populatedForm);
    } else {
      // Add mode - initialize all fields with empty strings, not null
      setFormMode('add');
      setSelectedEmployee(null);
      
      // Create a new object with all empty strings
      const emptyForm = {};
      Object.keys(formData).forEach(key => {
        emptyForm[key] = '';
      });
      setFormData(emptyForm);
    }
    
    // Reset file states
    setFiles({
      bpjs: null,
      nik: null,
      kk: null,
      npwp: null,
      norek: null,
      kpj: null
    });
    setFilesToDelete(new Set());
    setDeletedFiles(new Set());
    
    setShowForm(true);
  };
  
  // Close form
  const closeForm = () => {
    setShowForm(false);
    setSelectedEmployee(null);
    setFiles({
      bpjs: null,
      nik: null,
      kk: null,
      npwp: null,
      norek: null,
      kpj: null
    });
    setFilesToDelete(new Set());
    setDeletedFiles(new Set());
  };
  
  // IMPROVED: Enhanced submit form function
  const submitForm = async () => {
    // Validasi required fields
    if (!formData.nama_karyawan) {
      setMessage({
        text: 'Employee name is required',
        type: 'error'
      });
      return;
    }
    
    // Validasi semua field dan kumpulkan error
    const allErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        allErrors[key] = error;
      }
    });
    
    // Jika ada error, perbarui state error dan berhenti submit
    if (Object.keys(allErrors).length > 0) {
      setFormErrors({
        ...formErrors,
        ...allErrors
      });
      
      setMessage({
        text: 'The form contains errors. Please check again.',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare form data for submission
      const submitData = new FormData();
      
      // Add text fields - PERBAIKAN: Handle nilai null/undefined dengan lebih baik
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined) {
          submitData.append(key, value);
        } else {
          // Handle nilai kosong dengan lebih konsisten
          if (key === 'usia') {
            submitData.append(key, '0');
          } else {
            submitData.append(key, '');
          }
        }
      });
      
      // Add new files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      // PERBAIKAN: Handle file deletions untuk edit mode dengan method yang lebih simple
      if (formMode === 'edit' && selectedEmployee) {
        deletedFiles.forEach(field => {
          // Mark file fields for deletion by sending empty filename
          submitData.set(`${field}_filename`, '');
          submitData.set(`${field}_filepath`, '');
          submitData.set(`${field}_mimetype`, '');
          submitData.set(`${field}_filesize`, '0');
        });
      }
      
      
      if (formMode === 'add') {
        // Add new employee
        await axios.post(`${API_BASE_URL}/tar-mcu/mcu/with-files`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setMessage({
          text: 'Employee data has been successfully added',
          type: 'success'
        });
      } else {
        // Update employee
        await axios.put(`${API_BASE_URL}/tar-mcu/mcu/${selectedEmployee.id}/with-files`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setMessage({
          text: 'Employee data has been successfully updated',
          type: 'success'
        });
      }
      
      // Refresh data and close form
      await fetchEmployeeData();
      closeForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      let errorMessage = 'Failed to save employee data';
      if (error.response?.data?.message) {
        errorMessage += ': ' + error.response.data.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setMessage({
        text: errorMessage,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete employee
  const deleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee data?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/tar-mcu/mcu/${id}`);
      
      setMessage({
        text: 'Employee data deleted successfully',
        type: 'success'
      });
      
      // Refresh data
      await fetchEmployeeData();
    } catch (error) {
      console.error('Error deleting employee data:', error);
      setMessage({
        text: `Failed to delete employee data: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Download document
  const downloadDocument = async (id, field) => {
    try {
      setLoading(true);
      setMessage({ text: 'Starting download...', type: 'info' });
      
      // Use axios with responseType 'blob'
      const response = await axios({
        url: `${API_BASE_URL}/tar-mcu/mcu/file/${id}/${field}`,
        method: 'GET',
        responseType: 'blob',
        timeout: 30000 // 30 seconds timeout
      });
      
      // Get content type to determine file type
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Get filename from header or create default name based on field
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${field}_document`; // Base name without extension
      
      // Add extension based on content type if not in file name
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          // Add extension based on content type
          const extensionMap = {
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'image/jpeg': '.jpeg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'text/plain': '.txt'
          };
          
          const extension = extensionMap[contentType] || '';
          if (extension && !filename.endsWith(extension)) {
            filename += extension;
          }
        }
      }
      
      // Create Blob with correct content type
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create link element for download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 200);
      
      setMessage({ text: 'File downloaded successfully', type: 'success' });
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // More informative error handling
      let errorMessage = 'Failed to download file. ';
      
      if (error.response) {
        // Error from server with status code
        if (error.response.status === 404) {
          errorMessage += 'File not found on the server.';
        } else if (error.response.status === 403) {
          errorMessage += 'Access to the file was denied.';
        } else {
          errorMessage += `Server returned an error: ${error.response.status}`;
        }
        
        // If there is an error message from server in JSON format
        if (error.response.data instanceof Blob) {
          try {
            // Try to read error message from response blob
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorData = JSON.parse(reader.result);
                if (errorData && errorData.message) {
                  setMessage({ 
                    text: `Failed to download file: ${errorData.message}`, 
                    type: 'error' 
                  });
                }
              } catch (e) {
                // Ignore JSON parsing error
              }
            };
            reader.readAsText(error.response.data);
          } catch (e) {
            // Ignore error
          }
        }
      } else if (error.request) {
        // No response from server
        errorMessage += 'No response from the server. Please check your network connection.';
      } else {
        // Other errors
        errorMessage += error.message;
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk download history sebagai CSV
  const downloadContractHistory = () => {
    if (contractHistory.length === 0) {
      setHistoryError('No contract history to download');
      return;
    }
    
    const headers = [
      'Change Time',
      'Employee Name',
      // Contract
      'Old Contract Number', 'Old Contract Start', 'Old Contract End',
      'New Contract Number', 'New Contract Start', 'New Contract End',
      'Modified By'
    ];
    
    const rows = contractHistory.map(history => [
      new Date(history.waktu_perubahan).toLocaleString('en-US'),
      history.nama_karyawan || '',
      // Contract
      history.no_kontrak_lama || '-',
      formatDateToDDMMYYYY(history.kontrak_awal_lama) || '-',
      formatDateToDDMMYYYY(history.kontrak_akhir_lama) || '-',
      history.no_kontrak_baru || '-',
      formatDateToDDMMYYYY(history.kontrak_awal_baru) || '-',
      formatDateToDDMMYYYY(history.kontrak_akhir_baru) || '-',
      // Modified by
      history.modified_by || 'system'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contract-history-${selectedItemHistory?.nama_karyawan || 'data'}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim() && activeFilter === 'totemployes') {
      setFilteredData(mcuData);
      return;
    }
    
    let filtered = mcuData;
    
    if (activeFilter !== 'totemployes') {
      filtered = mcuData.filter(employee => {
        const days = getDaysDifference(employee.kontrak_akhir);
        
        if (activeFilter === 'duedate') {
          return days <= 14;  // Removed days >= 0 condition to include expired
        } else if (activeFilter === 'call2') {
          return days > 14 && days <= 30;
        } else if (activeFilter === 'call1') {
          return days > 30 && days <= 45;
        }
        
        return true;
      });
    }
    
    // Then apply search term filtering
    if (searchTerm.trim()) {
      filtered = filtered.filter(employee => {
        return Object.values(employee).some(value => 
          value !== null && 
          value !== undefined && 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    setFilteredData(filtered);
  }, [searchTerm, mcuData, activeFilter]);

  const getDaysDifference = (endDate) => {
    if (!endDate) return -999;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0);
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days:", e);
      return -999;
    }
  };
  
  // Export data to Excel
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      setMessage({
        text: 'No data to export',
        type: 'error'
      });
      return;
    }
    
    try {
      // Prepare data for export
      const exportData = filteredData.map(employee => {
        const data = {
          nama_karyawan: employee.nama_karyawan || '',
          jabatan: employee.jabatan || '',
          jenis_kelamin: employee.jenis_kelamin || '',
          tanggal_lahir: formatDateToDDMMYYYY(employee.tanggal_lahir) || '',
          usia: employee.usia || '',
          no_kontrak: employee.no_kontrak || '',
          awal_mcu: formatDateToDDMMYYYY(employee.awal_mcu) || '',
          akhir_mcu: formatDateToDDMMYYYY(employee.akhir_mcu) || '',
          hasil_mcu: employee.hasil_mcu || '',
          vendor_mcu: employee.vendor_mcu || '',
          keterangan_mcu: employee.keterangan_mcu || '',
          kontrak_awal: formatDateToDDMMYYYY(employee.kontrak_awal) || '',
          kontrak_akhir: formatDateToDDMMYYYY(employee.kontrak_akhir) || '',
          status_karyawan: employee.status_karyawan || '',
          nik: employee.nik || '',
          nik_tar: employee.nik_tar || '',
          kk: employee.kk || '',
          npwp: employee.npwp || '',
          kpj: employee.kpj || '',
          bpjs: employee.bpjs || '',
          norek: employee.norek || '',
          bank: employee.bank || '',
          status_pernikahan: employee.status_pernikahan || '',
          alamat_rumah: employee.alamat_rumah || '',
          no_hp: employee.no_hp || '',
          pendidikan_terakhir: employee.pendidikan_terakhir || '',
          jurusan: employee.jurusan || '',
          universitas_sekolah: employee.universitas_sekolah || ''
        };
        
        return data;
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
      
      // Export workbook
      XLSX.writeFile(workbook, 'employee_data.xlsx');
      
      setMessage({
        text: 'Data exported successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({
        text: `Export failed: ${error.message}`,
        type: 'error'
      });
    }
  };

  // IMPROVED: Function to render file management section
  const renderFileManagement = (field, label, maxLength = null) => {
    const isDeleted = deletedFiles.has(field);
    const hasNewFile = files[field] !== null;
    const hasExistingFile = selectedEmployee && selectedEmployee[`${field}_filename`] && !isDeleted;
    
    return (
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {maxLength && `(${maxLength} digits)`}
        </label>
        <div className="flex flex-col space-y-2">
          {/* Input field */}
          <div className="flex">
            <input
              type="text"
              name={field}
              value={formData[field] || ''}
              onChange={handleInputChange}
              maxLength={maxLength}
              className={`w-full p-2 border ${formErrors[field] ? 'border-red-500' : 'border-gray-300'} rounded-l-md`}
            />
            <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
              <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
              <input
                type="file"
                name={field}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </label>
          </div>
          
          {/* Validation error */}
          {formErrors[field] && (
            <p className="text-red-500 text-xs">{formErrors[field]}</p>
          )}
          
          {/* New file uploaded */}
          {hasNewFile && (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-700">
                <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                New file: {files[field].name}
              </span>
              <button
                type="button"
                onClick={() => removeNewFile(field)}
                className="text-red-500 hover:text-red-700"
                title="Remove new file"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          
          {/* Existing file */}
          {hasExistingFile && (
            <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
              <span className="text-sm text-blue-700">
                <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                Current: {selectedEmployee[`${field}_filename`]}
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => downloadDocument(selectedEmployee.id, field)}
                  className="text-green-500 hover:text-green-700"
                  title="Download file"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </button>
                <button
                  type="button"
                  onClick={() => openFilePreview(
                    selectedEmployee.id, 
                    field, 
                    selectedEmployee[`${field}_filename`], 
                    selectedEmployee[`${field}_mimetype`]
                  )}
                  className="text-blue-500 hover:text-blue-700"
                  title="Preview file"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                  type="button"
                  onClick={() => markFileForDeletion(field)}
                  className="text-red-500 hover:text-red-700"
                  title="Mark for deletion"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </div>
            </div>
          )}
          
          {/* File marked for deletion */}
          {isDeleted && (
            <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-700">
                <FontAwesomeIcon icon={faTrashCan} className="mr-2" />
                File will be deleted: {selectedEmployee[`${field}_filename`]}
              </span>
              <button
                type="button"
                onClick={() => restoreFileFromDeletion(field)}
                className="text-blue-500 hover:text-blue-700"
                title="Restore file"
              >
                Restore
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Define table columns
  const columns = [
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-3">
          <button
            onClick={() => openForm(row)}
            className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Edit"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button
            onClick={() => {
              setSelectedItemHistory(row);
              setShowHistoryModal(true);
              fetchContractHistory(row.id);
            }}
            className="px-2 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            title="Contract History"
          >
            <FontAwesomeIcon icon={faHistory} />
          </button>
          <button
            onClick={() => deleteEmployee(row.id)}
            className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      ),
      width: '150px',
      ignoreRowClick: true,
    },
    {
        name: 'Contract Status',
        cell: row => {
            const calculateContractStatus = (endDate) => {
                if (!endDate) return { status: 'No Date', color: 'gray' };
                
                try {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const endDateObj = new Date(endDate);
                    endDateObj.setHours(0, 0, 0, 0);
                    
                    const diffTime = endDateObj.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                        return { status: 'Expired', color: 'expired' };
                    } else if (diffDays <= 14) {
                        return { status: `${diffDays} days left`, color: 'red' };
                    } else if (diffDays <= 30) {
                        return { status: `${diffDays} days left`, color: 'yellow' };
                    } else if (diffDays <= 45) {
                        return { status: `${diffDays} days left`, color: 'green' };
                    } else {
                        return { status: 'Active', color: 'green' };
                    }
                } catch (e) {
                    console.error("Error calculating contract status:", e);
                    return { status: 'Error', color: 'gray' };
                }
            };
                            
            const { status, color } = calculateContractStatus(row.kontrak_akhir);
            
            const colorMapping = {
                'expired': 'bg-red-600 text-white',
                'red': 'bg-red-100 text-red-800',
                'yellow': 'bg-yellow-100 text-yellow-800',
                'orange': 'bg-orange-100 text-orange-800',
                'green': 'bg-green-100 text-green-800',
                'gray': 'bg-gray-100 text-gray-800'
            };
            
            return (
              <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${colorMapping[color] || 'bg-gray-100 text-gray-800'}`}>
                  {status}
                  </span>
              </div>
            );
        },
        sortable: true,
        width: '200px',
        },
    { name: 'NIK TAR', selector: row => row.nik_tar || '', sortable: true, width: '100px' },
    { name: 'Name', selector: row => row.nama_karyawan || '', sortable: true, width: '300px' },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: '300px' },
    { name: 'Employee Status', selector: row => row.status_karyawan || '', sortable: true, width: '200px' },
    { name: 'Contract Number', selector: row => row.no_kontrak|| '', sortable: true, width: '250px' },
    {
        name: 'KTP Number',
        cell: row => (
            <div 
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() => row.nik_filename ? 
                openFilePreview(row.id, 'nik', row.nik_filename, row.nik_mimetype) : 
                openDocumentModal(row.id, 'nik', row.nik)
            }
            >
            {row.nik || 'View KTP Number'}
            {row.nik_filename && (
                <div className="flex ml-2">
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'nik');
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Download File"
                >
                    <FontAwesomeIcon icon={faDownload} />
                </button>
                <FontAwesomeIcon 
                    icon={faEye} 
                    className="text-blue-500 hover:text-blue-700" 
                    title="Preview File"
                />
                </div>
            )}
            </div>
        ),
        width: '250px'
        },
        {
        name: 'Family Card',
        cell: row => (
            <div
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() =>
                row.kk_filename
                ? openFilePreview(row.id, 'kk', row.kk_filename, row.kk_mimetype)
                : openDocumentModal(row.id, 'kk', row.kk)
            }
            >
            {row.kk || 'View Family Card'}
            {row.kk_filename && (
                <div className="flex ml-2">
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'kk');
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Download File"
                >
                    <FontAwesomeIcon icon={faDownload} />
                </button>
                <FontAwesomeIcon
                    icon={faEye}
                    className="text-blue-500 hover:text-blue-700"
                    title="Preview File"
                />
                </div>
            )}
            </div>
        ),
        width: '250px'
        },
        {
        name: 'NPWP',
        cell: row => (
            <div
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() =>
                row.npwp_filename
                ? openFilePreview(row.id, 'npwp', row.npwp_filename, row.npwp_mimetype)
                : openDocumentModal(row.id, 'npwp', row.npwp)
            }
            >
            {row.npwp || 'View NPWP'}
            {row.npwp_filename && (
                <div className="flex ml-2">
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'npwp');
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Download File"
                >
                    <FontAwesomeIcon icon={faDownload} />
                </button>
                <FontAwesomeIcon
                    icon={faEye}
                    className="text-blue-500 hover:text-blue-700"
                    title="Preview File"
                />
                </div>
            )}
            </div>
        ),
        width: '250px'
        },
        {
        name: 'BPJS Health',
        cell: row => (
            <div
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() =>
                row.bpjs_filename
                ? openFilePreview(row.id, 'bpjs', row.bpjs_filename, row.bpjs_mimetype)
                : openDocumentModal(row.id, 'bpjs', row.bpjs)
            }
            >
            {row.bpjs || 'View BPJS Health'}
            {row.bpjs_filename && (
                <div className="flex ml-2">
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'bpjs');
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Download File"
                >
                    <FontAwesomeIcon icon={faDownload} />
                </button>
                <FontAwesomeIcon
                    icon={faEye}
                    className="text-blue-500 hover:text-blue-700"
                    title="Preview File"
                />
                </div>
            )}
            </div>
        ),
        width: '250px'
        },
        {
        name: 'BPJS Social Security',
        cell: row => (
            <div
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() =>
                row.kpj_filename
                ? openFilePreview(row.id, 'kpj', row.kpj_filename, row.kpj_mimetype)
                : openDocumentModal(row.id, 'kpj', row.kpj)
            }
            >
            {row.kpj || 'View BPJS Social Security'}
            {row.kpj_filename && (
                <div className="flex ml-2">
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'kpj');
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Download File"
                >
                    <FontAwesomeIcon icon={faDownload} />
                </button>
                <FontAwesomeIcon
                    icon={faEye}
                    className="text-blue-500 hover:text-blue-700"
                    title="Preview File"
                />
                </div>
            )}
            </div>
        ),
        width: '250px'
        },
        {
        name: 'Bank Account Number',
        cell: row => (
            <div
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() =>
                row.norek_filename
                ? openFilePreview(row.id, 'norek', row.norek_filename, row.norek_mimetype)
                : openDocumentModal(row.id, 'norek', row.norek)
            }
            >
            {row.norek ? `${row.norek} (${row.bank || 'No Bank'})` : 'Add Account'}
            {row.norek_filename && (
                <div className="flex ml-2">
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'norek');
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Download File"
                >
                    <FontAwesomeIcon icon={faDownload} />
                </button>
                <FontAwesomeIcon
                    icon={faEye}
                    className="text-blue-500 hover:text-blue-700"
                    title="Preview File"
                />
                </div>
            )}
            </div>
        ),
        width: '250px'
        },
    { name: 'Phone', selector: row => row.no_hp || '', sortable: true, width: '250px' },
    { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: '150px' },
    { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: '150px' },
    { name: 'Bank', selector: row => row.bank || '', sortable: true, width: '250px' },
    { name: 'Marital Status', selector: row => row.status_pernikahan || '', sortable: true, width: '250px' },
    { name: 'Last Education', selector: row => row.pendidikan_terakhir || '', sortable: true, width: '200px' },
    { name: 'Major', selector: row => row.jurusan || '', sortable: true, width: '350px' },
    { name: 'University/School', selector: row => row.universitas_sekolah || '', sortable: true, width: '300px' },
    { name: 'KTP Address', selector: row => row.alamat_rumah || '', sortable: true, width: '1000px' },
  ];
  
  // Table custom styles
  const customStyles = {
    table: {
      style: {
        width: '100%',
        tableLayout: 'auto',
      }
    },
    rows: { 
      style: { 
        minHeight: '60px',
        width: '100%'
      } 
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: '#802600',
        fontWeight: 'bold',
        color: '#FFFFFF',
        whiteSpace: 'normal',
        overflow: 'visible',
        textOverflow: 'clip',
        wordWrap: 'break-word',
      },
      activeSortStyle: {
        color: '#ffdd99',
        '&:focus': {
          outline: 'none',
        },
      },
    },
    cells: { 
      style: { 
        paddingLeft: '16px', 
        paddingRight: '16px',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
      } 
    },
    pagination: {
      style: {
        borderTopStyle: 'none',
        width: '100%',
      },
    },
  };
  
  // Close message notification
  const closeMessage = () => {
    setMessage({ text: '', type: '' });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h1 className="text-2xl text-center text-brown-600">PT TAR Employee</h1>

      <div className="py-6">
        <StatBoxTarComponents 
          onFilterChange={setActiveFilter}
          activeFilter={activeFilter}
        />
      </div>
      
      {/* Notification */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
          <button className="float-right" onClick={closeMessage}>×</button>
        </div>
      )}
      
      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employees..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => openForm()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Employee
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Export to Excel
          </button>
        </div>
      </div>
      
      {/* Employee Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          customStyles={customStyles}
          highlightOnHover
          striped
          responsive
          progressPending={loading}
          progressComponent={
            <div className="flex justify-center items-center p-10">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
          noDataComponent={
            <div className="p-6 text-center">
              <p className="text-gray-500">No employee data available</p>
              <button
                onClick={() => openForm()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Employee
              </button>
            </div>
          }
        />
      </div>
      
      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-screen overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{formMode === 'add' ? 'Add New Employee' : 'Edit Employee'}</h2>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Form Content */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_karyawan"
                      value={formData.nama_karyawan}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      name="jabatan"
                      value={formData.jabatan}
                      onChange={handleInputChange || ''}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Status
                    </label>
                    <input
                      type="text"
                      name="status_karyawan"
                      value={formData.status_karyawan || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={formData.tanggal_lahir || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="jenis_kelamin"
                      value={formData.jenis_kelamin || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marital Status
                    </label>
                    <select
                      name="status_pernikahan"
                      value={formData.status_pernikahan}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Status</option>
                      <option value="TK">TK</option>
                      <option value="TK/0">TK/0</option>
                      <option value="TK/1">TK/1</option>
                      <option value="TK/2">TK/2</option>
                      <option value="TK/3">TK/3</option>
                      <option value="K/0">K/0</option>
                      <option value="K/1">K/1</option>
                      <option value="K/2">K/2</option>
                      <option value="K/3">K/3</option>
                      <option value="K/I/0">K/I/0</option>
                      <option value="K/I/1">K/I/1</option>
                      <option value="K/I/2">K/I/2</option>
                      <option value="K/I/3">K/I/3</option>
                    </select>
                  </div>
                  
                  <div className="form-group md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="alamat_rumah"
                      value={formData.alamat_rumah || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows="2"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="no_hp"
                      value={formData.no_hp || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* Education */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Education Level
                    </label>
                    <select
                      name="pendidikan_terakhir"
                      value={formData.pendidikan_terakhir}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Level</option>
                      <option value="SD">SD (Elementary)</option>
                      <option value="SMP">SMP (Junior High)</option>
                      <option value="SMA/SMK">SMA/SMK (High School)</option>
                      <option value="D1">D1 (Diploma 1)</option>
                      <option value="D2">D2 (Diploma 2)</option>
                      <option value="D3">D3 (Diploma 3)</option>
                      <option value="D4">D4 (Diploma 4)</option>
                      <option value="S1">S1 (Bachelor's)</option>
                      <option value="S2">S2 (Master's)</option>
                      <option value="S3">S3 (Doctorate)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field of Study/Major
                    </label>
                    <input
                      type="text"
                      name="jurusan"
                      value={formData.jurusan || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School/University
                    </label>
                    <input
                      type="text"
                      name="universitas_sekolah"
                      value={formData.universitas_sekolah || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* Employment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Employment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TAR NIK
                    </label>
                    <input
                      type="text"
                      name="nik_tar"
                      value={formData.nik_tar || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Number
                    </label>
                    <input
                      type="text"
                      name="no_kontrak"
                      value={formData.no_kontrak || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Start Date
                    </label>
                    <input
                      type="date"
                      name="kontrak_awal"
                      value={formData.kontrak_awal || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract End Date
                    </label>
                    <input
                      type="date"
                      name="kontrak_akhir"
                      value={formData.kontrak_akhir || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank"
                      value={formData.bank || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      name="norek"
                      value={formData.norek || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* IMPROVED: Documents & IDs with enhanced file management */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Documents & IDs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* NIK */}
                  {renderFileManagement('nik', 'KTP Number', 16)}
                  
                  {/* Family Card */}
                  {renderFileManagement('kk', 'Family Card', 16)}
                  
                  {/* NPWP */}
                  {renderFileManagement('npwp', 'NPWP Number', 16)}
                  
                  {/* BPJS */}
                  {renderFileManagement('bpjs', 'BPJS Health Number', 13)}
                  
                  {/* KPJ */}
                  {renderFileManagement('kpj', 'BPJS Social Security Number', 11)}
                  
                  {/* Bank Account Document */}
                  {renderFileManagement('norek', 'Bank Account Document')}
                  
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitForm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {docModalField === 'bpjs' ? 'BPJS Health Information' :
                 docModalField === 'nik' ? 'KTP Number Information' :
                 docModalField === 'kk' ? 'Family Card Information' :
                 docModalField === 'npwp' ? 'NPWP Number Information' :
                 docModalField === 'kpj' ? 'BPJS Social Security Information' :
                 'Bank Account Information'}
              </h3>
              <button
                onClick={closeDocumentModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Text Input - view-only mode */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {docModalField === 'bpjs' ? 'BPJS Helath Number (13 characters)' :
                   docModalField === 'nik' ? 'KTP Number (16 digits)' :
                   docModalField === 'kk' ? 'Family Card Number (16 digits)' :
                   docModalField === 'npwp' ? 'NPWP Number' :
                   docModalField === 'kpj' ? 'BPJS Social Security Number (11 characters)' :
                   'Account Number'}
                </label>
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                  {docModalValue || 'No data available'}
                </div>
              </div>

              {/* File Info - view-only mode */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document File
                </label>
                {docModalId && (() => {
                  const employee = mcuData.find(emp => emp.id === docModalId);
                  if (employee && employee[`${docModalField}_filename`]) {
                    return (
                      <div className="mt-2">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded mt-1 bg-gray-50">
                          <span className="text-sm text-gray-600">{employee[`${docModalField}_filename`]}</span>
                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => downloadDocument(docModalId, docModalField)}
                              className="ml-2 text-sm text-green-500 hover:text-green-700"
                              title="Download file"
                            >
                              <FontAwesomeIcon icon={faDownload} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openFilePreview(
                                docModalId, 
                                docModalField, 
                                employee[`${docModalField}_filename`], 
                                employee[`${docModalField}_mimetype`]
                              )}
                              className="ml-2 text-sm text-blue-500 hover:text-blue-700"
                              title="Preview file"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 border border-gray-200 rounded bg-gray-50">
                        <span className="text-sm text-gray-500">No file is saved</span>
                      </div>
                    );
                  }
                })()}
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeDocumentModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {previewModal.fieldName} - {previewModal.fileName || 'File Preview'}
              </h3>
              <button
                onClick={() => setPreviewModal({...previewModal, show: false})}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg">
              {previewModal.fileUrl ? (
                <>
                  {previewModal.fileType && previewModal.fileType.startsWith('image/') ? (
                    <img
                      src={previewModal.fileUrl}
                      alt="Document preview"
                      className="max-w-full max-h-[70vh] object-contain mb-4"
                    />
                  ) : previewModal.fileType === 'application/pdf' ? (
                    <iframe
                      src={previewModal.fileUrl}
                      className="w-full h-[70vh] border-0 mb-4"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="p-8 text-center bg-gray-100 w-full mb-4 rounded">
                      <FontAwesomeIcon icon={faFileAlt} className="text-5xl text-gray-400 mb-4" />
                      <p>Preview is not available for this file type</p>
                      <p className="text-sm text-gray-500 mt-2">
                        ({previewModal.fileType || 'Unknown file type'})
                      </p>
                    </div>
                  )}

                  <div className="flex justify-center mt-4">
                    <a
                      href={previewModal.fileUrl}
                      download={previewModal.fileName}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center mr-4"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                      Download File
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-gray-100 w-full rounded">
                  <FontAwesomeIcon icon={faFileAlt} className="text-5xl text-gray-400 mb-4" />
                  <p>Unable to load the file</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Change History Modal */}
      {showHistoryModal && selectedItemHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <FontAwesomeIcon icon={faHistory} className="mr-2 text-blue-500" />
                Contract Change History - {selectedItemHistory.nama_karyawan}
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Employee Name:</p>
                  <p className="font-semibold">{selectedItemHistory.nama_karyawan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position:</p>
                  <p className="font-semibold">{selectedItemHistory.jabatan || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contract End:</p>
                  <p className="font-semibold">{formatDateToDDMMYYYY(selectedItemHistory.kontrak_akhir) || '-'}</p>
                </div>
              </div>
              
              <div className="flex justify-between mb-4">
                <h4 className="text-lg font-medium">Change List</h4>
                <div className="flex space-x-2">
                  {contractHistory.length > 0 && (
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                      onClick={downloadContractHistory}
                    >
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                      Download History
                    </button>
                  )}
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                    onClick={() => fetchContractHistory(selectedItemHistory.id)}
                  >
                    <FontAwesomeIcon icon={faSync} className="mr-2" />
                    Refresh History
                  </button>
                </div>
              </div>
              
              {loadingHistory ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-gray-500">Loading contract change history...</p>
                </div>
              ) : historyError ? (
                <div className="text-center py-4 bg-red-50 rounded">
                  <p className="text-red-500">{historyError}</p>
                </div>
              ) : contractHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No contract change history available</p>
                  <p className="text-gray-400 text-sm mt-1">History will appear when contract data is modified</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Value</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Value</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified By</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractHistory.map((history, index) => {
                        // Determine changes for more compact display
                        const changes = [];
                        
                        // Contract changes
                        if (history.no_kontrak_lama !== history.no_kontrak_baru) {
                          changes.push({
                            field: 'Contract Number',
                            oldValue: history.no_kontrak_lama || '-',
                            newValue: history.no_kontrak_baru || '-'
                          });
                        }
                        
                        if (history.kontrak_awal_lama !== history.kontrak_awal_baru) {
                          changes.push({
                            field: 'Contract Start',
                            oldValue: formatDateToDDMMYYYY(history.kontrak_awal_lama) || '-',
                            newValue: formatDateToDDMMYYYY(history.kontrak_awal_baru) || '-'
                          });
                        }
                        
                        if (history.kontrak_akhir_lama !== history.kontrak_akhir_baru) {
                          changes.push({
                            field: 'Contract End',
                            oldValue: formatDateToDDMMYYYY(history.kontrak_akhir_lama) || '-',
                            newValue: formatDateToDDMMYYYY(history.kontrak_akhir_baru) || '-'
                          });
                        }
                        
                        // If no changes detected
                        if (changes.length === 0) {
                          changes.push({
                            field: 'No changes detected',
                            oldValue: '-',
                            newValue: '-'
                          });
                        }
                        
                        // Create rows for each change
                        return changes.map((change, changeIndex) => (
                          <tr key={`${index}-${changeIndex}`} className={changeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {/* Only show timestamp and user for first change in a group */}
                            {changeIndex === 0 ? (
                              <>
                                <td 
                                  className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                                  rowSpan={changes.length} // Use rowspan for timestamp cell
                                >
                                  {new Date(history.waktu_perubahan).toLocaleString('id-ID')}
                                </td>
                              </>
                            ) : null}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 font-medium">
                              {change.field}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {change.oldValue}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-medium">
                              {change.newValue}
                            </td>
                            {changeIndex === 0 ? (
                              <td 
                                className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                                rowSpan={changes.length} // Use rowspan for modified_by cell
                              >
                                {history.modified_by || 'system'}
                              </td>
                            ) : null}
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TarSection;