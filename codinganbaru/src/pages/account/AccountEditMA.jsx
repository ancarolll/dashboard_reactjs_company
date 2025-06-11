import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsideComponents from '../../components/AsideComponents';
import HeaderComponents from '../../components/HeaderComponents';
import FooterComponents from '../../components/FooterComponents';
import '../../styles/main.css'
import ButtonComponents from '../../components/ButtonComponents';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faCopy } from '@fortawesome/free-solid-svg-icons';

// API base URL
const API_BASE_URL = 'http://localhost:3005/api/account';

// Create axios instance with auth interceptor
const createAuthenticatedAxios = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
  });

  // Add token to every request
  instance.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle auth errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('baseAuth');
        window.location.href = '/logadm';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const AccountEditMA = () => {
  // Navigasi untuk pengarahan halaman
  const navigate = useNavigate();

  // State untuk menyimpan informasi pengguna yang sedang login
  const [currentUser, setCurrentUser] = useState(null);

  // State untuk data pengguna
  const [users, setUsers] = useState([]);

  // State untuk loading
  const [loading, setLoading] = useState(false);

  // State untuk form penambahan pengguna
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    role: 'Master Admin',
    accessPages: [],
    category: 'master'
  });
  
  // State untuk form edit
  const [editMode, setEditMode] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState(null);
  
  // State untuk pesan
  const [message, setMessage] = useState({ text: '', type: '' });

  // Create authenticated axios instance
  const apiClient = createAuthenticatedAxios();

  // Fungsi untuk mendapatkan accessPages berdasarkan role
  const getAccessPagesFromRole = (role) => {
    if (role === 'Admin Project PT. Elnusa') {
      return ['/elnusa-edit', '/nonactive-elnusa', '/upload-massal-elnusa', '/tambah-user-elnusa'];
    } else if (role === 'Admin Project PT. Pertamina Ep Reg 4') {
      return ['/regional4-edit', '/nonactive-regional4', '/upload-massal-regional4', '/tambah-user-regional4' ];
    } else if (role === 'Admin Project PT. Pertamina Ep Reg 2 Eksplorasi') {
      return ['/regional2x-edit', '/nonactive-regional2x', '/upload-massal-regional2x', '/tambah-user-regional2x'];
    } else if (role === 'Admin Project PT. Pertamina Ep Reg 2 Subsurface') {
      return ['/regional2s-edit', '/nonactive-regional2s', '/tambah-user-regional2s', '/upload-massal-regional2s'];
    } else if (role === 'Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan') {
      return ['/regional2z7d-edit', '/nonactive-regional2z7d', '/tambah-user-regional2z7d', '/upload-massal-regional2z7d'];
    } else if (role === 'Admin Project PT. Pertamina Ep Reg 2 Zona 7 WOPDM') {
      return ['/regional2z7w-edit', '/nonactive-regional2z7w', '/tambah-user-regional2z7w', '/upload-massal-regional2z7w'];
    } else if (role === 'Admin Project PT. Umran Rubi Perkasa') {
      return ['/umran-edit', '/nonactive-umran', '/tambah-user-umran', 'upload-massal-umran'];
    } else if (role === 'Admin HSE') {
      return ['/hse-elnusa', '/hse-elnusa-form/:id', '/hse-regional4', '/hse-regional4-form/:id', '/hse-regional2x', '/hse-regional2x-form/:id', 
              '/hse-regional2s', '/hse-regional2s-form/:id', '/hse-regional2z7d', '/hse-regional2z7d-form/:id',
              '/hse-regional2z7w', '/hse-regional2z7w-form/:id', '/hse-tar'
      ];
    } else if (role === 'Admin Management') {
      return ['/management-edit', '/add-management'];
    } else if (role === 'Master Admin') {
      return ['/admin-account', '/user-account', '/elnusa-edit', '/nonactive-elnusa', '/upload-massal-elnusa', '/tambah-user-elnusa', 
        '/regional4-edit', '/nonactive-regional4', '/upload-massal-regional4', '/tambah-user-regional4',
        '/regional2x-edit', '/nonactive-regional2x', '/upload-massal-regional2x', '/tambah-user-regional2x',
        '/regional2s-edit', '/nonactive-regional2s', '/tambah-user-regional2s', '/upload-massal-regional2s', 
        '/regional2z7d-edit', '/nonactive-regional2z7d', '/tambah-user-regional2z7d', '/upload-massal-regional2z7d',
        '/regional2z7w-edit', '/nonactive-regional2z7w', '/tambah-user-regional2z7w', '/upload-massal-regional2z7w',
        '/umran-edit', '/nonactive-umran', '/tambah-user-umran', 'upload-massal-umran', 
        '/hse-elnusa', '/hse-elnusa-form/:id', '/hse-regional4', '/hse-regional4-form/:id', '/hse-regional2x', '/hse-regional2x-form/:id', 
        '/hse-regional2s', '/hse-regional2s-form/:id', '/hse-regional2z7d', '/hse-regional2z7d-form/:id', '/hse-regional2z7w', 
        '/hse-regional2z7w-form/:id', '/hse-tar', '/user-account'
      ];
    }
    return [];
  };

   // Fungsi untuk mendapatkan kategori berdasarkan role
  const getCategoryFromRole = (role) => {
    if (role.includes('Project')) {
      return 'project';
    } else if (role.includes('HSE')) {
      return 'hse';
    } else if (role.includes('Management')) {
      return 'management';
    } else if (role === 'Admin User') {
      return 'users';
    } else if (role === 'Master Admin') {
      return 'master';
    }
    return 'users';
  };

  // Fallback to local storage if API fails temporarily
  const getLocalUsers = () => {
    try {
      const storedUsers = localStorage.getItem('master_admin');
      if (storedUsers) {
        return JSON.parse(storedUsers);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return [];
  };

   // Save users to localStorage as backup
   const saveUsersToLocal = (usersData) => {
    try {
      localStorage.setItem('master_admin', JSON.stringify(usersData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Fungsi untuk mengambil data semua admin
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!navigator.onLine) {
        throw new Error('You are currently offline. Using local data.');
      }
      
      // Use authenticated axios instance
      const response = await apiClient.get('/admins');
      
      if (response.data.success) {
        const adminsData = response.data.data;
        setUsers(adminsData);
        saveUsersToLocal(adminsData);
        // Reset password visibility state when new data is loaded
        setShowPasswords({});
      } else {
        setMessage({ text: 'Failed to fetch admin data: ' + response.data.message, type: 'error' });
        const localUsers = getLocalUsers();
        setUsers(localUsers);
        setShowPasswords({});
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      
      const errorDetail = error.response?.data?.error || error.message;
      setError(errorDetail);
      
      setMessage({ 
        text: `An error occurred while fetching admin data: ${errorDetail}`, 
        type: 'error' 
      });
      
      const localUsers = getLocalUsers();
      setUsers(localUsers);
      setShowPasswords({});
    } finally {
      setLoading(false);
    }
  };

  // Inisialisasi master admin jika belum ada
  const initMasterAdmin = async () => {
    try {
      setLoading(true);
      
      // Cek apakah sedang online
      if (!navigator.onLine) {
        throw new Error('Network offline');
      }
      
      try {
        // Use regular axios for init (no auth needed)
        await axios.post(`${API_BASE_URL}/init-master-admin`);
        await fetchAdmins();
      } catch (error) {
        console.error('Error initializing master admin:', error);
        
        setMessage({
          text: 'Using offline mode because server is unavailable',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error initializing master admin:', error);
      
      const errorDetail = error.response?.data?.error || error.message;
      setError(errorDetail);
      
      setMessage({ 
        text: `An error occurred during data initialization: ${errorDetail}. Menggunakan data lokal.`, 
        type: 'error' 
      });
      
      // Fallback ke data lokal selalu
      const localUsers = getLocalUsers();
      setUsers(localUsers);
    } finally {
      setLoading(false);
    }
  };

  // State untuk show/hide password di tabel
  const [showPasswords, setShowPasswords] = useState({});

  // Toggle password visibility untuk user tertentu
  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Copy password to clipboard
  const copyPasswordToClipboard = async (password, username) => {
    try {
      await navigator.clipboard.writeText(password);
      setMessage({ 
        text: `Password for ${username} copied to clipboard!`, 
        type: 'success' 
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
      setMessage({ 
        text: 'Failed to copy password to clipboard', 
        type: 'error' 
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    }
  };

  // Show/Hide all passwords
  const toggleAllPasswords = () => {
    const allShown = users.every(user => showPasswords[user.id]);
    const newState = {};
    users.forEach(user => {
      newState[user.id] = !allShown;
    });
    setShowPasswords(newState);
  };

  // Definisi kolom untuk DataTable
  const columns = [
    {
      name: 'Username',
      selector: row => row.username,
      sortable: true,
    },
    {
      name: 'Password',
      selector: row => row.password,
      sortable: false,
      cell: row => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm">
            {showPasswords[row.id] ? row.password : '••••••••'}
          </span>
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => togglePasswordVisibility(row.id)}
              className="text-blue-500 hover:text-blue-700 text-xs p-1"
              title={showPasswords[row.id] ? 'Hide password' : 'Show password'}
            >
              <FontAwesomeIcon 
                icon={showPasswords[row.id] ? faEyeSlash : faEye} 
                size="sm"
              />
            </button>
            {showPasswords[row.id] && (
              <button
                type="button"
                onClick={() => copyPasswordToClipboard(row.password, row.username)}
                className="text-green-500 hover:text-green-700 text-xs p-1"
                title="Copy password to clipboard"
              >
                <FontAwesomeIcon 
                  icon={faCopy} 
                  size="sm"
                />
              </button>
            )}
          </div>
        </div>
      )
    },
    {
      name: 'Admin Type',
      selector: row => row.role,
      sortable: true,
      wrap: true,
      style: { minWidth: '200px' }, // Gunakan style alih-alih minWidth langsung
      cell: row => <div style={{ width: '200px' }}>{row.role}</div>
    },
    {
      name: 'Page Access',
      cell: row => (
        <div className="text-xs truncate max-w-xs" title={row.accessPages ? row.accessPages.join(', ') : ''}>
          {row.accessPages && row.accessPages.length > 0 ? row.accessPages.length + ' halaman' : 'Tidak ada akses'}
        </div>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
          <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-xs font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600"
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          <button 
            className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
            onClick={() => handleDelete(row.id)}
            disabled={row.username === 'master_admin'}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

 // Custom styles untuk DataTable
 const customStyles = {
  header: {
    style: {
      minHeight: '56px',
    },
  },
  headRow: {
    style: {
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderTopColor: '#e2e8f0',
    },
  },
  headCells: {
    style: {
      paddingLeft: '8px',
      paddingRight: '8px',
      fontWeight: '600',
      fontSize: '14px',
    },
  },
  cells: {
    style: {
      paddingLeft: '8px',
      paddingRight: '8px',
    },
  },
};

// Load current user dan cek akses saat komponen dimuat
useEffect(() => {
  // Cek token terlebih dahulu
  const token = sessionStorage.getItem('authToken');
  if (!token) {
    setMessage({ text: 'Please login first', type: 'error' });
    setTimeout(() => navigate('/logadm'), 1500);
    return;
  }

  // Cek pengguna dari localStorage
  const storedUser = localStorage.getItem('currentUser');
  
  if (!storedUser) {
    setMessage({ text: 'Please login first', type: 'error' });
    setTimeout(() => navigate('/logadm'), 1500);
    return;
  }

  try {
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    
    // Cek akses halaman
    const hasAccess = user.accessPages?.includes('/admin-account');
    if (!hasAccess) {
      setMessage({ text: 'You do not have access to this page!', type: 'error' });
      setTimeout(() => navigate('/'), 1500);
      return;
    }
    
    // Tampilkan data lokal terlebih dahulu untuk UX yang lebih baik
    const localUsers = getLocalUsers();
    setUsers(localUsers);
    // Reset password visibility when loading local data
    setShowPasswords({});
    
    // Tambahkan retry logic dengan eksponensial backoff
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptInitialization = async () => {
      try {
        await initMasterAdmin();
        // Jika berhasil, reset retryCount
        retryCount = 0;
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          setTimeout(attemptInitialization, delay);
        } else {
          console.error("Exhausted retry attempts. Using local data only.");
          setError("Could not connect to server after several attempts");
        }
      }
    };
    
    attemptInitialization();
  } catch (error) {
    console.error('Error parsing stored user:', error);
    setMessage({ text: 'Error with login data. Please login again.', type: 'error' });
    setTimeout(() => navigate('/logadm'), 1500);
  }
}, [navigate]);

// Tambahkan fungsi logout jika diperlukan
const handleLogout = () => {
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('baseAuth');
  navigate('/logadm');
};

// Handler untuk menghapus pengguna
const handleDelete = async (id) => {
  try {
    const userToDelete = users.find(user => user.id === id);
    if (userToDelete.username === 'master_admin') {
      setMessage({ text: 'Master Admin account cannot be deleted!', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    // Konfirmasi penghapusan
    if (!window.confirm(`Are you sure you want to delete the account ${userToDelete.username}?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.delete(`/admins/${id}`);
      
      if (response.data.success) {
        // Filter user yang akan dihapus dari state
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        saveUsersToLocal(updatedUsers);
        
        // Remove password visibility state for deleted user
        setShowPasswords(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        
        setMessage({ text: 'User successfully deleted!', type: 'success' });
      } else {
        setMessage({ text: response.data.message || 'Failed to delete user', type: 'error' });
      }
    } catch (apiError) {
      console.error('API error deleting admin:', apiError);
      
      // Handle offline mode
      if (!navigator.onLine || apiError.message === 'Network Error') {
        // Just update the local state in offline mode
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        saveUsersToLocal(updatedUsers);
        
        // Remove password visibility state for deleted user
        setShowPasswords(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        
        setMessage({ text: 'User deleted locally (offline mode)', type: 'warning' });
      } else {
        throw apiError; // Re-throw for the outer catch
      }
    }
  } catch (error) {
    console.error('Error deleting admin:', error);
    const errorDetail = error.response?.data?.error || error.message;
    setError(errorDetail);
    setMessage({ 
      text: `An error occurred while deleting user: ${errorDetail}`, 
      type: 'error' 
    });
  } finally {
    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }
};

// Handler untuk mode edit
const handleEdit = (user) => {
  setEditMode(true);
  setEditUser({ ...user });
};

// Handler untuk membatalkan edit
const handleCancelEdit = () => {
  setEditMode(false);
  setEditUser(null);
};

// Handler untuk menyimpan perubahan edit
const handleSaveEdit = async () => {
  try {
    // Validasi apakah username dan password diisi
    if (!editUser.username || !editUser.password) {
      setMessage({ text: 'Username and password must be filled!', type: 'error' });
      return;
    }
    
    // Jika ingin mengubah username, pastikan tidak ada username yang sama
    const userWithSameUsername = users.find(
      user => user.username === editUser.username && user.id !== editUser.id
    );
    
    if (userWithSameUsername) {
      setMessage({ text: 'Username is already in use!', type: 'error' });
      return;
    }
    
    // Mencegah perubahan username master_admin
    const originalUser = users.find(user => user.id === editUser.id);
    if (originalUser.username === 'master_admin' && editUser.username !== 'master_admin') {
      setMessage({ text: 'Master Admin username cannot be changed!', type: 'error' });
      return;
    }
    
    // Update accessPages dan category berdasarkan role
    const accessPages = getAccessPagesFromRole(editUser.role);
    const category = getCategoryFromRole(editUser.role);
    
    const updatedUser = {
      ...editUser,
      accessPages,
      category
    };
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put(`/admins/${editUser.id}`, updatedUser);
      
      if (response.data.success) {
        // Update state users dengan data yang diperbarui
        const updatedUsers = users.map(user => 
          user.id === editUser.id ? response.data.data : user
        );
        setUsers(updatedUsers);
        saveUsersToLocal(updatedUsers);
        
        setEditMode(false);
        setEditUser(null);
        setMessage({ text: 'User successfully updated!', type: 'success' });
        
        // Jika user yang login diubah, update localStorage
        if (currentUser.id === editUser.id) {
          localStorage.setItem('currentUser', JSON.stringify(response.data.data));
          setCurrentUser(response.data.data);
        }
      } else {
        setMessage({ text: response.data.message || 'Failed to update user', type: 'error' });
      }
    } catch (apiError) {
      console.error('API error updating admin:', apiError);
      
      // Handle offline mode
      if (!navigator.onLine || apiError.message === 'Network Error') {
        // Just update the local state in offline mode
        const updatedUsers = users.map(user => 
          user.id === editUser.id ? {...updatedUser, updatedAt: new Date().toISOString()} : user
        );
        setUsers(updatedUsers);
        saveUsersToLocal(updatedUsers);
        
        setEditMode(false);
        setEditUser(null);
        setMessage({ text: 'User updated locally (offline mode)', type: 'warning' });
        
        // Update current user if needed
        if (currentUser.id === editUser.id) {
          const updatedCurrentUser = {...updatedUser, updatedAt: new Date().toISOString()};
          localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
          setCurrentUser(updatedCurrentUser);
        }
      } else {
        throw apiError; // Re-throw for the outer catch
      }
    }
  } catch (error) {
    console.error('Error updating admin:', error);
    const errorDetail = error.response?.data?.error || error.message;
    setError(errorDetail);
    setMessage({ 
      text: `An error occurred while updating user: ${errorDetail}`, 
      type: 'error' 
    });
  } finally {
    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }
};

// Handler untuk mengubah nilai form tambah pengguna
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setNewUser({ ...newUser, [name]: value });
};

// Handler untuk mengubah nilai form edit
const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditUser({ ...editUser, [name]: value });
};

// Handler untuk menambah pengguna baru
const handleAddUser = async (e) => {
  e.preventDefault();
  
  try {
    if (!newUser.username || !newUser.password) {
      setMessage({ text: 'Username and password must be filled!', type: 'error' });
      return;
    }
    
    // Cek apakah username sudah ada
    if (users.some(user => user.username === newUser.username)) {
      setMessage({ text: 'Username is already in use!', type: 'error' });
      return;
    }
    
    // Set accessPages dan category berdasarkan role
    const accessPages = getAccessPagesFromRole(newUser.role);
    const category = getCategoryFromRole(newUser.role);
    
    const userToCreate = {
      ...newUser,
      accessPages,
      category
    };
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/admins', userToCreate);
      
      if (response.data.success) {
        // Tambahkan user baru ke state
        const updatedUsers = [...users, response.data.data];
        setUsers(updatedUsers);
        saveUsersToLocal(updatedUsers);
        
        // Reset form dengan default role (Admin User)
        setNewUser({ 
          username: '', 
          password: '', 
          role: 'Admin User',
          accessPages: [],
          category: 'users'
        });
        
        // Hide password for newly added user by default
        setShowPasswords(prev => ({
          ...prev,
          [response.data.data.id]: false
        }));
        
        setMessage({ text: 'User successfully added!', type: 'success' });
      } else {
        setMessage({ text: response.data.message || 'Failed to add user', type: 'error' });
      }
    } catch (apiError) {
      console.error('API error creating admin:', apiError);
      
      // Handle offline mode
      if (!navigator.onLine || apiError.message === 'Network Error') {
        // Create with local temporary ID
        const tempId = Math.max(...users.map(u => u.id), 0) + 1;
        const newUserWithId = {
          ...userToCreate,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedUsers = [...users, newUserWithId];
        setUsers(updatedUsers);
        saveUsersToLocal(updatedUsers);
        
        // Reset form
        setNewUser({ 
          username: '', 
          password: '', 
          role: 'Admin User',
          accessPages: [],
          category: 'users'
        });
        
        // Hide password for newly added user by default
        setShowPasswords(prev => ({
          ...prev,
          [tempId]: false
        }));
        
        setMessage({ text: 'User added locally (offline mode)', type: 'warning' });
      } else {
        throw apiError; // Re-throw for the outer catch
      }
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    const errorDetail = error.response?.data?.error || error.message;
    setError(errorDetail);
    setMessage({ 
      text: `An error occurred while adding user: ${errorDetail}`, 
      type: 'error' 
    });
  } finally {
    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }
};

// Function to retry database initialization
const retryDatabaseInit = async () => {
  setMessage({ text: 'Attempting to reconnect to database...', type: 'info' });
  setLoading(true);
  
  try {
    // Use regular axios for init (no auth needed)
    await axios.post(`${API_BASE_URL}/init-master-admin`);
    await fetchAdmins();
    setMessage({ text: 'Database connection successfully restored!', type: 'success' });
    setError(null);
  } catch (error) {
    console.error('Failed to retry database connection:', error);
    const errorDetail = error.response?.data?.error || error.message;
    setError(errorDetail);
    setMessage({ 
      text: `Failed to connect to database: ${errorDetail}`, 
      type: 'error' 
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className='bg-(--background-tar-color)'> 
        <div className="flex">
            <div className='h-screen fixed left-0 top-0'>
              {/* Slidebar = Aside*/}
            <AsideComponents />
            </div>

        {/* Konten Utama (Header, Main, Footer) */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
            {/* Header */}
            <div className='w-fill h-hug py-3'>
            <HeaderComponents />
            </div>
            <div className='flex flex-row justify-between items-center w-full'>
            <Link to='/account'>
            <ButtonComponents variant="back">&lt; Back</ButtonComponents>
            </Link>
            <ButtonComponents className="items-end" variant="danger" onClick={handleLogout}>Logout</ButtonComponents>
            </div>

          {/* Main Content */}
        <main className="flex flex-col bg-white p-3 shadow-md rounded gap-4">
            <div className='w-full'>
            <h2 className='mb-5'>Admin Account Management</h2>

            {message.text && (
              <div className={`mb-4 p-4 rounded ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 
                message.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {message.text}
                <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
              </div>
            )}

            {/* Show database connection error with retry button */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="text-red-700 font-medium">Database Error</h3>
                <p className="text-red-600 mb-2">{error}</p>
                <button 
                  onClick={retryDatabaseInit}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Trying...' : 'Try Reconnect'}
                </button>
              </div>
            )}

              <div className="p-4">
              <form onSubmit={handleAddUser}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Username
                        </label>
                        <input
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          type="text"
                          name="username"
                          value={editMode ? editUser.username : newUser.username}
                          onChange={editMode ? handleEditChange : handleInputChange}
                          placeholder="Enter username"
                          disabled={editMode && users.find(user => user.id === editUser?.id)?.username === 'master_admin'}
                        />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Password
                      </label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="password"
                        name="password"
                        value={editMode ? editUser.password : newUser.password}
                        onChange={editMode ? handleEditChange : handleInputChange}
                        placeholder="Enter password"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                      Admin Type
                        </label>
                        <select
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          name="role"
                          value={editMode ? editUser.role : newUser.role}
                          onChange={editMode ? handleEditChange : handleInputChange}
                        >
                          <option value="Admin Project PT. Elnusa">Admin Project PT. Elnusa</option>
                          <option value="Admin Project PT. Pertamina Ep Reg 4">Admin Project PT. Pertamina Ep Reg 4</option>
                          <option value="Admin Project PT. Pertamina Ep Reg 2 Eksplorasi">Admin Project PT. Pertamina Ep Reg 2 Eksplorasi</option>
                          <option value="Admin Project PT. Pertamina Ep Reg 2 Subsurface">Admin Project PT. Pertamina Ep Reg 2 Subsurface</option>
                          <option value="Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan">Admin Project PT. Pertamina Ep Reg 2 Zona 7 DevPlan</option>
                          <option value="Admin Project PT. Pertamina Ep Reg 2 Zona 7 WOPDM">Admin Project PT. Pertamina Ep Reg 2 Zona 7 WOPDM</option>
                          <option value="Admin Project PT. Umran Rubi Perkasa">Admin Project PT. Umran Rubi Perkasa</option>
                          <option value="Admin HSE">Admin HSE</option>
                          <option value="Admin Management">Admin Management</option>
                          <option value="Master Admin">Master Admin</option>
                        </select>
                    </div>

                    {editMode ? (
                      <div>
                        <button
                          type="button"
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                          onClick={handleSaveEdit}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        disabled={loading}
                      >
                        {loading ? 'Adding...' : 'Add User'}
                      </button>
                    )}
                  </form>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-lg">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Security Notice:</strong> Passwords are hidden by default for security. 
              Use the eye icon to show/hide individual passwords or the "Show All" button to toggle all passwords.
              Be careful when passwords are visible on screen.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium">User List</h3>
                  <button
                    onClick={toggleAllPasswords}
                    className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center space-x-1"
                    title="Toggle all passwords visibility"
                  >
                    <FontAwesomeIcon 
                      icon={users.every(user => showPasswords[user.id]) ? faEyeSlash : faEye} 
                      size="sm"
                    />
                    <span>
                      {users.every(user => showPasswords[user.id]) ? 'Hide All' : 'Show All'}
                    </span>
                  </button>
                </div>
                <div className="p-4">
                  <DataTable
                    columns={columns}
                    data={users}
                    pagination
                    highlightOnHover
                    responsive
                    customStyles={customStyles}
                    striped
                    progressPending={loading}
                    progressComponent={<div className="p-4 text-center">Fetching data...</div>}
                    noDataComponent={<div className="p-4 text-center">No user data</div>}
                  />
                </div>
              </div>
            </div>
        </main>
        
        {/* Footer*/}
        <FooterComponents/>

          </div>
        </div>
      </div>
  )
}

export default AccountEditMA