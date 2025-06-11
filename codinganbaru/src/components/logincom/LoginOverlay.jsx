import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import ButtonComponents from '../ButtonComponents';

const PAGE_ACCESS_MAP = {
  // Halaman Project Elnusa
  '/elnusa-edit': ['Admin Project PT. Elnusa', 'Master Admin'],
  '/nonactive-elnusa': ['Admin Project PT. Elnusa', 'Master Admin'],
  '/upload-massal-elnusa': ['Admin Project PT. Elnusa', 'Master Admin'],
  '/tambah-user-elnusa': ['Admin Project PT. Elnusa', 'Master Admin'],
  
  // Halaman Project Pertamina EP Reg 4
  '/regional4-edit': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  '/nonactive-regional4': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  '/upload-massal-regional4': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  '/tambah-user-regional4': ['Admin Project PT. Pertamina Ep Reg 4', 'Master Admin'],
  
  // Halaman Project Pertamina EP Reg 2 Eksplorasi
  '/regional2x-edit': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  '/nonactive-regional2x': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  '/upload-massal-regional2x': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  '/tambah-user-regional2x': ['Admin Project PT. Pertamina Ep Reg 2 Eksplorasi', 'Master Admin'],
  
  // Halaman Project Pertamina EP Reg 2 Subsurface
  '/regional2s-edit': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  '/nonactive-regional2s': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  '/tambah-user-regional2s': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  '/upload-massal-regional2s': ['Admin Project PT. Pertamina Ep Reg 2 Subsurface', 'Master Admin'],
  
  // Halaman Project PT. Pertamina EP Reg 2 Zona 7 DevPlan
  '/regional2z7d-edit': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],
  '/nonactive-regional2z7d': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],
  '/tambah-user-regional2z7d': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],
  '/upload-massal-regional2z7d': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan', 'Master Admin'],

  // Halaman Project PT. Pertamina EP Reg 2 Zona 7 WOPDM
  '/regional2z7w-edit': ['Admin Project PT. Pertamina Ep Reg 2 Zona 7 WOPDM', 'Master Admin'],
  '/nonactive-regional2z7w': ['Admin Project PT. Pertamina EP Reg 2 Zona 7 WOPDM', 'Master Admin'],
  '/tambah-user-regional2z7w': ['Admin Project PT. Pertamina EP Reg 2 Zona 7 WOPDM', 'Master Admin'],
  '/upload-massal-regional2z7w': ['Admin Project PT. Pertamina EP Reg 2 Zona 7 WOPDM', 'Master Admin'],

  // Halaman Project PT. Umran Rubi Perkasa
  '/umran-edit': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  '/nonactive-umran': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  '/tambah-user-umran': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  '/upload-massal-umran': ['Admin Project PT. Umran Rubi Perkasa', 'Master Admin'],
  
  // Halaman HSE
  '/hse-elnusa': ['Admin HSE', 'Master Admin'],
  '/hse-elnusa-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional4': ['Admin HSE', 'Master Admin'],
  '/hse-regional4-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2x': ['Admin HSE', 'Master Admin'],
  '/hse-regional2x-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2s': ['Admin HSE', 'Master Admin'],
  '/hse-regional2s-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7d': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7d-form': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7w': ['Admin HSE', 'Master Admin'],
  '/hse-regional2z7w-form': ['Admin HSE', 'Master Admin'],
  '/hse-tar': ['Admin HSE', 'Master Admin'],

  // Halaman Management
  '/management-edit': ['Admin Management', 'Master Admin'],
  '/add-management': ['Admin Management', 'Master Admin'],
  
  // Halaman User Account
  '/user-account': ['Master Admin'],
  
  // Halaman Admin Account
  '/admin-account': ['Master Admin']
};

const normalizePathForAccess = (path) => {
  if (!path) return '';
  
  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Remove trailing slash
  path = path.replace(/\/$/, '');
  
  // Replace dynamic parameters dengan base pattern
  // Contoh: /hse-regional2x-form/123 -> /hse-regional2x-form
  path = path.replace(/\/\d+$/, '');
  
  return path;
};

const LoginOverlay = ({ isOpen, onClose, onLogin, username, setUsername, password, setPassword, targetPage, message = "Please login to continue"}) => {

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Tambahkan state loading
    const navigate = useNavigate();

    const handleOverlayClick = (e) => {
      e.stopPropagation();
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      
      try {

        const normalizedTargetPage = normalizePathForAccess(targetPage);
        
        // Langkah 1: Login dengan kredensial
        const response = await api.post('/api/account/login', {
          username,
          password,
          targetPage
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          
           // Step 2: Check if user role matches required roles for the page
          // MODIFICATION: Special case for Master Admin - they get access to everything
          const isMasterAdmin = userData.role === 'Master Admin';
          
          // If Master Admin, they get access regardless of PAGE_ACCESS_MAP
          // Otherwise, check against the page access requirements
          const roleAllowed = PAGE_ACCESS_MAP[targetPage] || [];
          const hasAccess = isMasterAdmin || roleAllowed.includes(userData.role);
          
          if (hasAccess) {
            // Berhasil login dan memiliki akses
            // Simpan token dan data user
            sessionStorage.setItem('authToken', response.data.token);
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('baseAuth', JSON.stringify({ isLoggedIn: true }));
            
            // Tutup overlay
            setIsLoading(false);
            
            // Panggil onLogin callback
            if (typeof onLogin === 'function') {
              onLogin();
            }
            
            // Navigasi ke halaman target
            navigate(targetPage);
          } else {
            // Successfully logged in but doesn't have access
            setError(`Your account (${userData.role}) doesn't have access to the ${targetPage} page`);
            setIsLoading(false);
          }
        } else {
          setError(response.data.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.response && error.response.status === 401) {
          setError('Username or password is incorrect. Please try again.');
        } else if (error.response && error.response.status === 403) {
          setError('Your account doesn\'t have access to this page.');
        } else if (error.response) {
          setError(error.response.data.message || 'Username or password is incorrect');
        } else {
          setError('Cannot connect to server. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    if (!isOpen) return null;

    // Dapatkan informasi role yang dibutuhkan untuk halaman target
    const requiredRoles = PAGE_ACCESS_MAP[targetPage] || [];
    const roleMessage = requiredRoles.length > 0 
      ? `This page requires special access: ${requiredRoles.join(' or ')}`
      : 'This page requires special access';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick={handleOverlayClick}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Login Required</h2>
              <button 
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {message && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4">
                {message}
              </div>
            )}
  
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded mb-4">
              {roleMessage}
            </div>
            
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="overlay-username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    id="overlay-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="overlay-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="overlay-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
  };

export default LoginOverlay