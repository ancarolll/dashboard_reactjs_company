import React, { useState, useEffect } from 'react';
import StatBoxTarComponents from './StatBoxTarComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faDownload, faFileAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://localhost:3005/api';

const ViewTarSection = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Data state
  const [mcuData, setMcuData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('totemployes');
  
  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    show: false, fileUrl: null, fileType: null, fieldName: '', fileName: ''
  });

  // Document modal state - ADDED
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalField, setDocModalField] = useState(null);
  const [docModalId, setDocModalId] = useState(null);
  const [docModalValue, setDocModalValue] = useState('');
  
  // Fetch data on component mount
  useEffect(() => {
    fetchEmployeeData();
  }, []);
  
  // Fetch employee data from API
  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      // PERBAIKAN: Gunakan endpoint normal dulu, karena endpoint view mungkin belum siap
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/mcu`);
      
      // PERBAIKAN: Tangani respons baik dari endpoint view maupun endpoint biasa
      let employeeData = [];
      if (response.data && Array.isArray(response.data)) {
        employeeData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        employeeData = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        employeeData = response.data.data;
      }
      
      
      // Process data to ensure no null values
      const processedData = employeeData.map(employee => {
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
      setMessage({
        text: `Failed to load employee data: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
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

  // Open file preview
  const openFilePreview = (id, field, filename, mimetype) => {
    // If no file, don't open preview
    if (!filename) {
      setMessage({
        text: `No file for ${field}`,
        type: 'info'
      });
      return;
    }
    
    const fileUrl = `${API_BASE_URL}/tar-mcu/mcu/file/${id}/${field}`;
    
    // Format field name for display
    const fieldDisplayNames = {
      bpjs: 'BPJS Health', nik: 'KTP Number', kk: 'Family Card', npwp: 'NPWP Number', kpj: 'BPJS Social Number', norek: 'Bank Account Number'
    };
    
    setPreviewModal({
      show: true, 
      fileUrl, 
      fileType: mimetype, 
      fieldName: fieldDisplayNames[field] || field, 
      fileName: filename
    });
  };

  // Open document modal for a specific field - ADDED
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
      setShowDocModal(true);
    }
  };

  // Close document modal - ADDED
  const closeDocumentModal = () => {
    setShowDocModal(false);
    setDocModalId(null);
    setDocModalField(null);
    setDocModalValue('');
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
  
  // Filter data based on search term
  useEffect(() => {
    if (!mcuData || mcuData.length === 0) return;
    
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
  
  // Define table columns - Action column is removed for view-only mode
  const columns = [
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
    { name: 'KTP Number',
        cell: row => (
            <div 
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
                onClick={() => row.nik_filename ? 
                    openFilePreview(row.id, 'nik', row.nik_filename, row.nik_mimetype) : 
                    openDocumentModal(row.id, 'nik', row.nik)
                }
            >
                {row.nik || '-'}
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
                onClick={() =>
                    row.kk_filename
                    ? openFilePreview(row.id, 'kk', row.kk_filename, row.kk_mimetype)
                    : openDocumentModal(row.id, 'kk', row.kk)
                }
            >
                {row.kk || '-'}
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
    { name: 'NPWP Number',
        cell: row => (
            <div
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
                onClick={() =>
                    row.npwp_filename
                    ? openFilePreview(row.id, 'npwp', row.npwp_filename, row.npwp_mimetype)
                    : openDocumentModal(row.id, 'npwp', row.npwp)
                }
            >
                {row.npwp || '-'}
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
    { name: 'BPJS Health ',
        cell: row => (
            <div
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
                onClick={() =>
                    row.bpjs_filename
                    ? openFilePreview(row.id, 'bpjs', row.bpjs_filename, row.bpjs_mimetype)
                    : openDocumentModal(row.id, 'bpjs', row.bpjs)
                }
            >
                {row.bpjs || '-'}
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
                {row.kpj || '-'}
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
    { name: 'Bank Account Number',
        cell: row => (
            <div
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700"
                onClick={() =>
                    row.norek_filename
                    ? openFilePreview(row.id, 'norek', row.norek_filename, row.norek_mimetype)
                    : openDocumentModal(row.id, 'norek', row.norek)
                }
            >
                {row.norek ? `${row.norek} (${row.bank || 'No Bank'})` : '-'}
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
    { name: 'Major', selector: row => row.jurusan || '', sortable: true, width: '250px' },
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
      
      {/* Error display - PERBAIKAN: Tampilkan error jika ada */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700">
          {error}
          <button className="float-right" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* Search and Actions - Remove Add Employee button */}
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
        
        {/* Export action only */}
        <div>
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
        {/* PERBAIKAN: Tampilkan isi data awal jika DataTable error */}
        {filteredData.length > 0 ? (
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
              </div>
            }
          />
        ) : loading ? (
          <div className="flex justify-center items-center p-10">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-4">Loading data...</span>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No employee data available</p>
            <button
              onClick={fetchEmployeeData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Reload Data
            </button>
          </div>
        )}
      </div>

      {/* Document Modal - ADDED */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {docModalField === 'bpjs' ? 'BPJS Health Information' :
                 docModalField === 'nik' ? 'KTP Number Information' :
                 docModalField === 'kk' ? 'Family Card Number Information' :
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
                  {docModalField === 'bpjs' ? 'BPJS Health Number (13 characters)' :
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
    </div>
  );
};

export default ViewTarSection;