import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import StatBoxElnusaComponents from '../../../components/projectcom/StatBoxElnusaComponents';
import FileUploadModal from '../../../components/FileUploadModal';
import SertifikatModal from '../../../components/SerfikatModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTrashCan, faDownload, faFileAlt, faUpload, faEye } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare, faFile, faFileImage, faFileWord, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import EmployeeDataComponents from '../../../components/EmployeeDataComponents';
import DeleteReasonComponents from '../../../components/DeleteReasonComponents';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import axios from 'axios';

// Konstanta API URL
const API_BASE_URL = 'http://localhost:3005/api';
const PROJECT_ID = 'elnusa'; // Project ID tetap untuk Elnusa

const ElnusaEditProjectPage = () => {
  // Format tanggal untuk tampilan dalam format DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Jika sudah dalam format DD/MM/YYYY
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      
      // Jika dalam format YYYY-MM-DD
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Jika dengan timestamp, ambil hanya bagian tanggal
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
     // State for employee data modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState([]);
  const [error, setError] = useState(null);

  // State for document modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalId, setDocModalId] = useState(null);
  const [docModalField, setDocModalField] = useState(null);
  const [docModalValue, setDocModalValue] = useState('');
  const [docModalFile, setDocModalFile] = useState(null);

  // State for file upload modal
  const [fileUploadModal, setFileUploadModal] = useState({
    isOpen: false, userId: null, userName: '', docType: null, existingFile: null
  });

  const [previewModal, setPreviewModal] = useState({
  show: false, fileUrl: null, fileType: null, fieldName: '', fileName: ''
});

const [sertifikatModal, setSertifikatModal] = useState({
  isOpen: false, userId: null, userName: ''
});

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // State for table and UI
  const [perPage, setPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Modal handlers
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const openDocumentModal = (id, field, value) => {
  // Find the employee data
  const employee = backendData.find(emp => emp.id === id);
  
  // If there's a file and user clicked on the non-button part
  if (employee && employee[`${field}_filename`]) {
    // Open file preview
    openFilePreview(
      id,
      field,
      employee[`${field}_filename`],
      employee[`${field}_mimetype`]
    );
  } else {
    // Open view-only modal
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

// Tambahkan fungsi untuk membuka modal sertifikat
const openSertifikatModal = (user) => {
  setSertifikatModal({
    isOpen: true,
    userId: user.id,
    userName: user.nama_karyawan
  });
};

// Tambahkan fungsi untuk menutup modal sertifikat
const closeSertifikatModal = () => {
  setSertifikatModal({
    isOpen: false,
    userId: null,
    userName: ''
  });
};

// Add this function for file previews
const openFilePreview = (id, field, filename, mimetype) => {
  // If no file, don't open preview
  if (!filename) {
    setMessage({
      text: `No file for ${field}`,
      type: 'info'
    });
    return;
  }
  
  const fileUrl = `${API_BASE_URL}/elnusa/users/${id}/download/${field}`;
  
  // Format field names for display
  const fieldDisplayNames = {
    no_ktp: 'KTP Number', 
    no_kk: 'Family Card Number', 
    npwp: 'NPWP Number', 
    no_bpjs_kesehatan: 'BPJS Health',
    no_bpjs_tk: 'BPJS Social Security',
    no_rekening: 'Bank Account Number'
  };
  
  setPreviewModal({
    show: true, fileUrl, fileType: mimetype, fieldName: fieldDisplayNames[field] || field, fileName: filename
  });
};

// Add this function for downloading documents
const downloadDocument = async (id, field) => {
  try {
    setLoading(true);
    setMessage({ text: 'Starting download...', type: 'info' });
    
    // Use axios with responseType 'blob'
    const response = await axios({
      url: `${API_BASE_URL}/elnusa/users/${id}/download/${field}`,
      method: 'GET',
      responseType: 'blob',
      timeout: 30000 // 30 second timeout
    });
    
    // Get content type to determine file type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Get filename from header or create default name based on field
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${field}_document`; // Base name without extension
    
    // Add extension based on content type if not in filename
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

  // Navigation handlers
  const handlePersonalClick = () => {
    navigate('/tambah-user-elnusa', { 
      state: { 
        editMode: false,
        userData: null,
        projectId: PROJECT_ID
      } 
    });
    closeModal();
  };

  const handleMassalClick = () => {
    navigate('/upload-massal-elnusa', { 
      state: { 
        bulkMode: true,
        projectId: PROJECT_ID
      } 
    });
    closeModal();
  };

  // Data fetching function
  const fetchDataFromBackend = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/elnusa/users`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
    
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Log untuk debugging tanggal
          if (response.data.length > 0) {
            const sampleUser = response.data[0];
          }
          setBackendData(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setBackendData(response.data.data);
        } else {
          setError("Data received from server is invalid");
          setBackendData([]);
        }
      } else {
        setError("No data received from server");
        setBackendData([]);
      }
    } catch (err) {
      let errorMessage = "Failed to fetch data from server";
      if (err.response) {
        errorMessage += `: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage += ": No response from server";
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setBackendData([]);
    } finally {
      setLoading(false);
    }
  };

  // File operations
  const uploadFile = async (file, isReplace = false) => {
    if (!file || !fileUploadModal.userId || !fileUploadModal.docType) {
      setMessage({ text: 'Choose file', type: 'error' });
      return;
    }
    
    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ text: 'You cannot upload a file larger than 10 MB', type: 'error' });
      return;
    }
    
    // File type validation
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    if (!allowedMimeTypes.includes(selectedFile.type)) {
      setMessage({ 
        text: 'Unsupported file format. Please use PDF, DOC, DOCX, JPG, or PNG.', 
        type: 'error' 
      });
      return;
    }
    
    // Create FormData to send file
    const formData = new FormData();
    formData.append('file', file);
    
    if (isReplace) {
      formData.append('replace', 'true');
    }
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/elnusa/users/${fileUploadModal.userId}/upload/${fileUploadModal.docType}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      closeFileUploadModal();
      
      setMessage({ 
        text: isReplace ? 
          `${fileUploadModal.docType.toUpperCase()} Successfully changed!` : 
          `${fileUploadModal.docType.toUpperCase()} Successfully uploaded!`, 
        type: 'success' 
      });
      
      fetchDataFromBackend();
    } catch (err) {
      setMessage({ 
        text: `Failed to upload file: ${err.response?.data?.error || err.message}`, 
        type: 'error' 
      });
    }
  };
  
  // Download document
  const downloadFile = async (userId, docType, fileName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/elnusa/users/${userId}/download/${docType}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `${docType}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setMessage({ 
        text: `Failed to download file: ${err.response?.statusText || err.message}`, 
        type: 'error' 
      });
    }
  };

  // CRUD operations
  const deleteUserFromBackend = async (id) => {
    try {
      if (!id) {
        throw new Error('User ID must not be empty');
      }
      
      const response = await axios.delete(`${API_BASE_URL}/elnusa/users/${id}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      fetchDataFromBackend();
      
      return response.data;
    } catch (err) {
      setMessage({ 
        text: `Failed to delete user: ${err.response?.data?.message || err.message}`, 
        type: 'error' 
      });
      throw err;
    }
  };

  const setUserInactive = async (id, reason) => {
    try {
      if (!id) {
        throw new Error('User ID must not be empty');
      }
      
      const response = await axios.put(`${API_BASE_URL}/elnusa/users/${id}/na`, 
        { sebab_na: reason },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      fetchDataFromBackend();
      
      setMessage({ text: `User status has been changed to Non-Active!`, type: 'success' });
      
      return response.data;
    } catch (err) {
      setMessage({ 
        text: `Failed to change status: ${err.response?.data?.message || err.message}`, 
        type: 'error' 
      });
      throw err;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataFromBackend();
  }, []);

  // Handle navigation state
  useEffect(() => {
    if (location.state) {
      if (location.state.addedUser && location.state.newUser) { 
        const newUserData = location.state.newUser;
        setMessage({ 
          text: `User data for ${newUserData.nama_karyawan || 'new user'} has been successfully added!`, 
          type: 'success' 
        });
        window.history.replaceState({}, document.title); 
        fetchDataFromBackend();
      } else if (location.state.editedUser && location.state.updatedUser) {
        const updatedUserData = location.state.updatedUser;
      
        setMessage({ 
          text: `User data for ${updatedUserData.nama_karyawan || 'the edited user'} has been successfully updated!`, 
          type: 'success' 
        });
        window.history.replaceState({}, document.title);
        fetchDataFromBackend();
      }
    }
  }, [location.state]);

  // Format tanggal hanya untuk tampilan, tidak mengubah nilai asli
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      // Hanya untuk tampilan, tidak mengubah data asli
      const dateParts = dateString.split('T')[0].split('-');
      if (dateParts.length !== 3) return dateString;
      
      return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Format DD/MM/YYYY
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Kembalikan string asli jika ada error
    }
  };

  // Utility functions
  const getDaysDifference = (endDate) => {
    if (!endDate) return 0;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0);
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  };

  // Tambahkan juga fungsi untuk menampilkan indikator kontrak yang sedang diproses
  const getStatusColor = (days) => {
    if (days < 0) return 'bg-red-500 text-white'; // Kontrak berakhir
    if (days <= 14) return 'bg-red-200'; // Kurang dari 2 minggu
    if (days <= 30) return 'bg-yellow-200'; // Kurang dari 1 bulan
    if (days <= 45) return 'bg-green-200'; // Kurang dari 6 minggu
    return 'bg-gray-100'; // Default
  };

  // Fungsi untuk menampilkan pesan sisa kontrak yang lebih informatif
  const getStatusText = (days) => {
    if (days < 0) return `EOC ${Math.abs(days)} days ago`;
    if (days === 0) return "EOC today";
    return `${days} days remaining`;
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return faFile;
    if (fileType.includes('pdf')) return faFilePdf;
    if (fileType.includes('image')) return faFileImage;
    if (fileType.includes('word') || fileType.includes('document')) return faFileWord;
    if (fileType.includes('excel') || fileType.includes('sheet')) return faFileExcel;
    return faFile;
  };

  const getDisplayFileName = (fileName) => fileName ? 
    fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName : 'No File';

  // Filter data based on contract status
  const filterByStatus = (data, filterType) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.filter(employee => {
      const days = getDaysDifference(employee.kontrak_akhir);
      
      switch (filterType) {
        case 'all':
        case 'total':
          return days >= 0;
        case 'duedate':
          return days >= 0 && days <= 14;
        case 'call2':
          return days > 14 && days <= 30;
        case 'call1':
          return days > 30 && days <= 45;
        case 'nonactive':
          return days < 0;
        default:
          return true;
      }
    });
  };

  // Event handlers
  const handleDeleteConfirm = (reason) => {
    if (!userToDelete || !userToDelete.id) {
      setMessage({ text: 'Invalid user data', type: 'error' });
      closeDeleteModal();
      return;
    }
    
    // Tampilkan loading state
    setMessage({ text: `Processing NonActive for ${userToDelete.nama_karyawan}...`, type: 'info' });
    setIsSubmitting(true); // Tambahkan state isSubmitting jika belum ada

    // Validasi parameter dan status data
    if (!reason || reason.trim() === '') {
      setMessage({ text: `NonActive reason must not be empty`, type: 'error' });
      setIsSubmitting(false);
      return;
    }
    
    // Tambahkan timeout handling untuk mencegah request tergantung terlalu lama
  const timeoutId = setTimeout(() => {
    // Hanya jalankan jika request masih berjalan (isSubmitting masih true)
    if (isSubmitting) {
      setMessage({ text: 'The request is taking too long. Please try again.', type: 'warning' });
      setIsSubmitting(false);
    }
  }, 15000); // 15 detik timeout
  
  // Panggil API dengan error handling yang lebih baik
  axios.put(
    `${API_BASE_URL}/elnusa/users/${userToDelete.id}/na`, 
    { 
      sebab_na: reason,
      // Tambahkan timestamp untuk tracking
      timestamp: new Date().toISOString()
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Tambahkan timeout untuk request
      timeout: 10000 // 10 detik
    }
  )
  .then(response => {
    // Bersihkan timeout
    clearTimeout(timeoutId);
    
    // Validasi response
    if (!response.data || response.status !== 200) {
      throw new Error('Invalid API response');
    }
    
    // Tampilkan pesan sukses
    setMessage({ 
      text: `User ${userToDelete.nama_karyawan} has been successfully set to NonActive!`, 
      type: 'success' 
    });    
    
    // Refresh data setelah sukses
    fetchDataFromBackend();
    
    // Reset state
    setIsSubmitting(false);
    closeDeleteModal();
  })
  .catch(err => {
    // Bersihkan timeout
    clearTimeout(timeoutId);
    
    console.error("Error changing status:", err);
    
    // Buat pesan error yang user-friendly
    let errorMsg = 'Failed to change status: ';
    
    // Tangani berbagai skenario error
    if (err.response) {
      // Error dengan response dari server
      const status = err.response.status;
      
      switch (status) {
        case 400:
          errorMsg += err.response.data?.message || 'Invalid data';
          break;
        case 404:
          errorMsg += 'Employee not found';
          break;
        case 500:
          errorMsg += 'A server error occurred. ';
          
          // Tambahkan opsi retry untuk error server
          errorMsg += 'Would you like to try again?';
          
          setMessage({ text: errorMsg, type: 'error' });
          
          // Tampilkan konfirmasi untuk retry
          if (window.confirm(errorMsg)) {
            // Tunggu sebentar sebelum retry
            setTimeout(() => handleDeleteConfirm(reason), 1500);
            return;
          }
          break;
        default:
          errorMsg += err.response.data?.message || `Error (${status})`;
      }
    } else if (err.request) {
      // Request dibuat tapi tidak ada response
      errorMsg += 'The server did not respond. Please check your connection and try again.';
    } else {
      // Error lainnya
      errorMsg += err.message;
    }
    
    // Tampilkan pesan error
    setMessage({ text: errorMsg, type: 'error' });
    
    // Reset state
    setIsSubmitting(false);
    closeDeleteModal();
  });
};

  const handleNonActiveConfirm = (id, reason) => {
    setUserInactive(id, reason)
      .then(() => {
        setMessage({ text: `User status has been changed to inactive!`, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      })
      .catch(err => {
        setMessage({ text: `Failed to change status: ${err.message}`, type: 'error' });
      });
  };

  const handleEdit = (user) => {
    if (!user || !user.id) {
      setMessage({ text: 'Invalid user data', type: 'error' });
      return;
    }
  
    // Tanpa normalisasi tanggal di sini!
    navigate('/tambah-user-elnusa', { 
      state: { 
        editMode: true,
        userData: {...user}, // Kirim salinan data asli
        projectId: PROJECT_ID
      } 
    });
  };
  
  const handleRowSelected = (state) => setSelectedRows(state.selectedRows);
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  // Export data to Excel
  const exportToExcel = (dataToExport, fileName) => {
    if (!dataToExport || dataToExport.length === 0) {
      setMessage({ text: 'No data to export', type: 'error' });
      return;
    }
  
    try {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      setMessage({ text: `Data has been successfully exported to ${fileName}.xlsx`, type: 'success' });
    } catch (error) {
      setMessage({ text: `Failed to export: ${error.message}`, type: 'error' });
    }
  };
  
  const handleExportAllData = () => {
    if (!backendData || backendData.length === 0) {
      setMessage({ text: 'No data to export', type: 'error' });
      return;
    }
    exportToExcel(backendData, 'all_employee_data_elnusa');
  };
  
  const handleExportSelectedData = () => {
    if (!selectedRows || selectedRows.length === 0) {
      setMessage({ text: 'Please select at least one row of data to export', type: 'error' });
      return;
    }
    exportToExcel(selectedRows, 'selected_employee_data');
  };  

  const handleFilter = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    setSearchTerm('');
  };

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!backendData || !Array.isArray(backendData)) return [];
    
    const statusFiltered = filterByStatus(backendData, activeFilter);
    
    return statusFiltered.filter(row => {
      if (!row) return false;
      if (typeof row !== 'object') return false;
      
      return Object.values(row).some(value => 
        value !== null && 
        value !== undefined &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [backendData, searchTerm, activeFilter]);

  // DataTable columns definition
  const columns = [
    { 
      name: 'Action', 
      cell: row => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1">
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button onClick={() => openDeleteModal(row)} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1" title="Nonaktifkan Karyawan">
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      ), 
      width: "110px",
      ignoreRowClick: true,
      $allowOverflow: true,
      $button: true,
    },
    { 
      name: 'Status', 
      cell: row => {
        const daysRemaining = getDaysDifference(row.kontrak_akhir);
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`} >
            {daysRemaining} days Remaining
          </div>
        );
      }, 
      sortable: true, 
      width: "200px" 
    },
    { name: 'No Contract', selector: row => row.no_kontrak || '', sortable: true, width: "300px"},
    { name: 'Employee Name', selector: row => row.nama_karyawan || '', sortable: true, width: "450px" },
    { name: 'WBS/CCTR', selector: row => row.wbs_cctr || '', sortable: true, width: "250px" },
    { name: 'Vendor ID', selector: row => row.nik_vendor || '', sortable: true, width: "250px" },
    { name: 'Elnusa ID', selector: row => row.nik_elnusa || '', sortable: true, width: "250px" },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "250px" },
    { name: 'Unit', selector: row => row.unit || '', sortable: true, width: "250px" },
    { name: 'Project', selector: row => row.proyek || '', sortable: true, width: "250px" },
    { name: 'User Name', selector: row => row.user_name || '', sortable: true, width: "250px" },
    { name: 'Reception Location', selector: row => row.lokasi_penerimaan || '', sortable: true, width: "200px" },
    { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal)},
    { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir)},
    { name: 'Temp Unit', selector: row => row.unit_temp || '', sortable: true, width: "250px" },
    { name: 'Date of Birth', selector: row => row.tanggal_lahir || '', sortable: true, width: "180px", cell: row => formatDateToDDMMYYYY(row.tanggal_lahir)},
    { name: 'Gender', selector: row => row.jenis_kelamin || '', sortable: true, width: "200px" },
    { name: 'Religion', selector: row => row.agama || '', sortable: true, width: "200px" },
    { name: 'KTP Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_ktp_filename ? 
            openFilePreview(row.id, 'no_ktp', row.no_ktp_filename, row.no_ktp_mimetype) : 
            openDocumentModal(row.id, 'no_ktp', row.no_ktp)
            }
        >
          {row.no_ktp || 'View KTP'}
          {row.no_ktp_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_ktp');
                }}
                className="text-green-500 hover:text-green-700 mr-2"
                title="Download File"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePreview(row.id, 'no_ktp', row.no_ktp_filename, row.no_ktp_mimetype);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Preview File"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          )}
        </div>
      ),
      width: '250px'
    },
    { name: 'Family Card Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_kk_filename ? 
            openFilePreview(row.id, 'no_kk', row.no_kk_filename, row.no_kk_mimetype) : 
            openDocumentModal(row.id, 'no_kk', row.no_kk)
          }
        >
          {row.no_kk || 'View Family Card'}
          {row.no_kk_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_kk');
                }}
                className="text-green-500 hover:text-green-700 mr-2"
                title="Download File"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePreview(row.id, 'no_kk', row.no_kk_filename, row.no_kk_mimetype);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Preview File"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          )}
        </div>
      ),
      width: '250px'
    },
    { name: 'BPJS Health',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_bpjs_kesehatan_filename ? 
            openFilePreview(row.id, 'no_bpjs_kesehatan', row.no_bpjs_kesehatan_filename, row.no_bpjs_kesehatan_mimetype) : 
            openDocumentModal(row.id, 'no_bpjs_kesehatan', row.no_bpjs_kesehatan)
          }
        >
          {row.no_bpjs_kesehatan || 'View BPJS Health'}
          {row.no_bpjs_kesehatan_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_bpjs_kesehatan');
                }}
                className="text-green-500 hover:text-green-700 mr-2"
                title="Download File"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePreview(row.id, 'no_bpjs_kesehatan', row.no_bpjs_kesehatan_filename, row.no_bpjs_kesehatan_mimetype);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Preview File"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          )}
        </div>
      ),
      width: '250px'
    },
    { name: 'BPJS Health Details', selector: row => row.keterangan_bpjs_kesehatan || '', sortable: true, width: "550px"},
    { name: 'BPJS Social Security',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_bpjs_tk_filename ? 
            openFilePreview(row.id, 'no_bpjs_tk', row.no_bpjs_tk_filename, row.no_bpjs_tk_mimetype) : 
            openDocumentModal(row.id, 'no_bpjs_tk', row.no_bpjs_tk)
          }
        >
          {row.no_bpjs_tk || 'View BPJS Social Security'}
          {row.no_bpjs_tk_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_bpjs_tk');
                }}
                className="text-green-500 hover:text-green-700 mr-2"
                title="Download File"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePreview(row.id, 'no_bpjs_tk', row.no_bpjs_tk_filename, row.no_bpjs_tk_mimetype);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Preview File"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          )}
        </div>
      ),
      width: '250px'
    },
    { name: 'BPJS Social Security Details', selector: row => row.keterangan_bpjs_tk || '', sortable: true, width: "550px" },
    { name: 'Insurance Benefits', selector: row => row.hak_asuransi || '', sortable: true, width: "180px" },
    { name: 'Other Insurance', selector: row => row.asuransi_lainnya || '', sortable: true, width: "300px" },
    { name: 'NPWP Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.npwp_filename ? 
            openFilePreview(row.id, 'npwp', row.npwp_filename, row.npwp_mimetype) : 
            openDocumentModal(row.id, 'npwp', row.npwp)
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePreview(row.id, 'npwp', row.npwp_filename, row.npwp_mimetype);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Preview File"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          )}
        </div>
      ),
      width: '250px'
    },
    { name: 'Domicile Address', selector: row => row.alamat_lengkap_domisili || '', sortable: true, width: "800px" },
    { name: 'Marital Status', selector: row => row.status_perkawinan || '', sortable: true, width: "150px" },
    { name: 'HSE Status', selector: row => row.hse || '', sortable: true, width: "150px" },
    { name: 'Certificate', 
      cell: row => (
        <button
          onClick={() => openSertifikatModal(row)}
          className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-1"
          title="View Certificate"
        >
          <FontAwesomeIcon icon={faFileAlt} />
          <span>Certificate</span>
        </button>
      ),
      ignoreRowClick: true,
      $allowOverflow: true,
      $button: true,
      width: "150px"
    },
    { name: 'Last Education', selector: row => row.pendidikan_terakhir || '', sortable: true, width: "150px" },
    { name: 'CV', selector: row => row.cv || '', sortable: true, width: "150px" },
    { name: 'Major', selector: row => row.jurusan || '', sortable: true, width: "150px" },
    { name: 'Name of Educational Institution', selector: row => row.nama_instansi_pendidikan || '', sortable: true, width: "350px" },
    { name: 'Year of Entry', selector: row => row.tahun_masuk || '', sortable: true, width: "200px" },
    { name: 'Year of Exit', selector: row => row.tahun_keluar || '', sortable: true, width: "200px" },
    { name: 'Email', selector: row => row.alamat_email || '', sortable: true, width: "250px" },
    { name: 'Phone Number', selector: row => row.nomor_telepon || '', sortable: true, width: "250px" },
    { name: 'Emergency Phone Number', selector: row => row.nomor_telepon_darurat || '', sortable: true, width: "250px" },
    { name: 'Emergency Contact Name', selector: row => row.nama_telepon_darurat || '', sortable: true, width: "250px" },
    { name: 'Bank Account Name', selector: row => row.nama_pemilik_buku_tabungan || '', sortable: true, width: "250px" },
    { name: 'Bank Account',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_rekening_filename ? 
            openFilePreview(row.id, 'no_rekening', row.no_rekening_filename, row.no_rekening_mimetype) : 
            openDocumentModal(row.id, 'no_rekening', row.no_rekening)
          }
        >
          {row.no_rekening ? `${row.no_rekening} (${row.bank_penerbit || 'No Bank'})` : 'View Bank Account'}
          {row.no_rekening_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_rekening');
                }}
                className="text-green-500 hover:text-green-700 mr-2"
                title="Download File"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePreview(row.id, 'no_rekening', row.no_rekening_filename, row.no_rekening_mimetype);
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Preview File"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
          )}
        </div>
      ),
      width: '250px'
    },
    { name: 'Bank Name', selector: row => row.bank_penerbit || '', sortable: true, width: "250px" },
    { name: 'Honorarium', selector: row => row.honorarium || '', sortable: true, width: "250px" },
    { name: 'Basic Salary', selector: row => row.gaji_pokok || '', sortable: true, width: "150px", cell: row => row.gaji_pokok ? `Rp ${parseFloat(row.gaji_pokok).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Updated Salary', selector: row => row.gaji_terupdate || '', sortable: true, width: "150px", cell: row => row.gaji_terupdate ? `Rp ${parseFloat(row.gaji_terupdate).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Variable Allowance', selector: row => row.t_variabel || '', sortable: true, width: "150px", cell: row => row.t_variabel ? `Rp ${parseFloat(row.t_variabel).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Meal Allowance', selector: row => row.t_makan || '', sortable: true, width: "150px", cell: row => row.t_makan ? `Rp ${parseFloat(row.t_makan).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Transportation Allowance', selector: row => row.t_transport || '', sortable: true, width: "150px", cell: row => row.t_transport ? `Rp ${parseFloat(row.t_transport).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Phone Credit Allowance', selector: row => row.t_pulsa || '', sortable: true, width: "150px", cell: row => row.t_pulsa ? `Rp ${parseFloat(row.t_pulsa).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Specialist Allowance', selector: row => row.t_specialis || '', sortable: true, width: "150px", cell: row => row.t_specialis ? `Rp ${parseFloat(row.t_specialis).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Field Allowance', selector: row => row.t_lapangan || '', sortable: true, width: "150px", cell: row => row.t_lapangan ? `Rp ${parseFloat(row.t_lapangan).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'THP', selector: row => row.thp || '', sortable: true, width: "150px", cell: row => row.thp ? `Rp ${parseFloat(row.thp).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Automatic Overtime', selector: row => row.lemburan_otomatis || '', sortable: true, width: "180px", cell: row => row.lemburan_otomatis ? `Rp ${parseFloat(row.lemburan_otomatis).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Position Allowance', selector: row => row.t_posisi || '', sortable: true, width: "150px", cell: row => row.t_posisi ? `Rp ${parseFloat(row.t_posisi).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Offshore Allowance', selector: row => row.t_offshore || '', sortable: true, width: "150px", cell: row => row.t_offshore ? `Rp ${parseFloat(row.t_offshore).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Daily Field Allowance', selector: row => row.t_lapangan_perhari || '', sortable: true, width: "200px", cell: row => row.t_lapangan_perhari ? `Rp ${parseFloat(row.t_lapangan_perhari).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Onshore Allowance', selector: row => row.t_onshore || '', sortable: true, width: "150px", cell: row => row.t_onshore ? `Rp ${parseFloat(row.t_onshore).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Onshore Expert Allowance', selector: row => row.t_onshore_eksp || '', sortable: true, width: "180px", cell: row => row.t_onshore_eksp ? `Rp ${parseFloat(row.t_onshore_eksp).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Warehouse Office Allowance', selector: row => row.t_warehouse_office || '', sortable: true, width: "200px", cell: row => row.t_warehouse_office ? `Rp ${parseFloat(row.t_warehouse_office).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Project Allowance', selector: row => row.t_proyek || '', sortable: true, width: "150px", cell: row => row.t_proyek ? `Rp ${parseFloat(row.t_proyek).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Allowance Quarantine', selector: row => row.t_karantina || '', sortable: true, width: "150px", cell: row => row.t_karantina ? `Rp ${parseFloat(row.t_karantina).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Overtime Allowance', selector: row => row.tunjangan_lembur || '', sortable: true, width: "180px", cell: row => row.tunjangan_lembur ? `Rp ${parseFloat(row.tunjangan_lembur).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Supervisor Allowance', selector: row => row.t_supervisor || '', sortable: true, width: "150px", cell: row => row.t_supervisor ? `Rp ${parseFloat(row.t_supervisor).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Employee Status', selector: row => row.status_karyawan || '', sortable: true, width: "180px" }
  ];

  const customStyles = {
    rows: { style:{ minHeight:'60px' }, },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: '#802600',
        fontWeight: 'bold',
        color: '#FFFFFF'
      },
    },
    cells: { style: { paddingLeft: '16px', paddingRight: '16px' } }
  };

  return (
    <div className='bg-(--background-tar-color)'> 
        <div className="flex">
            <div className='h-screen fixed left-0 top-0'>
              {/* Slidebar = Aside*/}
            <AsideComponents />
            </div>
        
        {/* Konten Utama (Header, Main, Footer) */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
        {/* Header */}
        <div className='w-fill h-hug py-3'>
        <HeaderComponents />
        </div>
        <Link to='/project'>
        <ButtonComponents variant="back">&lt; Back</ButtonComponents>
        </Link>
        

        {/* Main Content */}
        <main className="flex-1">
            {/* Stat Box */}
          <div className='flex-1 flex flex-col text-center overflow-y-auto px-6 py-3'>
          <StatBoxElnusaComponents onFilterChange={handleFilterChange} activeFilter={activeFilter}/>
          </div>

          {/* Tombol untuk debugging - sembunyikan di production */}
          <div className="mb-2">
          </div>

          {message.text && (
                <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                    <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
                </div>
            )}

          {/* Table Section */}
        <div className="bg-white dshadow rounded-lg p-6">
          <div className='flex justify-between items-center mb-4'>
                  {/* Pencarian */}
                <div className='relative w-full max-w-lg'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center'>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className='text-gray-400'/>
                  </span>
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={handleFilter} 
                    placeholder="Search for a Name..." 
                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                    leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-lg' 
                  />
                </div>

                 {/* Action Button */}
                <div className='flex justify-end gap-2 mb-6'>
                  {/* Employee Data Button */}
                  <ButtonComponents 
                    variant='addempdata'
                    onClick={openModal}
                  >
                  Add Employed Data
                  </ButtonComponents>
                </div>
              </div>
              
          {/* DataTable */}
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Loading data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-red-50 rounded">
              <p className="text-red-500">{error}</p>
            </div>
          ) : !backendData || backendData.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded">
              <p className="text-gray-500 mb-4">No data available.</p>
              <ButtonComponents 
                variant='primary'
                onClick={() => navigate('/add-user-elnusa')}
              >
                Add New User
              </ButtonComponents>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded">
              <p className="text-gray-500">No data matching the search "{searchTerm}".</p>
            </div>
          ) : (
                <DataTable 
                  columns={columns}
                  data={filteredData}
                  selectableRows
                  onSelectedRowsChange={handleRowSelected}
                  fixedHeader
                  pagination
                  paginationPerPage={perPage}
                  paginationRowsPerPageOptions={[5, 10, 25, 50]}
                  customStyles={customStyles}
                  highlightOnHover
                  striped
                  pointerOnHover
                  responsive
                  noDataComponent={
                    <div className="p-4 text-center text-gray-500">
                      No data matching the filter
                    </div>
                  }
                />
              )}
            </div>
            
            <br />
            
            {filteredData && filteredData.length > 0 && (
              <div className='flex justify-end gap-2 mb-6'>
                {/* Export Buttons */}
                <div className='flex justify-end gap-2 my-4'>
                  <ButtonComponents 
                    variant='secondary' 
                    onClick={handleExportSelectedData} 
                    disabled={!selectedRows || selectedRows.length === 0}
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="mr-2" /> 
                    Export Selected ({selectedRows ? selectedRows.length : 0})
                  </ButtonComponents>
                  <ButtonComponents 
                    variant='secondary' 
                    onClick={handleExportAllData}
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="mr-2" /> 
                    Export All ({filteredData.length})
                  </ButtonComponents>
                </div>
              </div>
            )}

            
          </main>
          
          {/* Footer*/}
          <FooterComponents/>
        </div>
      </div>

      {/* Modal untuk memilih tipe input data */}
      {isModalOpen && (
        <EmployeeDataComponents
          isOpen={isModalOpen}
          onClose={closeModal}
          onPersonalClick={handlePersonalClick}
          onMassalClick={handleMassalClick}
        />
      )}
      
      {/* Modal konfirmasi hapus */}
      {isDeleteModalOpen && (
        <DeleteReasonComponents
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          userName={userToDelete?.nama_karyawan || ''}
        />
      )}

      {fileUploadModal.isOpen && (
        <FileUploadModal
          isOpen={fileUploadModal.isOpen}
          onClose={closeFileUploadModal}
          onUpload={uploadFile}
          userId={fileUploadModal.userId}
          userName={fileUploadModal.userName}
          docType={fileUploadModal.docType}
          existingFile={fileUploadModal.existingFile}
          onDownload={() => {
            if (fileUploadModal.existingFile) {
              downloadFile(
                fileUploadModal.userId,
                fileUploadModal.docType,
                fileUploadModal.existingFile.name
              );
            }
          }}
        />
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

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {docModalField === 'no_bpjs_kesehatan' ? 'BPJS Health' :
                docModalField === 'no_ktp' ? 'KTP Number' :
                docModalField === 'no_kk' ? 'Family Card Number' :
                docModalField === 'npwp' ? 'NPWP Number' :
                docModalField === 'no_bpjs_tk' ? 'BPJS Social Security' :
                docModalField === 'no_rekening' ? 'Bank Account Number' :
                'Document Information'}
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
                  {docModalField === 'no_bpjs_kesehatan' ? 'BPJS Health' :
                  docModalField === 'no_ktp' ? 'KTP Number' :
                  docModalField === 'no_kk' ? 'Family Card Number' :
                  docModalField === 'npwp' ? 'NPWP Number' :
                  docModalField === 'no_bpjs_tk' ? 'BPJS Social Security' :
                  docModalField === 'no_rekening' ? 'Bank Account Number' :
                  'Document Number'}
                </label>
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                  {docModalValue || 'No data available'}
                </div>
              </div>

              {/* File Information - view-only mode */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document File
                </label>
                {docModalId && (() => {
                  const employee = backendData.find(emp => emp.id === docModalId);
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
                {/* <button
                  onClick={() => openFileUploadModal(
                    docModalId,
                    backendData.find(emp => emp.id === docModalId)?.nama_karyawan || '',
                    docModalField,
                    backendData.find(emp => emp.id === docModalId)?.[`${docModalField}_filename`] || null
                  )}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Upload File
                </button> */}
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

      {/* Sertifikat Modal */}
      {sertifikatModal.isOpen && (
        <SertifikatModal
          isOpen={sertifikatModal.isOpen}
          onClose={closeSertifikatModal}
          userId={sertifikatModal.userId}
          userName={sertifikatModal.userName}
          viewOnly={true} // Hanya mode lihat di halaman Edit
          apiPrefix="elnusa"
        />
      )}

    </div>
  );
};

export default ElnusaEditProjectPage
