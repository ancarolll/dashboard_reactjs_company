import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import FileUploadModal from '../../../components/FileUploadModal';
import SertifikatModal from '../../../components/SerfikatModal';
import StatBoxElnusaComponents from '../../../components/projectcom/StatBoxElnusaComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faFileAlt, faTrashCan, faUpload, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import { faFile, faFileImage, faFileWord, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';


const ElnusaViewProjectPage = () => {
  // State untuk mengatur jumlah baris per halaman
  const [perPage, setPerPage] = useState(10);
  const location = useLocation();
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('totemployes');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileUploadModal, setFileUploadModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    docType: null,
    existingFile: null
  });
  const [sertifikatModal, setSertifikatModal] = useState({
    isOpen: false, userId: null, userName: ''
  });
  const [previewModal, setPreviewModal] = useState({
  show: false,
  fileUrl: null,
  fileType: null, 
  fieldName: '',
  fileName: ''
});

// State untuk document modal
const [showDocModal, setShowDocModal] = useState(false);
const [docModalId, setDocModalId] = useState(null);
const [docModalField, setDocModalField] = useState(null);
const [docModalValue, setDocModalValue] = useState('');
const [docModalFile, setDocModalFile] = useState(null);


  // Function untuk menghitung hari yang tersisa
  const getDaysDifference = (endDate) => {
    if (!endDate) return 0;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days:", e);
      return 0;
    }
  };

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
    no_rekening: 'Bank Account'
  };
  
  setPreviewModal({
    show: true, fileUrl, fileType: mimetype, fieldName: fieldDisplayNames[field] || field, fileName: filename
  });
};

  const openDocumentModal = (id, field, value) => {
  // Cari data karyawan - ganti backendData dengan users
  const employee = users.find(emp => emp.id === id);
  
  // Sisa fungsi tetap sama
  if (employee && employee[`${field}_filename`]) {
    openFilePreview(
      id,
      field,
      employee[`${field}_filename`],
      employee[`${field}_mimetype`]
    );
  } else {
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

  // File upload modal handlers (yang akan digunakan hanya untuk melihat/download file)
  const openFileUploadModal = (userId, userName, docType, existingFileName = null, existingFilePath = null) => {
    const existingFile = existingFileName ? 
      { 
        name: existingFileName,
        path: existingFilePath 
      } : null;
    
    setFileUploadModal({
      isOpen: true,
      userId,
      userName,
      docType,
      existingFile
    });
  };
  
  const closeFileUploadModal = () => {
    setFileUploadModal({
      isOpen: false,
      userId: null,
      userName: '',
      docType: null,
      existingFile: null
    });
  };

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

  // File operations
  const uploadFile = async (file, isReplace = false) => {
    if (!file || !fileUploadModal.userId || !fileUploadModal.docType) {
      setMessage({ text: 'Choose File', type: 'error' });
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

  // Fungsi untuk download file
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

  // Fungsi untuk download dokumen
const downloadDocument = async (id, docType) => {
  try {
    setLoading(true);
    setMessage({ text: 'Starting download...', type: 'info' });
    
    // Use axios with responseType 'blob'
    const response = await axios({
      url: `${API_BASE_URL}/elnusa/users/${id}/download/${docType}`,
      method: 'GET',
      responseType: 'blob',
      timeout: 30000 // 30 second timeout
    });
    
    // Get content type to determine file type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Get filename from header or create default name based on field
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${docType}_document`; // Base name without extension
    
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

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/elnusa/users`, {
          headers: {
            'Accept': 'application/json'
          },
          timeout: 10000
        });

      // Untuk debugging kolom file
      if (response.data && response.data.length > 0) {
        const fileFields = ['cv_filename', 'ijazah_filename', 'sertifikat_filename', 'pkwt_filename'];
        const fileData = response.data
          .filter(item => fileFields.some(field => item[field])) // Filter hanya yang memiliki file
          .map(item => ({
            id: item.id,
            nama: item.nama_karyawan,
            cv: item.cv_filename,
            ijazah: item.ijazah_filename,
            sertifikat: item.sertifikat_filename,
            pkwt: item.pkwt_filename
          }));
        
      }
        
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          // Handle jika response ada dalam property data
          setUsers(response.data.data);
        } else {
          setMessage({ 
            text: "The received data format is invalid",
            type: 'error' 
          });
          setUsers([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setMessage({ 
          text: `Failed to fetch data: ${err.message}`, 
          type: 'error' 
        });
        
        // Set users ke array kosong untuk menghindari error
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

   // Function untuk menentukan warna status
   const getStatusColor = (days) => {
    if (days < 0) return 'bg-red-500 text-white'; // Kontrak berakhir
    if (days <= 14) return 'bg-red-200';
    if (days <= 30) return 'bg-yellow-200';
    if (days <= 45) return 'bg-green-200';
    return 'bg-gray-100'; // Default
  };

  // Fungsi untuk menampilkan pesan sisa kontrak yang lebih informatif
  const getStatusText = (days) => {
    if (days < 0) return `EOC ${Math.abs(days)} days ago`;
    if (days === 0) return "EOC today";
    return `${days} days remaining`;
  };

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

  // Fungsi untuk filterisasi berdasarkan status
  const filterUsersByStatus = (users, filterType) => {
    if (!users || !Array.isArray(users)) {
      return [];
    }
    
    return users.filter(user => {
      if (!user) return false;
      
      // Hitung hari tersisa
      const days = getDaysDifference(user.kontrak_akhir);
      
      // Filter berdasarkan filterType
      switch (filterType) {
        case 'all':
        case 'total':
        case 'totemployes':
          return days >= 0;
        case 'duedate':
          return days >= 0 && days <= 14;
        case 'call2':
          return days > 14 && days <= 30;
        case 'call1':
          return days > 30 && days <= 45;
        default:
          return days >= 0; // Default menampilkan semua user aktif
      }
    });
  };

  // Tambahkan fungsi untuk handle perubahan filter dari StatBox
  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    // Logika filter data Anda disini
  };


  // Fungsi untuk mendapatkan ikon yang sesuai berdasarkan tipe file
  const getFileIcon = (fileType) => {
    if (!fileType) return faFile;
    if (fileType.includes('pdf')) return faFilePdf;
    if (fileType.includes('image')) return faFileImage;
    if (fileType.includes('word') || fileType.includes('document')) return faFileWord;
    if (fileType.includes('excel') || fileType.includes('sheet')) return faFileExcel;
    return faFileAlt; // Default file icon
  };

  // Fungsi untuk mendapatkan nama tampilan file (jika terlalu panjang)
  const getDisplayFileName = (fileName) => fileName ? 
  fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName : 'No file';

  // Filter records berdasarkan search term
  const handleFilter = (e) => {
    setSearchTerm(e.target.value);
  };

  // Definisikan filteredRecords menggunakan useMemo
  const filteredRecords = React.useMemo(() => {
    if (!users) {
      return [];
    }
  
    // Filter berdasarkan status dulu
    const statusFiltered = filterUsersByStatus(users, activeFilter);
    // Log jumlah data terfilter
  
    // Filter berdasarkan search term dengan perbaikan pencarian
    const result = statusFiltered.filter(row => {
      // Cek apakah row valid
      if (!row || typeof row !== 'object') {
        return false;
      }
      
      // Perbaikan: Gunakan nama_karyawan, bukan nama
      const namaKaryawan = row.nama_karyawan || '';
      const nikVendor = row.nik_vendor || '';
      const nikElnusa = row.nik_elnusa || '';
      const noKontrak = row.no_kontrak || '';
      const jabatan = row.jabatan || '';
      
      const searchValue = searchTerm.toLowerCase();
      
      // Cari di beberapa kolom penting
      return namaKaryawan.toLowerCase().includes(searchValue) || 
             nikVendor.toLowerCase().includes(searchValue) ||
             nikElnusa.toLowerCase().includes(searchValue) ||
             noKontrak.toLowerCase().includes(searchValue) ||
             jabatan.toLowerCase().includes(searchValue);
    });
    
    return result;
  }, [users, searchTerm, activeFilter]);

  // Definisi kolom untuk DataTable - menghapus kolom Aksi
  const columns = [
    { 
      name: 'Status', 
      cell: row => {
        // Perbaikan: Gunakan kontrak_akhir, bukan kontrakAkhir
        const daysRemaining = getDaysDifference(row.kontrak_akhir);
        
        // Tambahan: Fungsi getStatusText untuk informasi lebih jelas
        const getStatusText = (days) => {
          if (days < 0) return `EOC ${Math.abs(days)} days ago`;
          if (days === 0) return "EOC today";
          return `${days} days remaining`;
        };
        
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
            {getStatusText(daysRemaining)}
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
    { name: 'Receiving Location', selector: row => row.lokasi_penerimaan || '', sortable: true, width: "200px" },
    { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal)},
    { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir)},
    { name: 'Unit Temp', selector: row => row.unit_temp || '', sortable: true, width: "250px" },
    { name: 'Date of Birth', selector: row => row.tanggal_lahir || '', sortable: true, width: "180px", cell: row => formatDateToDDMMYYYY(row.tanggal_lahir)},
    { name: 'Religion', selector: row => row.agama || '', sortable: true, width: "200px" },
    { name: 'Gender', selector: row => row.jenis_kelamin || '', sortable: true, width: "200px" },
    {
      name: 'KTP Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_ktp_filename ? 
            openFilePreview(row.id, 'no_ktp', row.no_ktp_filename, row.no_ktp_mimetype) : 
            openDocumentModal(row.id, 'no_ktp', row.no_ktp)
            }
        >
          {row.no_ktp || 'View KTP Number'}
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
    {
      name: 'Family Card Number',
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
    {
      name: 'BPJS Health',
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
    {
      name: 'BPJS Social Security',
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
          {row.no_rekening ? `${row.no_rekening} (${row.bank_penerbit || 'No Bank'})` : 'View Account'}
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
      <div className='flex-1 flex flex-col items-center overflow-y-auto px-6 py-3'>
      <StatBoxElnusaComponents
        onFilterChange={handleFilterChange} 
        showCategories={['totemployes', 'duedate', 'call2', 'call1']} 
        activeFilter={activeFilter} // Parameter baru opsional
      />
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
          <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
        </div>
      )}

      <div className='bg-(--white-tar-color) text-right p-3 shadow-md rounded)'>
      </div>
      {/* Table Section */}
      <div className="bg-white shadow rounded-lg p-6">
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
              </div>

              {/* Conditional rendering untuk DataTable */}
              {!users || users.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded">
                  <p className="text-gray-500 mb-4">No data available</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded">
                  <p className="text-gray-500">No data matching the search "{searchTerm}".</p>
                </div>
              ) : (
                <DataTable 
                  columns={columns}
                  data={filteredRecords}
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
          </main>

    
    {/* Footer*/}
    <FooterComponents/>
    </div>

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
                  const employee = users.find(emp => emp.id === docModalId);
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
</div>
  )
}

export default ElnusaViewProjectPage

// { name: 'CV', 
    //   cell: row => {
    //     const hasFile = row.cv_filename && row.cv_filepath;
    //     return (
    //       <div className="flex items-center">
    //         {hasFile ? (
    //           <button 
    //             className="flex items-center text-blue-600 hover:text-blue-800"
    //             onClick={() => openFileUploadModal(
    //               row.id, 
    //               row.nama_karyawan, 
    //               'cv',
    //               row.cv_filename,
    //               row.cv_filepath
    //             )}
    //             title={`Lihat ${row.cv_filename}`}
    //           >
    //             <FontAwesomeIcon 
    //               icon={getFileIcon(row.cv_mimetype)} 
    //               className="mr-2 text-blue-600" 
    //             />
    //             <span className="mr-1">{getDisplayFileName(row.cv_filename)}</span>
    //             <FontAwesomeIcon icon={faDownload} className="text-xs ml-2" />
    //           </button>
    //         ) : (
    //           <button 
    //             className="flex items-center text-gray-500 hover:text-blue-600"
    //             onClick={() => openFileUploadModal(row.id, row.nama_karyawan, 'cv')}
    //             title="Upload CV"
    //           >
    //             <FontAwesomeIcon icon={faFile} className="mr-2 text-gray-400" />
    //             <span>NO FILE</span>
    //             <FontAwesomeIcon icon={faUpload} className="text-xs ml-2" />
    //           </button>
    //         )}
    //       </div>
    //     );
    //   },
    //   sortable: false,
    //   width: "300px"
    // },