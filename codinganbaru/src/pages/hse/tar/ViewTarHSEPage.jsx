import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import ButtonComponents from '../../../components/ButtonComponents';
import '../../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faDownload, faFileAlt, faCalendarAlt, faUser, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

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

const ViewTarHSEPage = () => {
  const location = useLocation();
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State for MCU
  const [mcuData, setMcuData] = useState([]);
  
  // State for HSE documents
  const [hseDocuments, setHseDocuments] = useState([]);
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMCUFilter, setActiveMCUFilter] = useState('total');
  const [activeDocFilter, setActiveDocFilter] = useState('total');
  
  // State for pagination
  const [perPage, setPerPage] = useState(10);

  // Tambahkan state untuk ISO documents
const [isoDocuments, setIsoDocuments] = useState([]);
const [activeIsoDocFilter, setActiveIsoDocFilter] = useState('all');

// Fungsi untuk cek apakah tanggal dalam jangka waktu 6 bulan
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

// Tambahkan ke useEffect
useEffect(() => {
  fetchMcuData();
  fetchHseDocuments();
  fetchIsoDocuments(); // Add this line
}, []);

// ISO document actions
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

// Add to prepareDataForExport function
// Tambahkan kode berikut ke dalam fungsi prepareDataForExport yang sudah ada:
// else if (exportType === 'iso') {
//   // Format dates for ISO document export
//   if (newItem.upload_date) newItem.upload_date = formatDateToDDMMYYYY(newItem.upload_date);
//   if (newItem.initial_registration_date) newItem.initial_registration_date = formatDateToDDMMYYYY(newItem.initial_registration_date);
//   if (newItem.first_surveillance_date) newItem.first_surveillance_date = formatDateToDDMMYYYY(newItem.first_surveillance_date);
//   if (newItem.second_surveillance_date) newItem.second_surveillance_date = formatDateToDDMMYYYY(newItem.second_surveillance_date);
//   if (newItem.expiry_date) newItem.expiry_date = formatDateToDDMMYYYY(newItem.expiry_date);
//   
//   // Select relevant columns for ISO documents
//   return {
//     title: newItem.title || '',
//     file_name: newItem.file_name || '',
//     upload_date: newItem.upload_date || '',
//     initial_registration_date: newItem.initial_registration_date || '',
//     first_surveillance_date: newItem.first_surveillance_date || '',
//     second_surveillance_date: newItem.second_surveillance_date || '',
//     expiry_date: newItem.expiry_date || ''
//   };
// }
  
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

  // Status color and text functions
  const getStatusColor = (days) => {
    if (days === undefined || days === null) return 'bg-gray-300 text-gray-700'; // Data not yet entered
    if (days <= 30) return 'bg-red-500 text-white'; // Expired (0-30 days)
    if (days <= 60) return 'bg-yellow-200'; // Reminder 2 (31-60 days)
    if (days <= 90) return 'bg-green-200'; // Reminder 1 (61-90 days)
    return 'bg-gray-100'; // Normal (> 90 days)
  };

  // Function to get priority value for sorting (lower = higher priority)
const getStatusPriority = (days) => {
    if (days === undefined || days === null) return 5; // Lowest priority for no data
    if (days < 0) return 1; // Highest priority for expired
    if (days <= 30) return 2; // High priority for expiring soon (within 1 month)
    if (days <= 60) return 3; // Medium priority (within 2 months)
    if (days <= 90) return 4; // Lower priority (within 3 months)
    return 5; // Lowest priority for dates far in the future
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

  // Helper to close notification
  const closeMessage = () => {
    setMessage({ text: '', type: '' });
  };
  
  // Document actions
  const viewDocumentFile = (id) => {
    window.open(`${API_BASE_URL}/tar-mcu/documents/${id}/view`, '_blank');
  };
  
  const downloadDocumentFile = (id) => {
    window.open(`${API_BASE_URL}/tar-mcu/documents/${id}/download`, '_blank');
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
  
  // Filter data based on expiration status
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

  // Apply priority sorting to data
const applyPrioritySort = (data, dateField) => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      const daysA = getDaysDifference(a[dateField]);
      const daysB = getDaysDifference(b[dateField]);
      
      const priorityA = getStatusPriority(daysA);
      const priorityB = getStatusPriority(daysB);
      
      // Sort by priority first (lower number = higher priority)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort by days within that priority (less days = higher priority)
      if (daysA !== null && daysB !== null) {
        return daysA - daysB;
      }
      
      // Handle cases where one or both dates are null
      if (daysA === null && daysB !== null) return 1;
      if (daysA !== null && daysB === null) return -1;
      
      // Default case if both are null or equal
      return 0;
    });
};
  
  // Memoized filtered data
  const filteredMcuData = React.useMemo(() => {
    const filtered = getFilteredData(mcuData, searchTerm, activeMCUFilter, 'akhir_mcu');
    return applyPrioritySort(filtered, 'akhir_mcu');
  }, [mcuData, searchTerm, activeMCUFilter]);
  
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

  // Custom StatBox for HSE Documents
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
  
  // Table columns - Read-only version (removed action buttons except view/download for documents)
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
    { name: 'Effective Date', selector: row => row.awal_berlaku || '', sortable: true, width: "200px", cell: row => formatDateToDDMMYYYY(row.awal_berlaku) },
    { name: 'Expired Date', selector: row => row.akhir_berlaku || '', sortable: true, width: "200px", cell: row => formatDateToDDMMYYYY(row.akhir_berlaku) },
  ];

  // ISO Document columns for the data table (view-only)
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
        </div>
      ), 
      width: "150px",
      ignoreRowClick: true,
    },
    { 
      name: 'Status', 
      cell: row => {
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
  
  const mcuColumns = [
    { 
      name: 'MCU Status', 
    selector: row => {
        const days = getDaysDifference(row.akhir_mcu);
        return getStatusPriority(days); // For sorting purposes
    },
      cell: row => {
        const daysRemaining = row.akhir_mcu ? getDaysDifference(row.akhir_mcu) : undefined;
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
            {getStatusText(daysRemaining)}
          </div>
        );
      }, 
      sortable: true, 
    sortFunction: (rowA, rowB) => {
        const daysA = getDaysDifference(rowA.akhir_mcu);
        const daysB = getDaysDifference(rowB.akhir_mcu);
        
        const priorityA = getStatusPriority(daysA);
        const priorityB = getStatusPriority(daysB);
        
        return priorityA - priorityB;
    },
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
            <h1 className="text-2xl font-bold mb-4 mt-2 text-center">TAR HSE Management (View Only)</h1>
            
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
                        activeDocFilter === 'reminder2' ? 'Reminder 2' : 
                        activeDocFilter === 'reminder1' ? 'Reminder 1' :
                        'Reminder & Expired Documents'}
                      </h4>
                      
                      <div className="flex gap-2">
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
                      <h4 className="text-xl font-semibold">
                        {activeMCUFilter === 'total' ? 'All MCU Data' : 
                        activeMCUFilter === 'reminder2' ? 'MCU Expiring Soon (31-60 days)' : 
                        'Expired MCU (0-30 days)'}
                      </h4>
                      
                      <div className="flex gap-2">
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
          </main>
          
          {/* Footer */}
          <FooterComponents />
        </div>
      </div>
    </div>
  );
};

export default ViewTarHSEPage;