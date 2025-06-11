import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import LoginOverlay from '../logincom/LoginOverlay';

// PERBAIKAN: Fungsi normalization yang lebih robust
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

const ProtectedRoute = ({ children, requiredAccess }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Effect terpisah untuk handle redirect
    useEffect(() => {
      if (shouldRedirect) {
        setShouldRedirect(false);
        navigate('/');
      }
    }, [shouldRedirect, navigate]);

    // Cek apakah user sudah login dan memiliki akses yang diperlukan
    useEffect(() => {
        const checkAuth = async () => {
          try {
            const token = sessionStorage.getItem('authToken');
            
            if (!token) {
              setIsAuthenticated(false);
              setIsAuthorized(false);
              setIsLoginOverlayOpen(true);
              setIsLoading(false);
              return;
            }
            
            // PERBAIKAN: Normalize kedua path dengan konsisten
            const normalizedRequiredAccess = normalizePathForAccess(requiredAccess);
            const currentPath = normalizePathForAccess(location.pathname);
            
            // Verify token and access with backend
            const response = await api.get('/api/account/verify-access', {
              params: { 
                requiredAccess: normalizedRequiredAccess,
                currentPath: currentPath
              }
            });
            
            if (response.data.success) {
              setIsAuthenticated(true);
              setIsAuthorized(true);
              setCurrentUser(response.data.user);
            } else {
              setIsAuthenticated(true);
              setIsAuthorized(false);
              setIsLoginOverlayOpen(true);
            }
          } catch (error) {
            console.error('Error verifying access:', error);
            
            if (error.response && error.response.status === 401) {
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('baseAuth');
            }
            
            setIsAuthenticated(false);
            setIsAuthorized(false);
            setIsLoginOverlayOpen(true);
          } finally {
            setIsLoading(false);
          }
        };
        
        checkAuth();
      }, [requiredAccess, location.pathname]);

      const handleLoginSuccess = async (tokenData) => {
        try {
          sessionStorage.setItem('authToken', tokenData.token);
          localStorage.setItem('currentUser', JSON.stringify(tokenData.user));
          localStorage.setItem('baseAuth', JSON.stringify({ isLoggedIn: true }));
          
          // PERBAIKAN: Normalize required access untuk verification
          const normalizedRequiredAccess = normalizePathForAccess(requiredAccess);
          
          const response = await api.get('/api/account/verify-access', {
            params: { 
              requiredAccess: normalizedRequiredAccess,
              currentPath: normalizePathForAccess(location.pathname)
            }
          });
          
          if (response.data.success) {
            setIsAuthenticated(true);
            setIsAuthorized(true);
            setCurrentUser(tokenData.user);
            setIsLoginOverlayOpen(false);
            setUsername('');
            setPassword('');
          } else {
            const requiredRoles = response.data.requiredRoles || [];
            const userRole = tokenData.user.role;
            alert(`Access denied. Your role (${userRole}) does not have permission to access this page. Required roles: ${requiredRoles.join(' or ')}`);
            setIsLoginOverlayOpen(false);
            setShouldRedirect(true);
          }
        } catch (error) {
          console.error("Error pada login:", error);
          
          let errorMessage = "Login verification failed";
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          
          alert(errorMessage);
          setIsLoginOverlayOpen(false);
          setShouldRedirect(true);
        }
      };
    
      const closeLoginOverlay = () => {
        setIsLoginOverlayOpen(false);
        setUsername('');
        setPassword('');
        setShouldRedirect(true);
      };
    
      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3">Checking access permissions...</p>
          </div>
        );
      }
    
        if (isAuthenticated && isAuthorized) {
        return children;
        }
    
        return (
        <>
           {isLoginOverlayOpen && (
                <LoginOverlay
                isOpen={isLoginOverlayOpen}
                onClose={closeLoginOverlay}
                onLogin={handleLoginSuccess}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                targetPage={location.pathname}
                message="This page requires special access. Please login with appropriate credentials."
                />
            )}
            
            {!isLoginOverlayOpen && !isLoading && !(isAuthenticated && isAuthorized) && (
              <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Access Required</h2>
                  <p className="text-gray-500 mb-4">You need special permissions to access this page.</p>
                  <button 
                    onClick={() => setShouldRedirect(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            )}
        </>
        );
    };

export default ProtectedRoute;