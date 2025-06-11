import React, { useState, useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import api from "../../config/api";


const BaseProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Verify token-based authentication
        const checkAuth = async () => {
          const token = sessionStorage.getItem('authToken');
          
          if (!token) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
          
          try {
            // Verify token with backend
            const response = await api.get('/api/account/verify-token');
            
            if (response.data.success) {
              // Update user info if needed
              localStorage.setItem('currentUser', JSON.stringify(response.data.user));
              localStorage.setItem('baseAuth', JSON.stringify({ isLoggedIn: true }));
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              // Clean up invalid tokens
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('baseAuth');
            }
          } catch (error) {
            console.error("Token verification error:", error);
            setIsAuthenticated(false);
            // Clean up on error
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('baseAuth');
          } finally {
            setLoading(false);
          }
        };
        
        checkAuth();
      }, []);
    
     // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Verifikasi akses...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the page they wanted to access for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Render child routes using Outlet
  return <Outlet />;
};

export default BaseProtectedRoute;