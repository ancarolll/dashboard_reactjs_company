import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import ViewURPBudget from '../../../components/budget/ViewURPBudget';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import StatBoxUmranComponents from '../../../components/projectcom/StatBoxUmranComponents';
import FileUploadModal from '../../../components/FileUploadModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faDownload, faFileAlt, faUpload, faEye } from '@fortawesome/free-solid-svg-icons';
import { faFile, faFileImage, faFileWord, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import axios from 'axios';

// Konstanta API URL
const API_BASE_URL = 'http://localhost:3005/api';
const PROJECT_ID = 'umran'; // Project ID untuk Umran

const UmranViewProjectPage = () => {

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

  // State for loading and data
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // State for file upload modal
  const [fileUploadModal, setFileUploadModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    docType: null,
    existingFile: null
  });

  // State for table and UI
  const [perPage, setPerPage] = useState(10);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // State for document modal (added for preview functionality)
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalId, setDocModalId] = useState(null);
  const [docModalField, setDocModalField] = useState(null);
  const [docModalValue, setDocModalValue] = useState('');
  const [docModalFile, setDocModalFile] = useState(null);

  // State for sertifikat modal (added for certificate functionality)
  const [sertifikatModal, setSertifikatModal] = useState({
    isOpen: false, 
    userId: null, 
    userName: ''
  });

  // State for file preview modal (added for preview functionality)
  const [previewModal, setPreviewModal] = useState({
    show: false, 
    fileUrl: null, 
    fileType: null, 
    fieldName: '', 
    fileName: ''
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Sertifikat modal handlers (added for certificate functionality)
  const openSertifikatModal = (user) => {
    setSertifikatModal({
      isOpen: true,
      userId: user.id,
      userName: user.nama_lengkap_karyawan
    });
  };

  const closeSertifikatModal = () => {
    setSertifikatModal({
      isOpen: false,
      userId: null,
      userName: ''
    });
  };

  // Document modal handlers (added for preview functionality)
  const openDocumentModal = (id, field, value) => {
    // Find the employee data
    const employee = users.find(emp => emp.id === id);
    
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

  // Close document modal (added for preview functionality)
  const closeDocumentModal = () => {
    setShowDocModal(false);
    setDocModalId(null);
    setDocModalField(null);
    setDocModalValue('');
    setDocModalFile(null);
  };

  // Function to preview a file (added for preview functionality)
  const openFilePreview = (id, field, filename, mimetype) => {
    // If no file, don't open preview
    if (!filename) {
      setMessage({
        text: `No file for ${field}`,
        type: 'info'
      });
      return;
    }
    
    const fileUrl = `${API_BASE_URL}/umran/users/${id}/download/${field}`;
    
    // Format field names for display
    const fieldDisplayNames = {
      no_ktp: 'KTP Number',
      no_kk: 'Family Card Number', 
      npwp: 'NPWP Number', 
      no_bpjs_kesehatan: 'BPJS Health',
      no_bpjs_tk: 'BPJS Social Security',
      rekening: 'Bank Account'
    };
    
    setPreviewModal({
      show: true, 
      fileUrl, 
      fileType: mimetype, 
      fieldName: fieldDisplayNames[field] || field, 
      fileName: filename
    });
  };

  // Function to download a document (added for preview functionality)
  const downloadDocument = (userId, docType) => {
    if (!userId || !docType) {
      setMessage({ text: 'Invalid document information', type: 'error' });
      return;
    }
    
    try {
      // Use existing downloadFile function
      downloadFile(userId, docType);
    } catch (error) {
      console.error('Error downloading document:', error);
      setMessage({ text: `Failed to download document: ${error.message}`, type: 'error' });
    }
  };

  // File upload modal handlers
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

  const handleDataChange = (data) => {
    console.log('Budget data updated:', data);
    // Lakukan sesuatu dengan data jika diperlukan
  };

  // Data fetching function
  const fetchDataFromBackend = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/umran/users`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('Data successfully retrieved:', response.data);

      // Debug data yang diterima
      console.log('Number of records retrieved:', response.data.length);
      console.log('First data sample:', response.data[0] || 'No data');
    
      // Untuk debugging kolom file
      if (response.data && response.data.length > 0) {
        const fileFields = ['cv_filename', 'ijazah_filename', 'sertifikat_filename', 'pkwt_filename'];
        const fileData = response.data
          .filter(item => fileFields.some(field => item[field])) // Filter hanya yang memiliki file
          .map(item => ({
            id: item.id,
            nama: item.nama_lengkap_karyawan,
            cv: item.cv_filename,
            ijazah: item.ijazah_filename,
            sertifikat: item.sertifikat_filename,
            pkwt: item.pkwt_filename,
          }));
        
        console.log('Data with file:', fileData);
        console.log('Number of employees with file:', fileData.length);
      }
      
      if (Array.isArray(response.data)) {
        // Filter hanya karyawan aktif (kontrak belum berakhir, tidak ada sebab_na)
        const activeUsers = response.data.filter(user => {
          if (!user) return false;
          
          // Karyawan aktif: tidak memiliki sebab_na dan kontrak belum berakhir
          const noSebabNA = !user.sebab_na;
          const contractNotExpired = user.kontrak_akhir ? 
            getDaysDifference(user.kontrak_akhir) >= 0 : true;
            
          return noSebabNA && contractNotExpired;
        });
        
        console.log(`Success: ${activeUsers.length} active employees found`);
        setUsers(activeUsers);
      } else if (response.data && Array.isArray(response.data.data)) {
        // Handle jika response ada dalam property data
        setUsers(response.data.data);
      } else {
        setMessage({ 
          text: "Received data format is invalid", 
          type: 'error'
        });
        setUsers([]);
      }
    } catch (err) {
      console.error('Error retrieving data:', err);
      setMessage({ 
        text: `Failed to retrieve data: ${err.message}`, 
        type: 'error'  
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // File operations
  const downloadFile = async (userId, docType, fileName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/umran/users/${userId}/download/${docType}`,
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

  // Fetch data on component mount
  useEffect(() => {
    fetchDataFromBackend();
  }, []);

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

  // Function for contract status indicators
  const getStatusColor = (days) => {
    if (days < 0) return 'bg-red-500 text-white'; // Kontrak berakhir
    if (days <= 14) return 'bg-red-200'; // Kurang dari 2 minggu
    if (days <= 30) return 'bg-yellow-200'; // Kurang dari 1 bulan
    if (days <= 45) return 'bg-green-200'; // Kurang dari 6 minggu
    return 'bg-gray-100'; // Default
  };

  // Function for displaying remaining contract days
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
        case 'totemployes':
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

  const handleFilter = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    setSearchTerm('');
  };

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    
    const statusFiltered = filterByStatus(users, activeFilter);
    
    return statusFiltered.filter(row => {
      if (!row) return false;
      if (typeof row !== 'object') return false;
      
      // Search in specific common fields
      const namaLengkap = row.nama_lengkap_karyawan || '';
      const nik = row.nik_tar || '';
      const jabatan = row.jabatan || '';
      
      const searchValue = searchTerm.toLowerCase();
      
      return namaLengkap.toLowerCase().includes(searchValue) || 
        nik.toLowerCase().includes(searchValue) ||
        jabatan.toLowerCase().includes(searchValue);
    });
  }, [users, searchTerm, activeFilter]);

  // DataTable columns definition - updated with preview functionality for 6 specified columns
  const columns = [
    { 
      name: 'Status', 
      cell: row => {
        const daysRemaining = getDaysDifference(row.kontrak_akhir);
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
            {getStatusText(daysRemaining)}
          </div>
        );
      }, 
      sortable: true, 
      width: "200px" 
    },
    { name: 'Full Name', selector: row => row.nama_lengkap_karyawan || '', sortable: true, width: "400px" },
    { name: 'TAR ID', selector: row => row.nik_tar || '', sortable: true, width: "250px" },
    { name: 'Certificates', 
      cell: row => (
        <button
          onClick={() => openSertifikatModal(row)}
          className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-1"
          title="View Certificates"
        >
          <FontAwesomeIcon icon={faFileAlt} />
          <span>Certificates</span>
        </button>
      ), 
      width: "180px",
      ignoreRowClick: true,
    },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "250px" },
    { name: 'Marital Status', selector: row => row.status_pernikahan || '', sortable: true, width: "250px" },
    { name: 'Contract Number', selector: row => row.no_kontrak|| '', sortable: true, width: "250px" },
    { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal)},
    { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir)},
    { 
      name: 'Birth Date', 
      selector: row => row.tanggal_lahir || '', 
      sortable: true, 
      width: "180px",
      cell: row => formatDateToDDMMYYYY(row.tanggal_lahir)
    },
    { name: 'KTP Number',
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
    { name: 'BPJS Health Status', selector: row => row.status_bpjs || '', sortable: true, width: "180px" },
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
    { name: 'Other Insurance', selector: row => row.asuransi_lainnya || '', sortable: true, width: "250px" },
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
    { name: 'Education & Major', selector: row => row.pendidikan_terakhir_jurusan || '', sortable: true, width: "300px" },
    { name: 'CV', selector: row => row.cv || '', sortable: true, width: "150px" },
    { name: 'Educational Institution', selector: row => row.nama_instansi_pendidikan || '', sortable: true, width: "400px" },
    { name: 'Domicile Address', selector: row => row.alamat_domisili || '', sortable: true, width: "550px" },
    { name: 'KTP Address', selector: row => row.alamat_ktp || '', sortable: true, width: "550px" },
    { name: 'Phone/WhatsApp Number', selector: row => row.no_hp_wa_aktif || '', sortable: true, width: "250px" },
    { name: 'Form Submission Email', selector: row => row.email_pengiriman_form || '', sortable: true, width: "250px" },
    { name: 'Active Email', selector: row => row.email_aktif || '', sortable: true, width: "250px" },
    { name: 'Emergency Contact Name', selector: row => row.nama_kontak_darurat || '', sortable: true, width: "250px" },
    { name: 'Emergency Contact', selector: row => row.kontak_darurat || '', sortable: true, width: "250px" },
    { name: 'Mothers Name', selector: row => row.nama_ibu_kandung || '', sortable: true, width: "250px" },
    { name: 'Bank Account Name', selector: row => row.nama_pemilik_rekening || '', sortable: true, width: "250px" },
    { name: 'Bank Account Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.rekening_filename ? 
            openFilePreview(row.id, 'rekening', row.rekening_filename, row.rekening_mimetype) : 
            openDocumentModal(row.id, 'rekening', row.rekening)
          }
        >
          {row.rekening || 'View Bank Account'}
          {row.rekening_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'rekening');
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
      width: '300px'
    },
    { name: 'Basic Salary', selector: row => row.gapok || '', sortable: true, width: "150px", cell: row => row.gapok ? `Rp ${parseFloat(row.gapok).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'OT', selector: row => row.ot || '', sortable: true, width: "150px", cell: row => row.ot ? `Rp ${parseFloat(row.ot).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'THP', selector: row => row.thp || '', sortable: true, width: "150px", cell: row => row.thp ? `Rp ${parseFloat(row.thp).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Transportation Allowance', selector: row => row.t_transport || '', sortable: true, width: "150px", cell: row => row.t_transport ? `Rp ${parseFloat(row.t_transport).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' },
    { name: 'Field Allowance', selector: row => row.t_lapangan || '', sortable: true, width: "150px", cell: row => row.t_lapangan ? `Rp ${parseFloat(row.t_lapangan).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' }
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
          <div className='w-full py-3'>
            <StatBoxUmranComponents 
              onFilterChange={handleFilterChange} 
              showCategories={['totemployes', 'duedate', 'call2', 'call1']}
              activeFilter={activeFilter}  
            />
          </div>

          {message.text && (
            <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
                <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
            </div>
          )}

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
                  placeholder="Cari Nama..." 
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                  leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-lg' 
                />
              </div>
            </div>
              
            {/* DataTable */}
            {loading ? (
              <div className="p-6 text-center bg-gray-50 rounded">
                <p className="text-gray-500 mb-4">Loading employee data...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center bg-red-50 rounded">
                <p className="text-red-500">{error}</p>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded">
                <p className="text-gray-500 mb-4">No user data available.</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded">
                <p className="text-gray-500">No user data matching the search "{searchTerm}".</p>
              </div>
            ) : (
              <DataTable 
                columns={columns}
                data={filteredData}
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
                    No data matching the filter.
                  </div>
                }
              />
            )}
          </div>
        </main>

        <br /> <br /> <br />
          {/* Integrasi ViewURPBudget */}
          <div className="budget-summary-section">
            <ViewURPBudget 
              embedded={true} 
              apiUrl="/api/urpbudget" 
              onDataChange={handleDataChange}
            />
          </div>
          
        {/* Footer*/}
        <FooterComponents/>
        </div>
      </div>

      {fileUploadModal.isOpen && (
        <FileUploadModal
          isOpen={fileUploadModal.isOpen}
          onClose={closeFileUploadModal}
          userId={fileUploadModal.userId}
          userName={fileUploadModal.userName}
          docType={fileUploadModal.docType}
          existingFile={fileUploadModal.existingFile}
          viewOnly={true}
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

      {/* Document Modal (added for preview functionality) */}
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
                 docModalField === 'rekening' ? 'Bank Account Number' :
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
                   docModalField === 'rekening' ? 'Bank Account Number' :
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

      {/* File Preview Modal (added for preview functionality) */}
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

      {/* Sertifikat Modal (added for certificate functionality) */}
      {sertifikatModal.isOpen && (
        <SertifikatModal
          isOpen={sertifikatModal.isOpen}
          onClose={closeSertifikatModal}
          userId={sertifikatModal.userId}
          userName={sertifikatModal.userName}
          viewOnly={true} // Read-only mode for view page
          apiPrefix="umran"
        />
      )}

    </div>
  );
};

export default UmranViewProjectPage;