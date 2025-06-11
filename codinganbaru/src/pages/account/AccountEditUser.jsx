import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsideComponents from '../../components/AsideComponents';
import HeaderComponents from '../../components/HeaderComponents';
import FooterComponents from '../../components/FooterComponents';
import '../../styles/main.css'
import ButtonComponents from '../../components/ButtonComponents';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';

const API_BASE_URL = 'http://localhost:3005/api/accountuser';

const AccountEditUser = () => {
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
    role: 'User PT. Elnusa',
    accessPages: [],
    category: 'user'
  });
  
  // State untuk form edit
  const [editMode, setEditMode] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState(null);
  
  // State untuk pesan
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fungsi untuk mendapatkan accessPages berdasarkan role
  const getAccessPagesFromRole = (role) => {
    if (role === 'User PT. Elnusa') {
      return ['/user-els', '/contract-els', '/data-hse-els'];
    } else if (role === 'User PT. Pertamina Ep Reg 4') {
      return ['/user-reg4', '/contract-reg4', '/data-hse-reg4'];
    } else if (role === 'User PT. Pertamina Ep Reg 2 Eksplorasi') {
      return ['/user-reg2x', '/contract-reg2x', '/data-hse-reg2x'];
    } else if (role === 'User PT. Pertamina Ep Reg 2 Subsurface') {
      return ['/user-reg2s', '/contract-reg2s', '/data-hse-reg2s'];
    } else if (role === 'User PT. Pertamina Ep Reg 2 Zona 7 DevPlan') {
      return ['/user-reg2z7d', '/contract-reg2z7d', '/data-hse-reg2z7d'];
    } else if (role === 'User PT. Pertamina Ep Reg 2 Zona 7 WOPDM') {
      return ['/user-reg2z7w', '/contract-reg2z7w', '/data-hse-reg2z7w'];
    } else if (role === 'User PT. Umran Rubi Perkasa') {
      return ['/user-urp', '/contract-urp', '/data-hse-urp'];
    }
    return [];
  };

  // Fallback to local storage if API fails temporarily
  const getLocalUsers = () => {
    try {
      const storedUsers = localStorage.getItem('user_accounts');
      if (storedUsers) {
        return JSON.parse(storedUsers);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    // Return empty array if nothing found
    return [];
  };

  // Save users to localStorage as backup
  const saveUsersToLocal = (usersData) => {
    try {
      localStorage.setItem('user_accounts', JSON.stringify(usersData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Fungsi untuk mengambil data semua user
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!navigator.onLine) {
        throw new Error('You are currently offline. Using local data.');
      }
      
      const response = await axios.get(`${API_BASE_URL}/users`);
      
      if (response.data.success) {
        const usersData = response.data.data;
        setUsers(usersData);
        saveUsersToLocal(usersData);
      } else {
        setMessage({ text: 'Failed to fetch user data: ' + response.data.message, type: 'error' });
        const localUsers = getLocalUsers();
        setUsers(localUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      const errorDetail = error.response?.data?.error || error.message;
      setError(errorDetail);
      
      setMessage({ 
        text: `An error occurred while fetching user data: ${errorDetail}`, 
        type: 'error' 
      });
      
      const localUsers = getLocalUsers();
      setUsers(localUsers);
    } finally {
      setLoading(false);
    }
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
      sortable: true
      // cell: row => '•••••••' // Sembunyikan password actual
    },
    {
      name: 'User Type',
      selector: row => row.role,
      sortable: true,
      wrap: true,
      style: { minWidth: '200px' },
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
    // Cek pengguna dari localStorage
    const storedUser = localStorage.getItem('currentUser');
    
    if (!storedUser) {
      setMessage({ text: 'Please login first!', type: 'error' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      
      // Cek akses halaman
      const hasAccess = user.accessPages?.includes('/user-account');
      if (!hasAccess) {
        setMessage({ text: 'You do not have access to this page!', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }
      
      // Tampilkan data lokal terlebih dahulu untuk UX yang lebih baik
      const localUsers = getLocalUsers();
      setUsers(localUsers);
      
      // Tambahkan retry logic dengan eksponensial backoff
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptFetch = async () => {
        try {
          await fetchUsers();
          // Jika berhasil, reset retryCount
          retryCount = 0;
        } catch (error) {
          retryCount++;
          if (retryCount <= maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            setTimeout(attemptFetch, delay);
          } else {
            console.error("Exhausted retry attempts. Using local data only.");
            setError("Could not connect to server after several attempts");
          }
        }
      };
      
      attemptFetch();
    } catch (error) {
      console.error('Error parsing stored user:', error);
      setMessage({ text: 'Error with login data. Please login again.', type: 'error' });
      setTimeout(() => navigate('/login'), 1500);
    }
  }, [navigate]);

  // Tambahkan fungsi logout jika diperlukan
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // Handler untuk menghapus pengguna
  const handleDelete = async (id) => {
    try {
      // Konfirmasi penghapusan
      if (!window.confirm(`Are you sure you want to delete this user?`)) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
        
        if (response.data.success) {
          // Filter user yang akan dihapus dari state
          const updatedUsers = users.filter(user => user.id !== id);
          setUsers(updatedUsers);
          saveUsersToLocal(updatedUsers);
          setMessage({ text: 'User successfully deleted!', type: 'success' });
        } else {
          setMessage({ text: response.data.message || 'Failed to delete user', type: 'error' });
        }
      } catch (apiError) {
        console.error('API error deleting user:', apiError);
        
        // Handle offline mode
        if (!navigator.onLine || apiError.message === 'Network Error') {
          // Just update the local state in offline mode
          const updatedUsers = users.filter(user => user.id !== id);
          setUsers(updatedUsers);
          saveUsersToLocal(updatedUsers);
          setMessage({ text: 'User deleted locally (offline mode)', type: 'warning' });
        } else {
          throw apiError; // Re-throw for the outer catch
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
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
      
      // Update accessPages berdasarkan role
      const accessPages = getAccessPagesFromRole(editUser.role);
      
      const updatedUser = {
        ...editUser,
        accessPages,
        category: 'user'
      };
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.put(`${API_BASE_URL}/users/${editUser.id}`, updatedUser);
        
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
        } else {
          setMessage({ text: response.data.message || 'Failed to update user', type: 'error' });
        }
      } catch (apiError) {
        console.error('API error updating user:', apiError);
        
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
        } else {
          throw apiError; // Re-throw for the outer catch
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
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
      
      // Check if username already exists
      if (users.some(user => user.username === newUser.username)) {
        setMessage({ text: 'Username is already in use!', type: 'error' });
        return;
      }
      
      // Set accessPages berdasarkan role
      const accessPages = getAccessPagesFromRole(newUser.role);
      
      const userToCreate = {
        ...newUser,
        accessPages,
        category: 'user'
      };
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/users`, userToCreate);
        
        if (response.data.success) {
          // Tambahkan user baru ke state
          const updatedUsers = [...users, response.data.data];
          setUsers(updatedUsers);
          saveUsersToLocal(updatedUsers);
          
          // Reset form dengan default role
          setNewUser({ 
            username: '', 
            password: '', 
            role: 'User PT. Elnusa',
            accessPages: [],
            category: 'user'
          });
          
          setMessage({ text: 'User successfully added!', type: 'success' });
        } else {
          setMessage({ text: response.data.message || 'Failed to add user', type: 'error' });
        }
      } catch (apiError) {
        console.error('API error creating user:', apiError);
        
        // Handle offline mode
        if (!navigator.onLine || apiError.message === 'Network Error') {
          // Create with local temporary ID
          const tempId = Math.max(...users.map(u => u.id || 0), 0) + 1;
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
            role: 'User PT. Elnusa',
            accessPages: [],
            category: 'user'
          });
          
          setMessage({ text: 'User added locally (offline mode)', type: 'warning' });
        } else {
          throw apiError; // Re-throw for the outer catch
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
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

  // Function to retry database connection
  const retryDatabaseConnection = async () => {
    setMessage({ text: 'Attempting to reconnect to database...', type: 'info' });
    setLoading(true);
    
    try {
      await fetchUsers();
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
            <h2 className='mb-5'>User Account Management</h2>

            {message.text && (
              <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
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
                  onClick={retryDatabaseConnection}
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
                        User Type
                        </label>
                        <select
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          name="role"
                          value={editMode ? editUser.role : newUser.role}
                          onChange={editMode ? handleEditChange : handleInputChange}
                        >
                          <option value="User PT. Elnusa">User PT. Elnusa</option>
                          <option value="User PT. Pertamina Ep Reg 4">User PT. Pertamina Ep Reg 4</option>
                          <option value="User PT. Pertamina Ep Reg 2 Eksplorasi">User PT. Pertamina Ep Reg 2 Eksplorasi</option>
                          <option value="User PT. Pertamina Ep Reg 2 Subsurface">User PT. Pertamina Ep Reg 2 Subsurface</option>
                          <option value="User PT. Pertamina Ep Reg 2 Zona 7 DevPlan">User PT. Pertamina Ep Reg 2 Zona 7 DevPlan</option>
                          <option value="User PT. Pertamina Ep Reg 2 Zona 7 WOPDM">User PT. Pertamina Ep Reg 2 Zona 7 WOPDM</option>
                          <option value="User PT. Umran Rubi Perkasa">User PT. Umran Rubi Perkasa</option>
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

      <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-lg font-medium">User List</h3>
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

export default AccountEditUser