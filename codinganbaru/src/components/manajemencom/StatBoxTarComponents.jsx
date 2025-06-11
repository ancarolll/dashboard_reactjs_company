import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/main.css';
import { faUserGroup, faExclamationCircle, faExclamationTriangle, faCheckCircle, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API URL constant
const API_BASE_URL = 'http://localhost:3005/api';

export const StatBox = ({ variant, title, subtitle, icon, value, onClick, linkTo, isActive }) => {
  const variants = {
    totemployes: "bg-white",
    duedate: "bg-white",
    call2: "bg-white",
    call1: "bg-white"
  };

  const iconBgColors = {
    totemployes: "bg-blue-100",
    duedate: "bg-red-100",
    call2: "bg-yellow-100",
    call1: "bg-green-100"
  };

  const iconColors = {
    totemployes: "text-blue-500",
    duedate: "text-red-500",
    call2: "text-yellow-600",
    call1: "text-green-600"
  };

  const subtitleColors = {
    totemployes: "text-blue-400",
    duedate: "text-red-400",
    call2: "text-yellow-500",
    call1: "text-green-500"
  };

  const borderColors = {
    totemployes: isActive ? "border-blue-500 border-2" : "border-gray-200",
    duedate: isActive ? "border-red-500 border-2" : "border-gray-200",
    call2: isActive ? "border-yellow-500 border-2" : "border-gray-200",
    call1: isActive ? "border-green-500 border-2" : "border-gray-200"
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

const StatBoxTarComponents = ({ onFilterChange, showCategories = ['totemployes', 'duedate', 'call2', 'call1'], activeFilter = 'totemployes' }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    total: 0,
    duedate: 0,
    call2: 0,
    call1: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to calculate days difference
  const getDaysDifference = (endDate) => {
    if (!endDate) return -999;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to 00:00:00
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0); // Reset time to 00:00:00
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days:", e);
      return -999;
    }
  };

  // Fetch data from backend with fallback strategy
 useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil SEMUA data karyawan dari endpoint tar-mcu/mcu
      const response = await axios.get(`${API_BASE_URL}/tar-mcu/mcu`, {
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
      
      if (response.data && Array.isArray(response.data)) {
        // Hitung total semua karyawan
        const totalEmployees = response.data.length;
        
        response.data.forEach(employee => {
          // Hitung berdasarkan status kontrak
          if (employee && employee.kontrak_akhir) {
            const days = getDaysDifference(employee.kontrak_akhir);
            
            // Perubahan utama: memasukkan kontrak expired ke dalam dueDate
            if (days < 0) {
              // Jika kontrak sudah berakhir, masukkan ke kategori duedate (expired)
              dueDateCount++;
            } else {
              // Jika kontrak masih berlaku
              activeCount++; // Karyawan aktif 
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
        total: response.data.length, // Total semua karyawan dalam tabel
        duedate: dueDateCount,
        call2: call2Count,
        call1: call1Count
      });
      
    } catch (err) {
      console.error('Error mengambil data karyawan TAR:', err);
      setError(err.message || 'Terjadi kesalahan saat mengambil data');
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

  // Text localization for UI
  const boxConfigTexts = {
    totemployes: {
      title: 'Tot Employees',
      subtitle: 'All Active'
    },
    duedate: {
      title: 'Expired',
      subtitle: '0-14 Days Remaining'
    },
    call2: {
      title: 'Remaining 2',
      subtitle: '15-30 Days Remaining'
    },
    call1: {
      title: 'Remaining 1',
      subtitle: '31-45 Days Remaining'
    }
  };

  const boxConfigs = {
    totemployes: {
      variant: 'totemployes',
      icon: faUserGroup,
      title: boxConfigTexts.totemployes.title,
      subtitle: boxConfigTexts.totemployes.subtitle,
      value: loading ? '...' : counts.total,
      onClick: () => handleBoxClick('totemployes'),
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
        <div className="text-red-500 mb-2">Error retrieving data: {error}</div>
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

export default StatBoxTarComponents;