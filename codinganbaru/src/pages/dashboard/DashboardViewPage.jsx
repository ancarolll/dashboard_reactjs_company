import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsideComponents from '../../components/AsideComponents';
import FooterComponents from '../../components/FooterComponents';
import HeaderComponents from '../../components/HeaderComponents';
import '../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faEdit, faTrash, faEye, faEyeSlash, faLink, faPlus } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3005';

const DashboardViewPage = () => {
    const navigate = useNavigate();
    
    // State untuk daftar data
    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(false);

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
            toast.error('Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('An error occurred while retrieving data');
        } finally {
            setLoading(false);
        }
    };

    // Saat komponen dimuat
    useEffect(() => {
    fetchDashboardData();
    }, []);

    const handleViewDetail = (id) => {
        navigate(`/dashboard/preview/${id}`);
      };

    return (
    <div className='bg-(--background-tar-color)'> 
        <div className="flex">
        <div className='h-screen fixed left-0 top-0'>
            <AsideComponents />
        </div>
    
        {/* Konten Utama (Header, Main, Footer) */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
            {/* Header */}
            <div className='w-fill h-hug py-3'>
            <HeaderComponents />
            </div>

            {/* Main Content */}
            <main className="flex-1 bg-(--background-tar-color) space-y-6">
            <div className='flex flex-col bg-white p-3 shadow-md rounded gap-4'>
                <div className='text-(--font-tar-maroon-color) flex items-baseline space-x-2'>
                <h2>Welcome to</h2>
                <h1 className='font-bold'>DigiTAR</h1> 
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-lg font-semibold">Dashboard Content List</h4>
                    </div>
                  </div>
                  {loading && <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading data...</p>
                  </div>}
                  
                  {!loading && dashboardData.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-md">
                      <FontAwesomeIcon icon={faImage} className="text-gray-400 text-5xl mb-3" />
                      <p className="text-gray-500">No active content is displayed yet.</p>
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
                                                    onClick={(e) => e.stopPropagation()} // Mencegah memicu onClick parent
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
              </div>
            </main>
    
            {/* Footer*/}
            <FooterComponents/>
          </div>
        </div>
        
        <ToastContainer position="top-right" autoClose={3000} />
    </div>
    );
}

export default DashboardViewPage;

