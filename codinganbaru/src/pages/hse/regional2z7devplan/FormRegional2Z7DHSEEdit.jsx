import  { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import '../../../styles/main.css';
import ButtonComponents from '../../../components/ButtonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faIdCard, faCarAlt, faSave, faArrowLeft, faHistory, faDownload, faSync } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';
const HSE_ID = 'regional2z7dhse';

const FormRegional2Z7DHSEEdit = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for loading, error handling, and feedback messages
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Main form data state
  const [formData, setFormData] = useState({
    // MCU Data
    awal_mcu: '',
    akhir_mcu: '',
    hasil_mcu: '',
    vendor_mcu: '',
    
    // HSE Passport Data
    no_hsepassport: '',
    awal_hsepassport: '',
    akhir_hsepassport: '',
    
    // SIM Data
    no_siml: '',
    awal_siml: '',
    akhir_siml: '',
    
    // Employee identification (readonly)
    id: '',
    nama_lengkap: '',
    jabatan: '',
    no_ktp: '',
    tanggal_lahir: '',
  });

  // HSE History Section state
  const [isExpanded, setIsExpanded] = useState(false);
  const [hseHistory, setHSEHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
   // Date formatting functions
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If already in YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      // If in DD/MM/YYYY format
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // If with timestamp, take only the date part
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };
  
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // If already in DD/MM/YYYY format
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      
      // If in YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // If with timestamp, take only the date part
      if (dateString.includes('T')) {
        const [datePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateString;
    }
  };
  
  // Format dates for backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return null;
    
    try {
      // If already in YYYY-MM-DD format or with timestamp
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      
      // If in DD/MM/YYYY format
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formatting date for backend:', error);
      return dateString;
    }
  };
  
  // Fetch employee data
  const fetchEmployeeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/regional2Z7D/users/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      if (response.data) {
        const employeeData = response.data;
        
        // Format dates for form inputs
        setFormData({
          // MCU Data
          awal_mcu: formatDateForInput(employeeData.awal_mcu),
          akhir_mcu: formatDateForInput(employeeData.akhir_mcu),
          hasil_mcu: employeeData.hasil_mcu || '',
          vendor_mcu: employeeData.vendor_mcu || '',
          
          // HSE Passport Data
          no_hsepassport: employeeData.no_hsepassport || '',
          awal_hsepassport: formatDateForInput(employeeData.awal_hsepassport),
          akhir_hsepassport: formatDateForInput(employeeData.akhir_hsepassport),
          
          // SIM Data
          no_siml: employeeData.no_siml || '',
          awal_siml: formatDateForInput(employeeData.awal_siml),
          akhir_siml: formatDateForInput(employeeData.akhir_siml),
          
          // Employee identification (readonly)
          id: employeeData.id,
          nama_lengkap: employeeData.nama_lengkap || '',
          jabatan: employeeData.jabatan || '',
          no_ktp: employeeData.no_ktp || '',
          no_telpon: employeeData.no_telpon || '',
          alamat_domisili: employeeData.alamat_domisili || '',
          tanggal_lahir: formatDateForInput(employeeData.tanggal_lahir),
        });
        
        // After loading employee data, fetch HSE history
        fetchHSEHistory(employeeData.id);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      let errorMessage = "Failed to fetch employee data";
      if (err.response) {
        errorMessage += `: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage += ": No response from server";
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
// Fetch HSE history data
  const fetchHSEHistory = async (userId) => {
    if (!userId) return;
    
    setLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const timestamp = new Date().getTime(); // Cache busting
      const response = await axios.get(
        `${API_BASE_URL}/regional2Z7D/users/${userId}/hse-history?t=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setHSEHistory(response.data.data);
      } else {
        setHSEHistory([]);
        setHistoryError('Response format is incorrect');
      }
    } catch (err) {
      console.error('Error fetching HSE history:', err);
      setHistoryError(err.response?.data?.message || 'Failed to fetch HSE history data');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Download history as CSV
  const downloadHSEHistory = () => {
    if (hseHistory.length === 0) {
      setHistoryError('No HSE history to download');
      return;
    }
    
    const headers = [
      'Change Time', 'Change Hour',
      'Employee Name',
      // MCU
      'Old MCU No', 'Old MCU Start', 'Old MCU End', 'Old MCU Result', 'Old MCU Vendor',
      'New MCU No', 'New MCU Start', 'New MCU End', 'New MCU Result', 'New MCU Vendor',
      // HSE Passport
      'Old HSEPassport No', 'Old HSEPassport Start', 'Old HSEPassport End',
      'New HSEPassport No', 'New HSEPassport Start', 'New HSEPassport End',
      // SIML
      'Old SIM No', 'Old SIM Start', 'Old SIM End',
      'New SIM No', 'New SIM Start', 'New SIM End',
      'Modified By'
    ];
    
    const rows = hseHistory.map(history => [
      new Date(history.waktu_perubahan).toLocaleString('id-ID'),
      history.nama_lengkap || '',
      // MCU
      history.no_mcu_lama || '-',
      formatDateForDisplay(history.awal_mcu_lama),
      formatDateForDisplay(history.akhir_mcu_lama),
      history.hasil_mcu_lama || '-',
      history.vendor_mcu_lama || '-',
      history.no_mcu_baru || '-',
      formatDateForDisplay(history.awal_mcu_baru),
      formatDateForDisplay(history.akhir_mcu_baru),
      history.hasil_mcu_baru || '-',
      history.vendor_mcu_baru || '-',
      // HSE Passport
      history.no_hsepassport_lama || '-',
      formatDateForDisplay(history.awal_hsepassport_lama),
      formatDateForDisplay(history.akhir_hsepassport_lama),
      history.no_hsepassport_baru || '-',
      formatDateForDisplay(history.awal_hsepassport_baru),
      formatDateForDisplay(history.akhir_hsepassport_baru),
      // SIML
      history.no_siml_lama || '-',
      formatDateForDisplay(history.awal_siml_lama),
      formatDateForDisplay(history.akhir_siml_lama),
      history.no_siml_baru || '-',
      formatDateForDisplay(history.awal_siml_baru),
      formatDateForDisplay(history.akhir_siml_baru),
      // Modified by
      history.modified_by || 'system'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hse-history-${formData.nama_lengkap || id}-Pertamina EP Regional 2 Zona 7 Devplan.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Form validation
  const validateForm = () => {
    const errors = [];
    
    // Validate date ranges
    if (formData.awal_mcu && formData.akhir_mcu) {
      if (new Date(formData.awal_mcu) > new Date(formData.akhir_mcu)) {
        errors.push('MCU start date cannot be after end date');
      }
    }
    
    if (formData.awal_hsepassport && formData.akhir_hsepassport) {
      if (new Date(formData.awal_hsepassport) > new Date(formData.akhir_hsepassport)) {
        errors.push('HSE Passport start date cannot be after end date');
      }
    }
    
    if (formData.awal_siml && formData.akhir_siml) {
      if (new Date(formData.awal_siml) > new Date(formData.akhir_siml)) {
        errors.push('SIM start date cannot be after end date');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      setMessage({
        text: `Please fix the following errors: ${validation.errors.join(', ')}`,
        type: 'error'
      });
      return;
    }
    
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Format dates for backend
      const formattedData = {
        ...formData,
        awal_mcu: formatDateForBackend(formData.awal_mcu),
        akhir_mcu: formatDateForBackend(formData.akhir_mcu),
        awal_hsepassport: formatDateForBackend(formData.awal_hsepassport),
        akhir_hsepassport: formatDateForBackend(formData.akhir_hsepassport),
        awal_siml: formatDateForBackend(formData.awal_siml),
        akhir_siml: formatDateForBackend(formData.akhir_siml),
      };
      
      // Menggunakan endpoint khusus untuk update HSE
      const response = await axios.put(
        `${API_BASE_URL}/regional2Z7D/users/${id}/hse`,
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (response.data) {
        setMessage({
          text: `Successfully updated HSE data for ${formData.nama_lengkap}`,
          type: 'success'
        });
        
        // Refresh HSE history after successful update
        fetchHSEHistory(id);
        
        // Redirect after short delay to show success message
        setTimeout(() => {
          navigate('/hse-regional2z7d', {
            state: {
              editedUser: true,
              updatedUser: formData,
              needRefresh: true // Tambahkan flag untuk trigger refresh
            }
          });
        }, 1500);
      }
    } catch (err) {
      let errorMessage = "Failed to update employee data";
      if (err.response) {
        errorMessage += `: ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        errorMessage += ": No response from server";
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setMessage({
        text: errorMessage,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };  
  
  // Helper to determine if a value has changed
  const valueChanged = (oldValue, newValue) => {
    if (oldValue === newValue) return false;
    if (!oldValue && !newValue) return false;
    return true;
  };

  // Fetch data on component mount
  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  // Handle data passed from location state
  useEffect(() => {
    if (location.state?.userData) {
      const userData = location.state.userData;
      
      setFormData({
        // MCU Data
        awal_mcu: formatDateForInput(userData.awal_mcu),
        akhir_mcu: formatDateForInput(userData.akhir_mcu),
        hasil_mcu: userData.hasil_mcu || '',
        vendor_mcu: userData.vendor_mcu || '',
        
        // HSE Passport Data
        no_hsepassport: userData.no_hsepassport || '',
        awal_hsepassport: formatDateForInput(userData.awal_hsepassport),
        akhir_hsepassport: formatDateForInput(userData.akhir_hsepassport),
        
        // SIM Data
        no_siml: userData.no_siml || '',
        awal_siml: formatDateForInput(userData.awal_siml),
        akhir_siml: formatDateForInput(userData.akhir_siml),
        
        // Employee identification (readonly)
        id: userData.id,
        nama_lengkap: userData.nama_lengkap || '',
        jabatan: userData.jabatan || '',
        no_ktp: userData.no_ktp || '',
        tanggal_lahir: formatDateForInput(userData.tanggal_lahir),
      });
      
      // After setting from location state, fetch HSE history if ID exists
      if (userData.id) {
        fetchHSEHistory(userData.id);
      }
      
      setLoading(false);
    }
  }, [location.state]);


  return (
    <div className='bg-(--background-tar-color)'> 
      <div className="flex">
        <div className='h-screen fixed left-0 top-0'>
          {/* Slidebar = Aside */}
          <AsideComponents />
        </div>
        
        {/* Main Content (Header, Main, Footer) */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
          {/* Header */}
          <div className='w-fill h-hug py-3'>
            <HeaderComponents />
          </div>
          
          <Link to='/hse-regional2z7d'>
            <ButtonComponents variant="back">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back
            </ButtonComponents>
          </Link>
          
          {/* Main Content */}
          <main className="flex-1">
            <h1 className="text-2xl font-bold mb-4 mt-2 text-center">Edit HSE Data Pertamina EP Regional 2 Zona 7 Devplan</h1>
            
            {message.text && (
              <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
                <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-xl">Loading employee data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-red-50 rounded-lg">
                <p className="text-red-500 text-xl">{error}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                {/* Employee Information (Read-only) */}
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">Employee Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Employee Name
                      </label>
                      <input 
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
                        value={formData.nama_lengkap}
                        readOnly
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Position
                      </label>
                      <input 
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
                        value={formData.jabatan}
                        readOnly
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Date of Birth
                      </label>
                      <input 
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
                        value={formatDateForDisplay(formData.tanggal_lahir)}
                        readOnly
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        NIK KTP
                      </label>
                      <input 
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
                        value={formData.no_ktp}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                {/* MCU Information */}
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" />
                    MCU Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        MCU Start Date
                      </label>
                      <input 
                        type="date"
                        name="awal_mcu"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.awal_mcu}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        MCU End Date
                      </label>
                      <input 
                        type="date"
                        name="akhir_mcu"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.akhir_mcu}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        MCU Result
                      </label>
                      <select
                        name="hasil_mcu"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.hasil_mcu}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Result</option>
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        MCU Vendor
                      </label>
                      <input 
                        type="text"
                        name="vendor_mcu"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.vendor_mcu}
                        onChange={handleInputChange}
                        placeholder="Enter MCU vendor"
                      />
                    </div>
                  </div>
                </div>
                
                {/* HSE Passport Information */}
                <div className="mb-6 border-b pb-4">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faIdCard} className="mr-2 text-green-500" />
                    HSE Passport Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        HSE Passport Number
                      </label>
                      <input 
                        type="text"
                        name="no_hsepassport"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.no_hsepassport}
                        onChange={handleInputChange}
                        placeholder="Enter HSE passport number"
                      />
                    </div>
                    
                    <div className="mb-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          HSE Passport Start Date
                        </label>
                        <input 
                          type="date"
                          name="awal_hsepassport"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={formData.awal_hsepassport}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          HSE Passport End Date
                        </label>
                        <input 
                          type="date"
                          name="akhir_hsepassport"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={formData.akhir_hsepassport}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* SIM Information */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faCarAlt} className="mr-2 text-yellow-500" />
                    SIM Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        SIM Number
                      </label>
                      <input 
                        type="text"
                        name="no_siml"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={formData.no_siml}
                        onChange={handleInputChange}
                        placeholder="Enter SIML number"
                      />
                    </div>

                    <div className="mb-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          SIM Start Date
                        </label>
                        <input 
                          type="date"
                          name="awal_siml"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={formData.awal_siml}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          SIM End Date
                        </label>
                        <input 
                          type="date"
                          name="akhir_siml"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={formData.akhir_siml}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Form Actions */}
                 <div className="flex justify-end mt-6">
                  <Link to="/hse-regional2z7d" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2">
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
                    disabled={saving}
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* HSE History Section - Terintegrasi langsung dalam komponen utama */}
            {!loading && !error && formData.id && (
              <div className="bg-white rounded-lg shadow mb-6 mt-6">
                <div className="p-4 flex justify-between items-center border-b">
                  <h3 className="text-lg font-semibold text-gray-700">
                    <FontAwesomeIcon icon={faHistory} className="mr-2" />
                    HSE Change History
                  </h3>
                  <div className="flex space-x-2">
                    {hseHistory.length > 0 && (
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                        onClick={downloadHSEHistory}
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download History
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                      onClick={() => fetchHSEHistory(formData.id)}
                    >
                      <FontAwesomeIcon icon={faSync} className="mr-2" />
                      Refresh History
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {loadingHistory ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-gray-500">Loading HSE history...</p>
                    </div>
                  ) : historyError ? (
                    <div className="text-center py-4 bg-red-50 rounded">
                      <p className="text-red-500">{historyError}</p>
                    </div>
                  ) : hseHistory.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No HSE change history available yet</p>
                      <p className="text-gray-400 text-sm mt-1">History will appear when you make changes to HSE data</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Value</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Value</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified By</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {hseHistory.map((history, index) => {
                            // Determine what changed to create more compact display
                            const changes = [];
                            
                            // Check MCU changes
                            if (valueChanged(history.hasil_mcu_lama, history.hasil_mcu_baru)) {
                              changes.push({
                                field: 'MCU Result',
                                oldValue: history.hasil_mcu_lama || '-',
                                newValue: history.hasil_mcu_baru || '-'
                              });
                            }
                            
                            if (valueChanged(history.vendor_mcu_lama, history.vendor_mcu_baru)) {
                              changes.push({
                                field: 'MCU Vendor',
                                oldValue: history.vendor_mcu_lama || '-',
                                newValue: history.vendor_mcu_baru || '-'
                              });
                            }
                            
                            if (valueChanged(history.awal_mcu_lama, history.awal_mcu_baru)) {
                              changes.push({
                                field: 'MCU Start Date',
                                oldValue: formatDateForDisplay(history.awal_mcu_lama) || '-',
                                newValue: formatDateForDisplay(history.awal_mcu_baru) || '-'
                              });
                            }
                            
                            if (valueChanged(history.akhir_mcu_lama, history.akhir_mcu_baru)) {
                              changes.push({
                                field: 'MCU End Date',
                                oldValue: formatDateForDisplay(history.akhir_mcu_lama) || '-',
                                newValue: formatDateForDisplay(history.akhir_mcu_baru) || '-'
                              });
                            }
                            
                            // Check HSE Passport changes
                            if (valueChanged(history.no_hsepassport_lama, history.no_hsepassport_baru)) {
                              changes.push({
                                field: 'HSE Passport Number',
                                oldValue: history.no_hsepassport_lama || '-',
                                newValue: history.no_hsepassport_baru || '-'
                              });
                            }
                            
                            if (valueChanged(history.awal_hsepassport_lama, history.awal_hsepassport_baru)) {
                              changes.push({
                                field: 'HSE Passport Start Date',
                                oldValue: formatDateForDisplay(history.awal_hsepassport_lama) || '-',
                                newValue: formatDateForDisplay(history.awal_hsepassport_baru) || '-'
                              });
                            }
                            
                            if (valueChanged(history.akhir_hsepassport_lama, history.akhir_hsepassport_baru)) {
                              changes.push({
                                field: 'HSE Passport End Date',
                                oldValue: formatDateForDisplay(history.akhir_hsepassport_lama) || '-',
                                newValue: formatDateForDisplay(history.akhir_hsepassport_baru) || '-'
                              });
                            }
                            
                            // Check SIML changes
                            if (valueChanged(history.no_siml_lama, history.no_siml_baru)) {
                              changes.push({
                                field: 'SIM Number',
                                oldValue: history.no_siml_lama || '-',
                                newValue: history.no_siml_baru || '-'
                              });
                            }
                            
                            if (valueChanged(history.awal_siml_lama, history.awal_siml_baru)) {
                              changes.push({
                                field: 'SIM Start Date',
                                oldValue: formatDateForDisplay(history.awal_siml_lama) || '-',
                                newValue: formatDateForDisplay(history.awal_siml_baru) || '-'
                              });
                            }
                            
                            if (valueChanged(history.akhir_siml_lama, history.akhir_siml_baru)) {
                              changes.push({
                                field: 'SIM End Date',
                                oldValue: formatDateForDisplay(history.akhir_siml_lama) || '-',
                                newValue: formatDateForDisplay(history.akhir_siml_baru) || '-'
                              });
                            }
                            
                            // If no changes detected, show generic message (shouldn't happen normally)
                            if (changes.length === 0) {
                              changes.push({
                                field: 'No changes detected',
                                oldValue: '-',
                                newValue: '-'
                              });
                            }
                            
                            // Create rows for each change
                            return changes.map((change, changeIndex) => (
                              <tr key={`${index}-${changeIndex}`} className={changeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {/* Only show timestamp and user for first change in a group */}
                                {changeIndex === 0 ? (
                                  <>
                                    <td 
                                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                                      rowSpan={changes.length} // Use rowspan for the timestamp cell
                                    >
                                      {new Date(history.waktu_perubahan).toLocaleString('id-ID')}
                                    </td>
                                  </>
                                ) : null}
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 font-medium">
                                  {change.field}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {change.oldValue}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-medium">
                                  {change.newValue}
                                </td>
                                {changeIndex === 0 ? (
                                  <td 
                                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                                    rowSpan={changes.length} // Use rowspan for the modified_by cell
                                  >
                                    {history.modified_by || 'system'}
                                  </td>
                                ) : null}
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
          
          {/* Footer */}
          <FooterComponents />
        </div>
      </div>
    </div>
  )
}

export default FormRegional2Z7DHSEEdit