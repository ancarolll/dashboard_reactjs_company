import  React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faCalendarAlt, faIdCard, faCarAlt } from '@fortawesome/free-solid-svg-icons';
import DataTable from 'react-data-table-component';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

// StatBox Component
const StatBox = ({ variant, title, icon, value, onClick }) => {
  const variants = {
      totemployes: "bg-white",
      duedate: "bg-red-100",
      call2: "bg-yellow-100",
      call1: "bg-green-100",
      nonactive: "bg-gray-200",
  };
  
  const iconColors = {
      totemployes: "text-gray-500",
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

  const ViewRegional2SHSEPage = () => {

    // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendData, setBackendData] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMCUFilter, setActiveMCUFilter] = useState('all');
  const [activeHSEFilter, setActiveHSEFilter] = useState('all');
  const [activeSIMLFilter, setActiveSIMLFilter] = useState('all');
  
  // State for pagination
  const [perPage, setPerPage] = useState(10);
  
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
      if (!endDate) return null; // Return null untuk data tanggal yang belum diisi
      
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
      if (days === undefined || days === null) return 'bg-gray-300 text-gray-700'; // Warna untuk data belum diisi
      if (days < 0) return 'bg-red-500 text-white'; // Expired
      if (days <= 30) return 'bg-red-200'; // Less than 2 weeks
      if (days <= 60) return 'bg-yellow-200'; // Less than 1 month
      if (days <= 90) return 'bg-green-200'; // Less than 6 weeks
      return 'bg-gray-100'; // Default
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
  
  const debouncedFetchData = useCallback(() => {
      const timer = setTimeout(() => {
      fetchDataFromBackend();
      }, 300);
      
      return () => clearTimeout(timer);
  }, []);
  
  const getStatusText = (days) => {
      if (days === undefined || days === null) return "No date available";
      if (days < 0) return `Expired ${Math.abs(days)} days ago`;
      if (days === 0) return "EOC";
      return `${days} days left`;
  };
  
  // Data fetching function
  const fetchDataFromBackend = async () => {
      setLoading(true);
      setError(null);
      
      try {
      const response = await axios.get(`${API_BASE_URL}/regional2s/hse-data`, {
          headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
          },
          timeout: 15000,
          // Tambahkan parameter untuk mencegah caching
          params: {
          _t: new Date().getTime()
          }
      });
      
      if (response.data) {
          if (Array.isArray(response.data)) {
          setBackendData(response.data);
          } else if (response.data.data && Array.isArray(response.data.data)) {
          setBackendData(response.data.data);
          } else {
          setError("Data received from server is not valid");
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
      
      console.error(errorMessage);
      setError(errorMessage);
      setBackendData([]);
      } finally {
      setLoading(false);
      }
  };
  
  // Filter data based on search term
  const getFilteredData = (data, searchTerm, filterType, dateField) => {
      if (!data || !Array.isArray(data)) return [];
      
      // Tampilkan semua data jika filter "all" 
      if (filterType === 'all') {
      // Jika ada pencarian, filter berdasarkan pencarian
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
      // Jika tidak ada pencarian, tampilkan semua data
      return data;
      }
      
      // Filter berdasarkan status dan pencarian
      let statusFiltered = data.filter(employee => {
      // Jika filterType bukan 'all', filter berdasarkan tanggal
      if (!employee[dateField]) {
          // Khusus untuk 'nonactive', tampilkan juga yang belum memiliki tanggal
          return filterType === 'nonactive';
      }
      
      const days = getDaysDifference(employee[dateField]);
      
      switch (filterType) {
          case 'duedate':
          return days >= 0 && days <= 30;
          case 'call2':
          return days > 30 && days <= 60;
          case 'call1':
          return days > 60 && days <= 90;
          case 'nonactive':
          return days < 0;
          default:
          return true;
      }
      });
      
      // Filter berdasarkan pencarian jika ada
      if (!searchTerm) return statusFiltered;
      
      return statusFiltered.filter(row => {
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
  
  // Memoized filtered data for each table with priority sorting
  const mcuFilteredData = React.useMemo(() => {
      const filtered = getFilteredData(backendData, searchTerm, activeMCUFilter, 'akhir_mcu');
      return applyPrioritySort(filtered, 'akhir_mcu');
  }, [backendData, searchTerm, activeMCUFilter]);
  
  const hseFilteredData = React.useMemo(() => {
      const filtered = getFilteredData(backendData, searchTerm, activeHSEFilter, 'akhir_hsepassport');
      return applyPrioritySort(filtered, 'akhir_hsepassport');
  }, [backendData, searchTerm, activeHSEFilter]);
  
  const simlFilteredData = React.useMemo(() => {
      const filtered = getFilteredData(backendData, searchTerm, activeSIMLFilter, 'akhir_siml');
      return applyPrioritySort(filtered, 'akhir_siml');
  }, [backendData, searchTerm, activeSIMLFilter]);
  
  // Calculate counts for StatBoxes
  const getMCUCounts = () => {
      const counts = {
      total: 0,
      duedate: 0,
      call2: 0,
      call1: 0,
      nonactive: 0
      };
      
      if (!backendData || !Array.isArray(backendData)) return counts;
      
      // Hitung total semua karyawan
      counts.total = backendData.length;
      
      // Hitung jumlah yang belum ada MCU
      const noMcuCount = backendData.filter(employee => !employee.akhir_mcu).length;
      
      // Tambahkan yang belum memiliki MCU ke nonactive
      counts.nonactive += noMcuCount;
      
      backendData.forEach(employee => {
      if (employee.akhir_mcu) {
          const days = getDaysDifference(employee.akhir_mcu);
          
          if (days < 0) {
          counts.nonactive++;
          } else if (days <= 30) {
          counts.duedate++;
          } else if (days <= 60) {
          counts.call2++;
          } else if (days <= 90) {
          counts.call1++;
          }
      }
      });
      
      return counts;
  };
  
  const getHSECounts = () => {
      const counts = {
      total: 0,
      duedate: 0,
      call2: 0,
      call1: 0,
      nonactive: 0
      };
      
      if (!backendData || !Array.isArray(backendData)) return counts;
      
      // Total semua karyawan, termasuk yang belum memiliki tanggal HSE Passport
      counts.total = backendData.length;
  
      // Hitung jumlah yang belum ada HSE
      const noHseCount = backendData.filter(employee => !employee.akhir_hsepassport).length;
      
      // Tambahkan yang belum memiliki HSE ke nonactive
      counts.nonactive += noHseCount;
      
      backendData.forEach(employee => {
      if (employee.akhir_hsepassport) {
          const days = getDaysDifference(employee.akhir_hsepassport);
          
          if (days < 0) {
          counts.nonactive++;
          } else if (days <= 30) {
          counts.duedate++;
          } else if (days <= 60) {
          counts.call2++;
          } else if (days <= 90) {
          counts.call1++;
          }
      }
      });
      
      return counts;
  };
  
  const getSIMLCounts = () => {
      const counts = {
      total: 0,
      duedate: 0,
      call2: 0,
      call1: 0,
      nonactive: 0
      };
      
      if (!backendData || !Array.isArray(backendData)) return counts;
      
      // Total semua karyawan, termasuk yang belum memiliki tanggal SIM
      counts.total = backendData.length;
  
      // Hitung jumlah yang belum ada MCU
      const noSimlCount = backendData.filter(employee => !employee.akhir_siml).length;
      
      // Tambahkan yang belum memiliki MCU ke nonactive
      counts.nonactive += noSimlCount;
  
      
      backendData.forEach(employee => {
      if (employee.akhir_siml) {
          const days = getDaysDifference(employee.akhir_siml);
          
          if (days < 0) {
          counts.nonactive++;
          } else if (days <= 30) {
          counts.duedate++;
          } else if (days <= 60) {
          counts.call2++;
          } else if (days <= 90) {
          counts.call1++;
          }
      }
      });
      
      return counts;
  };
  
  // Fetch data on component mount
  useEffect(() => {
      debouncedFetchData();
  }, [debouncedFetchData]);
  
  // StatBox data
  const mcuCounts = getMCUCounts();
  const hseCounts = getHSECounts();
  const simlCounts = getSIMLCounts();
  
  const mcuStatBoxes = {
      title: "MCU Statistics",
      boxes: [
      {
          variant: 'totemployes',
          icon: faCalendarAlt,
          title: 'Total MCU',
          value: mcuCounts.total,
          onClick: () => setActiveMCUFilter('all')
      },
      {
          variant: 'duedate',
          icon: faCalendarAlt,
          title: 'Expiring Soon',
          value: mcuCounts.duedate,
          onClick: () => setActiveMCUFilter('duedate')
      },
      {
          variant: 'nonactive',
          icon: faCalendarAlt,
          title: 'Expired MCU',
          value: mcuCounts.nonactive,
          onClick: () => setActiveMCUFilter('nonactive')
      }
      ]
  };
  
  const hseStatBoxes = {
      title: "HSE Passport Statistics",
      boxes: [
      {
          variant: 'totemployes',
          icon: faIdCard,
          title: 'Total HSE Passport',
          value: hseCounts.total,
          onClick: () => setActiveHSEFilter('all')
      },
      {
          variant: 'duedate',
          icon: faIdCard,
          title: 'Expiring Soon',
          value: hseCounts.duedate,
          onClick: () => setActiveHSEFilter('duedate')
      },
      {
          variant: 'nonactive',
          icon: faIdCard,
          title: 'Expired HSE',
          value: hseCounts.nonactive,
          onClick: () => setActiveHSEFilter('nonactive')
      }
      ]
  };
  
  const simlStatBoxes = {
      title: "SIM Statistics",
      boxes: [
      {
          variant: 'totemployes',
          icon: faCarAlt,
          title: 'Total SIM',
          value: simlCounts.total,
          onClick: () => setActiveSIMLFilter('all')
      },
      {
          variant: 'duedate',
          icon: faCarAlt,
          title: 'Expiring Soon',
          value: simlCounts.duedate,
          onClick: () => setActiveSIMLFilter('duedate')
      },
      {
          variant: 'nonactive',
          icon: faCarAlt,
          title: 'Expired SIM',
          value: simlCounts.nonactive,
          onClick: () => setActiveSIMLFilter('nonactive')
      }
      ]
  };
  
  // Table column definitions (without action column)
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
      width: "150px"
      },
      { name: 'Reason NA', selector: row => row.sebab_na || '', sortable: true, width: "150px" },
      { name: 'Employee Name', selector: row => row.nama_lengkap || '', sortable: true, width: "250px" },
      { name: 'NIK', selector: row => row.no_ktp || '', sortable: true, width: "250px" },
      { name: 'NIK Vendor', selector: row => row.nik_vendor || '', sortable: true, width: "250px" },
      { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "300px" },
      { name: 'Date of Birth', selector: row => row.tempat_tanggal_lahir || '', sortable: true, width: "200px" },
      { name: 'MCU Start Date', selector: row => row.awal_mcu || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.awal_mcu) },
      { name: 'MCU End Date', selector: row => row.akhir_mcu || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.akhir_mcu) },
      { name: 'MCU Result', selector: row => row.hasil_mcu || '', sortable: true, width: "150px" },
      { name: 'MCU Vendor', selector: row => row.vendor_mcu || '', sortable: true, width: "200px" },
      { name: 'Domicile address', selector: row => row.alamat_domisili || '', sortable: true, width: "1000px" }
  ];
  
  const hseColumns = [
      { 
      name: 'HSEPASSPORT Status', 
      selector: row => {
        const days = getDaysDifference(row.akhir_hsepassport);
        return getStatusPriority(days); // For sorting purposes
      },
      cell: row => {
          const daysRemaining = row.akhir_hsepassport ? getDaysDifference(row.akhir_hsepassport) : undefined;
          return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
              {getStatusText(daysRemaining)}
          </div>
          );
      }, 
      sortable: true, 
      sortFunction: (rowA, rowB) => {
        const daysA = getDaysDifference(rowA.akhir_hsepassport);
        const daysB = getDaysDifference(rowB.akhir_hsepassport);
        
        const priorityA = getStatusPriority(daysA);
        const priorityB = getStatusPriority(daysB);
        
        return priorityA - priorityB;
    },
      width: "150px"
      },
      { name: 'Reason NA', selector: row => row.sebab_na || '', sortable: true, width: "150px" },
      { name: 'Employee Name', selector: row => row.nama_lengkap || '', sortable: true, width: "250px" },
      { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "300px" },
      { name: 'HSE Passport No', selector: row => row.no_hsepassport || '', sortable: true, width: "200px" },
      { name: 'HSE Start Date', selector: row => row.awal_hsepassport || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.awal_hsepassport) },
      { name: 'HSE End Date', selector: row => row.akhir_hsepassport || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.akhir_hsepassport) },
  ];
  
  const simlColumns = [
      { 
      name: 'SIML Status', 
      selector: row => {
        const days = getDaysDifference(row.akhir_siml);
        return getStatusPriority(days); // For sorting purposes
    },
      cell: row => {
          const daysRemaining = row.akhir_siml ? getDaysDifference(row.akhir_siml) : undefined;
          return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
              {getStatusText(daysRemaining)}
          </div>
          );
      }, 
      sortable: true, 
      sortFunction: (rowA, rowB) => {
        const daysA = getDaysDifference(rowA.akhir_siml);
        const daysB = getDaysDifference(rowB.akhir_siml);
        
        const priorityA = getStatusPriority(daysA);
        const priorityB = getStatusPriority(daysB);
        
        return priorityA - priorityB;
    },
      width: "150px"
      },
      { name: 'Reason NA', selector: row => row.sebab_na || '', sortable: true, width: "150px" },
      { name: 'Employee Name', selector: row => row.nama_lengkap || '', sortable: true, width: "250px" },
      { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "300px" },
      { name: 'SIM Start Date', selector: row => row.awal_siml || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.awal_siml) },
      { name: 'SIM End Date', selector: row => row.akhir_siml || '', sortable: true, width: "150px", cell: row => formatDateToDDMMYYYY(row.akhir_siml) },
      { name: 'SIM Number', selector: row => row.no_siml || '', sortable: true, width: "200px" },
  ];

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
  
  // Table style
  const customStyles = {
      table: {
          style: {
          width: '100%',
          tableLayout: 'auto', // Biarkan browser menentukan layout tabel secara otomatis
      }
      },
      rows: { 
      style: { 
          minHeight: '60px',
          width: '100%' // Pastikan baris mengambil seluruh lebar yang tersedia
      } 
      },
      headCells: {
      style: {
          paddingLeft: '16px',
          paddingRight: '16px',
          backgroundColor: '#802600',
          fontWeight: 'bold',
          color: '#FFFFFF',
          whiteSpace: 'normal', // Biarkan teks wrap jika terlalu panjang
          overflow: 'visible', // Jangan sembunyikan overflow
          textOverflow: 'clip', // Jangan potong teks
          wordWrap: 'break-word', // Memungkinkan kata-kata panjang untuk diputus
      },
      activeSortStyle: {
          color: '#ffdd99', // Warna yang lebih terang untuk kolom yang sedang diurutkan
          '&:focus': {
          outline: 'none',
          },
      },
      },
      cells: { 
      style: { 
          paddingLeft: '16px', 
          paddingRight: '16px',
          wordBreak: 'break-word', // Memungkinkan kata-kata panjang untuk diputus
          whiteSpace: 'normal', // Biarkan teks wrap jika terlalu panjang
      } 
      },
      pagination: {
      style: {
          borderTopStyle: 'none', // Hilangkan border atas pada pagination
          width: '100%',
      },
      }
  };
  
  const tableWrapperStyle = {
      width: '100%',
      overflowX: 'auto', // Tambahkan scroll horizontal jika tabel terlalu lebar
      WebkitOverflowScrolling: 'touch', // Meningkatkan scrolling pada perangkat iOS
  };
  
    return (
      <div className='bg-(--background-tar-color)'> 
      <div className="flex">
          <div className='h-screen fixed left-0 top-0'>
          {/* Slidebar = Aside */}
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
              <h1 className="text-2xl font-bold mb-4 mt-2 text-center"> Pertamina EP Regional 2 Eksplorasi HSE</h1>
              
              {message.text && (
              <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                  <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
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

               {/* Add Color Legend Component */}
                <ColorLegend />
            
              {/* Loading or Error Message */}
              {loading ? (
              <div className="text-center py-10">
                  <p className="text-gray-500 text-xl">Loading data...</p>
              </div>
              ) : error ? (
              <div className="text-center py-10 bg-red-50 rounded-lg">
                  <p className="text-red-500 text-xl">{error}</p>
              </div>
              ) : (
              <>
                  {/* MCU Section */}
                  <section className="mb-8">
                  <StatBoxGroup {...mcuStatBoxes} />
                  
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                      <div className="mb-4">
                      <h2 className="text-xl font-semibold">MCU Data {activeMCUFilter !== 'all' && `(Filter: ${activeMCUFilter})`}</h2>
                      </div>
                      
                      <div style={tableWrapperStyle}>
                          <DataTable 
                          columns={mcuColumns}
                          data={mcuFilteredData}
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
                  </div>
                  </section>
                  
                  {/* HSE Passport Section */}
                  <section className="mb-8">
                  <StatBoxGroup {...hseStatBoxes} />
                  
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                      <div className="mb-4">
                      <h2 className="text-xl font-semibold">HSE Passport Data {activeHSEFilter !== 'all' && `(Filter: ${activeHSEFilter})`}</h2>
                      </div>
                      
                      <div style={tableWrapperStyle}>
                          <DataTable 
                          columns={hseColumns}
                          data={hseFilteredData}
                          pagination
                          paginationPerPage={10}
                          paginationRowsPerPageOptions={[5, 10, 25, 50]}
                          customStyles={customStyles}
                          highlightOnHover
                          striped
                          responsive
                          noDataComponent={
                              <div className="p-4 text-center text-gray-500">
                              No HSE Passport data available matching the current filters.
                              </div>
                          }
                          />
                      </div>
                  </div>
                  </section>
  
                   {/* SIM Section */}
                  <section className="mb-8">
                  <StatBoxGroup {...simlStatBoxes} />
                  
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                      <div className="mb-4">
                      <h2 className="text-xl font-semibold">SIML Data {activeSIMLFilter !== 'all' && `(Filter: ${activeSIMLFilter})`}</h2>
                      </div>
                          <div style={tableWrapperStyle}>
                              <DataTable 
                              columns={simlColumns}
                              data={simlFilteredData}
                              pagination
                              paginationPerPage={10}
                              paginationRowsPerPageOptions={[5, 10, 25, 50]}
                              customStyles={customStyles}
                              highlightOnHover
                              striped
                              responsive
                              noDataComponent={
                                  <div className="p-4 text-center text-gray-500">
                                  No SIML data available matching the current filters.
                                  </div>
                              }
                              />
                          </div>
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
    )
  }

export default ViewRegional2SHSEPage