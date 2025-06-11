import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import View2XBudget from '../../../components/budget/View2XBudget';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import StatBoxPertamina2XComponents from '../../../components/projectcom/StatBoxPertamina2XComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faDownload, faFileAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import { faFileExcel } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

const Pertamina2XViewProjectPage = () => {
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

    // State untuk preview dokumen
    const [previewModal, setPreviewModal] = useState({
        show: false, fileUrl: null, fileType: null, fieldName: '', fileName: ''
    });

    // State untuk document modal
    const [showDocModal, setShowDocModal] = useState(false);
    const [docModalId, setDocModalId] = useState(null);
    const [docModalField, setDocModalField] = useState(null);
    const [docModalValue, setDocModalValue] = useState('');

    // State untuk modal sertifikat
    const [sertifikatModal, setSertifikatModal] = useState({
        isOpen: false, userId: null, userName: ''
    });

    // Fungsi untuk Sertifikat Modal
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

    // Function untuk document modal
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
        
        const fileUrl = `${API_BASE_URL}/regional2x/users/${id}/download/${field}`;
        
        // Format field names for display
        const fieldDisplayNames = {
            no_ktp: 'KTP Number', 
            no_kk: 'Family Card Number', 
            no_npwp: 'NPWP Number', 
            bpjs_kesehatan: 'BPJS Health',
            bpjstk: 'BPJS Social Security',
            no_rekening: 'Bank Account'
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
                `${API_BASE_URL}/regional2x/users/${userId}/download/${docType}`,
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
            // First try to fetch data from the view endpoint
            const response = await axios.get(`${API_BASE_URL}/regional2x/users`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                params: {
                    format: 'json'
                },
                timeout: 15000
            }).catch(error => {
                // If view endpoint fails, fall back to users endpoint
                return axios.get(`${API_BASE_URL}/regional2x/users`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                });
            });
            
            if (response.data) {
                if (Array.isArray(response.data)) {
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

    // Status color based on days remaining
    const getStatusColor = (days) => {
        if (days < 0) return 'bg-red-500 text-white'; // Kontrak berakhir
        if (days <= 14) return 'bg-red-200'; // Kurang dari 2 minggu
        if (days <= 30) return 'bg-yellow-200'; // Kurang dari 1 bulan
        if (days <= 45) return 'bg-green-200'; // Kurang dari 6 minggu
        return 'bg-gray-100'; // Default
    };

    // Status text based on days remaining
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
        exportToExcel(backendData, 'all_employee_data_regional2x');
    };

    const handleExportSelectedData = () => {
        if (!selectedRows || selectedRows.length === 0) {
            setMessage({ text: 'Select at least one row of data to export', type: 'error' });
            return;
        }
        exportToExcel(selectedRows, 'selected_employee_data');
    };

    // Filter functions
    const handleFilter = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (filterType) => {
        setActiveFilter(filterType);
        setSearchTerm('');
    };

    // Filter data based on search term and active filter
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
        { name: 'Contract Number', selector: row => row.no_kontrak || '', sortable: true, width: "350px"},
        { name: 'Full Name', selector: row => row.nama_lengkap || '', sortable: true, width: "550px" },
        { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "350px" },
        { name: 'Vendor ID', selector: row => row.nik_vendor || '', sortable: true, width: "150px" },
        { name: 'Tender Package', selector: row => row.paket_tender || '', sortable: true, width: "200px" },
        { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal)},
        { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir)},
        { name: 'Place & Date of Birth', selector: row => row.tempat_tanggal_lahir || '', sortable: true, width: "250px" },
        { name: 'Gender', selector: row => row.jenis_kelamin || '', sortable: true, width: "150px" },
        { name: 'Marital Status', selector: row => row.status_pernikahan || '', sortable: true, width: "150px" },
        { name: 'CV', selector: row => row.cv || '', sortable: true, width: "150px" },
        { name: 'Phone Number', selector: row => row.no_telpon || '', sortable: true, width: "150px" },
        { name: 'Email', selector: row => row.email || '', sortable: true, width: "550px" },
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
        { name: 'Emergency Contact', selector: row => row.kontak_darurat || '', sortable: true, width: "350px" },
        { name: 'Mother\'s Name', selector: row => row.nama_ibu_kandung || '', sortable: true, width: "180px" },
        { name: 'KTP Number',
            cell: row => (
                <div 
                    className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700" 
                    onClick={() => row.no_ktp_filename ? openFilePreview(row.id, 'no_ktp', row.no_ktp_filename, row.no_ktp_mimetype) : openDocumentModal(row.id, 'no_ktp', row.no_ktp)}
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
                            <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="Preview File" />
                        </div>
                    )}
                </div>
            ),
            width: '250px'
        },
        { name: 'KTP Address', selector: row => row.alamat_KTP || '', sortable: true },
        { name: 'Domicile Address', selector: row => row.alamat_domisili || '', sortable: true },
        { name: 'Educational Institution', selector: row => row.nama_institute_pendidikan || '', sortable: true, width: "350px" },
        { name: 'Major', selector: row => row.jurusan || '', sortable: true, width: "350px" },
        { name: 'Family Card Number',
            cell: row => (
                <div 
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700" 
                onClick={() => row.no_kk_filename ? openFilePreview(row.id, 'no_kk', row.no_kk_filename, row.no_kk_mimetype) : openDocumentModal(row.id, 'no_kk', row.no_kk)}
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
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="Preview File" />
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
                onClick={() => row.no_npwp_filename ? openFilePreview(row.id, 'no_npwp', row.no_npwp_filename, row.no_npwp_mimetype) : openDocumentModal(row.id, 'no_npwp', row.no_npwp)}
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
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="Preview File" />
                    </div>
                )}
                </div>
            ),
            width: '250px'
        },
        { name: 'Bank Name', selector: row => row.nama_bank || '', sortable: true, width: "150px" },
        { name: 'Account Number',
            cell: row => (
                <div 
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700" 
                onClick={() => row.no_rekening_filename ? openFilePreview(row.id, 'no_rekening', row.no_rekening_filename, row.no_rekening_mimetype) : openDocumentModal(row.id, 'no_rekening', row.no_rekening)}
                >
                {row.no_rekening || 'No Data'}
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
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="Preview File" />
                    </div>
                )}
                </div>
            ),
            width: '250px'
        },
        { name: 'Bank Account Name', selector: row => row.nama_rekening || '', sortable: true, width: "350px" },
        { name: 'BPJS Health',
            cell: row => (
                <div 
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700" 
                onClick={() => row.bpjs_kesehatan_filename ? openFilePreview(row.id, 'bpjs_kesehatan', row.bpjs_kesehatan_filename, row.bpjs_kesehatan_mimetype) : openDocumentModal(row.id, 'bpjs_kesehatan', row.bpjs_kesehatan)}
                >
                {row.bpjs_kesehatan || 'No Data'}
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
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="Preview File" />
                    </div>
                )}
                </div>
            ),
            width: '250px'
        },
        { name: 'BPJS Health Details', selector: row => row.bpjs_kesehatan_keterangan || '', sortable: true, width: "200px" },
        { name: 'Spouse Health Insurance', selector: row => row.bpjs_kesehatan_suami_istri || '', sortable: true, width: "180px" },
        { name: 'Child 1 BPJS', selector: row => row.bpjs_anak1 || '', sortable: true, width: "150px" },
        { name: 'Child 2 BPJS', selector: row => row.bpjs_anak2 || '', sortable: true, width: "150px" },
        { name: 'Child 3 BPJS', selector: row => row.bpjs_anak3 || '', sortable: true, width: "150px" },
        { name: 'BPJS Social Security',
            cell: row => (
                <div 
                className="cursor-pointer flex items-center text-blue-500 hover:text-blue-700" 
                onClick={() => row.bpjstk_filename ? openFilePreview(row.id, 'bpjstk', row.bpjstk_filename, row.bpjstk_mimetype) : openDocumentModal(row.id, 'bpjstk', row.bpjstk)}
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
                    <FontAwesomeIcon icon={faEye} className="text-blue-500 hover:text-blue-700" title="Preview File" />
                    </div>
                )}
                </div>
            ),
            width: '250px'
        },
        { name: 'Other Insurance', selector: row => row.asuransi_lainnya || '', sortable: true, width: "250px" },
        { name: 'Net Salary', selector: row => row.gaji_net || '', sortable: true, width: "150px", cell: row => row.gaji_net ? `Rp ${parseFloat(row.gaji_net).toLocaleString('id-ID', {minimumFractionDigits: 2})}` : '-' }
    ];

    const customStyles = {
        rows: { style:{ minHeight:'60px' } },
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

    const handleDataChange = (data) => {
        // Anda bisa melakukan sesuatu dengan data yang diterima dari komponen View2XBudget
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
                            <StatBoxPertamina2XComponents 
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
                            ) : filteredData.length === 0 ? (
                                <div className="p-6 text-center bg-gray-50 rounded">
                                    <p className="text-gray-500">No user data matching the search "{searchTerm}".</p>
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
                                            No data matching the filter.
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

                        <br /> <br /> <br />
                        {/* Integrasi View2XBudget */}
                        <div className="budget-summary-section">
                            <View2XBudget 
                                embedded={true} 
                                apiUrl="/api/reg2xbudget" 
                                onDataChange={handleDataChange}
                            />
                        </div>
                    </main>
                    
                    {/* Footer*/}
                    <FooterComponents/>
                </div>
            </div>

            {/* Document Modal - Read Only */}
            {showDocModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {docModalField === 'bpjs_kesehatan' ? 'BPJS Health' :
                                docModalField === 'no_ktp' ? 'KTP Number' :
                                docModalField === 'no_kk' ? 'Family Card Number' :
                                docModalField === 'no_npwp' ? 'NPWP Number' :
                                docModalField === 'bpjstk' ? 'BPJS Social Security' :
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
                                    {docModalField === 'bpjs_kesehatan' ? 'BPJS Health' :
                                    docModalField === 'no_ktp' ? 'KTP Number' :
                                    docModalField === 'no_kk' ? 'Family Card Number' :
                                    docModalField === 'no_npwp' ? 'NPWP Number' :
                                    docModalField === 'bpjstk' ? 'BPJS Social Security' :
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
                    apiPrefix="regional2x"
                />
            )}
        </div>
    );
};

export default Pertamina2XViewProjectPage;