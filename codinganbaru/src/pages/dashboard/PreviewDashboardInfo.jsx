import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faExternalLinkAlt, faSpinner, faHome } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import HeaderComponents from '../../components/HeaderComponents';
import FooterComponents from '../../components/FooterComponents';
import AsideComponents from '../../components/AsideComponents';
import '../../styles/main.css';

// Konfigurasi API URL
const API_URL = 'http://localhost:3005';

const PreviewDashboardInfo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
  
    useEffect(() => {
      const fetchContentData = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/dashboard/api/data/${id}`);
          
          if (response.data.success) {
            setContent(response.data.data);
          } else {
            setError('Content not found');
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
        navigate('/');
      };
  
    if (loading) {
      return (
        <div className="bg-(--background-tar-color) min-h-screen">
          <div className="flex">
            <div className='h-screen fixed left-0 top-0'>
              <AsideComponents />
            </div>
            
            <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
              <div className='w-fill h-hug py-3'>
                <HeaderComponents />
              </div>
              
              <main className="flex-1 flex items-center justify-center">
                <div className="text-center p-10">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
                    <div className="absolute inset-3 flex items-center justify-center">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-700">Loading content...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
                </div>
              </main>
              
              <FooterComponents />
            </div>
          </div>
        </div>
      );
    }
  
    if (error || !content) {
      return (
        <div className="bg-(--background-tar-color) min-h-screen">
          <div className="flex">
            <div className='h-screen fixed left-0 top-0'>
              <AsideComponents />
            </div>
            
            <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
              <div className='w-fill h-hug py-3'>
                <HeaderComponents />
              </div>
              
              <main className="flex-1">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden mt-10">
                  <div className="p-8 text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Konten Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">{error || 'Konten yang Anda cari tidak tersedia atau telah dihapus.'}</p>
                    <button 
                      onClick={handleBackToDashboard}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <FontAwesomeIcon icon={faHome} className="mr-2" />
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </main>
              
              <FooterComponents />
            </div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="bg-(--background-tar-color) min-h-screen">
        <div className="flex">
          <div className='h-screen fixed left-0 top-0'>
            <AsideComponents />
          </div>
          
          <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
            <div className='w-fill h-hug py-3'>
              <HeaderComponents />
            </div>
            
            <main className="flex-1">
              <div className="mx-auto bg-white rounded-xl shadow-lg overflow-hidden my-8">
                {/* Header dengan navigasi kembali */}
                <div className="relative h-16 bg-gradient-to-r from-[#800000] to-[#660000] flex items-center px-6">
                  <h5 className="text-white font-medium text-center w-full">Content Details</h5>
                </div>
                
                {/* Judul */}
                <div className="p-8 pb-4">
                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
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
                <div className="px-8 py-4">
                  <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg">
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-gray-400" />
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
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">No image available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Deskripsi */}
                <div className="p-8">
                  <div className="prose max-w-none">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Description
                    </h3>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      {content.image_description ? (
                        <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                          {content.image_description}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">No description available</p>
                      )}
                    </div>
                  </div>
                </div>
                
               {/* Link eksternal */}
               {content.external_link && (
                  <div className="px-8 pb-8">
                    <div className="mt-2">
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                        </span>
                        External Link
                      </h3>
                      <a 
                        href={content.external_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 max-w-xs mx-auto"
                      >
                        <span className="mr-2">Visit Website</span>
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Metadata */}
                <div className="bg-gray-50 p-6 border-t">
                  <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Created: {new Date(content.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>
                        Updated: {new Date(content.updated_at).toLocaleDateString('id-ID', {
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
                <div className="p-6 flex justify-center">
                  <button 
                    onClick={handleBackToDashboard}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faHome} className="mr-2" />
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              </div>
            </main>
            
            <FooterComponents />
          </div>
        </div>
      </div>
    );
  };  

export default PreviewDashboardInfo