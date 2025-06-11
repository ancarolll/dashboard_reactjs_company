import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api/accountuser';

const UserProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAccess = async () => {
      setIsLoading(true);
      
      try {
        // Periksa apakah user memiliki token
        const token = localStorage.getItem('userAuthToken');
        if (!token) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        
        // Dapatkan info user
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        // Verifikasi akses dengan cek apakah path saat ini ada dalam accessPages
        if (userInfo && userInfo.accessPages) {
          // Path saat ini
          const currentPath = location.pathname;
          
          // Cek apakah path saat ini ada dalam daftar accessPages
          const hasAccess = userInfo.accessPages.some(page => 
            currentPath === page || 
            // Periksa juga jika ini adalah path dengan parameter
            (page.includes(':id') && currentPath.startsWith(page.split(':id')[0]))
          );
          
          setIsAuthorized(hasAccess);
        } else {
          // Jika tidak ada info accessPages, coba verifikasi dengan API
          const response = await axios.get(`${API_BASE_URL}/verify-access`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { requiredAccess: location.pathname }
          });
          
          setIsAuthorized(response.data.success);
        }
      } catch (error) {
        console.error('Error verifying user access:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccess();
  }, [location]);

  if (isLoading) {
    // Tampilkan loading state
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Redirect ke halaman login jika tidak terautentikasi atau tidak memiliki akses
    return <Navigate to="/log-user" state={{ from: location }} replace />;
  }

  // Render child atau outlet jika terautentikasi dan memiliki akses
  return children || <Outlet />;
};

export default UserProtectedRoute;