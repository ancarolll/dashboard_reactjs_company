import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import View2Z7DBudget from '../../../components/budget/View2Z7DBudget';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import StatBoxPertamina2Z7DComponents from '../../../components/projectcom/StatBoxPertamina2Z7DComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faDownload, faFileAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import { faFileExcel } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

const Pertamina2Z7DViewProjectPage = () => {
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

  // State for table and UI
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState([]);
  const [error, setError] = useState(null);
  const [perPage, setPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const location = useLocation();
  const navigate = useNavigate();

  // State for document modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalId, setDocModalId] = useState(null);
  const [docModalField, setDocModalField] = useState(null);
  const [docModalValue, setDocModalValue] = useState('');

  // State for sertifikat modal
  const [sertifikatModal, setSertifikatModal] = useState({
    isOpen: false, userId: null, userName: ''
  });

  // State for file preview modal
  const [previewModal, setPreviewModal] = useState({
    show: false, fileUrl: null, fileType: null, fieldName: '', fileName: ''
  });

  // Sertifikat modal handlers
  const openSertifikatModal = (user) => {
    setSertifikatModal({
      isOpen: true,
      userId: user.id,
      userName: user.nama_lengkap
    });
  };

  const closeSertifikatModal = () => {
    setSertifikatModal({
      isOpen: false,
      userId: null,
      userName: ''
    });
  };

  // Document modal handlers
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
      setShowDocModal(true);
    }
  };

  // Close document modal
  const closeDocumentModal = () => {
    setShowDocModal(false);
    setDocModalId(null);
    setDocModalField(null);
    setDocModalValue('');
  };

  // Function to preview a file
  const openFilePreview = (id, field, filename, mimetype) => {
    // If no file, don't open preview
    if (!filename) {
      setMessage({
        text: `No file for ${field}`,
        type: 'info'
      });
      return;
    }
    
    const fileUrl = `${API_BASE_URL}/regional2Z7D/users/${id}/download/${field}`;
    
    // Format field names for display
    const fieldDisplayNames = {
      no_ktp: 'KTP Number',
      no_kk: 'Family Card Number',
      no_npwp: 'NPWP Number',
      bpjs_kesehatan_karyawan: 'BPJS Health',
      bpjstk: 'BPJS Social Security',
      no_rekening_mandiri: 'Bank Account Number'
    };
    
    setPreviewModal({
      show: true, 
      fileUrl, 
      fileType: mimetype, 
      fieldName: fieldDisplayNames[field] || field, 
      fileName: filename
    });
  };

  // Function to download a document
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

  // Download document
  const downloadFile = async (userId, docType, fileName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/regional2Z7D/users/${userId}/download/${docType}`,
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

  // Data fetching function
  const fetchDataFromBackend = async () => {
    setLoading(true);
    setError(null);
    
    try {
      
      // ALWAYS use the same endpoint as EditProjectPage
      const response = await axios.get(`${API_BASE_URL}/regional2Z7D/users`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.data) {
        let processedData = [];
        
        if (Array.isArray(response.data)) {
          processedData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          processedData = response.data.data;
        } else {
          setError("Data received from server is invalid");
          setBackendData([]);
          return;
        }
        
        // DEBUGGING: Check file metadata for first user
        if (processedData.length > 0) {
          const firstUser = processedData[0];
          
          // Check if file metadata exists for any user
          const usersWithFiles = processedData.filter(user => 
            user.no_ktp_filename || 
            user.no_kk_filename || 
            user.no_npwp_filename || 
            user.bpjs_kesehatan_karyawan_filename || 
            user.bpjstk_filename || 
            user.no_rekening_mandiri_filename
          );
          
          if (usersWithFiles.length > 0) {
            } else {
            }
        }
        
        setBackendData(processedData);
      } else {
        setError("No data received from server");
        setBackendData([]);
      }
    } catch (err) {
      console.error('🔍 DEBUGGING: API Error:', err);
      
      let errorMessage = "Failed to fetch data from server";
      if (err.response) {
        console.error('🔍 DEBUGGING: Error response:', err.response);
        errorMessage += `: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        console.error('🔍 DEBUGGING: No response received:', err.request);
        errorMessage += ": No response from server";
      } else {
        console.error('🔍 DEBUGGING: Request setup error:', err.message);
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setBackendData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataFromBackend();
  }, []);

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
    // Reset pencarian saat mengganti filter
    setSearchTerm('');
  };

  // Event handlers
  const handleRowSelected = (state) => setSelectedRows(state.selectedRows);

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
      setMessage({ text: `Data successfully exported to ${fileName}.xlsx`, type: 'success' });
    } catch (error) {
      setMessage({ text: `Export failed: ${error.message}`, type: 'error' });
    }
  };

  const handleExportAllData = () => {
    if (!backendData || backendData.length === 0) {
      setMessage({ text: 'No data to export', type: 'error' });
      return;
    }
    exportToExcel(backendData, 'all_employee_data_regional2Z7D');
  };

  const handleExportSelectedData = () => {
    if (!selectedRows || selectedRows.length === 0) {
      setMessage({ text: 'Select at least one row to export', type: 'error' });
      return;
    }
    exportToExcel(selectedRows, 'selected_employee_data');
  };

  // Filter records berdasarkan search term
  const handleFilter = (e) => {
    setSearchTerm(e.target.value);
  };

  // Definisikan filteredRecords menggunakan useMemo
  const filteredRecords = React.useMemo(() => {
    if (!backendData) {
      return [];
    }
  
    // Filter berdasarkan status dulu
    const statusFiltered = filterUsersByStatus(backendData, activeFilter);
    // Log jumlah data terfilter

    // Filter berdasarkan search term
    const result = statusFiltered.filter(row => {
      // Cek apakah row valid
      if (!row || typeof row !== 'object') {
        return false;
      }
      
      // Gunakan nama_lengkap dan kolom lain yang relevan
      const namaLengkap = row.nama_lengkap || '';
      const noKontrak = row.no_kontrak || '';
      const jabatan = row.jabatan || '';
      
      const searchValue = searchTerm.toLowerCase();
      
      // Cari di beberapa kolom penting
      return namaLengkap.toLowerCase().includes(searchValue) || 
            noKontrak.toLowerCase().includes(searchValue) ||
            jabatan.toLowerCase().includes(searchValue);
    });
    
    return result;
  }, [backendData, searchTerm, activeFilter]);

  // useEffect untuk monitoring data terfilter
  useEffect(() => {
  }, [backendData, filteredRecords.length]);

  const handleDataChange = (data) => {
    // Lakukan sesuatu dengan data jika diperlukan
  };

  // Definisi kolom untuk DataTable - READ ONLY VERSION
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
      width: "250px" 
    },
    { name: 'Contract Number', selector: row => row.no_kontrak || '', sortable: true, width: "300px"},
    { name: 'Full Name', selector: row => row.nama_lengkap || '', sortable: true, width: "250px" },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true },
    { name: 'Start Contract', selector: row => row.kontrak_awal || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal)},
    { name: 'End Contract', selector: row => row.kontrak_akhir || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir)},
    { name: 'Date of Birth', 
      selector: row => row.tanggal_lahir || '', 
      sortable: true, 
      width: "180px",
      cell: row => formatDateToDDMMYYYY(row.tanggal_lahir)
    },
    { name: 'Birth Place', selector: row => row.tempat_lahir || '', sortable: true, width: "200px" },
    { name: 'Gender', selector: row => row.jenis_kelamin || '', sortable: true, width: "150px" },
    { name: 'Domicile Address', selector: row => row.alamat_domisili || '', sortable: true, width: "850px" },
    { name: 'KTP Address', selector: row => row.alamat_ktp || '', sortable: true, width: "850px" },
    { name: 'Phone Number', selector: row => row.no_telpon || '', sortable: true, width: "150px" },
    { name: 'Mothers Name', selector: row => row.nama_ibu_kandung || '', sortable: true, width: "150px" },
    { name: 'Emergency Contact', selector: row => row.kontak_darurat || '', sortable: true, width: "250px" },
    { name: 'Name Emergency Contact', selector: row => row.nama_kontak_darurat || '', sortable: true, width: "250px" },
    { name: 'Email', selector: row => row.email || '', sortable: true, width: "350px" },
    { name: 'Other Email', selector: row => row.email_lain || '', sortable: true, width: "250px" },
    { name: 'KTP Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_ktp_filename ? 
            openFilePreview(row.id, 'no_ktp', row.no_ktp_filename, row.no_ktp_mimetype) : 
            openDocumentModal(row.id, 'no_ktp', row.no_ktp)
          }
        >
          {row.no_ktp || 'No Data'}
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
          {row.no_kk || 'No Data'}
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
    { name: 'Education', selector: row => row.pendidikan || '', sortable: true, width: "750px" },
    { name: 'CV', selector: row => row.cv || '', sortable: true, width: "150px" },
    { name: 'BPJS Health',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.bpjs_kesehatan_karyawan_filename ? 
            openFilePreview(row.id, 'bpjs_kesehatan_karyawan', row.bpjs_kesehatan_karyawan_filename, row.bpjs_kesehatan_karyawan_mimetype) : 
            openDocumentModal(row.id, 'bpjs_kesehatan_karyawan', row.bpjs_kesehatan_karyawan)
          }
        >
          {row.bpjs_kesehatan_karyawan || 'No Data'}
          {row.bpjs_kesehatan_karyawan_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'bpjs_kesehatan_karyawan');
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
    { name: 'Spouse Health Insurance', selector: row => row.bpjs_kesehatan_suami_istri || '', sortable: true, width: "350px" },
    { name: 'Child 1 Insurance', selector: row => row.bpjs_anak1 || '', sortable: true, width: "350px" },
    { name: 'Child 2 Insurance', selector: row => row.bpjs_anak2 || '', sortable: true, width: "350px" },
    { name: 'Child 3 Insurance', selector: row => row.bpjs_anak3 || '', sortable: true, width: "350px" },
    { name: 'BPJS Social Security',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.bpjstk_filename ? 
            openFilePreview(row.id, 'bpjstk', row.bpjstk_filename, row.bpjstk_mimetype) : 
            openDocumentModal(row.id, 'bpjstk', row.bpjstk)
          }
        >
          {row.bpjstk || 'No Data'}
          {row.bpjstk_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'bpjstk');
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
    { name: 'BPJS Social Security Details', selector: row => row.bpjstk_keterangan || '', sortable: true, width: "600px" },
    { name: 'Other Insurance', selector: row => row.asuransi_lainnya || '', sortable: true, width: "250px" },
    { name: 'NPWP Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_npwp_filename ? 
            openFilePreview(row.id, 'no_npwp', row.no_npwp_filename, row.no_npwp_mimetype) : 
            openDocumentModal(row.id, 'no_npwp', row.no_npwp)
          }
        >
          {row.no_npwp || 'No Data'}
          {row.no_npwp_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_npwp');
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
    { name: 'Mandiri Account Number',
      cell: row => (
        <div 
          className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
          onClick={() => row.no_rekening_mandiri_filename ? 
            openFilePreview(row.id, 'no_rekening_mandiri', row.no_rekening_mandiri_filename, row.no_rekening_mandiri_mimetype) : 
            openDocumentModal(row.id, 'no_rekening_mandiri', row.no_rekening_mandiri)
          }
        >
          {row.no_rekening_mandiri || 'No Data'}
          {row.no_rekening_mandiri_filename && (
            <div className="flex ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadDocument(row.id, 'no_rekening_mandiri');
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
    }
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
      <div className='w-full py-3'>
      <StatBoxPertamina2Z7DComponents 
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
                    placeholder="Search..." 
                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                    leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-lg'
                  />
                </div>
              </div>

              {/* Conditional rendering untuk DataTable */}
              {loading ? (
                <div className="p-6 text-center bg-gray-50 rounded">
                  <p className="text-gray-500 mb-4">Loading employee data...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : !backendData || backendData.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded">
                  <p className="text-gray-500 mb-4">No user data available.</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded">
                  <p className="text-gray-500">No user data matching the search "{searchTerm}".</p>
                </div>
              ) : (
                <DataTable 
                  columns={columns}
                  data={filteredRecords}
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
                      No data matching the filter.
                    </div>
                  }
                />
              )}
            </div>
            
            <br />
            
            {filteredRecords && filteredRecords.length > 0 && (
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
                    Export All ({filteredRecords.length})
                  </ButtonComponents>
                </div>
              </div>
            )}
          </main>

          <br /> <br /> <br />
          {/* Integrasi View2Z7DBudget */}
          <div className="budget-summary-section">
            <View2Z7DBudget 
              embedded={true} 
              apiUrl="/api/reg2z7dbudget" 
              onDataChange={handleDataChange}
            />
          </div>

    {/* Footer*/}
    <FooterComponents/>
    </div>

    {/* Document Modal - Read Only */}
    {showDocModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
        {docModalField === 'bpjs_kesehatan_karyawan' ? 'BPJS Health' :
        docModalField === 'no_ktp' ? 'KTP Number' :
        docModalField === 'no_kk' ? 'Family Card Number' :
        docModalField === 'no_npwp' ? 'NPWP Number' :
        docModalField === 'bpjstk' ? 'BPJS Social Security' :
        docModalField === 'no_rekening_mandiri' ? 'Bank Account Number' :
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
          {docModalField === 'bpjs_kesehatan_karyawan' ? 'BPJS Health' :
          docModalField === 'no_ktp' ? 'KTP Number' :
          docModalField === 'no_kk' ? 'Family Card Number' :
          docModalField === 'no_npwp' ? 'NPWP Number' :
          docModalField === 'bpjstk' ? 'BPJS Social Security' :
          docModalField === 'no_rekening_mandiri' ? 'Bank Account Number' :
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

    {/* Sertifikat Modal */}
    {sertifikatModal.isOpen && (
      <SertifikatModal
      isOpen={sertifikatModal.isOpen}
      onClose={closeSertifikatModal}
      userId={sertifikatModal.userId}
      userName={sertifikatModal.userName}
      viewOnly={true} // Mode lihat saja untuk halaman View
      apiPrefix="regional2Z7D"
      />
    )}

    </div>
</div>
  )
}

export default Pertamina2Z7DViewProjectPage