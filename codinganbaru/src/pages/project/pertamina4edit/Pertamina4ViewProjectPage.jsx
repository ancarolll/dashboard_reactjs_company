import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import StatBoxPertamina4Components from '../../../components/projectcom/StatBoxPertamina4Components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faFileAlt, faTrashCan, faUpload, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import { faFile, faFileImage, faFileWord, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

const Pertamina4ViewProjectPage = () => {
  const [perPage, setPerPage] = useState(10);
  const location = useLocation();
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tambahan state untuk preview dan modal dokumen
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
  
  // State untuk sertifikat modal
  const [sertifikatModal, setSertifikatModal] = useState({
    isOpen: false, userId: null, userName: ''
  });

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

  // Function untuk preview file
  const openFilePreview = (id, field, filename, mimetype) => {
    // If no file, don't open preview
    if (!filename) {
      setMessage({
        text: `No file for ${field}`,
        type: 'info'
      });
      return;
    }
    
    const fileUrl = `${API_BASE_URL}/regional4/users/${id}/download/${field}`;
    
    // Format field names for display
    const fieldDisplayNames = {
      nik: 'KTP Number', 
      no_kk: 'Family Card Number', 
      npwp: 'NPWP Number', 
      bpjs_kesehatan: 'BPJS Health',
      bpjs_ketenagakerjaan: 'BPJS Social Security',
      nomor_rekening: 'Bank Account Number'
    };
    
    setPreviewModal({
      show: true, fileUrl, fileType: mimetype, fieldName: fieldDisplayNames[field] || field, fileName: filename
    });
  };
  
  // Function untuk document modal
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

  // Close document modal
  const closeDocumentModal = () => {
    setShowDocModal(false);
    setDocModalId(null);
    setDocModalField(null);
    setDocModalValue('');
    setDocModalFile(null);
  };
  
  // Modal sertifikat
  const openSertifikatModal = (user) => {
    setSertifikatModal({
      isOpen: true,
      userId: user.id,
      userName: user.nama_karyawan
    });
  };

  // Tutup modal sertifikat
  const closeSertifikatModal = () => {
    setSertifikatModal({
      isOpen: false,
      userId: null,
      userName: ''
    });
  };

  // Fungsi untuk download dokumen
  const downloadDocument = async (userId, docType) => {
    try {
      setLoading(true);
      setMessage({ text: 'Starting download...', type: 'info' });
      
      // Use axios with responseType 'blob'
      const response = await axios({
        url: `${API_BASE_URL}/regional4/users/${userId}/download/${docType}`,
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

  // Fungsi untuk memuat data dari backend - GUNAKAN ENDPOINT YANG SAMA DENGAN EDIT PAGE
   const fetchDataFromBackend = async () => {
    setLoading(true);
    try {
      // Gunakan endpoint yang sama dengan Edit page
      const response = await axios.get(`${API_BASE_URL}/regional4/users`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });


      if (response.data) {
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
          
          setUsers(activeUsers);
          
          // Debug file data
          if (activeUsers.length > 0) {
            const fileFields = ['nik_filename', 'no_kk_filename', 'npwp_filename', 'bpjs_kesehatan_filename', 'bpjs_ketenagakerjaan_filename', 'nomor_rekening_filename'];
            const fileData = activeUsers
              .filter(item => fileFields.some(field => item[field]))
              .map(item => ({
                id: item.id,
                nama: item.nama_karyawan,
                nik: item.nik_filename,
                no_kk: item.no_kk_filename,
                npwp: item.npwp_filename,
                bpjs_kesehatan: item.bpjs_kesehatan_filename,
                bpjs_ketenagakerjaan: item.bpjs_ketenagakerjaan_filename,
                nomor_rekening: item.nomor_rekening_filename
              }));
            
          }
          
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setUsers(response.data.data);
        } else {
          setMessage({ 
            text: "Data received from server is invalid", 
            type: 'error' 
          });
          setUsers([]);
        }
      } else {
        setMessage({ 
          text: "No data received from server", 
          type: 'error' 
        });
        setUsers([]);
      }
    } catch (err) {
      console.error('Error retrieving data:', err);
      let errorMessage = "Failed to fetch data from server";
      if (err.response) {
        errorMessage += `: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage += ": No response from server";
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setMessage({ 
        text: errorMessage, 
        type: 'error' 
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetchDataFromBackend saat komponen dimuat
  useEffect(() => {
    fetchDataFromBackend();
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
    // Reset pencarian saat mengganti filter
    setSearchTerm('');
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
  fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName : 'Tidak ada file';

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
  
    // Filter berdasarkan search term
    const result = statusFiltered.filter(row => {
      // Cek apakah row valid
      if (!row || typeof row !== 'object') {
        return false;
      }
      
      // Gunakan nama_karyawan dan kolom lain yang relevan
      const namaKaryawan = row.nama_karyawan || '';
      const nikTar = row.nik_tar || '';
      const nikPepReg4 = row.nik_pep_reg4 || '';
      const noKontrak = row.no_kontrak || '';
      const jabatan = row.jabatan || '';
      
      const searchValue = searchTerm.toLowerCase();
      
      // Cari di beberapa kolom penting
      return namaKaryawan.toLowerCase().includes(searchValue) || 
        nikTar.toLowerCase().includes(searchValue) ||
        nikPepReg4.toLowerCase().includes(searchValue) ||
        noKontrak.toLowerCase().includes(searchValue) ||
        jabatan.toLowerCase().includes(searchValue);
    });
    
    return result;
  }, [users, searchTerm, activeFilter]);

  // useEffect untuk monitoring data terfilter

  // Definisi kolom untuk DataTable - GUNAKAN NAMA KOLOM YANG SAMA DENGAN EDIT PAGE
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
    { name: 'Contract Number', selector: row => row.no_kontrak || '', sortable: true, width: "300px" },
    { name: 'Full Name', selector: row => row.nama_karyawan || '', sortable: true, width: "450px" },
    { name: 'PEP Reg4 ID', selector: row => row.nik_pep_reg4 || '', sortable: true, width: "150px" },
    { name: 'TAR ID', selector: row => row.nik_tar || '', sortable: true, width: "150px" },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "300px" },
    { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal) },
    { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir) },   
    { name: 'Date of Birth', selector: row => row.tanggal_lahir || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.tanggal_lahir)},
    { name: 'Domicile Address', selector: row => row.alamat_domisili || '', sortable: true, width: "1000px" },
    { name: 'Phone Number', selector: row => row.nomor_hp || '', sortable: true, width: "150px" },
    { name: 'Emergency Contact Name', selector: row => row.nama_telp_kontak_emergency || '', sortable: true, width: "250px" },
    { name: 'Emergency Contact Number', selector: row => row.no_telp_kontak_emergency || '', sortable: true, width: "250px" },
    { name: 'Emergency Contact Relation', selector: row => row.hubungan_kontak_emergency || '', sortable: true, width: "250px" },
    { name: 'KTP Number',
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
    { name: 'Spouse Name', selector: row => row.nama_pasangan || '', sortable: true, width: "250px" },
    { name: 'Child 1', selector: row => row.nama_anak_ke_1 || '', sortable: true, width: "250px" },
    { name: 'Child 2', selector: row => row.nama_anak_ke_2 || '', sortable: true, width: "250px" },
    { name: 'Marital Status', selector: row => row.status_nikah || '', sortable: true, width: "150px" },
    { name: 'BPJS Health',
        cell: row => (
            <div 
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() => row.bpjs_kesehatan_filename ? 
                openFilePreview(row.id, 'bpjs_kesehatan', row.bpjs_kesehatan_filename, row.bpjs_kesehatan_mimetype) : 
                openDocumentModal(row.id, 'bpjs_kesehatan', row.bpjs_kesehatan)
            }
            >
            {row.bpjs_kesehatan || 'View BPJS Health'}
            {row.bpjs_kesehatan_filename && (
                <div className="flex ml-2">
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'bpjs_kesehatan');
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
    { name: 'BPJS Social Security',
        cell: row => (
            <div 
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() => row.bpjs_ketenagakerjaan_filename ? 
                openFilePreview(row.id, 'bpjs_ketenagakerjaan', row.bpjs_ketenagakerjaan_filename, row.bpjs_ketenagakerjaan_mimetype) : 
                openDocumentModal(row.id, 'bpjs_ketenagakerjaan', row.bpjs_ketenagakerjaan)
            }
            >
            {row.bpjs_ketenagakerjaan || 'View BPJS Social Security'}
            {row.bpjs_ketenagakerjaan_filename && (
                <div className="flex ml-2">
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'bpjs_ketenagakerjaan');
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
    { name: 'Email', selector: row => row.alamat_email || '', sortable: true, width: "250px" },
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
    { name: 'Last Education', selector: row => row.pendidikan_terakhir || '', sortable: true },
    { name: 'CV', selector: row => row.cv || '', sortable: true, width: "150px" },
    { name: 'University', selector: row => row.universitas || '', sortable: true, width: "250px" },
    { name: 'Major', selector: row => row.jurusan || '', sortable: true, width: "200px" },
    { name: 'Shoe Size', selector: row => row.ukuran_sepatu || '', sortable: true, width: "150px" },
    { name: 'Coverall Size', selector: row => row.ukuran_coveroll || '', sortable: true, width: "150px" },
    { name: 'Bank Account Number',
        cell: row => (
            <div 
            className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
            onClick={() => row.nomor_rekening_filename ? 
                openFilePreview(row.id, 'nomor_rekening', row.nomor_rekening_filename, row.nomor_rekening_mimetype) : 
                openDocumentModal(row.id, 'nomor_rekening', row.nomor_rekening)
            }
            >
            {row.nomor_rekening ? `${row.nomor_rekening} (${row.bank || 'No Bank'})` : 'View Bank Account'}
            {row.nomor_rekening_filename && (
                <div className="flex ml-2">
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(row.id, 'nomor_rekening');
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
    { name: 'Bank Name', selector: row => row.nama_pemilik || '', sortable: true, width: "250px" },
    { name: 'Bank', selector: row => row.bank || '', sortable: true, width: "150px" }
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
      <StatBoxPertamina4Components 
        onFilterChange={handleFilterChange} 
        showCategories={['totemployes', 'duedate', 'call2', 'call1']} 
        activeFilter={activeFilter} // Parameter baru opsional
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
              ) : !users || users.length === 0 ? (
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

    
    {/* Footer*/}
    <FooterComponents/>
    </div>

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {docModalField === 'bpjs_kesehatan' ? 'BPJS Health' :
                docModalField === 'nik' ? 'KTP Number' :
                docModalField === 'no_kk' ? 'Family Card Number' :
                docModalField === 'npwp' ? 'NPWP Number' :
                docModalField === 'bpjs_ketenagakerjaan' ? 'BPJS Social Security' :
                docModalField === 'nomor_rekening' ? 'Bank Account Number' :
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
                  {docModalField === 'bpjs_kesehatan' ? 'BPJS Health' :
                  docModalField === 'nik' ? 'KTP Number' :
                  docModalField === 'no_kk' ? 'Family Card Number' :
                  docModalField === 'npwp' ? 'NPWP Number' :
                  docModalField === 'bpjs_ketenagakerjaan' ? 'BPJS Social Security' :
                  docModalField === 'nomor_rekening' ? 'Bank Account Number' :
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
          viewOnly={true} // Hanya mode lihat di halaman View
          apiPrefix="regional4"
        />
      )}

    </div>
</div>
  )
}

export default Pertamina4ViewProjectPage