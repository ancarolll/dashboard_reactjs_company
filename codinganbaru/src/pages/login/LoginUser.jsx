import React, { useState, useEffect } from 'react';
import '../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import ButtonComponents from '../../components/ButtonComponents';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// API base URL configuration
const API_BASE_URL = 'http://localhost:3005/api/accountuser';

const LoginUser = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    targetPage: '' // Optional: to check specific page access during login
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMessage, setUserMessage] = useState('');

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('userAuthToken');
      
      if (!token) return;
      
      try {
        // Verify token with backend
        const response = await axios.get(`${API_BASE_URL}/verify-token`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // Save user info to localStorage for convenience
          localStorage.setItem('userInfo', JSON.stringify(response.data.user));
          
          // Redirect to requested page or appropriate landing page based on role
          redirectUserBasedOnRole(response.data.user);
        }
      } catch (error) {
        // Invalid token, remove from localStorage
        console.error('Token verification error:', error);
        localStorage.removeItem('userAuthToken');
        localStorage.removeItem('userInfo');
      }
    };
    
    checkAuth();
  }, [navigate, location]);

  // Function to redirect user based on their role
  const redirectUserBasedOnRole = (user) => {
    if (!user || !user.role || !user.accessPages || user.accessPages.length === 0) {
      setError('User role or access information missing');
      return;
    }

    // Set default dashboard page based on role
    let defaultPage;
    
    // Tentukan halaman default berdasarkan role pengguna
    if (user.role === 'User PT. Elnusa') {
      defaultPage = '/user-els';
    } else if (user.role === 'User PT. Pertamina Ep Reg 4') {
      defaultPage = '/user-reg4';
    } else if (user.role === 'User PT. Pertamina Ep Reg 2 Eksplorasi') {
      defaultPage = '/user-reg2x';
    } else if (user.role === 'User PT. Pertamina Ep Reg 2 Subsurface') {
      defaultPage = '/user-reg2s';
    } else if (user.role === 'User PT. Pertamina Ep Reg 2 Zona 7 DevPlan') {
      defaultPage = '/user-reg2z7d';
    } else if (user.role === 'User PT. Pertamina Ep Reg 2 Zona 7 WOPDM') {
      defaultPage = '/user-reg2z7w';
    } else if (user.role === 'User PT. Umran Rubi Perkasa') {
      defaultPage = '/user-urp';
    } else {
      // Fallback jika role tidak dikenali, gunakan halaman akses pertama
      defaultPage = user.accessPages[0] || '/user-pt';
    }
    
    // Jika pengguna mencoba mengakses halaman tertentu, periksa apakah mereka memiliki akses
    if (location.state?.from?.pathname) {
      const requestedPage = location.state.from.pathname;
      
      // Periksa apakah halaman yang diminta ada dalam daftar halaman yang diizinkan
      if (user.accessPages.includes(requestedPage)) {
        navigate(requestedPage);
        return;
      }
    }
    
    navigate(defaultPage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setUserMessage('Memeriksa kredensial...');
    
    try {
      // Login through API
      const response = await axios.post(`${API_BASE_URL}/login`, credentials);
      
      if (response.data.success) {
        setUserMessage('Login berhasil! Mengalihkan...');
        
        // Store token in localStorage
        localStorage.setItem('userAuthToken', response.data.token);
        
        // Store user info in localStorage
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        
        // Redirect based on user role and access
        setTimeout(() => {
          redirectUserBasedOnRole(response.data.user);
        }, 1000); // Short delay for user to see success message
      } else {
        setError(response.data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setError('Username atau password salah. Silakan coba lagi.');
        } else if (error.response.status === 403) {
          setError('Anda tidak memiliki akses yang diperlukan.');
        } else {
          setError(error.response.data?.message || 'Terjadi kesalahan saat login');
        }
      } else if (error.request) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
      setUserMessage('');
    }
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  return (
    <div className='flex min-h-screen flex-row bg-(--background-tar-color)'>
    {/* Form Section (Now on the Left) */}
    <div className='w-1/2 lg:w-1/2 flex items-center justify-center p-8 bg-white'> 
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center text-(--font-tar-maroon-color)'>
          <h1 className='text-5xl text-left p-3 font-extrabold'>Log In 👋</h1>
          <p className='text-(--ash-60-oppacity)'>Please enter your account Username and Password</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-3">
            {error}
          </div>
        )}

        {userMessage && (
          <div className="bg-blue-100 text-blue-700 p-3 rounded mb-3">
            {userMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className='space-y-4'>
            <div>
              <label htmlFor="username" className='block text-sm font-medium text-gray-700 mb-1'>Username</label>
              <input 
                id="username" 
                name="username" 
                type="text" 
                required 
                value={credentials.username} 
                onChange={handleInputChange}
                className='appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900'
                placeholder='Enter username'
              />
            </div>

            <div>
              <label htmlFor="password" className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
              <div className='relative'>
                <input 
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter password"
                />
                <button 
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                >
                  {showPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <ButtonComponents variant="login" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Login'}
            </ButtonComponents>
          </div>
        </form>
      </div>
    </div>

    {/* Logo Section (Now on the Right) */}
    <div className='w-1/2 lg:w-1/2 flex flex-col items-center justify-center p-8'>
      <h2 className="text-center font-bold animate-bounce mt-2 gap-2 drop-shadow bigfont">PT. TIMUR ADI RAYA</h2>
      <div className="flex justify-center space-x-4 p-3">
        {/* Image */}
        <img 
          src="/tar.jpeg"
          alt="Company Logo"
          className="w-80 h-auto object-cover rounded-3xl"
        />
      </div>
    </div>
  </div>
);
};

export default LoginUser