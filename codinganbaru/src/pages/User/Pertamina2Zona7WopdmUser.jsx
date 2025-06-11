import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faFileContract, faHelmetSafety, faArrowRightFromBracket, faBell, faSun, faImage, faLink, faArrowLeft, faExternalLinkAlt, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/main.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3005';

const Pertamina2Zona7WopdmUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);
  
  // State untuk data dashboard
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
    
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  

  // Effect untuk menyetel path aktif
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  // Effect untuk mengambil info pengguna
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

  // Mengambil data dari API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/dashboard/api/data?all=true`);
      if (response.data.success) {
        // Filter hanya data yang aktif
        const activeData = response.data.data.filter(item => item.is_active);
        setDashboardData(activeData);
      } else {
        toast.error('Failed to retrieve dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('An error occurred while retrieving data');
    } finally {
      setLoading(false);
    }
  };

  // Saat komponen dimuat, ambil data dashboard
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fungsi untuk styling link
  const getLinkClassName = (path) => {
    const baseClasses = "flex items-center space-x-2 p-3 rounded-lg btn-aside no-underline text-black";
    return `${baseClasses} ${activePath === path ? 'active' : ''}`;
  };

  // Fungsi untuk menghandle logout
  const handleLogout = (e) => {
    e.preventDefault();
    
    // Hapus semua data otentikasi dari storage
    localStorage.removeItem('userAuthToken');
    localStorage.removeItem('userInfo');
    
    // Tampilkan pesan
    toast.success('You have successfully logged out');
    
    // Arahkan ke halaman login
    setTimeout(() => {
      navigate('/log-user');
    }, 1500);
  };

  const fetchPreviewData = async (id) => {
    setLoading(true);
    try {
        const response = await axios.get(`${API_URL}/dashboard/api/data/${id}`);
        if (response.data.success) {
            setPreviewData(response.data.data);
        } else {
            toast.error('Failed to retrieve dashboard details');
        }
    } catch (error) {
        console.error('Error fetching preview data:', error);
        toast.error('An error occurred while retrieving details');
    } finally {
        setLoading(false);
    }
};
// Update fungsi handleViewDetail
  const handleViewDetail = (id) => {
    setSelectedItemId(id);
    fetchPreviewData(id);
  };
  
  // Fungsi untuk kembali ke tampilan dashboard
  const handleBackToDashboard = () => {
    setSelectedItemId(null);
    setPreviewData(null);
  };

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
                      {/* {userInfo?.role || 'PT. Elnusa'} */}
                      {'PT. Timur Adi Raya'}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {userInfo?.username || 'User'}
                    </p>
                  </div>
              
              <nav className="mt-8 space-y-4">
                {/* Link Dashboard */}
                <Link to="/user-reg2z7w" className={getLinkClassName('/user-reg2z7w')}>
                  <FontAwesomeIcon icon={faHouse} className='text-lg'/>
                  <span className='text-sm'>Dashboard</span>
                </Link>
                
                {/* Link Contract */}
                <Link to="/contract-reg2z7w" className={getLinkClassName('/contract-reg2z7w')}>
                  <FontAwesomeIcon icon={faFileContract} className='text-lg'/>
                  <span className='text-sm'>Contract</span>
                </Link>
                
                {/* Link HSE */}
                <Link to="/data-hse-reg2z7w" className={getLinkClassName('/data-hse-reg2z7w')}>
                  <FontAwesomeIcon icon={faHelmetSafety} className='text-lg'/>
                  <span className='text-sm'>HSE</span>
                </Link>
                
                {/* Tombol Logout */}
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

          {/* MAIN CONTENT */}
          <main className="flex-1 bg-(--background-tar-color) space-y-6">
            <div className='flex flex-col bg-white p-3 shadow-md rounded gap-4'>
              <div className='text-(--font-tar-maroon-color) flex items-baseline space-x-2'>
              <h2>Welcome to</h2>
              <h1 className='font-bold'>DigiTAR PT Pertamina Zona 7 WOPDM</h1> 
              </div>

              {selectedItemId && previewData ? (
                <div className='bg-white p-6 rounded-lg shadow-md'>
                  {/* Header dengan navigasi kembali */}
                  <div className="mb-6">
                    <button 
                      onClick={handleBackToDashboard}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                      Back
                    </button>
                  </div>
                  
                  {/* Header dan judul */}
                  <div className="relative h-12 sm:h-16 bg-gradient-to-r from-[#800000] to-[#660000] flex items-center px-4 sm:px-6 mb-6">
                    <h3 className="text-white font-medium text-center w-full">PT. TIMUR ADI RAYA</h3>
                  </div>
                  
                  {/* Judul */}
                  <div className="p-4 sm:p-8 pb-2 sm:pb-4">
                    <h2 className="text-xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
                      {previewData.image_title}
                    </h2>
                    {!previewData.is_active && (
                      <div className="flex justify-center">
                        <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                          NonActive
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Gambar */}
                  <div className="px-4 sm:px-8 py-2 sm:py-4">
                    <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg">
                      {previewData.image_path ? (
                        <img 
                          src={`${API_URL}${previewData.image_path}`} 
                          alt={previewData.image_title}
                          className="w-full h-auto object-contain rounded-lg" 
                          style={{ maxHeight: '500px' }}
                        />
                      ) : (
                        <div className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">No image available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Deskripsi */}
                  <div className="p-4 sm:p-8">
                    <div className="prose max-w-none">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Description
                      </h3>
                      <div className="bg-gray-50 p-3 sm:p-5 rounded-xl border border-gray-100">
                        {previewData.image_description ? (
                          <p className="whitespace-pre-line text-sm sm:text-base text-gray-700 leading-relaxed">
                            {previewData.image_description}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">No description available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Link eksternal */}
                  {previewData.external_link && (
                    <div className="px-4 sm:px-8 pb-4 sm:pb-8">
                      <div className="mt-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                          <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                          </span>
                          External Link
                        </h3>
                        <a 
                          href={previewData.external_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 max-w-xs mx-auto"
                        >
                          <span className="mr-2">Visit Website</span>
                          <FontAwesomeIcon icon={faLink} />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="bg-gray-50 p-4 sm:p-6 border-t">
                    <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          Created: {new Date(previewData.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>
                          Updated: {new Date(previewData.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-lg font-semibold">Dashboard Content List</h4>
                  </div>
                </div>
                
                {loading && (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading data...</p>
                  </div>
                )}
                
                {!loading && dashboardData.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-md">
                    <FontAwesomeIcon icon={faImage} className="text-gray-400 text-5xl mb-3" />
                    <p className="text-gray-500">No active content is currently displayed.</p>
                  </div>
                )}

                {!loading && dashboardData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.map(item => (
                      <div 
                        key={item.id} 
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                        onClick={() => handleViewDetail(item.id)}
                      >
                        <div className="relative h-48 bg-gray-100">
                          {item.image_path ? (
                            <img 
                              src={`${API_URL}${item.image_path}`} 
                              alt={item.image_title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faImage} className="text-gray-400 text-5xl" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold mb-2 truncate">{item.image_title}</h5>
                          <p className="text-sm text-gray-600 line-clamp-3 h-14 overflow-hidden">
                            {item.image_description || 'Tidak ada deskripsi'}
                          </p>
                          {item.external_link && (
                            <div className="mt-2">
                              <a 
                                href={item.external_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FontAwesomeIcon icon={faLink} className="mr-1" />
                                <span className="truncate">{item.external_link}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
              </div>
          </main>

          {/* FOOTER */}
          <div className='bg-(--background-tar-color) text-xs'>
            <footer className="flex justify-center space-x-5 text-(--ash-60-oppacity) text-center p-4">
              <p>&copy; 2025 Made</p>
              <p className='flex space-x-2'>
                <span>Distributed By </span>
                <span className='text-(--tar-color)'>PT Pertamina Zona 7 WOPDM</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Pertamina2Zona7WopdmUser