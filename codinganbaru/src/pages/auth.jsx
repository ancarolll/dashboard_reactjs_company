import React, { createContext, useState, useEffect, useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

// Konteks autentikasi
const AuthContext = createContext(null);

// Provider autentikasi
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Cek localStorage saat aplikasi dimuat
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fungsi login
  const login = (userData, callback) => {
    // Verifikasi login di sini (bisa simulasi)
    const validUsers = {
      'admin_elnusa': { password: 'password123', role: 'admin', project: 'elnusa' },
      'admin_reg2': { password: 'reg2pass', role: 'admin', project: 'pertaminareg2' },
      'admin_reg4': { password: 'reg4pass', role: 'admin', project: 'pertaminareg4' }
    };

    const userInfo = validUsers[userData.username];
    
    if (userInfo && userInfo.password === userData.password) {
      const authenticatedUser = {
        username: userData.username,
        role: userInfo.role,
        project: userInfo.project
      };
      
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      
      if (callback) callback();
      return true;
    }
    
    return false;
  };

  // Fungsi logout
  const logout = (callback) => {
    setUser(null);
    localStorage.removeItem('user');
    if (callback) callback();
  };

  const value = { user, login, logout };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook untuk menggunakan konteks autentikasi
export const useAuth = () => {
  return useContext(AuthContext);
};

// Komponen untuk melindungi route
export const ProtectedRoute = ({ requiredProject }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect ke login jika tidak terautentikasi
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifikasi akses ke project tertentu (opsional)
  if (requiredProject && user.project !== requiredProject) {
    // Redirect ke halaman unauthorized jika tidak memiliki akses ke project
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};