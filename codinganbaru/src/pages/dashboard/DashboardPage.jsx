import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsideComponents from '../../components/AsideComponents'
import FooterComponents from '../../components/FooterComponents'
import HeaderComponents from '../../components/HeaderComponents'
import '../../styles/main.css';
import ButtonComponents from '../../components/ButtonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faX, faEdit, faTrash, faLink, faEye, faEyeSlash, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3005';

const DashboardPage = () => {
  const navigate = useNavigate();

  // State untuk mode (add/edit)
  const [mode, setMode] = useState('list'); // list, add, edit
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // State untuk form
  const [formData, setFormData] = useState({
    image_title: '',
    image_description: '',
    external_link: '',
    is_active: true
  });
  
  // State untuk preview gambar
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  
  // State untuk daftar data
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filteredData = dashboardData.filter(item => {
    if (filter === 'active') return item.is_active;
    if (filter === 'inactive') return !item.is_active;
    return true; // 'all'
  });

  // Mengambil data dari API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/dashboard/api/data?all=true`);
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        toast.error('Gagal mengambil data dashboard');
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

  // Mengubah input form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Mengubah gambar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('File size is too large. Maximum 2MB');
        return;
      }
      
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setError('File format not supported. Use JPG, JPEG, or PNG formats');
        return;
      }

      setError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Menghapus gambar dari preview
  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  // Menambah atau memperbarui data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi
    if (!formData.image_title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (mode === 'add' && !imageFile) {
      toast.error('Image must be uploaded');
      return;
    }
    
    // Buat FormData untuk mengirim file
    const submitData = new FormData();
    submitData.append('image_title', formData.image_title);
    submitData.append('image_description', formData.image_description || '');
    submitData.append('external_link', formData.external_link || '');
    submitData.append('is_active', formData.is_active);
    
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    setLoading(true);
    try {
      let response;
      
      if (mode === 'add') {
        // Menambah data baru
        response = await axios.post(`${API_URL}/dashboard/api/data`, submitData);
      } else if (mode === 'edit' && selectedId) {
        // Memperbarui data yang ada
        response = await axios.put(`${API_URL}/dashboard/api/data/${selectedId}`, submitData);
      }
      
      if (response && response.data.success) {
        toast.success(mode === 'add' ? 'Data added successfully' : 'Data updated successfully');
        resetForm();
        setMode('list');
        fetchDashboardData();
      } else {
        toast.error(mode === 'add' ? 'Failed to add data' : 'Failed to update data');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while saving data');
    } finally {
      setLoading(false);
    }
  };

  // Mengatur mode edit dan mengisi form dengan data yang ada
  const handleEdit = (item) => {
    setMode('edit');
    setSelectedId(item.id);
    setFormData({
      image_title: item.image_title,
      image_description: item.image_description || '',
      external_link: item.external_link || '',
      is_active: item.is_active
    });
    
    // Set preview gambar yang ada
    if (item.image_path) {
      setImagePreview(`${API_URL}${item.image_path}`);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
  };

  // Menghapus data
  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/dashboard/api/data/${id}`);
      if (response.data.success) {
        toast.success('Data deleted successfully');
        fetchDashboardData();
      } else {
        toast.error('Failed to delete data');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('An error occurred while deleting data');
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  // Mengubah status aktif/nonaktif
  const handleToggleActive = async (id, currentStatus) => {
    setLoading(true);
    try {
      const response = await axios.patch(`${API_URL}/dashboard/api/data/${id}/toggle`, {
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        toast.success(`Data successfully ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchDashboardData();
      } else {
        toast.error('Failed to change data status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('An error occurred while changing data status');
    } finally {
      setLoading(false);
    }
  };

  // Navigasi ke halaman preview
  const handleViewDetail = (id) => {
    navigate(`/dashboard/preview/${id}`);
  };

  // Reset form ke nilai awal
  const resetForm = () => {
    setFormData({
      image_title: '',
      image_description: '',
      external_link: '',
      is_active: true
    });
    setImagePreview(null);
    setImageFile(null);
    setError('');
    setSelectedId(null);
  };

  // Tampilan form tambah/edit
  const renderForm = () => (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h4 className='text-center text-lg font-semibold mb-4'>
        {mode === 'add' ? 'Add New Content' : 'Edit Content'}
      </h4>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Judul */}
        <div>
          <label htmlFor="image_title" className='block text-sm font-medium text-gray-700 mb-1'>Title</label>
          <input 
            type="text" 
            id='image_title' 
            name='image_title' 
            required 
            value={formData.image_title}
            onChange={handleInputChange} 
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Enter content title'
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label htmlFor="image_description" className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
          <textarea 
            id="image_description"
            name='image_description' 
            rows="4" 
            value={formData.image_description}
            onChange={handleInputChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Enter content description'
          ></textarea>
        </div>

        {/* Link Eksternal */}
        <div>
          <label htmlFor="external_link" className='block text-sm font-medium text-gray-700 mb-1'>External Link</label>
          <input 
            type="url" 
            id='external_link' 
            name='external_link' 
            value={formData.external_link}
            onChange={handleInputChange} 
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='https://example.com'
          />
          <p className="text-xs text-gray-500 mt-1">Optional: Enter full URL if you want to link to an external website</p>
        </div>

        {/* Status */}
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="is_active" 
            name="is_active" 
            checked={formData.is_active} 
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Active
          </label>
        </div>

        {/* Upload Gambar */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Image</label>
          {!imagePreview ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FontAwesomeIcon className='mx-auto h-12 w-12 text-gray-400' icon={faImage} />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload file</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG up to 2MB
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-1 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-md mx-auto"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FontAwesomeIcon icon={faX} />
              </button>
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
          
          {mode === 'edit' && !imageFile && (
            <p className="mt-2 text-sm text-gray-500">
              {imagePreview ? 'Gambar yang ada akan dipertahankan jika tidak diubah' : 'Tidak ada gambar saat ini'}
            </p>
          )}
        </div>

        {/* Tombol action */}
        <div className='flex justify-end space-x-3'>
          <button
            type="button"
            onClick={() => {
              setMode('list');
              resetForm();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <ButtonComponents variant="addempdata" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </ButtonComponents>
        </div>
      </form>
    </div>
  );

  // Tampilan daftar data
  const renderDashboardList = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold mb-2">Dashboard Content Lis</h4>
          {/* Filter buttons */}
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'inactive' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Inactive
            </button>
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setMode('add');
            resetForm();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Content
        </button>
      </div>

      {loading && <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading data...</p>
      </div>}
      
      {!loading && filteredData.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-md">
          <FontAwesomeIcon icon={faImage} className="text-gray-400 text-5xl mb-3" />
          <p className="text-gray-500">
            {filter === 'active' && 'No active content yet.'}
            {filter === 'inactive' && 'No inactive content yet.'}
            {filter === 'all' && 'No content data yet. Click "Add Content" to add.'}
          </p>
        </div>
      )}

      {!loading && filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(item => (
            <div key={item.id} className={`border rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${!item.is_active ? 'opacity-70' : ''}`}>
              {/* Gambar dengan area klik untuk melihat detail */}
              <div 
                className="relative h-48 bg-gray-100 cursor-pointer"
                onClick={() => handleViewDetail(item.id)}
              >
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
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah event click ke parent
                      handleEdit(item);
                    }}
                    className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah event click ke parent
                      handleToggleActive(item.id, item.is_active);
                    }}
                    className={`p-1.5 ${item.is_active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    title={item.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon icon={item.is_active ? faEyeSlash : faEye} className="text-xs" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah event click ke parent
                      handleDelete(item.id);
                    }}
                    className={`p-1.5 ${confirmDelete === item.id ? 'bg-red-700' : 'bg-red-500'} text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah event click ke parent
                      handleViewDetail(item.id);
                    }}
                    className="p-1.5 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
                  </button>
                </div>
                {!item.is_active && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                    Inactive
                  </div>
                )}
                {item.external_link && (
                  <div className="absolute bottom-2 right-2">
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-purple-500 text-white rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      title="Buka link eksternal"
                      onClick={(e) => e.stopPropagation()} // Mencegah event click ke parent
                    >
                      <FontAwesomeIcon icon={faLink} className="text-xs" />
                    </a>
                  </div>
                )}
              </div>
              {/* Informasi konten */}
              <div 
                className="p-4 cursor-pointer" 
                onClick={() => handleViewDetail(item.id)}
              >
                <h5 className="font-semibold mb-2 truncate">{item.image_title}</h5>
                <p className="text-sm text-gray-600 line-clamp-3 h-14 overflow-hidden">
                  {item.image_description || 'Tidak ada deskripsi'}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                  <span>Type: {item.file_type}</span>
                  <span>Size: {(item.file_size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

              {mode === 'list' && renderDashboardList()}
              {(mode === 'add' || mode === 'edit') && renderForm()}
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

export default DashboardPage