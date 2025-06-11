import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import ButtonComponents from '../../../components/ButtonComponents';
import '../../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTrashCan, faDownload, faUpload, faFileAlt, faCalendarAlt, faUser, faEye, faSearch,faPlus, faHistory, faSync
} from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';
const HSE_ID = 'tarhse';

// StatBox Component
const StatBox = ({ variant, title, icon, value, onClick }) => {
  const variants = {
    total: "bg-white",
    duedate: "bg-red-100",
    call2: "bg-yellow-100",
    call1: "bg-green-100",
    nonactive: "bg-gray-200",
  };

  const iconColors = {
    total: "text-gray-500",
    duedate: "text-red-500",
    call2: "text-yellow-500",
    call1: "text-green-500",
    nonactive: "text-gray-700",
  };

  return (
    <div className="flex justify-center rounded w-full px-2">
      <div
        className={`${variants[variant]} flex flex-col w-full h-30 items-center justify-center rounded-lg shadow-md border border-gray-300 transition duration-300 cursor-pointer hover:shadow-lg p-4`}
        onClick={onClick}
      >
        {icon && (
          <div className={`mb-2 text-2xl mt-2 ${iconColors[variant]}`}>
            <FontAwesomeIcon icon={icon} />
          </div>
        )}
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
};

// StatBox Group Component
const StatBoxGroup = ({ title, boxes }) => {
  return (
    <div className="mb-4 bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-l-4 border-blue-500 pl-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {boxes.map((box, index) => (
          <StatBox
            key={index}
            variant={box.variant}
            icon={box.icon}
            title={box.title}
            value={box.value}
            onClick={box.onClick}
          />
        ))}
      </div>
    </div>
  );
};

const TarHSEPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State for MCU
  const [mcuData, setMcuData] = useState([]);
  const [selectedMcu, setSelectedMcu] = useState(null);
  const [showMcuForm, setShowMcuForm] = useState(false);
  const [mcuFormData, setMcuFormData] = useState({
    nama_karyawan: '',
    jabatan: '',
    tanggal_lahir: '',
    usia: '',
    jenis_kelamin: '',
    no_kontrak: '',
    awal_mcu: '',
    akhir_mcu: '',
    hasil_mcu: '',
    vendor_mcu: '',
    keterangan_mcu: ''
  });
  
  // State for HSE documents
  const [hseDocuments, setHseDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    uploadDate: new Date().toISOString().split('T')[0],
    awalBerlaku: '',
    akhirBerlaku: ''
  });
  const [documentFile, setDocumentFile] = useState(null);
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMCUFilter, setActiveMCUFilter] = useState('total');
  const [activeDocFilter, setActiveDocFilter] = useState('total');
  
  // State for pagination
  const [perPage, setPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);

  // State for history
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState(null);
  const [mcuHistory, setMcuHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // document iso
  // Add these to the existing state variables
const [isoDocuments, setIsoDocuments] = useState([]);
const [selectedIsoDocument, setSelectedIsoDocument] = useState(null);
const [showIsoDocumentForm, setShowIsoDocumentForm] = useState(false);
const [isoDocumentFormData, setIsoDocumentFormData] = useState({
  title: '',
  uploadDate: new Date().toISOString().split('T')[0],
  initialRegistrationDate: '',
  firstSurveillanceDate: '',
  secondSurveillanceDate: '',
  expiryDate: ''
});
const [isoDocumentFile, setIsoDocumentFile] = useState(null);
const [activeIsoDocFilter, setActiveIsoDocFilter] = useState('all');

// New function to check if a date is within 6 months
const isWithinSixMonths = (targetDateStr) => {
  if (!targetDateStr) return false;
  
  try {
    let targetDate;
    
    // Check if the date is in DD/MM/YYYY format
    if (typeof targetDateStr === 'string' && targetDateStr.includes('/')) {
      const [day, month, year] = targetDateStr.split('/');
      targetDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
      targetDate = new Date(targetDateStr);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    // Calculate the difference in milliseconds
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if it's within 6 months (approx 180 days)
    return diffDays >= 0 && diffDays <= 180;
  } catch (e) {
    console.error("Error calculating if within six months:", e);
    return false;
  }
};

// Function to fetch ISO documents
const fetchIsoDocuments = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`${API_BASE_URL}/tar-mcu/iso-documents`);
    setIsoDocuments(response.data?.data?.data || []);
  } catch (error) {
    console.error('Error fetching ISO documents:', error);
    setError('Failed to load ISO document data. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Add to the useEffect that loads data on component mount
useEffect(() => {
  fetchMcuData();
  fetchHseDocuments();
  fetchIsoDocuments(); // Add this line
}, []);

// Form handling for ISO documents
const handleIsoDocumentInputChange = (e) => {
  const { name, value } = e.target;
  setIsoDocumentFormData({
    ...isoDocumentFormData,
    [name]: value
  });
};

const handleIsoFileChange = (e) => {
  setIsoDocumentFile(e.target.files[0]);
};

const openIsoDocumentForm = (document = null) => {
  if (document) {
    // Edit mode
    setIsoDocumentFormData({
      title: document.title || '',
      uploadDate: document.upload_date ? new Date(document.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      initialRegistrationDate: document.initial_registration_date ? new Date(document.initial_registration_date).toISOString().split('T')[0] : '',
      firstSurveillanceDate: document.first_surveillance_date ? new Date(document.first_surveillance_date).toISOString().split('T')[0] : '',
      secondSurveillanceDate: document.second_surveillance_date ? new Date(document.second_surveillance_date).toISOString().split('T')[0] : '',
      expiryDate: document.expiry_date ? new Date(document.expiry_date).toISOString().split('T')[0] : ''
    });
    setSelectedIsoDocument(document);
  } else {
    // Add mode
    setIsoDocumentFormData({
      title: '',
      uploadDate: new Date().toISOString().split('T')[0],
      initialRegistrationDate: '',
      firstSurveillanceDate: '',
      secondSurveillanceDate: '',
      expiryDate: ''
    });
    setSelectedIsoDocument(null);
  }
  setIsoDocumentFile(null);
  setShowIsoDocumentForm(true);
};

const closeIsoDocumentForm = () => {
  setShowIsoDocumentForm(false);
  setSelectedIsoDocument(null);
  setIsoDocumentFile(null);
};

// CRUD operations for ISO documents
const saveIsoDocumentData = async () => {
  if (!isoDocumentFormData.title) {
    setMessage({
      text: 'Document title is required',
      type: 'error'
    });
    return;
  }
  
  if (!selectedIsoDocument && !isoDocumentFile) {
    setMessage({
      text: 'Document file is required',
      type: 'error'
    });
    return;
  }
  
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('title', isoDocumentFormData.title);
    formData.append('uploadDate', isoDocumentFormData.uploadDate);
    formData.append('initialRegistrationDate', isoDocumentFormData.initialRegistrationDate);
    formData.append('firstSurveillanceDate', isoDocumentFormData.firstSurveillanceDate);
    formData.append('secondSurveillanceDate', isoDocumentFormData.secondSurveillanceDate);
    formData.append('expiryDate', isoDocumentFormData.expiryDate);
    
    if (isoDocumentFile) {
      formData.append('file', isoDocumentFile);
    }
    
    if (selectedIsoDocument) {
      // Update document
      await axios.put(`${API_BASE_URL}/tar-mcu/iso-documents/${selectedIsoDocument.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({
        text: 'ISO document updated successfully',
        type: 'success'
      });
    } else {
      // Add new document
      await axios.post(`${API_BASE_URL}/tar-mcu/iso-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({
        text: 'ISO document added successfully',
        type: 'success'
      });
    }
    
    // Refresh document data
    fetchIsoDocuments();
    closeIsoDocumentForm();
  } catch (error) {
    console.error('Error saving ISO document:', error);
    setMessage({
      text: `Failed to save ISO document: ${error.response?.data?.message || error.message}`,
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};

const deleteIsoDocument = async (id) => {
  if (!window.confirm('Are you sure you want to delete this ISO document?')) {
    return;
  }
  
  setLoading(true);
  try {
    await axios.delete(`${API_BASE_URL}/tar-mcu/iso-documents/${id}`);
    setMessage({
      text: 'ISO document deleted successfully',
      type: 'success'
    });
    fetchIsoDocuments();
  } catch (error) {
    console.error('Error deleting ISO document:', error);
    setMessage({
      text: 'Failed to delete ISO document',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};

const viewIsoDocumentFile = (id) => {
  window.open(`${API_BASE_URL}/tar-mcu/iso-documents/${id}/view`, '_blank');
};

const downloadIsoDocumentFile = (id) => {
  window.open(`${API_BASE_URL}/tar-mcu/iso-documents/${id}/download`, '_blank');
};

// Get ISO document counts based on 6-month warning period
const getIsoDocumentCounts = () => {
  const counts = {
    total: 0,
    firstSurveillance: 0,
    secondSurveillance: 0,
    expiry: 0
  };
  
  if (!isoDocuments || !Array.isArray(isoDocuments)) return counts;
  
  // Count total documents
  counts.total = isoDocuments.length;
  
  // Count documents with dates within 6 months
  isoDocuments.forEach(doc => {
    if (isWithinSixMonths(doc.first_surveillance_date)) {
      counts.firstSurveillance++;
    }
    
    if (isWithinSixMonths(doc.second_surveillance_date)) {
      counts.secondSurveillance++;
    }
    
    if (isWithinSixMonths(doc.expiry_date)) {
      counts.expiry++;
    }
  });
  
  return counts;
};

// Filter ISO documents based on date type and 6-month period
const getFilteredIsoData = (data, searchTerm, filterType) => {
  if (!data || !Array.isArray(data)) return [];
  
  // If filterType is 'all', show all data
  if (filterType === 'all') {
    // If there's a search term, filter based on it
    if (searchTerm) {
      return data.filter(row => {
        if (!row) return false;
        if (typeof row !== 'object') return false;
        
        return Object.values(row).some(value => 
          value !== null && 
          value !== undefined &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    // If no search term, return all data
    return data;
  }
  
  // Filter based on the specific date type and if it's within 6 months
  const filtered = data.filter(doc => {
    switch (filterType) {
      case 'firstSurveillance':
        return isWithinSixMonths(doc.first_surveillance_date);
      case 'secondSurveillance':
        return isWithinSixMonths(doc.second_surveillance_date);
      case 'expiry':
        return isWithinSixMonths(doc.expiry_date);
      default:
        return true;
    }
  });
  
  // If there's a search term, filter further
  if (!searchTerm) return filtered;
  
  return filtered.filter(row => {
    if (!row) return false;
    if (typeof row !== 'object') return false;
    
    return Object.values(row).some(value => 
      value !== null && 
      value !== undefined &&
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
};

// Memoized filtered ISO document data
const filteredIsoDocuments = React.useMemo(() => 
  getFilteredIsoData(isoDocuments, searchTerm, activeIsoDocFilter),
  [isoDocuments, searchTerm, activeIsoDocFilter]
);

// Export ISO documents to Excel
const handleExportIsoDocuments = () => {
  exportToExcel(filteredIsoDocuments, 'tar_hse_iso_documents', 'iso');
};

// Prepare ISO document data for export
// Add this to the prepareDataForExport function's switch statement
/*
else if (exportType === 'iso') {
  // Format dates for ISO document export
  if (newItem.upload_date) newItem.upload_date = formatDateToDDMMYYYY(newItem.upload_date);
  if (newItem.initial_registration_date) newItem.initial_registration_date = formatDateToDDMMYYYY(newItem.initial_registration_date);
  if (newItem.first_surveillance_date) newItem.first_surveillance_date = formatDateToDDMMYYYY(newItem.first_surveillance_date);
  if (newItem.second_surveillance_date) newItem.second_surveillance_date = formatDateToDDMMYYYY(newItem.second_surveillance_date);
  if (newItem.expiry_date) newItem.expiry_date = formatDateToDDMMYYYY(newItem.expiry_date);
  
  // Select relevant columns for ISO documents
  return {
    title: newItem.title || '',
    file_name: newItem.file_name || '',
    upload_date: newItem.upload_date || '',
    initial_registration_date: newItem.initial_registration_date || '',
    first_surveillance_date: newItem.first_surveillance_date || '',
    second_surveillance_date: newItem.second_surveillance_date || '',
    expiry_date: newItem.expiry_date || ''
  };
}
*/

// DOCUMENT ISO
  
  // Date formatting function
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

  // Function to get days difference between dates
  const getDaysDifference = (endDate) => {
    if (!endDate) return null;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let endDateObj;
      
      // Check if the date is in DD/MM/YYYY format
      if (typeof endDate === 'string' && endDate.includes('/')) {
        const [day, month, year] = endDate.split('/');
        endDateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        endDateObj = new Date(endDate);
      }
      
      endDateObj.setHours(0, 0, 0, 0);
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days:", e);
      return null;
    }
  };

  // Function to fetch contract change history from API
  const fetchMCUHistory = async (id) => {
    if (!id) return;
    
    setLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/mcu/${id}/history`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setMcuHistory(response.data.data);
      } else {
        setMcuHistory([]);
        setHistoryError('Response format is invalid');
      }
    } catch (err) {
      console.error('Error fetching MCU history:', err);
      setHistoryError(err.response?.data?.message || 'Failed to fetch MCU history data');
    } finally {
      setLoadingHistory(false);
    }
  };

  const ColorLegend = () => {
    return (
        <div className="bg-white shadow rounded-lg p-4 mb-4">
        <h5 className="text-lg font-semibold mb-2 border-l-4 border-blue-500 pl-3">Color Status</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-300 mr-2"></div>
            <span className="text-sm">Data not yet entered/available</span>
            </div>
            <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Expired (negative days)</span>
            </div>
            <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-red-200 mr-2"></div>
            <span className="text-sm">Expiring soon (0-30 days)</span>
            </div>
            <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-yellow-200 mr-2"></div>
            <span className="text-sm">Remaining 2 (31-60 days)</span>
            </div>
            <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-200 mr-2"></div>
            <span className="text-sm">Remaining 1 (61-90 days)</span>
            </div>
            <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-100 mr-2"></div>
            <span className="text-sm">More than 90 days remaining</span>
            </div>
        </div>
        </div>
    );
    };

  // Function to download history as CSV
  const downloadMCUHistory = () => {
    if (mcuHistory.length === 0) {
      setHistoryError('No MCU history to download');
      return;
    }
    
    const headers = [
      'Change Time',
      'Employee Name',
      // MCU
      'Old MCU Start', 'Old MCU End', 'Old MCU Result', 'Old MCU Vendor',
      'New MCU Start', 'New MCU End', 'New MCU Result', 'New MCU Vendor',
      'Modified By'
    ];
    
    const rows = mcuHistory.map(history => [
      new Date(history.waktu_perubahan).toLocaleString('en-US'),
      history.nama_karyawan || '',
      // MCU
      formatDateToDDMMYYYY(history.awal_mcu_lama),
      formatDateToDDMMYYYY(history.akhir_mcu_lama),
      history.hasil_mcu_lama || '-',
      history.vendor_mcu_lama || '-',
      formatDateToDDMMYYYY(history.awal_mcu_baru),
      formatDateToDDMMYYYY(history.akhir_mcu_baru),
      history.hasil_mcu_baru || '-',
      history.vendor_mcu_baru || '-',
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
    link.setAttribute('download', `mcu-history-${selectedItemHistory?.nama_karyawan || 'data'}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to determine if a value has changed
  const valueChanged = (oldValue, newValue) => {
    if (oldValue === newValue) return false;
    if (!oldValue && !newValue) return false;
    return true;
  };

  // Status color and text functions
  const getStatusColor = (days) => {
    if (days === undefined || days === null) return 'bg-gray-300 text-gray-700'; // Data not entered yet
    if (days <= 30) return 'bg-red-500 text-white'; // Expired (0-30 days)
    if (days <= 60) return 'bg-yellow-200'; // Reminder 2 (31-60 days)
    if (days <= 90) return 'bg-green-200'; // Reminder 1 (61-90 days)
    return 'bg-gray-100'; // Normal (> 90 days)
  };

  const getStatusText = (days) => {
    if (days === undefined || days === null) return "No date yet";
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return "Expires today";
    return `${days} days left`;
  };

  // Data fetching functions
  const fetchMcuData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/mcu`);
      setMcuData(response.data || []);
    } catch (error) {
      console.error('Error fetching MCU data:', error);
      setError('Failed to load MCU data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHseDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/documents`);
      setHseDocuments(response.data?.data?.data || []);
    } catch (error) {
      console.error('Error fetching HSE documents:', error);
      setError('Failed to load document data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMcuData();
    fetchHseDocuments();
  }, []);

  // Check for updates from location state (after editing)
  useEffect(() => {
    if (location.state?.updatedMcu || location.state?.updatedDocument || location.state?.needRefresh) {
      fetchMcuData();
      fetchHseDocuments();
      
      if (location.state?.message) {
        setMessage({
          text: location.state.message,
          type: 'success'
        });
      }
      
      // Clear state to prevent re-fetching
      navigate('/tar-hse', { replace: true, state: {} });
    }
  }, [location.state, navigate]);
  
  // Form handling functions
  const handleMcuInputChange = (e) => {
    const { name, value } = e.target;
    setMcuFormData({
      ...mcuFormData,
      [name]: value
    });
  };
  
  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentFormData({
      ...documentFormData,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
  };
  
    const openMcuForm = (mcu) => {
      if (!mcu) {
        // Do nothing if trying to add a new employee
        return;
      }
      
      // Set form data for the selected employee
      setMcuFormData({
        nama_karyawan: mcu.nama_karyawan || '',
        jabatan: mcu.jabatan || '',
        tanggal_lahir: mcu.tanggal_lahir ? new Date(mcu.tanggal_lahir).toISOString().split('T')[0] : '',
        jenis_kelamin: mcu.jenis_kelamin || '',
        no_kontrak: mcu.no_kontrak || '',
        awal_mcu: mcu.awal_mcu ? new Date(mcu.awal_mcu).toISOString().split('T')[0] : '',
        akhir_mcu: mcu.akhir_mcu ? new Date(mcu.akhir_mcu).toISOString().split('T')[0] : '',
        hasil_mcu: mcu.hasil_mcu || '',
        vendor_mcu: mcu.vendor_mcu || '',
        keterangan_mcu: mcu.keterangan_mcu || ''
      });
      setSelectedMcu(mcu);
      setShowMcuForm(true);
  };
    
  const closeMcuForm = () => {
    setShowMcuForm(false);
    setSelectedMcu(null);
  };
  
  const openDocumentForm = (document = null) => {
    if (document) {
      // Edit mode
      setDocumentFormData({
        title: document.title || '',
        uploadDate: document.upload_date ? new Date(document.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        awalBerlaku: document.awal_berlaku ? new Date(document.awal_berlaku).toISOString().split('T')[0] : '',
        akhirBerlaku: document.akhir_berlaku ? new Date(document.akhir_berlaku).toISOString().split('T')[0] : ''
      });
      setSelectedDocument(document);
    } else {
      // Add mode
      setDocumentFormData({
        title: '',
        uploadDate: new Date().toISOString().split('T')[0],
        awalBerlaku: '',
        akhirBerlaku: ''
      });
      setSelectedDocument(null);
    }
    setDocumentFile(null);
    setShowDocumentForm(true);
  };
  
  const closeDocumentForm = () => {
    setShowDocumentForm(false);
    setSelectedDocument(null);
    setDocumentFile(null);
  };
  
  // CRUD operations
    const saveMcuData = async () => {
    setLoading(true);
    try {
      // Create an object with only the editable fields
      const editableMcuData = {
        awal_mcu: mcuFormData.awal_mcu,
        akhir_mcu: mcuFormData.akhir_mcu,
        hasil_mcu: mcuFormData.hasil_mcu,
        vendor_mcu: mcuFormData.vendor_mcu,
        keterangan_mcu: mcuFormData.keterangan_mcu
      };
      
      // Update MCU with only editable fields
      await axios.put(`${API_BASE_URL}/tar-mcu/mcu/${selectedMcu.id}/editable`, editableMcuData);
      setMessage({
        text: 'MCU data updated successfully',
        type: 'success'
      });
      
      // Refresh MCU data
      fetchMcuData();
      closeMcuForm();
    } catch (error) {
      console.error('Error saving MCU data:', error);
      setMessage({
        text: `Failed to save MCU data: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveDocumentData = async () => {
    if (!documentFormData.title) {
      setMessage({
        text: 'Document title is required',
        type: 'error'
      });
      return;
    }
    
    if (!selectedDocument && !documentFile) {
      setMessage({
        text: 'Document file is required',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', documentFormData.title);
      formData.append('uploadDate', documentFormData.uploadDate);
      formData.append('awalBerlaku', documentFormData.awalBerlaku);
      formData.append('akhirBerlaku', documentFormData.akhirBerlaku);
      
      if (documentFile) {
        formData.append('file', documentFile);
      }
      
      if (selectedDocument) {
        // Update document
        await axios.put(`${API_BASE_URL}/tar-mcu/documents/${selectedDocument.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage({
          text: 'Document updated successfully',
          type: 'success'
        });
      } else {
        // Add new document
        await axios.post(`${API_BASE_URL}/tar-mcu/documents`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage({
          text: 'Document added successfully',
          type: 'success'
        });
      }
      
      // Refresh document data
      fetchHseDocuments();
      closeDocumentForm();
    } catch (error) {
      console.error('Error saving document:', error);
      setMessage({
        text: `Failed to save document: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteMcuData = async (id) => {
    if (!window.confirm('Are you sure you want to delete this MCU data?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/tar-mcu/mcu/${id}`);
      setMessage({
        text: 'MCU data deleted successfully',
        type: 'success'
      });
      fetchMcuData();
    } catch (error) {
      console.error('Error deleting MCU data:', error);
      setMessage({
        text: 'Failed to delete MCU data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/tar-mcu/documents/${id}`);
      setMessage({
        text: 'Document deleted successfully',
        type: 'success'
      });
      fetchHseDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage({
        text: 'Failed to delete document',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const viewDocumentFile = (id) => {
    window.open(`${API_BASE_URL}/tar-mcu/documents/${id}/view`, '_blank');
  };
  
  const downloadDocumentFile = (id) => {
    window.open(`${API_BASE_URL}/tar-mcu/documents/${id}/download`, '_blank');
  };
  
  // Helper to close notification
  const closeMessage = () => {
    setMessage({ text: '', type: '' });
  };
  
  // Filter data based on expiration status
  const filterByStatus = (data, filterType, dateField) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    return data.filter(item => {
      // If filterType is 'total', show all items
      if (filterType === 'all') {
        return true;
      }
      
      // Only filter based on date if filterType is not 'all'
      if (!item[dateField]) {
        return filterType === 'expired';
      }
      
      const days = getDaysDifference(item[dateField]);
      
      switch (filterType) {
        case 'reminder2':
          return days > 0 && days <= 30;
        case 'reminder1':
          return days > 30 && days <= 60;
        case 'normal':
          return days > 60 && days <= 90;
        case 'expired':
          return days <= 0;
        default:
          return true;
      }
    });
  };
  
  // Filter data based on search term
  const getFilteredData = (data, searchTerm, filterType, dateField) => {
    if (!data || !Array.isArray(data)) return [];
    
    // If filterType is 'all', show all data
    if (filterType === 'all') {
      // If there's a search term, filter based on it
      if (searchTerm) {
        return data.filter(row => {
          if (!row) return false;
          if (typeof row !== 'object') return false;
          
          return Object.values(row).some(value => 
            value !== null && 
            value !== undefined &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }
      // If no search term, return all data
      return data;
    }
    
    // Filter based on status and expiration dates
    const filtered = data.filter(doc => {
      if (!doc[dateField] && filterType === 'expired') {
        return true; // Documents with no expiry date are considered expired
      }
      
      if (!doc[dateField]) {
        return false;
      }
      
      const days = getDaysDifference(doc[dateField]);
      
      switch (filterType) {
        case 'reminder2':
          return days > 30 && days <= 60;
        case 'reminder1':
          return days > 60 && days <= 90;
        case 'normal':
          return days > 90;
        case 'expired':
          return days <= 30;
        default:
          return true;
      }
    });
    
    // If there's a search term, filter further
    if (!searchTerm) return filtered;
    
    return filtered.filter(row => {
      if (!row) return false;
      if (typeof row !== 'object') return false;
      
      return Object.values(row).some(value => 
        value !== null && 
        value !== undefined &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };
  
  // Memoized filtered data
  const filteredMcuData = React.useMemo(() => 
    getFilteredData(mcuData, searchTerm, activeMCUFilter, 'akhir_mcu'),
    [mcuData, searchTerm, activeMCUFilter]
  );
  
  const filteredDocuments = React.useMemo(() => 
    getFilteredData(hseDocuments, searchTerm, activeDocFilter, 'akhir_berlaku'),
    [hseDocuments, searchTerm, activeDocFilter]
  );
  
  // Calculate counts for StatBoxes
  const getMCUCounts = () => {
    const counts = {
      total: 0,
      reminder2: 0,
      reminder1: 0,
      normal: 0,
      expired: 0
    };
    
    if (!mcuData || !Array.isArray(mcuData)) return counts;
    
    // Count total employees
    counts.total = mcuData.length;
    
    // Count employees with no MCU
    const noMcuCount = mcuData.filter(employee => !employee.akhir_mcu).length;
    counts.expired += noMcuCount;
    
    mcuData.forEach(employee => {
      if (employee.akhir_mcu) {
        const days = getDaysDifference(employee.akhir_mcu);
        
        if (days <= 0) {
          counts.expired++;
        } else if (days <= 30) {
          counts.reminder2++;
        } else if (days <= 60) {
          counts.reminder1++;
        } else if (days <= 90) {
          counts.normal++;
        }
      }
    });
    
    return counts;
  };
  
  const getDocumentCounts = () => {
    const counts = {
      total: 0,
      reminder2: 0,
      reminder1: 0,
      normal: 0,
      expired: 0
    };
    
    if (!hseDocuments || !Array.isArray(hseDocuments)) return counts;
    
    // Count total documents
    counts.total = hseDocuments.length;
    
    // Count documents with no expiration date
    const noExpiryCount = hseDocuments.filter(doc => !doc.akhir_berlaku).length;
    counts.expired += noExpiryCount;
    
    hseDocuments.forEach(doc => {
      if (doc.akhir_berlaku) {
        const days = getDaysDifference(doc.akhir_berlaku);
        
        if (days <= 30) {
          counts.expired++;
        } else if (days <= 60) {
          counts.reminder2++;
        } else if (days <= 90) {
          counts.reminder1++;
        } else {
          counts.normal++;
        }
      }
    });
    
    return counts;
  };
  
  // StatBox data
  const mcuCounts = getMCUCounts();
  const documentCounts = getDocumentCounts();

  // Custom StatBox for HSE Documents (replacing StatBoxGroup)
  const DocumentStatBox = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeDocFilter === 'all' ? 'border-2 border-blue-500' : ''}`}
          onClick={() => setActiveDocFilter('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Documents</p>
              <h3 className="text-2xl font-bold">{documentCounts.total}</h3>
              <p className="text-xs text-blue-500">All Documents</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeDocFilter === 'reminder2' ? 'border-2 border-yellow-500' : ''}`}
          onClick={() => setActiveDocFilter('reminder2')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reminder 2</p>
              <h3 className="text-2xl font-bold">{documentCounts.reminder2}</h3>
              <p className="text-xs text-yellow-600">31-60 Days Remaining</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeDocFilter === 'reminder1' ? 'border-2 border-green-500' : ''}`}
          onClick={() => setActiveDocFilter('reminder1')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reminder 1</p>
              <h3 className="text-2xl font-bold">{documentCounts.reminder1}</h3>
              <p className="text-xs text-green-600">61-90 Days Remaining</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeDocFilter === 'expired' ? 'border-2 border-red-500' : ''}`}
          onClick={() => setActiveDocFilter('expired')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reminder & Exp Doc</p>
              <h3 className="text-2xl font-bold">{documentCounts.expired}</h3>
              <p className="text-xs text-red-500">0-30 Days Remaining</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Keep the MCU StatBoxes with the original component style
  const mcuStatBoxes = {
    title: "MCU Statistics",
    boxes: [
      {
        variant: 'total',
        icon: faCalendarAlt,
        title: 'Total MCU',
        value: mcuCounts.total,
        onClick: () => setActiveMCUFilter('total')
      },
      {
        variant: 'duedate',
        icon: faCalendarAlt,
        title: 'MCU Expiring Soon',
        value: mcuCounts.reminder2,
        onClick: () => setActiveMCUFilter('reminder2')
      },
      {
        variant: 'nonactive',
        icon: faCalendarAlt,
        title: 'Expired MCU',
        value: mcuCounts.expired,
        onClick: () => setActiveMCUFilter('expired')
      }
    ]
  };
  
  // Table columns
  const documentColumns = [
    { 
      name: 'Actions', 
      cell: row => (
        <div className="flex gap-2">
          {row.file_path && (
            <>
              <button 
                onClick={() => viewDocumentFile(row.id)} 
                className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
                title="View Document"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
              <button 
                onClick={() => downloadDocumentFile(row.id)} 
                className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
                title="Download Document"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
            </>
          )}
          <button 
            onClick={() => openDocumentForm(row)} 
            className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
            title="Edit Document"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button 
            onClick={() => deleteDocument(row.id)} 
            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
            title="Delete Document"
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      ), 
      width: "150px",
      ignoreRowClick: true,
    },
    { 
      name: 'Status', 
      cell: row => {
        const daysRemaining = row.akhir_berlaku ? getDaysDifference(row.akhir_berlaku) : undefined;
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
            {getStatusText(daysRemaining)}
          </div>
        );
      }, 
      sortable: true, 
      width: "150px" 
    },
    { name: 'Title', selector: row => row.title || '', sortable: true, width: "300px" },
    { name: 'Upload Date', selector: row => row.upload_date || '', sortable: true, width: "200px", cell: row => formatDateToDDMMYYYY(row.upload_date) },
    { name: 'Start Date', selector: row => row.awal_berlaku || '', sortable: true, width: "200px", cell: row => formatDateToDDMMYYYY(row.awal_berlaku) },
    { name: 'End Date', selector: row => row.akhir_berlaku || '', sortable: true, width: "200px", cell: row => formatDateToDDMMYYYY(row.akhir_berlaku) },
  ];

  // ISO Document columns for the data table
const isoDocumentColumns = [
  { 
    name: 'Actions', 
    cell: row => (
      <div className="flex gap-2">
        {row.file_path && (
          <>
            <button 
              onClick={() => viewIsoDocumentFile(row.id)} 
              className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
              title="View Document"
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
            <button 
              onClick={() => downloadIsoDocumentFile(row.id)} 
              className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
              title="Download Document"
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
          </>
        )}
        <button 
          onClick={() => openIsoDocumentForm(row)} 
          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
          title="Edit Document"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </button>
        <button 
          onClick={() => deleteIsoDocument(row.id)} 
          className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
          title="Delete Document"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      </div>
    ), 
    width: "150px",
    ignoreRowClick: true,
  },
  {
  name: 'Status',
  cell: row => {
    // Function to check if a date is within 6 months
    const isWithinSixMonths = (dateStr) => {
      if (!dateStr) return false;
      
      try {
        const targetDate = new Date(dateStr);
        const today = new Date();
        
        // Calculate diff in milliseconds
        const diffTime = targetDate.getTime() - today.getTime();
        
        // Convert to days
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Check if within 6 months (approx 180 days)
        return diffDays >= 0 && diffDays <= 180;
      } catch (error) {
        console.error("Error checking if date is within six months:", error);
        return false;
      }
    };
    
    // Function to calculate days difference
    const getDaysDifference = (targetDate) => {
      if (!targetDate) return null;
      
      try {
        let targetDateObj;
        
        // Check if the date is in string format
        if (typeof targetDate === 'string') {
          // If date includes time part (T), remove it
          if (targetDate.includes('T')) {
            targetDate = targetDate.split('T')[0];
          }
          
          // Parse the date
          targetDateObj = new Date(targetDate);
        } else {
          targetDateObj = new Date(targetDate);
        }
        
        // Set time to midnight for accurate day calculation
        targetDateObj.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate difference in milliseconds, then convert to days
        const diffTime = targetDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
      } catch (error) {
        console.error("Error calculating days difference:", error);
        return null;
      }
    };
    
    // Check which dates are within 6 months
    const firstSurveillanceAlert = isWithinSixMonths(row.first_surveillance_date);
    const secondSurveillanceAlert = isWithinSixMonths(row.second_surveillance_date);
    const expiryAlert = isWithinSixMonths(row.expiry_date);
    
    // Get days difference for each date
    const firstSurveillanceDays = getDaysDifference(row.first_surveillance_date);
    const secondSurveillanceDays = getDaysDifference(row.second_surveillance_date);
    const expiryDays = getDaysDifference(row.expiry_date);
    
    let statusText = "No upcoming dates";
    let statusClass = "bg-gray-100";
    let daysText = "";
    
    // Determine which alert to show (priority: expiry > second surveillance > first surveillance)
    if (expiryAlert && expiryDays !== null) {
      statusText = "Expiry date ";
      statusClass = "bg-red-100 text-red-700";
      daysText = expiryDays > 0 ? 
        `${expiryDays} day${expiryDays !== 1 ? 's' : ''} left` : 
        expiryDays === 0 ? "Today" : "Expired";
    } else if (secondSurveillanceAlert && secondSurveillanceDays !== null) {
      statusText = "2nd surveillance ";
      statusClass = "bg-yellow-100 text-yellow-700";
      daysText = secondSurveillanceDays > 0 ? 
        `${secondSurveillanceDays} day${secondSurveillanceDays !== 1 ? 's' : ''} left` : 
        secondSurveillanceDays === 0 ? "Today" : "Overdue";
    } else if (firstSurveillanceAlert && firstSurveillanceDays !== null) {
      statusText = "1st surveillance ";
      statusClass = "bg-green-100 text-green-700";
      daysText = firstSurveillanceDays > 0 ? 
        `${firstSurveillanceDays} day${firstSurveillanceDays !== 1 ? 's' : ''} left` : 
        firstSurveillanceDays === 0 ? "Today" : "Overdue";
    }
    
    return (
      <div className={`px-3 py-1 rounded-full ${statusClass}`}>
        {statusText} {daysText && `( ${daysText} )`}
      </div>
    );
  }, 
  sortable: true,
  width: "300px" // Increased width to accommodate the additional text
},
  { name: 'Title', selector: row => row.title || '', sortable: true, width: "450px" },
  { name: 'Upload Date', selector: row => row.upload_date || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.upload_date) },
  { name: 'Initial Registration', selector: row => row.initial_registration_date || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.initial_registration_date) },
  { name: '1st Surveillance', selector: row => row.first_surveillance_date || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.first_surveillance_date) },
  { name: '2nd Surveillance', selector: row => row.second_surveillance_date || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.second_surveillance_date) },
  { name: 'Expiry Date', selector: row => row.expiry_date || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.expiry_date) },
];

// ISO Document StatBox Component
const IsoDocumentStatBox = () => {
  const isoDocumentCounts = getIsoDocumentCounts();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div
        className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeIsoDocFilter === 'all' ? 'border-2 border-blue-500' : ''}`}
        onClick={() => setActiveIsoDocFilter('all')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total ISO Documents</p>
            <h3 className="text-2xl font-bold">{isoDocumentCounts.total}</h3>
            <p className="text-xs text-blue-500">All Documents</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeIsoDocFilter === 'firstSurveillance' ? 'border-2 border-green-500' : ''}`}
        onClick={() => setActiveIsoDocFilter('firstSurveillance')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">1st Surveillance Date</p>
            <h3 className="text-2xl font-bold">{isoDocumentCounts.firstSurveillance}</h3>
            <p className="text-xs text-green-600">Due within 6 months</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeIsoDocFilter === 'secondSurveillance' ? 'border-2 border-yellow-500' : ''}`}
        onClick={() => setActiveIsoDocFilter('secondSurveillance')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">2nd Surveillance Date</p>
            <h3 className="text-2xl font-bold">{isoDocumentCounts.secondSurveillance}</h3>
            <p className="text-xs text-yellow-600">Due within 6 months</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeIsoDocFilter === 'expiry' ? 'border-2 border-red-500' : ''}`}
        onClick={() => setActiveIsoDocFilter('expiry')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Expiry Date</p>
            <h3 className="text-2xl font-bold">{isoDocumentCounts.expiry}</h3>
            <p className="text-xs text-red-500">Due within 6 months</p>
          </div>
          <div className="bg-red-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// DOcument ISO
  
  const mcuColumns = [
    { 
      name: 'Actions', 
      cell: row => (
        <div className="flex gap-2">
          <button 
            onClick={() => openMcuForm(row)} 
            className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
            title="Edit MCU Data"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button 
            onClick={() => {
              setSelectedItemHistory(row);
              setShowHistoryModal(true);
              fetchMCUHistory(row.id);
            }} 
            className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
            title="Change History"
          >
            <FontAwesomeIcon icon={faHistory} />
          </button>
        </div>
      ), 
      width: "120px",
      ignoreRowClick: true,
    },
    { 
      name: 'MCU Status', 
      cell: row => {
        const daysRemaining = row.akhir_mcu ? getDaysDifference(row.akhir_mcu) : undefined;
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
            {getStatusText(daysRemaining)}
          </div>
        );
      }, 
      sortable: true, 
      width: "180px" 
    },
    { name: 'Employee Name', selector: row => row.nama_karyawan || '', sortable: true, width: "250px" },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "200px" },
    { name: 'Gender', selector: row => row.jenis_kelamin || '', sortable: true, width: "120px" },
    { name: 'Contract No', selector: row => row.no_kontrak || '', sortable: true, width: "150px" },
    { name: 'Birth Date', selector: row => row.tanggal_lahir || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.tanggal_lahir) },
    { name: 'Age', selector: row => row.usia || '', sortable: true, width: "120px" },
    { name: 'MCU Start Date', selector: row => row.awal_mcu || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.awal_mcu) },
    { name: 'MCU End Date', selector: row => row.akhir_mcu || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.akhir_mcu) },
    { name: 'MCU Result', selector: row => row.hasil_mcu || '', sortable: true, width: "150px" },
    { name: 'MCU Vendor', selector: row => row.vendor_mcu || '', sortable: true, width: "200px" },
  ];
  
  // Table style
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

  // Function to export data to Excel
  const prepareDataForExport = (data, exportType) => {
    if (!data || data.length === 0) return [];
    
    const formattedData = data.map(item => {
      const newItem = { ...item };
      
      if (exportType === 'mcu') {
        // Format dates for MCU export
        if (newItem.tanggal_lahir) newItem.tanggal_lahir = formatDateToDDMMYYYY(newItem.tanggal_lahir);
        if (newItem.awal_mcu) newItem.awal_mcu = formatDateToDDMMYYYY(newItem.awal_mcu);
        if (newItem.akhir_mcu) newItem.akhir_mcu = formatDateToDDMMYYYY(newItem.akhir_mcu);
        
        // Add MCU status as a column
        const daysRemaining = newItem.akhir_mcu ? getDaysDifference(newItem.akhir_mcu) : null;
        newItem.mcu_status = getStatusText(daysRemaining);
        
        // Select relevant columns for MCU
        return {
          nama_karyawan: newItem.nama_karyawan || '',
          jabatan: newItem.jabatan || '',
          jenis_kelamin: newItem.jenis_kelamin || '',
          no_kontrak: newItem.no_kontrak || '',
          usia: newItem.usia || '',
          tanggal_lahir: newItem.tanggal_lahir || '',
          awal_mcu: newItem.awal_mcu || '',
          akhir_mcu: newItem.akhir_mcu || '',
          hasil_mcu: newItem.hasil_mcu || '',
          vendor_mcu: newItem.vendor_mcu || '',
          mcu_status: newItem.mcu_status || '',
          keterangan_mcu: newItem.keterangan_mcu || ''
        };
      } else if (exportType === 'document') {
        // Format dates for document export
        if (newItem.upload_date) newItem.upload_date = formatDateToDDMMYYYY(newItem.upload_date);
        if (newItem.awal_berlaku) newItem.awal_berlaku = formatDateToDDMMYYYY(newItem.awal_berlaku);
        if (newItem.akhir_berlaku) newItem.akhir_berlaku = formatDateToDDMMYYYY(newItem.akhir_berlaku);
        
        // Add document status as a column
        const daysRemaining = newItem.akhir_berlaku ? getDaysDifference(newItem.akhir_berlaku) : null;
        newItem.document_status = getStatusText(daysRemaining);
        
        // Select relevant columns for documents
        return {
          title: newItem.title || '',
          file_name: newItem.file_name || '',
          upload_date: newItem.upload_date || '',
          awal_berlaku: newItem.awal_berlaku || '',
          akhir_berlaku: newItem.akhir_berlaku || '',
          document_status: newItem.document_status || ''
        };
      }
      
      return newItem;
    });
    
    return formattedData;
  };
  
  const exportToExcel = (dataToExport, fileName, exportType) => {
    if (!dataToExport || dataToExport.length === 0) {
      setMessage({ text: 'No data to export', type: 'error' });
      return;
    }
    
    try {
      // Prepare data for export
      const formattedData = prepareDataForExport(dataToExport, exportType);
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      
      // Set sheet name based on export type
      const sheetName = exportType === 'mcu' ? 'MCU Data' : 'HSE Documents';
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      
      setMessage({ 
        text: `Data successfully exported to ${fileName}.xlsx`, 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ 
        text: `Export failed: ${error.message}`, 
        type: 'error' 
      });
    }
  };
  
  // Handle export buttons
  const handleExportMCU = () => {
    exportToExcel(filteredMcuData, 'tar_mcu_data', 'mcu');
  };
  
  const handleExportDocuments = () => {
    exportToExcel(filteredDocuments, 'tar_hse_documents', 'document');
  };

  return (
    <div className='bg-(--background-tar-color)'> 
      <div className="flex">
        <div className='h-screen fixed left-0 top-0'>
          {/* Sidebar = Aside */}
          <AsideComponents />
        </div>
        
        {/* Main Content (Header, Main, Footer) */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
          {/* Header */}
          <div className='w-fill h-hug py-3'>
            <HeaderComponents />
          </div>
          
          <Link to='/hse'>
            <ButtonComponents variant="back">&lt; Back</ButtonComponents>
          </Link>
          
          {/* Main Content */}
          <main className="flex-1">
            <h1 className="text-2xl font-bold mb-4 mt-2 text-center">TAR HSE Management</h1>
            
            {message.text && (
              <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
                <button className="float-right" onClick={closeMessage}>×</button>
              </div>
            )}
            
            {/* Global Search */}
            <div className='relative w-full max-w-lg mb-4 mx-auto'>
              <span className='absolute inset-y-0 left-0 pl-3 flex items-center'>
                <FontAwesomeIcon icon={faMagnifyingGlass} className='text-gray-400'/>
              </span>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Search all data..." 
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-lg' 
              />
            </div>
            
            {/* Loading or Error Message */}
            {loading && mcuData.length === 0 && hseDocuments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-xl">Loading data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-red-50 rounded-lg">
                <p className="text-red-500 text-xl">{error}</p>
              </div>
            ) : (
              <>
                {/* Documents Section */}
                <section className="mb-8">
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-l-4 border-blue-500 pl-3">HSE Document CSMS</h2>
                    <DocumentStatBox />
                  
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        {activeDocFilter === 'all' ? 'All Documents' : 
                        activeDocFilter === 'reminder2' ? 'Reminder 2 (31-60 days)' : 
                        activeDocFilter === 'reminder1' ? 'Reminder 1 (61-90 days)' :
                        'Reminder & Expired Documents (0-30 days)'}
                      </h4>
                      
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
                          onClick={() => openDocumentForm()}
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" />
                          Add Document
                        </button>
                        {/* <button 
                          className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center"
                          onClick={handleExportDocuments}
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2" />
                          Export Documents
                        </button> */}
                      </div>
                    </div>
                    
                    <DataTable 
                      columns={documentColumns}
                      data={filteredDocuments}
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 25, 50]}
                      customStyles={customStyles}
                      highlightOnHover
                      striped
                      responsive
                      noDataComponent={
                        <div className="p-4 text-center text-gray-500">
                          No document data available matching the current filters.
                        </div>
                      }
                    />
                  </div>
                </section>

                {/* ISO Document Section */}
                <section className="mb-8">
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-l-4 border-blue-500 pl-3">HSE Document ISO</h2>
                    <IsoDocumentStatBox />
                  
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        {activeIsoDocFilter === 'all' ? 'All ISO Documents' : 
                        activeIsoDocFilter === 'firstSurveillance' ? '1st Surveillance Documents' : 
                        activeIsoDocFilter === 'secondSurveillance' ? '2nd Surveillance Documents' :
                        'Documents Approaching Expiry'}
                      </h4>
                      
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
                          onClick={() => openIsoDocumentForm()}
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" />
                          Add ISO Document
                        </button>
                        {/* <button 
                          className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center"
                          onClick={handleExportIsoDocuments}
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2" />
                          Export ISO Documents
                        </button> */}
                      </div>
                    </div>
                    
                    <DataTable 
                      columns={isoDocumentColumns}
                      data={filteredIsoDocuments}
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 25, 50]}
                      customStyles={customStyles}
                      highlightOnHover
                      striped
                      responsive
                      noDataComponent={
                        <div className="p-4 text-center text-gray-500">
                          No ISO document data available matching the current filters.
                        </div>
                      }
                    />
                  </div>
                </section>

                
                {/* MCU Section */}
                <section className="mb-8">
                  <StatBoxGroup {...mcuStatBoxes} />

                      {/* Add Color Legend Component */}
                            <ColorLegend />
                  
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">MCU Data {activeMCUFilter !== 'total' && `(Filter: ${activeMCUFilter})`}</h2>
                      
                      <div className="flex gap-2">
                        {/* Only keep the export button */}
                        <button 
                          className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center"
                          onClick={handleExportMCU}
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2" />
                          Export MCU Data
                        </button>
                      </div>
                    </div>
                    
                    <DataTable 
                      columns={mcuColumns}
                      data={filteredMcuData}
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 25, 50]}
                      customStyles={customStyles}
                      highlightOnHover
                      striped
                      responsive
                      noDataComponent={
                        <div className="p-4 text-center text-gray-500">
                          No MCU data available matching the current filters.
                        </div>
                      }
                    />
                  </div>
                </section>
              </>
            )}

            {showIsoDocumentForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{selectedIsoDocument ? 'Edit ISO Document' : 'Add New ISO Document'}</h3>
                    <button 
                      onClick={closeIsoDocumentForm}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={isoDocumentFormData.title}
                        onChange={handleIsoDocumentInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Date
                      </label>
                      <input
                        type="date"
                        name="uploadDate"
                        value={isoDocumentFormData.uploadDate}
                        onChange={handleIsoDocumentInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Initial Registration Date
                        </label>
                        <input
                          type="date"
                          name="initialRegistrationDate"
                          value={isoDocumentFormData.initialRegistrationDate}
                          onChange={handleIsoDocumentInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          1st Surveillance Date
                        </label>
                        <input
                          type="date"
                          name="firstSurveillanceDate"
                          value={isoDocumentFormData.firstSurveillanceDate}
                          onChange={handleIsoDocumentInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          2nd Surveillance Date
                        </label>
                        <input
                          type="date"
                          name="secondSurveillanceDate"
                          value={isoDocumentFormData.secondSurveillanceDate}
                          onChange={handleIsoDocumentInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={isoDocumentFormData.expiryDate}
                          onChange={handleIsoDocumentInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedIsoDocument ? 'Replace File (Optional)' : 'Upload Document File'}
                        {!selectedIsoDocument && <span className="text-red-500">*</span>}
                      </label>
                      <div className="border border-gray-300 rounded-md p-4">
                        <input
                          type="file"
                          onChange={handleIsoFileChange}
                          className="w-full"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                        />
                        {selectedIsoDocument?.file_name && (
                          <div className="mt-2 text-sm text-gray-600">
                            Current file: {selectedIsoDocument.file_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeIsoDocumentForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveIsoDocumentData}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            
            {/* MCU Form Modal */}
            {showMcuForm && selectedMcu && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit MCU Data - {selectedMcu.nama_karyawan}</h3>
                    <button 
                      onClick={closeMcuForm}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Employee Info - Read-only section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-100 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Employee Name:</p>
                      <p className="font-semibold">{selectedMcu.nama_karyawan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Position:</p>
                      <p className="font-semibold">{selectedMcu.jabatan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contract Number:</p>
                      <p className="font-semibold">{selectedMcu.no_kontrak || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender:</p>
                      <p className="font-semibold">{selectedMcu.jenis_kelamin || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth:</p>
                      <p className="font-semibold">{formatDateToDDMMYYYY(selectedMcu.tanggal_lahir) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age:</p>
                      <p className="font-semibold">{selectedMcu.usia || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-300 my-4 pt-4">
                    <h4 className="font-semibold mb-4">MCU Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MCU Start Date
                        </label>
                        <input
                          type="date"
                          name="awal_mcu"
                          value={mcuFormData.awal_mcu}
                          onChange={handleMcuInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MCU End Date
                        </label>
                        <input
                          type="date"
                          name="akhir_mcu"
                          value={mcuFormData.akhir_mcu}
                          onChange={handleMcuInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MCU Result
                        </label>
                        <select
                          name="hasil_mcu"
                          value={mcuFormData.hasil_mcu}
                          onChange={handleMcuInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Result</option>
                          <option value="P1">P1</option>
                          <option value="P2">P2</option>
                          <option value="P3">P3</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MCU Vendor
                        </label>
                        <input
                          type="text"
                          name="vendor_mcu"
                          value={mcuFormData.vendor_mcu}
                          onChange={handleMcuInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comments
                      </label>
                      <textarea
                        name="keterangan_mcu"
                        value={mcuFormData.keterangan_mcu}
                        onChange={handleMcuInputChange}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeMcuForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveMcuData}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save MCU Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Document Form Modal */}
            {showDocumentForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{selectedDocument ? 'Edit Document' : 'Add New Document'}</h3>
                    <button 
                      onClick={closeDocumentForm}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={documentFormData.title}
                        onChange={handleDocumentInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Date
                      </label>
                      <input
                        type="date"
                        name="uploadDate"
                        value={documentFormData.uploadDate}
                        onChange={handleDocumentInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="awalBerlaku"
                          value={documentFormData.awalBerlaku}
                          onChange={handleDocumentInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="akhirBerlaku"
                          value={documentFormData.akhirBerlaku}
                          onChange={handleDocumentInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedDocument ? 'Replace File (Optional)' : 'Upload Document File'}
                        {!selectedDocument && <span className="text-red-500">*</span>}
                      </label>
                      <div className="border border-gray-300 rounded-md p-4">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="w-full"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                        />
                        {selectedDocument?.file_name && (
                          <div className="mt-2 text-sm text-gray-600">
                            Current file: {selectedDocument.file_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeDocumentForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveDocumentData}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
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
                      HSE Change History - {selectedItemHistory.nama_karyawan}
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
                        <p className="text-sm text-gray-600">MCU Active Until:</p>
                        <p className="font-semibold">{formatDateToDDMMYYYY(selectedItemHistory.akhir_mcu) || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mb-4">
                      <h4 className="text-lg font-medium">Change List</h4>
                      <div className="flex space-x-2">
                        {mcuHistory.length > 0 && (
                          <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                            onClick={downloadMCUHistory}
                          >
                            <FontAwesomeIcon icon={faDownload} className="mr-2" />
                            Download History
                          </button>
                        )}
                        <button
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                          onClick={() => fetchMCUHistory(selectedItemHistory.id)}
                        >
                          <FontAwesomeIcon icon={faSync} className="mr-2" />
                          Refresh History
                        </button>
                      </div>
                    </div>
                    
                    {loadingHistory ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                        <p className="text-gray-500">Loading change history...</p>
                      </div>
                    ) : historyError ? (
                      <div className="text-center py-4 bg-red-50 rounded">
                        <p className="text-red-500">{historyError}</p>
                      </div>
                    ) : mcuHistory.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No contract change history yet</p>
                        <p className="text-gray-400 text-sm mt-1">History will appear when you change MCU data</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified By</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {mcuHistory.map((history, index) => {
                              // Determine changes for more compact display
                              const changes = [];
                              
                              // MCU changes
                              if (valueChanged(history.hasil_mcu_lama, history.hasil_mcu_baru)) {
                                changes.push({
                                  field: 'MCU Result',
                                  oldValue: history.hasil_mcu_lama || '-',
                                  newValue: history.hasil_mcu_baru || '-'
                                });
                              }
                              
                              if (valueChanged(history.vendor_mcu_lama, history.vendor_mcu_baru)) {
                                changes.push({
                                  field: 'MCU Vendor',
                                  oldValue: history.vendor_mcu_lama || '-',
                                  newValue: history.vendor_mcu_baru || '-'
                                });
                              }
                              
                              if (valueChanged(history.awal_mcu_lama, history.awal_mcu_baru)) {
                                changes.push({
                                  field: 'MCU Start Date',
                                  oldValue: formatDateToDDMMYYYY(history.awal_mcu_lama) || '-',
                                  newValue: formatDateToDDMMYYYY(history.awal_mcu_baru) || '-'
                                });
                              }
                              
                              if (valueChanged(history.akhir_mcu_lama, history.akhir_mcu_baru)) {
                                changes.push({
                                  field: 'MCU End Date',
                                  oldValue: formatDateToDDMMYYYY(history.akhir_mcu_lama) || '-',
                                  newValue: formatDateToDDMMYYYY(history.akhir_mcu_baru) || '-'
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
                                        {new Date(history.waktu_perubahan).toLocaleString('en-US')}
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

          </main>
          
          {/* Footer */}
          <FooterComponents />
        </div>
      </div>
    </div>
  );
};

export default TarHSEPage;