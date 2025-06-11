import React, { useState, useEffect } from 'react';
import '../../styles/main.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import ButtonComponents from '../../components/ButtonComponents';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/api';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

   // Cek jika sudah login
   useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) return;
      
      try {
        // Verify token with backend
        const response = await api.get('/api/account/verify-token');
        
        if (response.data.success) {
          // Save user info to localStorage for convenience
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          
          // Redirect to requested page or dashboard
          const destination = location.state?.from?.pathname || '/';
          navigate(destination);
        }
      } catch (error) {
        // Invalid token, remove from sessionStorage
        console.error('Token verification error:', error);
        sessionStorage.removeItem('authToken');
      }
    };
    
    checkAuth();
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Login through API
      const response = await api.post('/api/account/login', credentials);
      
      if (response.data.success) {
        // Store token in sessionStorage (not localStorage)
        sessionStorage.setItem('authToken', response.data.token);
        
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        
        // Also store baseAuth for BaseProtectedRoute
        localStorage.setItem('baseAuth', JSON.stringify({ isLoggedIn: true }));
        
        // Redirect to destination page or dashboard
        const destination = location.state?.from?.pathname || '/';
        navigate(destination);
      } else {
        setError(response.data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response && error.response.status === 401) {
        setError('Username atau password salah. Silakan coba lagi.');
      } else if (error.response) {
        setError(error.response.data.message || 'Username atau password salah');
      } else {
        setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-row bg-(--background-tar-color)'>
      {/* kiri layout  */}
      <div className='w-1/2 lg:w-1/2 flex flex-col items-center justify-center p-8'>
      <h2 className="text-center font-bold animate-bounce mt-2 gap-2 drop-shadow bigfont ">PT. TIMUR ADI RAYA</h2>
            <div className="flex justify-center space-x-4 p-3">
            {/* Gambar */}
            <img 
              src="/tar.jpeg"
              alt="Tar Logo"
              className="w-80 h-auto object-cover rounded-3xl"
            />
          </div>
        </div>
      
      {/* Kanan Layout */}
      <div className='w-1/2 lg:w-1/2 flex items-center justify-center p-8 bg-white'> 
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center text-(--font-tar-maroon-color)'>
            <h1 className='text-2xl font-bold'>Welcome Admin👋</h1>
            <p className='text-(--ash-60-oppacity)'>Please enter your account Username and Password</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className='space-y-4'>
              <div>
                  <label htmlFor="username" className='block text-sm font-medium text-gray-700 mb-1'> Username </label>
                  <input 
                    id="username" 
                    name="username" 
                    type="text" 
                    required 
                    value={credentials.username} 
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className='appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900'
                    placeholder='Enter username'
                  />
                </div>

                <div>
                <label htmlFor="password" className='block text-sm font-medium text-gray-700 mb-1'> Password </label>
                <div className='relative'>
                  <input 
                    id="password" 
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})} 
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
    </div>

  )
}

export default LoginPage