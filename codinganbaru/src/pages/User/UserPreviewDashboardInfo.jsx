import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faExternalLinkAlt, faSpinner, faHome, faBell, faSun,faHouse,faFileContract,faHelmetSafety,faArrowRightFromBracket} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../../styles/main.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Konfigurasi API URL
const API_URL = 'http://localhost:3005';

const UserPreviewDashboardInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
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

  useEffect(() => {
    const fetchContentData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/dashboard/api/data/${id}`);
        
        if (response.data.success) {
          setContent(response.data.data);
        } else {
          setError('Konten tidak ditemukan');
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContentData();
    }
  }, [id]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleBackToDashboard = () => {
    // Arahkan ke halaman dashboard user berdasarkan role
    if (userInfo?.role?.includes('Elnusa')) {
      navigate('/user-els');
    } else if (userInfo?.role?.includes('Pertamina Ep Reg 4')) {
      navigate('/user-reg4');
    } else if (userInfo?.role?.includes('Pertamina Ep Reg 2 Eksplorasi')) {
      navigate('/user-reg2x');
    } else if (userInfo?.role?.includes('Pertamina Ep Reg 2 Subsurface')) {
      navigate('/user-reg2s');
    } else if (userInfo?.role?.includes('Pertamina Ep Reg 2 Zona 7 DevPlan')) {
      navigate('/user-reg2z7d');
    } else if (userInfo?.role?.includes('Pertamina Ep Reg 2 Zona 7 WOPDM')) {
      navigate('/user-reg2z7w');
    } else if (userInfo?.role?.includes('Umran Rubi Perkasa')) {
      navigate('/user-urp');
    } else {
      // Default fallback
      navigate('/');
    }
  };

  // Fungsi untuk menghandle logout
  const handleLogout = (e) => {
    e.preventDefault();
    
    // Hapus semua data otentikasi dari storage
    localStorage.removeItem('userAuthToken');
    localStorage.removeItem('userInfo');
    
    // Tampilkan pesan
    toast.success('Anda telah berhasil logout');
    
    // Arahkan ke halaman login
    setTimeout(() => {
      navigate('/log-user');
    }, 1500);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-(--background-tar-color) min-h-screen w-full">
      <div className="flex flex-col">
        <div className="w-full flex-1 flex flex-col h-screen overflow-y-auto px-3 sm:px-4 md:px-6 py-3">
          {/* HEADER */}
          <div className='w-full py-3'>
            <header className="bg-(--white-tar-color) text-right p-3 shadow-md rounded">
              <a href="#" className="inline-block">
                <FontAwesomeIcon icon={faBell} className='text-lg px-3 sm:px-6 text-(--ash-60-oppacity)'/>
              </a>
              <a href="" className="inline-block">
                <FontAwesomeIcon icon={faSun} className='text-lg text-(--ash-60-oppacity)'/>
              </a>
            </header>
          </div>
          
          <main className="flex-1 flex w-full items-center justify-center">
            <div className="text-center p-4 sm:p-10 w-full">
              <div className="relative w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
                <div className="absolute inset-3 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-xl sm:text-2xl text-blue-600" />
                </div>
              </div>
              <p className="text-base sm:text-lg font-medium text-gray-700">Memuat konten...</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
            </div>
          </main>
          
          {/* FOOTER */}
          <div className='bg-(--background-tar-color) text-xs w-full'>
            <footer className="flex flex-col sm:flex-row justify-center items-center sm:space-x-5 text-(--ash-60-oppacity) text-center p-4">
              <p>&copy; 2025 Made</p>
              <p className='flex space-x-2 mt-1 sm:mt-0'>
                <span>Distributed By </span>
                <span className='text-(--tar-color)'>PT Timur Adi Raya</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

  // Error state
  if (error || !content) {
    return (
      <div className="bg-(--background-tar-color) min-h-screen w-full">
        <div className="flex flex-col">
          <div className="w-full flex-1 flex flex-col h-screen overflow-y-auto px-3 sm:px-4 md:px-6 py-3">
            {/* HEADER */}
            <div className='w-full py-3'>
              <header className="bg-(--white-tar-color) text-right p-3 shadow-md rounded">
                <a href="#" className="inline-block">
                  <FontAwesomeIcon icon={faBell} className='text-lg px-3 sm:px-6 text-(--ash-60-oppacity)'/>
                </a>
                <a href="" className="inline-block">
                  <FontAwesomeIcon icon={faSun} className='text-lg text-(--ash-60-oppacity)'/>
                </a>
              </header>
            </div>
            
            <main className="flex-1 w-full">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden mt-4 sm:mt-10 px-4 sm:px-0">
                <div className="p-4 sm:p-8 text-center">
                  <div className="text-red-600 text-4xl sm:text-6xl mb-4">⚠️</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Konten Tidak Ditemukan</h2>
                  <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">{error || 'Konten yang Anda cari tidak tersedia atau telah dihapus.'}</p>
                  <button 
                    onClick={handleBackToDashboard}
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <FontAwesomeIcon icon={faHome} className="mr-2" />
                    Kembali ke Dashboard
                  </button>
                </div>
              </div>
            </main>
            
            {/* FOOTER */}
            <div className='bg-(--background-tar-color) text-xs w-full'>
              <footer className="flex flex-col sm:flex-row justify-center items-center sm:space-x-5 text-(--ash-60-oppacity) text-center p-4">
                <p>&copy; 2025 Made</p>
                <p className='flex space-x-2 mt-1 sm:mt-0'>
                  <span>Distributed By </span>
                  <span className='text-(--tar-color)'>PT Timur Adi Raya</span>
                </p>
              </footer>
            </div>
          </div>
        </div>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  // Content display
  return (
    <div className="bg-(--background-tar-color) min-h-screen w-full">
      <div className="flex flex-col">
        <div className="w-full flex-1 flex flex-col h-screen overflow-y-auto px-3 sm:px-4 md:px-6 py-3">
          {/* HEADER */}
          <div className='w-full py-3'>
            <header className="bg-(--white-tar-color) text-right p-3 shadow-md rounded">
              <a href="#" className="inline-block">
                <FontAwesomeIcon icon={faBell} className='text-lg px-3 sm:px-6 text-(--ash-60-oppacity)'/>
              </a>
              <a href="" className="inline-block">
                <FontAwesomeIcon icon={faSun} className='text-lg text-(--ash-60-oppacity)'/>
              </a>
            </header>
          </div>
          
          <main className="flex-1 w-full mx-auto px-2 sm:px-4">
            <div className="w-full py-3 bg-white rounded-xl shadow-lg overflow-hidden my-4 sm:my-8">
              {/* Header dengan navigasi kembali */}
              <div className="relative h-12 sm:h-16 bg-gradient-to-r from-[#800000] to-[#660000] flex items-center px-4 sm:px-6">
                <h3 className="text-white font-medium text-center w-full">PT. TIMUR ADI RAYA</h3>
              </div>
              
              {/* Judul */}
              <div className="p-4 sm:p-8 pb-2 sm:pb-4">
                <h2 className="text-xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
                  {content.image_title}
                </h2>
                {!content.is_active && (
                  <div className="flex justify-center">
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                      Nonaktif
                    </span>
                  </div>
                )}
              </div>
              
              {/* Gambar */}
              <div className="px-4 sm:px-8 py-2 sm:py-4">
                <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-2xl sm:text-3xl text-gray-400" />
                    </div>
                  )}
                  {content.image_path ? (
                    <img 
                      src={`${API_URL}${content.image_path}`} 
                      alt={content.image_title}
                      className="w-full h-auto object-contain rounded-lg" 
                      style={{ maxHeight: '500px' }}
                      onLoad={handleImageLoad}
                    />
                  ) : (
                    <div className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Tidak ada gambar</p>
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
                    Deskripsi
                  </h3>
                  <div className="bg-gray-50 p-3 sm:p-5 rounded-xl border border-gray-100">
                    {content.image_description ? (
                      <p className="whitespace-pre-line text-sm sm:text-base text-gray-700 leading-relaxed">
                        {content.image_description}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">Tidak ada deskripsi</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Link eksternal */}
              {content.external_link && (
                <div className="px-4 sm:px-8 pb-4 sm:pb-8">
                  <div className="mt-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Link Eksternal
                    </h3>
                    <a 
                      href={content.external_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 max-w-xs mx-auto"
                    >
                      <span className="mr-2">Kunjungi Website</span>
                      <FontAwesomeIcon icon={faExternalLinkAlt} />
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
                      Dibuat: {new Date(content.created_at).toLocaleDateString('id-ID', {
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
                      Diperbarui: {new Date(content.updated_at).toLocaleDateString('id-ID', {
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

              {/* Tombol kembali */}
              <div className="p-4 sm:p-6 flex justify-center">
                <button 
                  onClick={handleBackToDashboard}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                >
                  <FontAwesomeIcon icon={faHome} className="mr-2" />
                  <span>Kembali ke Dashboard</span>
                </button>
              </div>
            </div>
          </main>
          
          {/* FOOTER */}
          <div className='bg-(--background-tar-color) text-xs w-full'>
            <footer className="flex flex-col sm:flex-row justify-center items-center sm:space-x-5 text-(--ash-60-oppacity) text-center p-4">
              <p>&copy; 2025 Made</p>
              <p className='flex space-x-2 mt-1 sm:mt-0'>
                <span>Distributed By </span>
                <span className='text-(--tar-color)'>PT Timur Adi Raya</span>
              </p>
            </footer>
          </div>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default UserPreviewDashboardInfo