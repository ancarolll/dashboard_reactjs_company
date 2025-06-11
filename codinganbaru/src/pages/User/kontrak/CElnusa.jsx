import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faFileContract, faHelmetSafety, faArrowRightFromBracket, faBell, faSun, faMagnifyingGlass, faFileAlt, faUpload, faDownload, faImage, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { faFile, faFileImage, faFileWord, faFilePdf, faFileExcel } from '@fortawesome/free-regular-svg-icons';
import '../../../styles/main.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from 'react-data-table-component';
import SertifikatModal from '../../../components/SerfikatModal';

const API_URL = 'http://localhost:3005';
const API_BASE_URL = 'http://localhost:3005/api';

const CElnusa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);
  
  // State for data
  const [perPage, setPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('totemployes');
  const [message, setMessage] = useState({ text: '', type: '' });

  // State for certificate modal
  const [sertifikatModal, setSertifikatModal] = useState({
    isOpen: false, userId: null, userName: ''
  });

  // Effect to set active path
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  // Effect to get user info
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserInfo(user);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  // Fetch data from API
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

        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
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
        
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  // Function to open certificate modal
  const openSertifikatModal = (user) => {
    setSertifikatModal({
      isOpen: true,
      userId: user.id,
      userName: user.nama_karyawan
    });
  };

  // Function to close certificate modal
  const closeSertifikatModal = () => {
    setSertifikatModal({
      isOpen: false,
      userId: null,
      userName: ''
    });
  };

  // Function to calculate remaining days
  const getDaysDifference = (endDate) => {
    if (!endDate) return null; // Return null for dates that haven't been filled
    
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

  // Function to get priority value for sorting (lower = higher priority)
  const getStatusPriority = (days) => {
    if (days === undefined || days === null) return 5; // Lowest priority for no data
    if (days < 0) return 1; // Highest priority for expired
    if (days <= 14) return 2; // High priority for expiring soon (within 14 days)
    if (days <= 30) return 3; // Medium priority (within 30 days)
    if (days <= 45) return 4; // Lower priority (within 45 days)
    return 5; // Lowest priority for dates far in the future
  };

  // Apply priority sorting to data
  const applyPrioritySort = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      const daysA = getDaysDifference(a.kontrak_akhir);
      const daysB = getDaysDifference(b.kontrak_akhir);
      
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

  // Function for styling link
  const getLinkClassName = (path) => {
    const baseClasses = "flex items-center space-x-2 p-3 rounded-lg btn-aside no-underline text-black";
    return `${baseClasses} ${activePath === path ? 'active' : ''}`;
  };

  // Function to handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    
    // Remove all authentication data from storage
    localStorage.removeItem('userAuthToken');
    localStorage.removeItem('userInfo');
    
    // Show message
    toast.success('You have successfully logged out');
    
    // Redirect to login page
    setTimeout(() => {
      navigate('/log-user');
    }, 1500);
  };

  // Function to determine status color
  const getStatusColor = (days) => {
    if (days === undefined || days === null) return 'bg-gray-300 text-gray-700'; // Color for data not yet filled
    if (days < 0) return 'bg-red-500 text-white'; // Expired
    if (days <= 14) return 'bg-red-200'; // Less than 14 days
    if (days <= 30) return 'bg-yellow-200'; // Less than 30 days
    if (days <= 45) return 'bg-green-200'; // Less than 45 days
    return 'bg-gray-100'; // Default
  };

  // Function to display more informative contract remaining message
  const getStatusText = (days) => {
    if (days === undefined || days === null) return "No date available";
    if (days < 0) return `EOC ${Math.abs(days)} days ago`;
    if (days === 0) return "EOC";
    return `${days} days remaining`;
  };

  // Format date for display in DD/MM/YYYY format
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

  // Function to filter users based on status
  const filterUsersByStatus = (users, filterType) => {
    if (!users || !Array.isArray(users)) {
      return [];
    }
    
    return users.filter(user => {
      if (!user) return false;
      
      // Calculate remaining days
      const days = getDaysDifference(user.kontrak_akhir);
      
      // Filter based on filterType
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
          return days >= 0; // Default show all active users
      }
    });
  };

  // Filter records based on search term
  const handleFilter = (e) => {
    setSearchTerm(e.target.value);
  };

  // Define filteredRecords using useMemo with priority sorting
  const filteredRecords = useMemo(() => {
    if (!users) {
      return [];
    }
  
    // Filter based on status first
    const statusFiltered = filterUsersByStatus(users, activeFilter);
  
    // Filter based on search term
    const searchFiltered = statusFiltered.filter(row => {
      // Check if row is valid
      if (!row || typeof row !== 'object') {
        return false;
      }
      
      const namaKaryawan = row.nama_karyawan || '';
      const nikVendor = row.nik_vendor || '';
      const nikElnusa = row.nik_elnusa || '';
      const noKontrak = row.no_kontrak || '';
      const jabatan = row.jabatan || '';
      
      const searchValue = searchTerm.toLowerCase();
      
      // Search in several important columns
      return namaKaryawan.toLowerCase().includes(searchValue) || 
            nikVendor.toLowerCase().includes(searchValue) ||
            nikElnusa.toLowerCase().includes(searchValue) ||
            noKontrak.toLowerCase().includes(searchValue) ||
            jabatan.toLowerCase().includes(searchValue);
    });

    // Apply priority sorting
    return applyPrioritySort(searchFiltered);
  }, [users, searchTerm, activeFilter]);

  // Define columns for DataTable
  const columns = [
    { 
      name: 'Status', 
      selector: row => {
        const days = getDaysDifference(row.kontrak_akhir);
        return getStatusPriority(days); // For sorting purposes
      },
      cell: row => {
        const daysRemaining = getDaysDifference(row.kontrak_akhir);
        return (
          <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
            {getStatusText(daysRemaining)}
          </div>
        );
      }, 
      sortable: true,
      sortFunction: (rowA, rowB) => {
        const daysA = getDaysDifference(rowA.kontrak_akhir);
        const daysB = getDaysDifference(rowB.kontrak_akhir);
        
        const priorityA = getStatusPriority(daysA);
        const priorityB = getStatusPriority(daysB);
        
        return priorityA - priorityB;
      },
      width: "200px"
    },
    { name: 'No Contract', selector: row => row.no_kontrak || '', sortable: true, width: "300px"},
    { name: 'Employee Name', selector: row => row.nama_karyawan || '', sortable: true, width: "450px" },
    { name: 'WBS/CCTR', selector: row => row.wbs_cctr || '', sortable: true, width: "250px" },
    { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "250px" },
    { name: 'Unit', selector: row => row.unit || '', sortable: true, width: "250px" },
    { name: 'Project', selector: row => row.proyek || '', sortable: true, width: "250px" },
    { name: 'Contract Start', selector: row => row.kontrak_awal || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_awal)},
    { name: 'Contract End', selector: row => row.kontrak_akhir || '', sortable: true, width: "250px", cell: row => formatDateToDDMMYYYY(row.kontrak_akhir)},
    { name: 'Employee Status', selector: row => row.status_karyawan || '', sortable: true, width: "200px" },
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
      width: "150px"
    }
  ];

  // Function to handle filter change
  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
  };

  // Custom styles for DataTable
  const customStyles = {
    rows: { 
      style: { 
        minHeight: '60px'
      },
      highlightOnHoverStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
      }
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: '#802600',
        fontWeight: 'bold',
        color: '#FFFFFF'
      },
      activeSortStyle: {
        color: '#ffdd99', // Lighter color for the column being sorted
        '&:focus': {
          outline: 'none',
        },
      },
    },
    cells: { 
      style: { 
        paddingLeft: '16px', 
        paddingRight: '16px'
      } 
    }
  };

  // StatBox component (styled like ElnusaViewProjectPage)
  const StatBox = () => {
    // Calculate statistics
    const totalEmployees = users.filter(user => getDaysDifference(user.kontrak_akhir) >= 0).length;
    const dueDateUsers = users.filter(user => {
      const days = getDaysDifference(user.kontrak_akhir);
      return days >= 0 && days <= 14;
    }).length;
    const call2Users = users.filter(user => {
      const days = getDaysDifference(user.kontrak_akhir);
      return days > 14 && days <= 30;
    }).length;
    const call1Users = users.filter(user => {
      const days = getDaysDifference(user.kontrak_akhir);
      return days > 30 && days <= 45;
    }).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div 
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'totemployes' ? 'border-2 border-blue-500' : ''}`}
          onClick={() => handleFilterChange('totemployes')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <h3 className="text-2xl font-bold">{totalEmployees}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <FontAwesomeIcon icon={faUserGroup} />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'duedate' ? 'border-2 border-red-500' : ''}`}
          onClick={() => handleFilterChange('duedate')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Due Date Contract</p>
              <h3 className="text-2xl font-bold">{dueDateUsers}</h3>
              <p className="text-xs text-red-500">0-14 Days Remaining</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div 
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'call2' ? 'border-2 border-yellow-500' : ''}`}
          onClick={() => handleFilterChange('call2')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Call 2</p>
              <h3 className="text-2xl font-bold">{call2Users}</h3>
              <p className="text-xs text-yellow-600">15-30 Days Remaining</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div 
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'call1' ? 'border-2 border-green-500' : ''}`}
          onClick={() => handleFilterChange('call1')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Call 1</p>
              <h3 className="text-2xl font-bold">{call1Users}</h3>
              <p className="text-xs text-green-600">31-45 Days Remaining</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component rendering
  return (
    <div className='bg-(--background-tar-color)'> 
      <div className="flex">
        {/* ASIDE SECTION */}
        <div className='h-screen fixed left-0 top-0'>
          <div className='flex sticky top-0'>
            <aside className="w-70 bg-white text-black-70 p-4 flex flex-col h-screen overflow-y-auto">
              <div className='w-full px-2 py-3 text-center'>
                <div className="flex justify-center space-x-4 p-3">
                  {/* Logo */}
                  <img 
                    src="/tar.jpeg"
                    alt="Company Logo"
                    className="w-80 h-auto object-cover rounded-lg"
                  />
                  </div>
                  <h5 className="text-center font-bold mt-2 gap-2 drop-shadow">
                    {'PT. Timur Adi Raya'}
                  </h5>
                  <p className="text-sm text-gray-500">
                    {userInfo?.username || 'User'}
                  </p>
                </div>
              
              <nav className="mt-8 space-y-4">
                {/* Dashboard Link */}
                <Link to="/user-els" className={getLinkClassName('/user-elnusa')}>
                  <FontAwesomeIcon icon={faHouse} className='text-lg'/>
                  <span className='text-sm'>Dashboard</span>
                </Link>
                
                {/* Contract Link */}
                <Link to="/contract-els" className={getLinkClassName('/contract-elnusa')}>
                  <FontAwesomeIcon icon={faFileContract} className='text-lg'/>
                  <span className='text-sm'>Contract</span>
                </Link>
                
                {/* HSE Link */}
                <Link to="/data-hse-els" className={getLinkClassName('/data-hse-elnusa')}>
                  <FontAwesomeIcon icon={faHelmetSafety} className='text-lg'/>
                  <span className='text-sm'>HSE</span>
                </Link>
                
                {/* Logout Button */}
                <div className="mt-auto pt-8">
                  <a href="#"
                    onClick={handleLogout}
                    className="flex items-center space-x-2 p-3 rounded-lg text-red-600 hover:bg-red-50"
                    style={{ cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} className='text-lg' />
                    <span className='text-sm'>Logout</span>
                  </a>
                </div>
              </nav>
            </aside>
          </div>
        </div>

        {/* MAIN CONTENT SECTION */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
          {/* HEADER */}
          <div className='w-fill h-hug py-3'>
            <header className="bg-(--white-tar-color) text-right p-3 shadow-md rounded">
              <a href="#">
                <FontAwesomeIcon icon={faBell} className='text-lg px-6 text-(--ash-60-oppacity)'/>
              </a>
              <a href="">
                <FontAwesomeIcon icon={faSun} className='text-lg text-(--ash-60-oppacity)'/>
              </a>
            </header>
          </div>

          {/* Back button */}
          <div className="mb-4">
            <Link to='/user-elnusa' className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              &lt; Back
            </Link>
          </div>

          {/* MAIN CONTENT */}
          <main className="flex-1">
            <h1 className="text-2xl font-bold mb-4 mt-2 text-center">Contract Management</h1>
            
            {/* Notification message */}
            {message.text && (
              <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
                <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
              </div>
            )}

            {/* Stats section */}
            <StatBox />

            {/* Table Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className='flex justify-between items-center mb-4'>
                {/* Search */}
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
                    leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-lg'
                  />
                </div>
              </div>

              {/* Conditional rendering for DataTable */}
              {loading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading data...</p>
                </div>
              ) : !users || users.length === 0 ? (
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
                  defaultSortFieldId={1} // Default sort by Status (1st column, index starts at 1)
                  defaultSortAsc={true}  // Ascending order (lower priority values first)
                  noDataComponent={
                    <div className="p-4 text-center text-gray-500">
                      No data matching the filter
                    </div>
                  }
                />
              )}
            </div>
          </main>

          {/* FOOTER */}
          <div className='bg-(--background-tar-color) text-xs'>
            <footer className="flex justify-center space-x-5 text-(--ash-60-oppacity) text-center p-4">
              <p>&copy; 2025 Made</p>
              <p className='flex space-x-2'>
                <span>Distributed By </span>
                <span className='text-(--tar-color)'>PT Timur Adi Raya</span>
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {sertifikatModal.isOpen && (
        <SertifikatModal
          isOpen={sertifikatModal.isOpen}
          onClose={closeSertifikatModal}
          userId={sertifikatModal.userId}
          userName={sertifikatModal.userName}
          viewOnly={true} // View only mode in CElnusa page
          apiPrefix="elnusa"
        />
      )}
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CElnusa;