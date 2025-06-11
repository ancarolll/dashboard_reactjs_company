import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useContext, useEffect, useState } from 'react'
import '../styles/main.css';
import { faCircle} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';

// Konstanta API URL
const API_BASE_URL = 'http://localhost:3005/api';

const BubbleNotifComponents = ({ project, hseId, stacked = false }) => {

  const [notifData, setNotifData] = useState({
    yellowCount: 0, // call2
    redCount: 0,    // duedate
    greenCount: 0   // call1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fungsi untuk menghitung hari yang tersisa dari tanggal kontrak akhir
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

  // Fetch data dari API berdasarkan project
  useEffect(() => {
    const fetchNotificationData = async () => {
      setLoading(true);
      try {
        // Tentukan endpoint berdasarkan project
        let endpoint = `${API_BASE_URL}/`;
        
        if (project === 'elnusa') {
          endpoint += 'elnusa/users';
        } 
        // Project Pertamina dengan berbagai macam
        else if (project === 'regional4') {
          endpoint += 'regional4/users';
        } 
        else if (project === 'regional2x') {
          endpoint += 'regional2x/users';
        } 
        else if (project === 'regional2s') {
          endpoint += 'regional2s/users';
        } 
        else if (project === 'regional2Z7D') {
          endpoint += 'regional2Z7D/users';
        } 
        else if (project === 'regional2Z7W') {
          endpoint += 'regional2Z7W/users';
        }
        else if (project === 'umran') {
          endpoint += 'umran/users';
        }
        // Project PHE
        else if (project === 'phe') {
          endpoint += 'phe/users';
        } 
        // Default ke elnusa jika tidak ada project yang cocok
        else {
          endpoint += 'elnusa/users';
        }
        
        // Tambahkan filter HSE ID jika tersedia
        if (hseId) {
          // Mapping HSE ID berdasarkan project
          let hseParam = hseId;
          
          // Jika hseId tidak spesifik, gunakan default HSE ID berdasarkan project
          if (hseId === true) {
            if (project === 'regional4') {
              hseParam = 'reg4';
            } else if (project === 'pertaminareg2eks') {
              hseParam = 'reg2eks';
            } else if (project === 'pertaminareg2sub') {
              hseParam = 'reg2sub';
            } else if (project === 'pertamina2zona7devplan') {
              hseParam = '2zona7devplan';
            } else if (project === 'pertamina2zona7wopdm') {
              hseParam = '2zona7wopdm';
            }
          }
          // Tambahkan HSE ID ke endpoint sebagai query parameter
          endpoint += endpoint.includes('?') ? `&hseId=${hseParam}` : `?hseId=${hseParam}`;
        }

        // Tambahkan parameter format=json jika belum ada
        if (!endpoint.includes('format=json')) {
          endpoint += endpoint.includes('?') ? '&format=json' : '?format=json';
        }
        
        // Tambahkan parameter format=json untuk memastikan respons dalam format JSON
        endpoint += '?format=json';
        
        const response = await axios.get(endpoint, {
          headers: {
            'Accept': 'application/json'
          },
          timeout: 5000
        });

        // Inisialisasi counter
        let yellowCount = 0;
        let redCount = 0;
        let greenCount = 0;

        // Proses data jika valid
        if (response.data && Array.isArray(response.data)) {
          // Filter berdasarkan hseId jika tersedia
          let filteredUsers = hseId 
            ? response.data.filter(user => user.hseId === hseId) 
            : response.data;

          filteredUsers.forEach(user => {
            if (user.kontrak_akhir) {
              const days = getDaysDifference(user.kontrak_akhir);
              
              if (days >= 0) {
                if (days <= 14) {
                  redCount++; // Due date (merah)
                } else if (days <= 30) {
                  yellowCount++; // Call 2 (kuning)
                } else if (days <= 42) {
                  greenCount++; // Call 1 (hijau)
                }
              }
            }
          });
        }

        // Update state dengan data yang dihitung
        setNotifData({
          yellowCount,
          redCount,
          greenCount
        });
        
      } catch (err) {
        console.error(`Error mengambil data notifikasi untuk ${project || 'semua'}:`, err);
        setError(err.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationData();
  }, [project, hseId]);
  
   // Ekstrak nilai dari state
   const { yellowCount, redCount, greenCount } = notifData;

   // Jika loading, tampilkan indikator loading sederhana
   if (loading) {
     return (
       <div className="flex space-x-1">
         <div className="h-3 w-3 bg-gray-300 rounded-full animate-pulse"></div>
         <div className="h-3 w-3 bg-gray-300 rounded-full animate-pulse"></div>
         <div className="h-3 w-3 bg-gray-300 rounded-full animate-pulse"></div>
       </div>
     );
   }
 
   // Jika error, tampilkan indikator error kecil (opsional)
   if (error) {
     return (
       <div className="flex items-center text-red-500 text-xs">
         <span>!</span>
       </div>
     );
   }
 
   // Jika tidak ada notifikasi untuk project ini, jangan tampilkan apapun
   if (yellowCount === 0 && redCount === 0 && greenCount === 0) {
     return null;
   }
 
   return (
     <div className={`flex ${stacked ? 'space-x-6' : ''}`}>
       {/* Lingkaran Kuning (Call 2) */}
       {yellowCount > 0 && (
         <div className='relative'>
           <FontAwesomeIcon 
             icon={faCircle}
             className='text-3xl text-(--yellow-tar-color) transform hover:scale-125 transition duration-300'
           />
           <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold'>
             {yellowCount}
           </span>
         </div>
       )}
 
       {/* Lingkaran Merah (Due Date) */}
       {redCount > 0 && (
         <div className='relative'>
           <FontAwesomeIcon 
             icon={faCircle}
             className={`text-3xl text-(--tar-color) transform hover:scale-125 transition duration-300 ${!stacked && yellowCount > 0 ? '-ml-4' : ''}`}
           />
           <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold">
             {redCount}
           </span>
         </div>
       )}
 
       {/* Lingkaran Hijau (Call 1) */}
       {greenCount > 0 && (
         <div className='relative'>
           <FontAwesomeIcon 
             icon={faCircle}
             className={`text-3xl text-(--green-tar-color) transform hover:scale-125 transition duration-300 ${!stacked && (yellowCount > 0 || redCount > 0) ? '-ml-4' : ''}`}
           />
           <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold'>
             {greenCount}
           </span>
         </div>
       )}
     </div>
   );
 };

export default BubbleNotifComponents


