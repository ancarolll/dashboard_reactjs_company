import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faTrash, faPenToSquare, faSave } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../styles/main.css';

const BASE_URL = 'http://localhost:3005/api';

const SertifikatModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  viewOnly = false,
  apiPrefix = 'elnusa' // Parameter default "elnusa", tetapi bisa diubah menjadi regional4, regional2x, dll.
}) => {
  const API_BASE_URL = `${BASE_URL}/${apiPrefix}`; // Gabungkan BASE_URL dengan apiPrefix

  const [sertifikatList, setSertifikatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingId, setEditingId] = useState(null);
  const [newSertifikat, setNewSertifikat] = useState({
    judul_sertifikat: '',
    tanggal_awal_berlaku: '',
    tanggal_akhir_berlaku: ''
  });

  // Format tanggal untuk tampilan dalam format DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Jika sudah dalam format DD/MM/YYYY
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      
      // Jika dalam format YYYY-MM-DD
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Jika dengan timestamp, ambil hanya bagian tanggal
      if (dateString.includes('T')) {
        const [datePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format tanggal dari DD/MM/YYYY ke YYYY-MM-DD
  const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString) return null; // Kembalikan null alih-alih string kosong
    
    try {
        // Jika dalam format DD/MM/YYYY
        if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Jika sudah dalam format YYYY-MM-DD
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
        }
        
        // Jika format dengan timestamp, ambil hanya bagian tanggal
        if (dateString.includes('T')) {
        return dateString.split('T')[0];
        }
        
        return null; // Kembalikan null jika format tidak dikenal
    } catch (error) {
        console.error('Error converting date format:', error);
        return null; // Return null jika error
    }
    };

  // Fetch sertifikat data when the modal is opened
  useEffect(() => {
    if (isOpen && userId) {
      fetchSertifikatData();
    }
  }, [isOpen, userId]);

  const fetchSertifikatData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/sertifikat/user/${userId}`);
      
      if (response.data.success) {
        setSertifikatList(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch certificate data');
      }
    } catch (error) {
      console.error('Error fetching certificate data:', error);
      setError('Error fetching certificate data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSertifikat({
      ...newSertifikat,
      [name]: value
    });
  };

  const handleAddSertifikat = async () => {
    // Validasi user ID
    if (!userId) {
        setMessage({
        text: 'Invalid User ID. Please refresh the page and try again.',
        type: 'error'
        });
        return;
    }

    if (!newSertifikat.judul_sertifikat) {
      setMessage({
        text: 'Certificate title is required',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const dataToSubmit = {
        user_id: parseInt(userId, 10), // Pastikan user_id adalah angka
        judul_sertifikat: newSertifikat.judul_sertifikat,
        tanggal_awal_berlaku: formatDateToYYYYMMDD(newSertifikat.tanggal_awal_berlaku),
        tanggal_akhir_berlaku: formatDateToYYYYMMDD(newSertifikat.tanggal_akhir_berlaku)
      };
      
      const response = await axios.post(`${API_BASE_URL}/sertifikat`, dataToSubmit);
      
      if (response.data.success) {
        // Clear form and refresh data
        setNewSertifikat({
          judul_sertifikat: '',
          tanggal_awal_berlaku: '',
          tanggal_akhir_berlaku: ''
        });
        
        setMessage({
          text: 'Certificate successfully added',
          type: 'success'
        });
        
        fetchSertifikatData();
      } else {
        setMessage({
          text: response.data.message || 'Failed to add certificate',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      setMessage({
        text: error.response?.data?.message || 'Error adding certificate. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSertifikat = (sertifikat) => {
    setEditingId(sertifikat.id);
    setNewSertifikat({
      judul_sertifikat: sertifikat.judul_sertifikat,
      tanggal_awal_berlaku: formatDateToDDMMYYYY(sertifikat.tanggal_awal_berlaku),
      tanggal_akhir_berlaku: formatDateToDDMMYYYY(sertifikat.tanggal_akhir_berlaku)
    });
  };

  const handleUpdateSertifikat = async () => {
    if (!newSertifikat.judul_sertifikat) {
      setMessage({
        text: 'Certificate title is required',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const dataToSubmit = {
        judul_sertifikat: newSertifikat.judul_sertifikat,
        tanggal_awal_berlaku: formatDateToYYYYMMDD(newSertifikat.tanggal_awal_berlaku),
        tanggal_akhir_berlaku: formatDateToYYYYMMDD(newSertifikat.tanggal_akhir_berlaku)
      };
      
      const response = await axios.put(`${API_BASE_URL}/sertifikat/${editingId}`, dataToSubmit);
      
      if (response.data.success) {
        // Reset form and refresh data
        setEditingId(null);
        setNewSertifikat({
          judul_sertifikat: '',
          tanggal_awal_berlaku: '',
          tanggal_akhir_berlaku: ''
        });
        
        setMessage({
          text: 'Certificate successfully updated',
          type: 'success'
        });
        
        fetchSertifikatData();
      } else {
        setMessage({
          text: response.data.message || 'Failed to update certificate',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
      setMessage({
        text: error.response?.data?.message || 'Error updating certificate. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSertifikat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/sertifikat/${id}`);
      
      if (response.data.success) {
        setMessage({
          text: 'Certificate successfully deleted',
          type: 'success'
        });
        
        fetchSertifikatData();
      } else {
        setMessage({
          text: response.data.message || 'Failed to delete certificate',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      setMessage({
        text: error.response?.data?.message || 'Error deleting certificate. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewSertifikat({
      judul_sertifikat: '',
      tanggal_awal_berlaku: '',
      tanggal_akhir_berlaku: ''
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {viewOnly 
              ? `Certificate Data - ${userName || 'Employee'}`
              : `Manage Certificates - ${userName || 'Employee'}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
            <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
            <button className="float-right" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Form for adding/editing */}
        {!viewOnly && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-md font-medium mb-2">
              {editingId ? 'Edit Certificate' : 'Add New Certificate'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Judul Sertifikat */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="judul_sertifikat">
                  Certificate Title <span className="text-red-500">*</span>
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  name="judul_sertifikat"
                  placeholder="Enter certificate title"
                  value={newSertifikat.judul_sertifikat}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Tanggal Awal Berlaku */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tanggal_awal_berlaku">
                  Start Date
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  name="tanggal_awal_berlaku"
                  placeholder="DD/MM/YYYY"
                  value={newSertifikat.tanggal_awal_berlaku}
                  onChange={handleInputChange}
                />
                <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
              </div>
              
              {/* Tanggal Akhir Berlaku */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tanggal_akhir_berlaku">
                  End Date
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  name="tanggal_akhir_berlaku"
                  placeholder="DD/MM/YYYY"
                  value={newSertifikat.tanggal_akhir_berlaku}
                  onChange={handleInputChange}
                />
                <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end mt-4">
              {editingId ? (
                <>
                  <button
                    type="button"
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
                    onClick={handleUpdateSertifikat}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    {loading ? 'Processing...' : 'Update'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
                  onClick={handleAddSertifikat}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  {loading ? 'Processing...' : 'Add Certificate'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* List of sertifikat */}
        <div className="bg-white">
          <h4 className="text-md font-medium mb-2">Certificate List</h4>
          
          {loading && !sertifikatList.length ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-500">Loading certificate data...</p>
            </div>
          ) : sertifikatList.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 rounded">
              <p className="text-gray-500">No certificate data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    {!viewOnly && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sertifikatList.map((sertifikat) => (
                    <tr key={sertifikat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-900">{sertifikat.judul_sertifikat}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateToDDMMYYYY(sertifikat.tanggal_awal_berlaku) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateToDDMMYYYY(sertifikat.tanggal_akhir_berlaku) || '-'}
                        </div>
                      </td>
                      {!viewOnly && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleEditSertifikat(sertifikat)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button
                            onClick={() => handleDeleteSertifikat(sertifikat.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SertifikatModal;