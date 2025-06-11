import React, { useState, useRef, useEffect } from 'react';
import AsideComponents from '../../../components/AsideComponents';
import FooterComponents from '../../../components/FooterComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
// import ButtonComponents from '../../../components/ButtonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-regular-svg-icons';
import { faDownload, faHistory, faFileAlt, faUpload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';


// Helper function to validate DD/MM/YYYY date format
const isValidDDMMYYYY = (dateString) => {
  if (!dateString) return false;
  
  try {
    // Cek apakah format sesuai DD/MM/YYYY
    if (!dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    // Validasi yang lebih longgar - hanya cek range wajar
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1000 || year > 9999) return false; // Diperlonggar dari 1900-2100 menjadi 1000-9999
    
    // HAPUS validasi kalender yang ketat - terima semua tanggal
    return true;
  } catch (error) {
    console.error('Error validating date format:', error);
    return false;
  }
};

// Function to convert DD/MM/YYYY to YYYY-MM-DD (for database)
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  
  try {
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  } catch (error) {
    console.error('Error converting date format:', error);
    return '';
  }
};

// Function to format date to DD/MM/YYYY for display
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  
  try {
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateString;
    }
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
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

const api = axios.create({
  baseURL: 'http://localhost:3005/api/regional2s'
});

api.interceptors.request.use(
  (config) => {
    
    if (config.data) {
      const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
      
      dateFields.forEach(field => {
        if (config.data[field] && typeof config.data[field] === 'string') {
          config.data[field] = formatDateToYYYYMMDD(config.data[field]);
        }
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(' Response error:', error);
    return Promise.reject(error);
  }
);

const TambahUserPertamina2S = () => {
  const [formData, setFormData] = useState({
    nama_lengkap: '', no_kontrak: '', paket_tender: '', jabatan: '', nik_vendor: '', gaji_net: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', status_pernikahan: '', no_telpon: '', nama_ibu_kandung: '', kontak_darurat: '', 
    email: '', alamat_ktp: '', alamat_domisili: '', nama_institute_pendidikan: '', jurusan: '', no_kk: '', no_ktp: '', no_npwp: '', nama_bank: '', no_rekening: '', nama_rekening: '', bpjs_kesehatan: '', bpjs_kesehatan_keterangan: '', 
    bpjs_kesehatan_suami_istri: '', bpjs_anak1: '', bpjs_anak2: '', bpjs_anak3: '', bpjstk: '', kontrak_awal: '', kontrak_akhir: ''
  });  
  
  const [files, setFiles] = useState({
    cv: null,
    ijazah: null,
    sertifikat: null,
    pkwt: null,
    no_ktp: null,
    no_kk: null,
    no_npwp: null,
    bpjs_kesehatan: null,
    bpjstk: null,
    no_rekening: null
  });

  const [fileNames, setFileNames] = useState({
    cv: '',
    ijazah: '',
    sertifikat: '',
    pkwt: '',
    no_ktp: '',
    no_kk: '',
    no_npwp: '',
    bpjs_kesehatan: '',
    bpjstk: '',
    no_rekening: ''
  });

  const [existingFiles, setExistingFiles] = useState({
    cv: null,
    ijazah: null,
    sertifikat: null,
    pkwt: null,
    no_ktp: null,
    no_kk: null,
    no_npwp: null,
    bpjs_kesehatan: null,
    bpjstk: null,
    no_rekening: null
  });

  const [deletedFiles, setDeletedFiles] = useState({
    cv: false,
    ijazah: false,
    sertifikat: false,
    pkwt: false,
    no_ktp: false,
    no_kk: false,
    no_npwp: false,
    bpjs_kesehatan: false,
    bpjstk: false,
    no_rekening: false
  });

  const [userData, setUserData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyUsers, setHistoryUsers] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode || false;
  const isRestoreMode = location.state?.isRestore || false;
  const [isRestoring, setIsRestoring] = useState(false);
  const userToEdit = location.state?.userData || null;
  const [error, setError] = useState(null);
  
  const [sortedHistory, setSortedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRefCV = useRef(null);
  const fileInputRefIjazah = useRef(null);
  const fileInputRefSertifikat = useRef(null);
  const fileInputRefPKWT = useRef(null);

  const fileInputRefNoKTP = useRef(null);
  const fileInputRefNoKK = useRef(null);
  const fileInputRefNoNPWP = useRef(null);
  const fileInputRefBPJSKes = useRef(null);
  const fileInputRefBPJSTK = useRef(null);
  const fileInputRefNoRekening = useRef(null);

  const [showSertifikatModal, setShowSertifikatModal] = useState(false);

  // State for gender options
  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  // State for marital status options
  const statusPernikahanOptions = [
    { value: '', label: 'Select Marital Status' },
    { value: 'TK/0', label: 'TK/0' },
    { value: 'TK/1', label: 'TK/1' },
    { value: 'TK/2', label: 'TK/2' },
    { value: 'TK/3', label: 'TK/3' },
    { value: 'K/0', label: 'K/0' },
    { value: 'K/1', label: 'K/1' },
    { value: 'K/2', label: 'K/2' },
    { value: 'K/3', label: 'K/3' },
    { value: 'K/I/0', label: 'K/I/0' },
    { value: 'K/I/1', label: 'K/I/1' },
    { value: 'K/I/2', label: 'K/I/2' },
    { value: 'K/I/3', label: 'K/I/3' }
  ];

  // Required fields for form submission
  const requiredFields = [
    'nama_lengkap',
    'no_kontrak',
    'kontrak_awal',
    'kontrak_akhir'
  ];

  // Get today's date in YYYY-MM-DD format
  const getTodayYYYYMMDD = () => {
    try {
      const now = new Date();
      const isoString = now.toISOString();
      return isoString.split('T')[0];
    } catch (error) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  // First effect to handle edit data from userToEdit
  useEffect(() => {
    if (isEditMode && userToEdit) {
      
      setOriginalData({
        kontrak_awal: userToEdit.kontrak_awal,
        kontrak_akhir: userToEdit.kontrak_akhir,
        sebab_na: userToEdit.sebab_na
      });
      
      setFormData({
        ...userToEdit,
        kontrak_awal: formatDateToDDMMYYYY(userToEdit.kontrak_awal),
        kontrak_akhir: formatDateToDDMMYYYY(userToEdit.kontrak_akhir),
        tanggal_lahir: formatDateToDDMMYYYY(userToEdit.tanggal_lahir)
      });
    }
  }, [isEditMode, userToEdit]);

  useEffect(() => {
    if (location.state?.userData?.id) {
      setUserId(location.state.userData.id);
      
      const userData = location.state.userData;
      setFormData({
        ...userData,
        kontrak_awal: formatDateToDDMMYYYY(userData.kontrak_awal),
        kontrak_akhir: formatDateToDDMMYYYY(userData.kontrak_akhir),
        tanggal_lahir: formatDateToDDMMYYYY(userData.tanggal_lahir)
      });
    } 
    else {
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id');
      if (idParam) {
        setUserId(idParam);
        fetchUserData(idParam);
      }
    }
  }, [location.state]);

  useEffect(() => {
    try {
      if (location.state?.restored) {
        setIsRestoring(true);
        
        setMessage({
          text: location.state.message || 'To reactivate the employee, update the contract and contract number',
          type: 'info'
        });
        
        setFormData(prev => ({
          ...prev,
          sebab_na: null
        }));
        
        setTimeout(() => {
          try {
            const noKontrakField = document.getElementById('no_kontrak');
            const kontrakAwalField = document.getElementById('kontrak_awal');
            const kontrakAkhirField = document.getElementById('kontrak_akhir');
            
            if (noKontrakField) noKontrakField.classList.add('border-blue-500', 'bg-blue-50');
            if (kontrakAwalField) kontrakAwalField.classList.add('border-blue-500', 'bg-blue-50');
            if (kontrakAkhirField) kontrakAkhirField.classList.add('border-blue-500', 'bg-blue-50');
            
            const saveButton = document.querySelector('button[type="submit"]');
            if (saveButton) {
              saveButton.textContent = 'Reactivate';
              saveButton.classList.add('bg-green-600', 'hover:bg-green-700');
            }
          } catch (domError) {
            console.error("Error modifying DOM:", domError);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error detecting restoration mode:", error);
    }
  }, [location.state]);

  useEffect(() => {
    if (isRestoring && formData) {
      setChangedFields({
        ...changedFields,
        kontrak_awal: true,
        kontrak_akhir: true,
        no_kontrak: true
      });
      
    }
  }, [isRestoring]);

  // Get file info when in edit mode
  useEffect(() => {
    if (isEditMode && userId) {
      const fetchFileInfo = async () => {
        try {
          const response = await api.get(`/users/${userId}`);
          
          if (response.data) {
            const userData = response.data;
            
            // Set existing files for all document types
            const documentTypes = ['cv', 'ijazah', 'sertifikat', 'pkwt', 'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk', 'no_rekening'];
            
            documentTypes.forEach(docType => {
              if (userData[`${docType}_filename`]) {
                setExistingFiles(prev => ({
                  ...prev,
                  [docType]: {
                    filename: userData[`${docType}_filename`],
                    filepath: userData[`${docType}_filepath`],
                    mimetype: userData[`${docType}_mimetype`],
                    filesize: userData[`${docType}_filesize`]
                  }
                }));
              }
            });
          }
        } catch (error) {
          console.error('Error fetching file info:', error);
        }
      };
      
      fetchFileInfo();
    }
  }, [isEditMode, userId]);

  const fetchUserData = async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      if (response.data) {
        const userData = response.data;
        setFormData({
          ...userData,
          kontrak_awal: userData.kontrak_awal ? formatDateToDDMMYYYY(userData.kontrak_awal) : '',
          kontrak_akhir: userData.kontrak_akhir ? formatDateToDDMMYYYY(userData.kontrak_akhir) : ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setErrorMessage('Failed to fetch user data');
    }
  };

  // Fetch contract history
  const fetchAllContractHistory = async (userId) => {
    setLoadingHistory(true);
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/users/${userId}/all-contract-history?t=${timestamp}`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setSortedHistory(response.data.data);
      } else {
        setSortedHistory([]);
      }
    } catch (error) {
      console.error('Error fetching contract history:', error);
      handleApiError(error);
      setSortedHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Function to validate input fields
  const validateInputField = (name, value) => {
    let error = '';
    
    if (name === 'bpjs_kesehatan' && value) {
      if (value.length > 0 && value.length !== 13) {
        error = 'BPJS Health must be 13 digits';
      }
    }
    
    if (name === 'bpjstk' && value) {
      if (value.length > 0 && value.length !== 11) {
        error = 'BPJS Social Security must be 11 digits';
      }
    }
    
    if (name === 'no_ktp' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'KTP Number must be 16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'KTP Number must contain only numbers';
      }
    }
    
    if (name === 'no_kk' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'Family Card Number must be 16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'Family Card Number must contain only numbers';
      }
    }
    
    if (name === 'no_npwp' && value) {
      if (value.length > 0 && value.length !== 15 && value.length !== 16) {
        error = 'NPWP Number must be 15-16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'NPWP Number must contain only numbers';
      }
    }
    
    return error;
  };

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (['no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk'].includes(name)) {
      const maxLengths = {
        'bpjs_kesehatan': 13,
        'bpjstk': 11,
        'no_ktp': 16,
        'no_kk': 16,
        'no_npwp': 16
      };
      
      if (maxLengths[name] && value.length > maxLengths[name]) return;
      
      if (['no_ktp', 'no_kk', 'no_npwp'].includes(name) && 
          value !== '' && 
          !/^\d*$/.test(value)) {
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      const error = validateInputField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    else {
      handleChange(e);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir') {
      setChangedFields(prev => ({
        ...prev,
        [name]: true
      }));
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (value && value.includes('/') && !isValidDDMMYYYY(value)) {
        setErrors(prev => ({
          ...prev,
          [name]: `Invalid date format. Use DD/MM/YYYY format`
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  // Handle date changes separately
  const handleDateChange = (name, value) => {
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
  
  setChangedFields(prev => ({
    ...prev,
    [name]: true
  }));
  
  // Hanya validasi jika input sudah lengkap 10 karakter
  if (value && value.length === 10) {
    if (value.match(/^\d{2}\/\d{2}\/\d{4}$/) && isValidDDMMYYYY(value)) {
      // Tanggal valid, hapus error
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    } else {
      // Format salah
      setErrors(prev => ({
        ...prev,
        [name]: `Format tanggal harus DD/MM/YYYY`
      }));
    }
  } else {
    // Belum lengkap atau kosong, hapus error
    setErrors(prev => ({
      ...prev,
      [name]: null
    }));
  }
};

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          [type]: 'File too large, maximum 5MB' 
        }));
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          [type]: 'Unsupported file format. Use PDF, DOC, DOCX, JPG, or PNG.' 
        }));
        return;
      }
      
      // Update files state correctly
      setFiles(prev => {
        const newFiles = { ...prev };
        newFiles[type] = file;
        return newFiles;
      });
      
      // Update fileNames state
      setFileNames(prev => ({ 
        ...prev, 
        [type]: file.name 
      }));
      
      // Clear error if exists
      if (errors[type]) {
        setErrors(prev => ({ ...prev, [type]: null }));
      }
      } else {
    }
  };

  // Validate form
  const validateForm = () => {
  try {
    const newErrors = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });

    // Validasi format tanggal yang lebih longgar
    const dateFields = ['kontrak_awal', 'kontrak_akhir'];
    dateFields.forEach(field => {
      if (formData[field] && typeof formData[field] === 'string') {
        
        // Hanya cek format DD/MM/YYYY, tidak cek validitas tanggal
        if (!formData[field].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          newErrors[field] = `Format ${field.replace(/_/g, ' ')} harus DD/MM/YYYY`;
          console.error(`Invalid date format for ${field}:`, formData[field]);
        } else {
          // Format benar, cek range basic
          const [day, month, year] = formData[field].split('/').map(Number);
          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000 || year > 9999) {
            newErrors[field] = `Tanggal ${field.replace(/_/g, ' ')} tidak valid`;
          }
        }
      }
    });

    // Validasi tanggal akhir harus setelah tanggal awal (tetap perlu)
    if (formData.kontrak_awal && formData.kontrak_akhir) {
      try {
        const parseDate = (dateStr) => {
          const [day, month, year] = dateStr.split('/');
          return new Date(year, month - 1, day);
        };
        
        const startDate = parseDate(formData.kontrak_awal);
        const endDate = parseDate(formData.kontrak_akhir);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate <= startDate) {
          newErrors.kontrak_akhir = 'Contract end date must be after contract start date';
          console.error('End date must be after start date');
        }
      } catch (error) {
        console.error('Error validating dates:', error);
        // Jangan tambahkan error jika parsing gagal, biarkan format validation yang handle
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  } catch (error) {
    console.error("Error in form validation:", error);
    setMessage({
      text: `Validation error: ${error.message}`,
      type: 'error'
    });
    return false;
  }
};
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Log file state for debugging
    Object.keys(files).forEach(type => {
      if (files[type]) {
      }
    });
    
    // Check if there are valid files to upload
    const hasValidFiles = Object.values(files).some(file => file && file.size > 0);
    if (hasValidFiles) {
    }
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Create copy of form data
        let dataToSubmit = {...formData};

        // Add flags for deleted files
        Object.keys(deletedFiles).forEach(fileType => {
          if (deletedFiles[fileType]) {
            dataToSubmit[`${fileType}_filename`] = null;
            dataToSubmit[`${fileType}_filepath`] = null;
            dataToSubmit[`${fileType}_mimetype`] = null;
            dataToSubmit[`${fileType}_filesize`] = null;
          }
        });

        // For date fields that haven't changed, use original data
        if (isEditMode) {
          const dateFields = ['kontrak_awal', 'kontrak_akhir'];
          dateFields.forEach(field => {
            if (!changedFields[field] && originalData[field]) {
              dataToSubmit[field] = originalData[field];
            }
          });
        }

        // Ensure correct date format (YYYY-MM-DD)
        const dateFields = ['kontrak_awal', 'kontrak_akhir'];
        dateFields.forEach(field => {
          if (dataToSubmit[field]) {
            const formattedDate = formatDateToYYYYMMDD(dataToSubmit[field]);
            dataToSubmit[field] = formattedDate;
          } else {
            dataToSubmit[field] = null;
          }
        });

        // Handle numeric fields
        if (dataToSubmit.gaji_net === '' || dataToSubmit.gaji_net === undefined) {
          dataToSubmit.gaji_net = null;
        } else if (dataToSubmit.gaji_net !== null) {
          dataToSubmit.gaji_net = Number(dataToSubmit.gaji_net);
        }

        // Validate required date fields
        if (!dataToSubmit.kontrak_awal || dataToSubmit.kontrak_awal === '') {
          throw new Error('Contract start date is required');
        }
        
        if (!dataToSubmit.kontrak_akhir || dataToSubmit.kontrak_akhir === '') {
          throw new Error('Contract end date is required');
        }

        // Determine endpoint
        const endpoint = isEditMode && userId 
          ? `/users/${userId}` 
          : '/users';
        
        // Submit data
        let response;
        if (isEditMode) {
          response = await api.put(endpoint, dataToSubmit);
        } else {
          response = await api.post(endpoint, dataToSubmit);
        }

        // Get the correct userId from response
        const userIdForFiles = isEditMode ? 
          userId : 
          (response.data.id || response.data.data?.id || (response.data.data && response.data.data.id));
      
        // Check before uploading files
        if (userIdForFiles && userIdForFiles !== 'undefined' && userIdForFiles !== undefined) {
          const hasFilesToUpload = Object.values(files).some(file => file !== null);
          
          if (hasFilesToUpload) {
            try {
              const uploadResults = await uploadFiles(userIdForFiles);
              
              const successCount = uploadResults.filter(r => r.success).length;
              const failCount = uploadResults.filter(r => !r.success).length;
              
              if (failCount > 0) {
                setMessage({
                  text: `Data saved, but ${failCount} of ${uploadResults.length} files failed to upload`,
                  type: 'warning'
                });
              } else {
              }
            } catch (fileError) {
              console.error("Error uploading files:", fileError);
              setMessage({
                text: 'Data saved but there was an issue uploading files. Please try uploading files manually later.',
                type: 'warning'
              });
            }
          } else {
          }
        } else {
        }
        
        // Success message specific to restore mode
        if (isRestoring) {
          setSuccessMessage('Employee successfully restored and reactivated');
          setMessage({
            text: 'Employee successfully restored to active status!',
            type: 'success'
          });
        } else {
          setSuccessMessage(isEditMode 
            ? 'Data successfully updated' 
            : 'Data successfully added');
        }
        
        // Refresh data if in edit mode
        if (isEditMode && userId) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchAllContractHistory(userId);
          await fetchUserData(userId);

          if (!isRestoring) {
            setMessage({
              text: 'Data successfully saved and contract history updated',
              type: 'success'
            });
          }
        } else {
          // Reset form if in add mode
          setFormData({
            nama_lengkap: '', no_kontrak: '', paket_tender: '', jabatan: '', nik_vendor: '', gaji_net: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '',
            status_pernikahan: '', no_telpon: '', nama_ibu_kandung: '', kontak_darurat: '', email: '', alamat_ktp: '', alamat_domisili: '', nama_institute_pendidikan: '',
            jurusan: '', no_kk: '', no_ktp: '', no_npwp: '', nama_bank: '',  no_rekening: '', nama_rekening: '', bpjs_kesehatan: '', bpjs_kesehatan_keterangan: '',
            bpjs_kesehatan_suami_istri: '', bpjs_anak1: '', bpjs_anak2: '', bpjs_anak3: '', bpjstk: '', asuransi_lainnya: '', kontrak_awal: '', kontrak_akhir: '', cv: ''
          });

          setFiles({
            cv: null, ijazah: null, sertifikat: null, pkwt: null, no_ktp: null, no_kk: null,
            no_npwp: null, bpjs_kesehatan: null, bpjstk: null, no_rekening: null
          });
          
          setFileNames({
            cv: '', ijazah: '', sertifikat: '', pkwt: '', no_ktp: '',
            no_kk: '', no_npwp: '', bpjs_kesehatan: '', bpjstk: '', no_rekening: ''
          });

          setExistingFiles({
            cv: null, ijazah: null, sertifikat: null, pkwt: null, no_ktp: null,
            no_kk: null, no_npwp: null, bpjs_kesehatan: null, bpjstk: null, no_rekening: null
          });

          setDeletedFiles({
            cv: false, ijazah: false, sertifikat: false, pkwt: false, no_ktp: false, no_kk: false, no_npwp: false, 
            bpjs_kesehatan: false, bpjstk: false, no_rekening: false
          });

          // Reset file input elements
          const fileInputRefs = [
            fileInputRefCV, fileInputRefIjazah, fileInputRefSertifikat, fileInputRefPKWT,
            fileInputRefNoKTP, fileInputRefNoKK, fileInputRefNoNPWP, fileInputRefBPJSKes,
            fileInputRefBPJSTK, fileInputRefNoRekening
          ];
          
          fileInputRefs.forEach(ref => {
            if (ref.current) ref.current.value = '';
          });
        }
        
        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);

        let errorMessage = 'An error occurred';
        
        if (error.response) {
          errorMessage = error.response.data?.message || 
            `An error occurred (${error.response.status}): ${error.response.statusText}`;
          
          if (error.response.data?.message?.includes("column") && 
              error.response.data?.message?.includes("does not exist")) {
            const columnMatch = error.response.data.message.match(/column "([^"]+)"/);
            const columnName = columnMatch ? columnMatch[1] : 'unknown';
            
            errorMessage = `An error occurred in the ${columnName} column. Please contact the IT team.`;
            console.error(`Database column error detected: ${columnName}`);
          }
        } else if (error.request) {
          errorMessage = 'No response from server. Check your network connection.';
        } else {
          errorMessage = 'An error occurred: ' + error.message;
        }
        
        setErrorMessage(errorMessage);
        setMessage({
          text: 'Failed to save data. ' + errorMessage,
          type: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const uploadFiles = async (userId) => {
    if (!userId || userId === 'undefined' || userId === undefined) {
      throw new Error('Invalid User ID for file upload');
    }

    const fileTypes = [
      'cv', 'ijazah', 'sertifikat', 'pkwt',
      'no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan', 'bpjstk', 'no_rekening'
    ];
    const uploadPromises = [];
    
    for (const type of fileTypes) {
      if (files[type]) {
        const formData = new FormData();
        formData.append('file', files[type]);

        try {
          const uploadPromise = api.post(
            `/users/${userId}/upload/${type}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          uploadPromises.push(
            uploadPromise.then(response => ({
              type,
              success: true,
              response: response.data
            })).catch(error => {
              console.error(`Error uploading ${type}:`, error.response?.data || error.message);
              return {
                type,
                success: false,
                error: error.response?.data?.error || error.message
              };
            })
          );
        } catch (error) {
          console.error(`Error preparing ${type} upload:`, error);
          throw error;
        }
      }
    }
    
    if (uploadPromises.length > 0) {
      
      try {
        const results = await Promise.all(uploadPromises);
        
        const errors = results.filter(result => !result.success);
        if (errors.length > 0) {
          errors.forEach(error => {
            console.error(`Failed to upload ${error.type}:`, error.error);
          });
        }
        
        const successCount = results.filter(result => result.success).length;
        
        return results;
      } catch (uploadError) {
        console.error("Error during file upload:", uploadError);
        throw uploadError;
      }
    }
    
    return [];
  };
  
  // Function to download file
  const downloadFile = async (type) => {
    try {
      if (userId) {
        const url = `${api.defaults.baseURL}/users/${userId}/download/${type}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error(`Error downloading ${type} file:`, error);
      setMessage({
        text: `Failed to download ${type}`,
        type: 'error'
      });
    }
  };

  // Function to delete file
  const deleteFile = async (type) => {
    try {
      if (userId) {
        const response = await api.delete(`/users/${userId}/delete-file/${type}`);
        
        if (response.data && response.data.success) {
          setExistingFiles(prev => ({
            ...prev,
            [type]: null
          }));
          
          setFileNames(prev => ({
            ...prev,
            [type]: ''
          }));

          setDeletedFiles(prev => ({
            ...prev,
            [type]: true
          }));
          
          const fileInputRefs = {
            'cv': fileInputRefCV,
            'ijazah': fileInputRefIjazah,
            'sertifikat': fileInputRefSertifikat,
            'pkwt': fileInputRefPKWT,
            'no_ktp': fileInputRefNoKTP,
            'no_kk': fileInputRefNoKK,
            'no_npwp': fileInputRefNoNPWP,
            'bpjs_kesehatan': fileInputRefBPJSKes,
            'bpjstk': fileInputRefBPJSTK,
            'no_rekening': fileInputRefNoRekening
          };
          
          if (fileInputRefs[type] && fileInputRefs[type].current) {
            fileInputRefs[type].current.value = '';
          }
          
          setMessage({
            text: `${type} file successfully deleted`,
            type: 'success'
          });
        } else {
          throw new Error(response.data?.message || 'Failed to delete file');
        }
      } else {
        setExistingFiles(prev => ({
          ...prev,
          [type]: null
        }));
        
        setFileNames(prev => ({
          ...prev,
          [type]: ''
        }));
        
        setDeletedFiles(prev => ({
          ...prev,
          [type]: true
        }));
        
        setFiles(prev => ({
          ...prev,
          [type]: null
        }));
        
        const fileInputRefs = {
          'cv': fileInputRefCV,
          'ijazah': fileInputRefIjazah,
          'sertifikat': fileInputRefSertifikat,
          'pkwt': fileInputRefPKWT,
          'no_ktp': fileInputRefNoKTP,
          'no_kk': fileInputRefNoKK,
          'no_npwp': fileInputRefNoNPWP,
          'bpjs_kesehatan': fileInputRefBPJSKes,
          'bpjstk': fileInputRefBPJSTK,
          'no_rekening': fileInputRefNoRekening
        };
        
        if (fileInputRefs[type] && fileInputRefs[type].current) {
          fileInputRefs[type].current.value = '';
        }
        
        setMessage({
          text: `${type} file deleted`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error(`Error deleting ${type} file:`, error);
      setDeletedFiles(prev => ({
        ...prev,
        [type]: true
      }));
      
      setExistingFiles(prev => ({
        ...prev,
        [type]: null
      }));
      
      setMessage({
        text: `An error occurred while deleting the file from the server. File will be deleted when saving.`,
        type: 'warning'
      });
    }
  };
  
  // Download history as CSV
  const downloadContractHistory = () => {
    if (sortedHistory.length === 0) {
      setMessage({ text: 'No contract history to download', type: 'error' });
      return;
    }
    
    const headers = [
      'Change Time',
      'Employee Name',
      'Old Contract No',
      'Old Contract Start',
      'Old Contract End',
      'New Contract No',
      'New Contract Start',
      'New Contract End',
      'Modified By'
    ];
    
    const rows = sortedHistory.map(history => [
      new Date(history.tanggal_perubahan || history.waktu_perubahan).toLocaleString('id-ID'),
      history.nama_karyawan || '',
      history.no_kontrak_lama || '-',
      formatDateToDDMMYYYY(history.kontrak_awal_lama),
      formatDateToDDMMYYYY(history.kontrak_akhir_lama),
      history.no_kontrak_baru || '-',
      formatDateToDDMMYYYY(history.kontrak_awal_baru),
      formatDateToDDMMYYYY(history.kontrak_akhir_baru),
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
    link.setAttribute('download', `contract-history-${formData.nama_lengkap}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Effect to load contract history on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (userData && userData.id) {
        try {
          if (isMounted) {
            await fetchAllContractHistory(userData.id);
          }
        } catch (error) {
          console.error('Failed to load contract history:', error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [userData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    if (idParam) {
      setIsEditMode(true);
      setUserId(idParam);
      fetchUserData(idParam);
    }
  }, []);
  
  // Format date for display in DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return formatDateToDDMMYYYY(dateString);
    } catch (e) {
      console.error('Error formatting date:', e);
      return '-';
    }
  };

  // Handle API error
  const handleApiError = (error) => {
    if (error.response) {
      setErrorMessage(error.response.data?.message || 'An error occurred while retrieving data');
    } else if (error.request) {
      setErrorMessage('No response from server');
    } else {
      setErrorMessage('An error occurred: ' + error.message);
    }
  };
  
  // Render contract history section
  const renderContractHistorySection = () => {
    if (!isEditMode) return null;

    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-semibold text-gray-700">
            <FontAwesomeIcon icon={faHistory} className="mr-2" />
            Contract Change History
          </h3>
          <div className="flex space-x-2">
            {sortedHistory.length > 0 && (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                onClick={downloadContractHistory}
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Download History
              </button>
            )}
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
              onClick={() => fetchAllContractHistory(userId)}
            >
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Refresh History
            </button>
          </div>
        </div>
        <div className="p-4">
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-gray-500">Loading contract history...</p>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No contract change history yet</p>
              <p className="text-gray-400 text-sm mt-1">History will appear when you change contract data</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Contract No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Start</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old End</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Contract No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Start</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New End</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedHistory.map((history, index) => (
                    <tr key={history.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(history.tanggal_perubahan || history.waktu_perubahan).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {history.no_kontrak_lama || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(history.kontrak_awal_lama)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(history.kontrak_akhir_lama)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {history.no_kontrak_baru || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(history.kontrak_awal_baru)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(history.kontrak_akhir_baru)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {history.modified_by || 'system'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Navigate after form submission
  useEffect(() => {
    if (submitted) {
      setTimeout(() => {
        navigate('/regional2s-edit', {
          state: {
            addedUser: !isEditMode,
            editedUser: isEditMode,
            newUser: !isEditMode ? formData : undefined,
            updatedUser: isEditMode ? formData : undefined
          },
          replace: true
        });
      }, 1500);
    }
  }, [submitted, navigate, formData, isEditMode, isRestoreMode]);

  useEffect(() => {
    if (userId) {
      fetchAllContractHistory(userId);
    }
  }, [userId]);

  const today = getTodayYYYYMMDD();

  // Render form sections
  const renderPersonalDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Data Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_lengkap">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_lengkap ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_lengkap"
              placeholder="Enter Full Name"
              value={formData.nama_lengkap || ''}
              onChange={handleChange}
            />
            {errors.nama_lengkap && <p className="text-red-500 text-xs italic mt-1">{errors.nama_lengkap}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jenis_kelamin">
              Gender
            </label>
            <select
              className={`shadow appearance-none border ${errors.jenis_kelamin ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="jenis_kelamin"
              value={formData.jenis_kelamin || ''}
              onChange={handleChange}
            >
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.jenis_kelamin && <p className="text-red-500 text-xs italic mt-1">{errors.jenis_kelamin}</p>}
          </div>

          {/* Tempat Lahir */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tempat_lahir">
            Birth Place
            </label>
            <input
              className={`shadow appearance-none border ${errors.tempat_lahir ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="tempat_lahir"
              placeholder="Enter Birth Place"
              value={formData.tempat_lahir || ''}
              onChange={handleChange}
            />
            {errors.tempat_lahir && <p className="text-red-500 text-xs italic mt-1">{errors.tempat_lahir}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tanggal_lahir">
              Date of Birth
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border ${
                  errors.tanggal_lahir ? 'border-red-500' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="tanggal_lahir"
                id="tanggal_lahir"
                placeholder="DD/MM/YYYY"
                value={formData.tanggal_lahir || ''}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  // Hanya izinkan angka dan slash
                  const cleanedValue = rawValue.replace(/[^\d\/]/g, '');
                  
                  // Format otomatis saat mengetik
                  let formattedValue = cleanedValue;
                  
                  // Auto-add slash setelah 2 digit pertama
                  if (cleanedValue.length === 2 && !cleanedValue.includes('/')) {
                    formattedValue = cleanedValue + '/';
                  }
                  // Auto-add slash setelah 2 digit kedua (bulan)
                  else if (cleanedValue.length === 5 && cleanedValue.split('/').length === 2) {
                    formattedValue = cleanedValue + '/';
                  }
                  // Batasi maksimal 10 karakter (DD/MM/YYYY)
                  else if (cleanedValue.length > 10) {
                    formattedValue = cleanedValue.substring(0, 10);
                  }
                  
                  // Panggil handleDateChange
                  handleDateChange('tanggal_lahir', formattedValue);
                }}
                maxLength={10}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
            </div>
            {errors.tanggal_lahir && <p className="text-red-500 text-xs italic mt-1">{errors.tanggal_lahir}</p>}
          </div>

          {/* Status Pernikahan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status_pernikahan">
            Marital Status
            </label>
            <select
              className={`shadow appearance-none border ${errors.status_pernikahan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="status_pernikahan"
              value={formData.status_pernikahan || ''}
              onChange={handleChange}
            >
              {statusPernikahanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status_pernikahan && <p className="text-red-500 text-xs italic mt-1">{errors.status_pernikahan}</p>}
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_telpon">
            Phone Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_telpon ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="no_telpon"
              placeholder="Enter Phone Number"
              value={formData.no_telpon || ''}
              onChange={handleNumberChange}
            />
            {errors.no_telpon && <p className="text-red-500 text-xs italic mt-1">{errors.no_telpon}</p>}
          </div>

          {/* Nama Ibu Kandung */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_ibu_kandung">
            Mother's Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_ibu_kandung ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_ibu_kandung"
              placeholder="Enter Mother's Name"
              value={formData.nama_ibu_kandung || ''}
              onChange={handleChange}
            />
            {errors.nama_ibu_kandung && <p className="text-red-500 text-xs italic mt-1">{errors.nama_ibu_kandung}</p>}
          </div>

          {/* Kontak Darurat */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="kontak_darurat">
              Emergency Contact
            </label>
            <input
              className={`shadow appearance-none border ${errors.kontak_darurat ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="kontak_darurat"
              placeholder="Enter Emergency Contact"
              value={formData.kontak_darurat || ''}
              onChange={handleNumberChange}
            />
            {errors.kontak_darurat && <p className="text-red-500 text-xs italic mt-1">{errors.kontak_darurat}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className={`shadow appearance-none border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="email"
              placeholder="email@example.com"
              value={formData.email || ''}
              onChange={handleChange}
            />
            {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
          </div>

          {/* Alamat KTP */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_ktp">
              KTP Address
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.alamat_ktp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="alamat_ktp"
              rows="2"
              placeholder="Enter complete address as on KTP"
              value={formData.alamat_ktp || ''}
              onChange={handleChange}
            ></textarea>
            {errors.alamat_ktp && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_ktp}</p>}
          </div>

          {/* Alamat Domisili */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_domisili">
            Domicile Address
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.alamat_domisili ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="alamat_domisili"
              rows="2"
              placeholder="Enter Domicile Address"
              value={formData.alamat_domisili || ''}
              onChange={handleChange}
            ></textarea>
            {errors.alamat_domisili && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_domisili}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Render employment data section
  const renderEmploymentDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Employment Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* No Kontrak */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_kontrak">
            Contract Number  <span className="text-red-500">*</span> {isEditMode && <span className="text-blue-500 text-xs">(Changes will be recorded in history)</span>}
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_kontrak ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="no_kontrak"
              id="no_kontrak"
              placeholder="Enter Contract Number "
              value={formData.no_kontrak || ''}
              onChange={handleChange}
            />
            {errors.no_kontrak && <p className="text-red-500 text-xs italic mt-1">{errors.no_kontrak}</p>}
          </div>

          {/* Paket Tender */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paket_tender">
            Tender Package
            </label>
            <input
              className={`shadow appearance-none border ${errors.paket_tender ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="paket_tender"
              placeholder="Enter Tender Package"
              value={formData.paket_tender || ''}
              onChange={handleChange}
            />
            {errors.paket_tender && <p className="text-red-500 text-xs italic mt-1">{errors.paket_tender}</p>}
          </div>

          {/* Jabatan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jabatan">
            Position
            </label>
            <input
              className={`shadow appearance-none border ${errors.jabatan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="jabatan"
              placeholder="Enter Position"
              value={formData.jabatan || ''}
              onChange={handleChange}
            />
            {errors.jabatan && <p className="text-red-500 text-xs italic mt-1">{errors.jabatan}</p>}
          </div>

          {/* NIK Vendor */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nik_vendor">
              Vendor ID
            </label>
            <input
              className={`shadow appearance-none border ${errors.nik_vendor ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nik_vendor"
              placeholder="Enter Vendor ID"
              value={formData.nik_vendor || ''}
              onChange={handleChange}
            />
            {errors.nik_vendor && <p className="text-red-500 text-xs italic mt-1">{errors.nik_vendor}</p>}
          </div>

          {/* Net Salary */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gaji_net">
              Net Salary
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.gaji_net ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="gaji_net"
                placeholder="0.00"
                value={formData.gaji_net || ''}
                onChange={handleCurrencyChange}
              />
            </div>
            {errors.gaji_net && <p className="text-red-500 text-xs italic mt-1">{errors.gaji_net}</p>}
            <p className="text-gray-400 text-xs mt-1">Format: numbers without thousands separator (e.g., 5000000.00)</p>
          </div>

          {/* Contract Start Date */}
          <div>
            <label className={`block text-gray-700 text-sm font-bold mb-2 ${isEditMode ? 'text-blue-700' : ''}`} htmlFor="kontrak_awal">
              Contract Start Date <span className="text-red-500">*</span>
              {isEditMode && <span className="text-blue-500 text-xs ml-1">(Changes will be recorded in history)</span>}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border ${
                  errors.kontrak_awal ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="kontrak_awal"
                id="kontrak_awal"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_awal || ''}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  // Hanya izinkan angka dan slash
                  const cleanedValue = rawValue.replace(/[^\d\/]/g, '');
                  
                  // Format otomatis saat mengetik
                  let formattedValue = cleanedValue;
                  
                  // Auto-add slash setelah 2 digit pertama
                  if (cleanedValue.length === 2 && !cleanedValue.includes('/')) {
                    formattedValue = cleanedValue + '/';
                  }
                  // Auto-add slash setelah 2 digit kedua (bulan)
                  else if (cleanedValue.length === 5 && cleanedValue.split('/').length === 2) {
                    formattedValue = cleanedValue + '/';
                  }
                  // Batasi maksimal 10 karakter (DD/MM/YYYY)
                  else if (cleanedValue.length > 10) {
                    formattedValue = cleanedValue.substring(0, 10);
                  }
                  
                  // Panggil handleDateChange yang sudah diperbaiki
                  handleDateChange('kontrak_awal', formattedValue);
                }}
                maxLength={10}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY (contoh: 15/01/2024)</small>
            </div>
            {errors.kontrak_awal && <p className="text-red-500 text-xs italic mt-1">{errors.kontrak_awal}</p>}
          </div>

          {/* Contract End Date */}
          <div>
            <label className={`block text-gray-700 text-sm font-bold mb-2 ${isEditMode ? 'text-blue-700' : ''}`} htmlFor="kontrak_akhir">
              Contract End Date <span className="text-red-500">*</span>
              {isEditMode && <span className="text-blue-500 text-xs ml-1">(Changes will be recorded in history)</span>}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border ${
                  errors.kontrak_akhir ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="kontrak_akhir"
                id="kontrak_akhir"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_akhir || ''}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  // Hanya izinkan angka dan slash
                  const cleanedValue = rawValue.replace(/[^\d\/]/g, '');
                  
                  // Format otomatis saat mengetik
                  let formattedValue = cleanedValue;
                  
                  // Auto-add slash setelah 2 digit pertama
                  if (cleanedValue.length === 2 && !cleanedValue.includes('/')) {
                    formattedValue = cleanedValue + '/';
                  }
                  // Auto-add slash setelah 2 digit kedua (bulan)
                  else if (cleanedValue.length === 5 && cleanedValue.split('/').length === 2) {
                    formattedValue = cleanedValue + '/';
                  }
                  // Batasi maksimal 10 karakter (DD/MM/YYYY)
                  else if (cleanedValue.length > 10) {
                    formattedValue = cleanedValue.substring(0, 10);
                  }
                  
                  // Panggil handleDateChange yang sudah diperbaiki
                  handleDateChange('kontrak_akhir', formattedValue);
                }}
                maxLength={10}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY (contoh: 31/12/2024)</small>
            </div>
            {errors.kontrak_akhir && <p className="text-red-500 text-xs italic mt-1">{errors.kontrak_akhir}</p>}
          </div>

        </div>
      </div>
    );
  };

  // Render education data section
  const renderEducationDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Education Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nama Institute Pendidikan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_institute_pendidikan">
            Educational Institution Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_institute_pendidikan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_institute_pendidikan"
              placeholder="Enter Educational Institution Name"
              value={formData.nama_institute_pendidikan || ''}
              onChange={handleChange}
            />
            {errors.nama_institute_pendidikan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_institute_pendidikan}</p>}
          </div>
  
          {/* Jurusan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jurusan">
              Major
            </label>
            <input
              className={`shadow appearance-none border ${errors.jurusan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="jurusan"
              placeholder="Enter Major"
              value={formData.jurusan || ''}
              onChange={handleChange}
            />
            {errors.jurusan && <p className="text-red-500 text-xs italic mt-1">{errors.jurusan}</p>}
          </div>
        </div>

        {/* Other Insurance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cv">
              CV
            </label>
            <input
              className={`shadow appearance-none border ${errors.cv ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="cv"
              placeholder="Enter CV"
              value={formData.cv || ''}
              onChange={handleChange}
            />
            {errors.cv && <p className="text-red-500 text-xs italic mt-1">{errors.cv}</p>}
          </div>
        
        {/* File Upload Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {userId && (
            <div>
                <button
                  type="button"
                  onClick={() => setShowSertifikatModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                  Manage Certificates
                </button>
              </div>
          )}

        </div>
      </div>
    );
  };

   // Render administration data section
const renderAdministrationDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Administration Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* ID Card Number (no_ktp) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_ktp">
              KTP Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_ktp ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_ktp"
                  id="no_ktp"
                  placeholder="Enter KTP Number"
                  value={formData.no_ktp || ''}
                  onChange={handleInputChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefNoKTP}
                    type="file"
                    name="no_ktp"
                    onChange={(e) => handleFileChange(e, 'no_ktp')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_ktp && <p className="text-red-500 text-xs italic mt-1">{errors.no_ktp}</p>}
              <small className="text-gray-500 mt-1">Must be 16 digits.</small>
              {fileNames.no_ktp && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.no_ktp}</p>}
              {existingFiles.no_ktp && !files.no_ktp && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.no_ktp.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('no_ktp')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('no_ktp')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Family Card Number (no_kk) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_kk">
              Family Card Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_kk ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_kk"
                  placeholder="Enter Family Card Number"
                  value={formData.no_kk || ''}
                  onChange={handleInputChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefNoKK}
                    type="file"
                    name="no_kk"
                    onChange={(e) => handleFileChange(e, 'no_kk')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_kk && <p className="text-red-500 text-xs italic mt-1">{errors.no_kk}</p>}
              <small className="text-gray-500 mt-1">Must be 16 digits.</small>
              {fileNames.no_kk && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.no_kk}</p>}
              {existingFiles.no_kk && !files.no_kk && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.no_kk.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('no_kk')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('no_kk')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tax ID Number (no_npwp) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_npwp">
              NPWP Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_npwp ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_npwp"
                  placeholder="Enter NPWP Number"
                  value={formData.no_npwp || ''}
                  onChange={handleInputChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefNoNPWP}
                    type="file"
                    name="no_npwp"
                    onChange={(e) => handleFileChange(e, 'no_npwp')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_npwp && <p className="text-red-500 text-xs italic mt-1">{errors.no_npwp}</p>}
              <small className="text-gray-500 mt-1">Must be 15-16 digits.</small>
              {fileNames.no_npwp && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.no_npwp}</p>}
              {existingFiles.no_npwp && !files.no_npwp && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.no_npwp.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('no_npwp')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('no_npwp')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank Account Number (no_rekening) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_rekening">
              Bank Account Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_rekening ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_rekening"
                  placeholder="Enter Bank Account Number"
                  value={formData.no_rekening || ''}
                  onChange={handleNumberChange}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefNoRekening}
                    type="file"
                    name="no_rekening"
                    onChange={(e) => handleFileChange(e, 'no_rekening')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_rekening && <p className="text-red-500 text-xs italic mt-1">{errors.no_rekening}</p>}
              {fileNames.no_rekening && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.no_rekening}</p>}
              {existingFiles.no_rekening && !files.no_rekening && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.no_rekening.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('no_rekening')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('no_rekening')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_rekening">
              Bank Account Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_rekening ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_rekening"
              placeholder="Enter Bank Account Name"
              value={formData.nama_rekening || ''}
              onChange={handleChange}
            />
            {errors.nama_rekening && <p className="text-red-500 text-xs italic mt-1">{errors.nama_rekening}</p>}
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_bank">
              Bank Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_bank ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_bank"
              placeholder="Enter Bank Name"
              value={formData.nama_bank || ''}
              onChange={handleChange}
            />
            {errors.nama_bank && <p className="text-red-500 text-xs italic mt-1">{errors.nama_bank}</p>}
          </div>

        </div>
      </div>
    );
  };

  // Render BPJS data section
const renderBPJSDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">BPJS Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Health Insurance Number (bpjs_kesehatan) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_kesehatan">
              BPJS Health
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.bpjs_kesehatan ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="bpjs_kesehatan"
                  placeholder="Enter BPJS Health"
                  value={formData.bpjs_kesehatan || ''}
                  onChange={handleInputChange}
                  maxLength={13}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefBPJSKes}
                    type="file"
                    name="bpjs_kesehatan"
                    onChange={(e) => handleFileChange(e, 'bpjs_kesehatan')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.bpjs_kesehatan && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_kesehatan}</p>}
              <small className="text-gray-500 mt-1">Must be 13 digits.</small>
              {fileNames.bpjs_kesehatan && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.bpjs_kesehatan}</p>}
              {existingFiles.bpjs_kesehatan && !files.bpjs_kesehatan && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.bpjs_kesehatan.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('bpjs_kesehatan')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('bpjs_kesehatan')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BPJS Kesehatan Keterangan */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_kesehatan_keterangan">
              BPJS Health Details
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.bpjs_kesehatan_keterangan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="bpjs_kesehatan_keterangan"
              rows="2"
              placeholder="Enter BPJS Health Details"
              value={formData.bpjs_kesehatan_keterangan || ''}
              onChange={handleChange}
            ></textarea>
            {errors.bpjs_kesehatan_keterangan && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_kesehatan_keterangan}</p>}
          </div>

          {/* BPJS Kesehatan Suami/Istri */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_kesehatan_suami_istri">
              Spouse BPJS Health
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_kesehatan_suami_istri ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_kesehatan_suami_istri"
              placeholder="Enter Spouse BPJS Health"
              value={formData.bpjs_kesehatan_suami_istri || ''}
              onChange={handleNumberChange}
            />
            {errors.bpjs_kesehatan_suami_istri && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_kesehatan_suami_istri}</p>}
          </div>

          {/* BPJS Anak 1 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_anak1">
              Child 1 BPJS
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_anak1 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_anak1"
              placeholder="Enter Child 1 BPJS Number"
              value={formData.bpjs_anak1 || ''}
              onChange={handleNumberChange}
            />
            {errors.bpjs_anak1 && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_anak1}</p>}
          </div>

          {/* BPJS Anak 2 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_anak2">
              Child 2 BPJS
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_anak2 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_anak2"
              placeholder="Enter Child 2 BPJS Number"
              value={formData.bpjs_anak2 || ''}
              onChange={handleNumberChange}
            />
            {errors.bpjs_anak2 && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_anak2}</p>}
          </div>

          {/* BPJS Anak 3 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_anak3">
              Child 3 BPJS
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_anak3 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_anak3"
              placeholder="Enter  Child 3 BPJS Number"
              value={formData.bpjs_anak3 || ''}
              onChange={handleNumberChange}
            />
            {errors.bpjs_anak3 && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_anak3}</p>}
          </div>

          {/* Employment Insurance Number (bpjstk) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjstk">
              BPJS Social Security
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.bpjstk ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="bpjstk"
                  placeholder="Enter BPJS Social Security"
                  value={formData.bpjstk || ''}
                  onChange={handleInputChange}
                  maxLength={11}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefBPJSTK}
                    type="file"
                    name="bpjstk"
                    onChange={(e) => handleFileChange(e, 'bpjstk')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.bpjstk && <p className="text-red-500 text-xs italic mt-1">{errors.bpjstk}</p>}
              <small className="text-gray-500 mt-1">Must be 11 digits.</small>
              {fileNames.bpjstk && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.bpjstk}</p>}
              {existingFiles.bpjstk && !files.bpjstk && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.bpjstk.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('bpjstk')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('bpjstk')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Other Insurance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="asuransi_lainnya">
              Other Insurance
            </label>
            <input
              className={`shadow appearance-none border ${errors.asuransi_lainnya ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="asuransi_lainnya"
              placeholder="Enter Other Insurance"
              value={formData.asuransi_lainnya || ''}
              onChange={handleChange}
            />
            {errors.asuransi_lainnya && <p className="text-red-500 text-xs italic mt-1">{errors.asuransi_lainnya}</p>}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className='bg-(--background-tar-color)'> 
      <div className="flex">
        <div className='h-screen fixed left-0 top-0'>
          <AsideComponents />
        </div>
    
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
          <div className='w-fill h-hug py-3'>
            <HeaderComponents />
          </div>

          <main className="flex-1 bg-(--background-tar-color) space-y-6">
            <div className='flex flex-col bg-white p-6 shadow-md rounded gap-4'>
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                  {isEditMode 
                    ? isRestoreMode 
                      ? 'Form to Restore User Data PT Pertamina EP Regional 2 Subsurface' 
                      : 'Form to Edit User Data PT Pertamina EP Regional 2 Subsurface'
                    : 'Form to Add User Data PT Pertamina EP Regional 2 Subsurface'
                  }
                </h2>
                
                {message.text && (
                  <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : message.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                    <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
                  </div>
                )}

                {isRestoring && (
                  <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded shadow-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-blue-800">Employee Restoration Mode</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p className="font-bold">To reactivate an employee, you MUST:</p>
                          <ol className="list-decimal list-inside mt-2">
                            <li className="mb-1">Update the <span className="font-bold">Contract Number</span></li>
                            <li className="mb-1">Update the <span className="font-bold">Contract Start Date</span> (if needed)</li>
                            <li className="mb-1">Update the <span className="font-bold">Contract End Date</span> (must be after today)</li>
                          </ol>
                          <p className="mt-2">Previous inactive reason: <span className="font-bold">{originalData.sebab_na || '-'}</span></p>
                          <p className="mt-2 text-xs">Contract changes will be saved in history</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isEditMode && !isRestoring && formData.sebab_na && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <span className="font-bold">Attention:</span> This employee has Inactive status with reason: <span className="font-bold">{formData.sebab_na}</span>
                        </p>
                        <p className="text-xs mt-1">
                          To reactivate, use the "Restore" button on the Inactive page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitted ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Success!</strong>
                    <p className="block sm:inline"> Form has been {isEditMode ? 'updated' : 'submitted'} successfully. Redirecting to the user list page...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {renderPersonalDataSection()}
                    {renderEmploymentDataSection()}
                    {renderEducationDataSection()}
                    {renderAdministrationDataSection()}
                    {renderBPJSDataSection()}
                    
                    <div className="flex flex-row gap-x-10 items-center justify-center">
                      <button
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        type="submit"
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} className='w-4 h-4 mr-2' /> 
                        {isSubmitting ? 'Submitting...' : isEditMode ? 'Save Changes' : 'Save Data'}
                      </button>
                      <button 
                        type="button" 
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => navigate('/regional2s-edit')}
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            {isEditMode && renderContractHistorySection()}
          </main>

          {showSertifikatModal && (
            <SertifikatModal
              isOpen={showSertifikatModal}
              onClose={() => setShowSertifikatModal(false)}
              userId={userId}
              userName={formData.nama_lengkap}
              viewOnly={false}
              apiPrefix="regional2s"
            />
          )}
          
          <FooterComponents/>
        </div>
      </div>
    </div>
  );
};

export default TambahUserPertamina2S;