import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/main.css';
import { faUserGroup, faExclamationCircle, faExclamationTriangle, faCheckCircle, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';
const PROJECT_ID = 'regional2Z7D';

export const StatBox = ({ variant, title, subtitle, icon, value, onClick, linkTo, isActive }) => {
  const variants = {
    totemployes: "bg-white",
    duedate: "bg-white",
    call2: "bg-white",
    call1: "bg-white", 
    nonactive: "bg-white",
  };

  const iconBgColors = {
    totemployes: "bg-blue-100",
    duedate: "bg-red-100",
    call2: "bg-yellow-100",
    call1: "bg-green-100",
    nonactive: "bg-gray-100",
  };

  const iconColors = {
    totemployes: "text-blue-500",
    duedate: "text-red-500",
    call2: "text-yellow-600",
    call1: "text-green-600",
    nonactive: "text-gray-500",
  };

  const subtitleColors = {
    totemployes: "text-blue-400",
    duedate: "text-red-400",
    call2: "text-yellow-500",
    call1: "text-green-500",
    nonactive: "text-gray-400",
  };

  const borderColors = {
    totemployes: isActive ? "border-blue-500 border-2" : "border-gray-200",
    duedate: isActive ? "border-red-500 border-2" : "border-gray-200",
    call2: isActive ? "border-yellow-500 border-2" : "border-gray-200",
    call1: isActive ? "border-green-500 border-2" : "border-gray-200",
    nonactive: isActive ? "border-gray-500 border-2" : "border-gray-200",
  };

  const handleClick = () => {
    if (linkTo) {
      // Handle navigation if needed
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className="w-full h-full"> 
      <div 
        className={`${variants[variant]} ${borderColors[variant]} flex items-center justify-between p-4 h-full min-h-24 rounded-lg shadow hover:shadow-md transition cursor-pointer`}
        onClick={handleClick}
      >
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <h4 className="text-2xl font-bold">{value}</h4>
          {subtitle && <p className={`text-[10px] ${subtitleColors[variant]} mt-1`}>{subtitle}</p>}
        </div>
        <div className={`${iconBgColors[variant]} p-2 rounded-full flex-shrink-0`}>
          <FontAwesomeIcon icon={icon} className={`w-4 h-4 ${iconColors[variant]}`} />
        </div>
      </div>
    </div>
  );
};

const StatBoxPertamina2Z7DComponents = ({ onFilterChange, showCategories = ['totemployes', 'duedate', 'call2', 'call1', 'nonactive'], activeFilter = 'totemployes' }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    total: 0,
    duedate: 0,
    call2: 0,
    call1: 0,
    nonactive: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk menghitung selisih hari
  const getDaysDifference = (endDate) => {
    if (!endDate) return -999;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error menghitung hari:", e);
      return -999;
    }
  };

  // Fetch data dari backend dengan strategi fallback
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ambil data karyawan aktif
        let activeResponse;
        try {
          activeResponse = await axios.get(`${API_BASE_URL}/${PROJECT_ID}/users`, {
            headers: {
              'Accept': 'application/json'
            },
            timeout: 5000
          });
        } catch (userErr) {
          
          // Fallback ke endpoint edit dengan format=json
          activeResponse = await axios.get(`${API_BASE_URL}/${PROJECT_ID}/edit?format=json`, {
            headers: {
              'Accept': 'application/json'
            },
            timeout: 5000
          });
        }
  
        // Ambil data karyawan non-aktif secara terpisah
        const naResponse = await axios.get(`${API_BASE_URL}/${PROJECT_ID}/na?format=json`, {
          headers: {
            'Accept': 'application/json'
          },
          timeout: 5000
        });
        
        // Hitung jumlah untuk setiap kategori
        let activeCount = 0;
        let dueDateCount = 0;
        let call2Count = 0;
        let call1Count = 0;
        
        // Tentukan jumlah non-aktif dari response /na endpoint
        let nonactiveCount = Array.isArray(naResponse.data) ? naResponse.data.length : 0;
        
        if (activeResponse.data && Array.isArray(activeResponse.data)) {
          activeResponse.data.forEach(employee => {
            if (employee && employee.kontrak_akhir) {
              const days = getDaysDifference(employee.kontrak_akhir);
              
              if (days >= 0) {
                activeCount++; // Total karyawan aktif 
                if (days <= 14) {
                  dueDateCount++; // Due date (merah)
                } else if (days <= 30) {
                  call2Count++; // Call 2 (kuning)
                } else if (days <= 45) {
                  call1Count++; // Call 1 (hijau)
                }
              }
            }
          });
        }
        
        setCounts({
          total: activeCount,
          duedate: dueDateCount,
          call2: call2Count,
          call1: call1Count,
          nonactive: nonactiveCount
        });
        
      } catch (err) {
        console.error('Error mengambil data untuk StatBox:', err);
        setError(err.message || 'Terjadi kesalahan saat mengambil data');
        
        // Tetap coba dapatkan data non-aktif walaupun endpoint lain gagal
        try {
          const naResponse = await axios.get(`${API_BASE_URL}/${PROJECT_ID}/na?format=json`, {
            headers: {
              'Accept': 'application/json'
            },
            timeout: 5000
          });
          
          if (naResponse.data && Array.isArray(naResponse.data)) {
            setCounts(prev => ({
              ...prev,
              nonactive: naResponse.data.length
            }));
          }
        } catch (naErr) {
          console.error('Error mengambil data NA:', naErr);
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const handleBoxClick = (filterType) => {
    if (onFilterChange) {
      onFilterChange(filterType);
    }
  };

  const handleNonActiveClick = () => {
    navigate('/nonactive-regional2Z7D');
  };

  // Lokalisasi teks untuk UI
  const boxConfigTexts = {
    totemployes: {
      title: 'Tot Employees',
      subtitle: 'All Active'
    },
    duedate: {
      title: 'Due Date',
      subtitle: '0-14 Days Remaining'
    },
    call2: {
      title: 'Call 2',
      subtitle: '15-30 Days Remaining'
    },
    call1: {
      title: 'Call 1',
      subtitle: '31-45 Days Remaining'
    },
    nonactive: {
      title: 'Non Active',
      subtitle: 'Inactive Employees'
    }
  };

  const boxConfigs = {
    totemployes: {
      variant: 'totemployes',
      icon: faUserGroup,
      title: boxConfigTexts.totemployes.title,
      subtitle: boxConfigTexts.totemployes.subtitle,
      value: loading ? '...' : counts.total,
      onClick: () => handleBoxClick('all'),
      isActive: activeFilter === 'totemployes'
    },
    duedate: {
      variant: 'duedate',
      icon: faExclamationCircle,
      title: boxConfigTexts.duedate.title,
      subtitle: boxConfigTexts.duedate.subtitle,
      value: loading ? '...' : counts.duedate,
      onClick: () => handleBoxClick('duedate'),
      isActive: activeFilter === 'duedate'
    },
    call2: {
      variant: 'call2',
      icon: faExclamationTriangle,
      title: boxConfigTexts.call2.title,
      subtitle: boxConfigTexts.call2.subtitle,
      value: loading ? '...' : counts.call2,
      onClick: () => handleBoxClick('call2'),
      isActive: activeFilter === 'call2'
    },
    call1: {
      variant: 'call1',
      icon: faCheckCircle,
      title: boxConfigTexts.call1.title,
      subtitle: boxConfigTexts.call1.subtitle,
      value: loading ? '...' : counts.call1,
      onClick: () => handleBoxClick('call1'),
      isActive: activeFilter === 'call1'
    },
    nonactive: {
      variant: 'nonactive',
      icon: faUserSlash,
      title: boxConfigTexts.nonactive.title,
      subtitle: boxConfigTexts.nonactive.subtitle,
      value: loading ? '...' : counts.nonactive,
      onClick: handleNonActiveClick,
      isActive: activeFilter === 'nonactive'
    }
  };
  
  // Filter boxes based on showCategories prop
  const filteredBoxes = showCategories.map(category => boxConfigs[category]).filter(Boolean);

  const getGridClass = () => {
    const itemCount = filteredBoxes.length;
    
    // Special handling for 4 items - always use grid-cols-4 on larger screens
    if (itemCount === 4) {
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4";
    }
    
    // For other numbers of items, use responsive grid
    switch(itemCount) {
      case 1:
        return "grid grid-cols-1 gap-4";
      case 2:
        return "grid grid-cols-1 sm:grid-cols-2 gap-4";
      case 3:
        return "grid grid-cols-1 sm:grid-cols-3 gap-4";
      case 5:
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500 mb-2">Error mengambil data: {error}</div>
        <div className={`grid ${getGridClass()} gap-4`}>
          {filteredBoxes.map((box, index) => (
            <StatBox
              key={index}
              variant={box.variant}
              icon={box.icon}
              title={box.title}
              subtitle={box.subtitle}
              value={box.value}
              onClick={box.onClick}
              isActive={box.isActive}
            />
          ))}
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full px-4 py-2"> 
      <div className={`${getGridClass()}`}> 
        {filteredBoxes.map((box, index) => (
          <StatBox
            key={index}
            variant={box.variant}
            icon={box.icon}
            title={box.title}
            subtitle={box.subtitle}
            value={box.value}
            onClick={box.onClick}
            isActive={box.isActive}
          />
        ))}
      </div>
    </div>
  );
};

export default StatBoxPertamina2Z7DComponents;