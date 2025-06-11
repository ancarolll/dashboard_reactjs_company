import React, { useState, useRef, useEffect } from 'react';
import AsideComponents from '../../../components/AsideComponents';
import FooterComponents from '../../../components/FooterComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faDownload, faHistory, faFileAlt, faUpload } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Fungsi bantuan untuk memvalidasi format tanggal DD/MM/YYYY
const isValidDDMMYYYY = (dateString) => {
  if (!dateString) return false;
  
  try {
    if (!dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (month === 2) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      if (isLeapYear && day > 29) return false;
      if (!isLeapYear && day > 28) return false;
    } else if (day > daysInMonth[month - 1]) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating date format:', error);
    return false;
  }
};

// Fungsi untuk konversi DD/MM/YYYY ke YYYY-MM-DD (untuk database)
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  
  try {
    if (dateString.includes('/')) {
      if (!isValidDDMMYYYY(dateString)) {
        console.error(`Format tanggal tidak valid: ${dateString}`);
        return dateString;
      }
      
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // console.warn(`Date format not recognized: ${dateString}`);
    return dateString;
  } catch (error) {
    console.error('Error converting date format:', error);
    return dateString;
  }
};

// Fungsi untuk format date dalam DD/MM/YYYY untuk tampilan
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
    
    // console.warn(`Date format not recognized: ${dateString}`);
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const api = axios.create({
  baseURL: 'http://localhost:3005/api/umran'
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

const TambahUserUmran = () => {
  const [formData, setFormData] = useState({ 
    nama_lengkap_karyawan: '', jabatan: '', nik_tar: '', no_kontrak: '', status_pernikahan: '', no_ktp: '', no_kk: '', tanggal_lahir: '', no_bpjs_kesehatan: '', asuransi_lainnya: '', status_bpjs: '', 
    no_bpjs_tk: '', npwp: '', pendidikan_terakhir_jurusan: '', nama_instansi_pendidikan: '', alamat_domisili: '', alamat_ktp: '', no_hp_wa_aktif: '', email_pengiriman_form: '', 
    email_aktif: '', nama_kontak_darurat: '', kontak_darurat: '', nama_ibu_kandung: '', gapok: '', ot: '', thp: '', t_transport: '', t_lapangan: '', rekening: '', 
    nama_pemilik_rekening: '', kontrak_awal: '', kontrak_akhir: '', cv: ''
  });

  // State untuk file uploads (ditambahkan 6 field baru)
  const [files, setFiles] = useState({
    cv: null, ijazah: null, sertifikat: null, pkwt: null,
    no_ktp: null, no_kk: null, npwp: null, no_bpjs_kesehatan: null,
    no_bpjs_tk: null, rekening: null
  });
  
  // State untuk file names (ditambahkan 6 field baru)
  const [fileNames, setFileNames] = useState({
    cv: '', ijazah: '', sertifikat: '', pkwt: '',
    no_ktp: '', no_kk: '', npwp: '', no_bpjs_kesehatan: '',
    no_bpjs_tk: '', rekening: ''
  });
  
  // State untuk existing file info (ditambahkan 6 field baru)
  const [existingFiles, setExistingFiles] = useState({
    cv: null, ijazah: null, sertifikat: null, pkwt: null,
    no_ktp: null, no_kk: null, npwp: null, no_bpjs_kesehatan: null,
    no_bpjs_tk: null, rekening: null
  });
  
  // State untuk menandai file yang telah dihapus (ditambahkan 6 field baru)
  const [deletedFiles, setDeletedFiles] = useState({
    cv: false, ijazah: false, sertifikat: false, pkwt: false,
    no_ktp: false, no_kk: false, npwp: false, no_bpjs_kesehatan: false,
    no_bpjs_tk: false, rekening: false
  });

  const [showSertifikatModal, setShowSertifikatModal] = useState(false);
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
  
  // File input refs (ditambahkan 6 ref baru)
  const fileInputRefCV = useRef(null);
  const fileInputRefIjazah = useRef(null);
  const fileInputRefSertifikat = useRef(null);
  const fileInputRefPKWT = useRef(null);
  const fileInputRefKTP = useRef(null);
  const fileInputRefKK = useRef(null);
  const fileInputRefNPWP = useRef(null);
  const fileInputRefBPJSKes = useRef(null);
  const fileInputRefBPJSTK = useRef(null);
  const fileInputRefRekening = useRef(null);

  // State for marriage status options
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

  // Fields required for form submission
const getRequiredFields = () => {
  if (isRestoring) {
    // Dalam mode restore, hanya nama yang wajib
    return ['nama_lengkap_karyawan'];
  } else {
    // Mode normal, semua field ini wajib
    return ['nama_lengkap_karyawan', 'kontrak_awal', 'kontrak_akhir'];
  }
};

  // Fungsi untuk mendapatkan hari ini dalam format YYYY-MM-DD
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

  // Effect pertama untuk menangani data edit dari userToEdit
  useEffect(() => {
    if (isEditMode && userToEdit) {
      // console.log("Editing user:", userToEdit);
      
      setOriginalData({
        tanggal_lahir: userToEdit.tanggal_lahir,
        kontrak_awal: userToEdit.kontrak_awal,
        kontrak_akhir: userToEdit.kontrak_akhir
      });
      
      const getDateString = (dateString) => {
        if (!dateString) return '';
        
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        
        if (dateString.includes('T')) {
          return dateString.split('T')[0];
        }
        
        try {
          return dateString.substring(0, 10);
        } catch (e) {
          console.error('Error extracting date:', e);
          return '';
        }
      };
      
      setFormData({
        ...userToEdit,
        tanggal_lahir: getDateString(userToEdit.tanggal_lahir),
        kontrak_awal: getDateString(userToEdit.kontrak_awal),
        kontrak_akhir: getDateString(userToEdit.kontrak_akhir)
      });
    }
  }, [isEditMode, userToEdit]);

  // Effect kedua untuk menangani data dari URL atau location state
  useEffect(() => {
    if (location.state?.userData?.id) {
      setUserId(location.state.userData.id);
      setFormData(location.state.userData);
    } else {
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
        // console.log("Restoration mode detected:", location.state);
        setIsRestoring(true);
        
        setMessage({
          text: location.state.message || 'To reactivate employee, update contract and contract number',
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
            console.error("Error when modifying DOM:", domError);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error when detecting restoration mode:", error);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.restored) {
      setIsRestoring(true);
      setMessage({
        text: location.state.message || 'To reactivate employee, update contract and contract number',
        type: 'info'
      });
    }
  }, [location.state]);
  
  useEffect(() => {
    if (isEditMode && userId) {
      fetchAllContractHistory(userId);
    }
  }, [userId, isEditMode]);

  // Effect untuk mendapatkan info file saat edit mode
  useEffect(() => {
    if (isEditMode && userId) {
      const fetchFileInfo = async () => {
        try {
          const response = await api.get(`/users/${userId}`);
          
          if (response.data) {
            const userData = response.data;
            
            // Set existing files for all file types
            const fileTypes = ['cv', 'ijazah', 'sertifikat', 'pkwt', 'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'rekening'];
            
            fileTypes.forEach(type => {
              if (userData[`${type}_filename`]) {
                setExistingFiles(prev => ({
                  ...prev,
                  [type]: {
                    filename: userData[`${type}_filename`],
                    filepath: userData[`${type}_filepath`],
                    mimetype: userData[`${type}_mimetype`],
                    filesize: userData[`${type}_filesize`]
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
          tanggal_lahir: userData.tanggal_lahir ? userData.tanggal_lahir.split('T')[0] : '',
          kontrak_awal: userData.kontrak_awal ? userData.kontrak_awal.split('T')[0] : '',
          kontrak_akhir: userData.kontrak_akhir ? userData.kontrak_akhir.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setErrorMessage('Failed to retrieve user data');
    }
  };

  const fetchAllContractHistory = async (userId) => {
    setLoadingHistory(true);
    try {
      // console.log(`Fetching all contract history for user ${userId}`);
      const timestamp = new Date().getTime();
      const response = await api.get(`/users/${userId}/history?t=${timestamp}`);
      
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      setSortedHistory(response.data.data);
      // console.log(`Successfully loaded ${response.data.data.length} contract history records`);
    } else if (response.data && Array.isArray(response.data)) {
      // Fallback jika response format berbeda
      setSortedHistory(response.data);
      // console.log(`Successfully loaded ${response.data.length} contract history records`);
    } else {
      // console.warn('Unexpected response format:', response.data);
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
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir') {
      setChangedFields(prev => ({
        ...prev,
        [name]: true
      }));
      
      // console.log(`Changed ${name} to:`, value);
      
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

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle currency input changes
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Fungsi validasi field dokumen dengan perbaikan sesuai permintaan
  const validateInputField = (name, value) => {
    let error = '';
    
    // PERBAIKAN: no_bpjs_kesehatan menerima alphanumeric dengan max 13 karakter
    if (name === 'no_bpjs_kesehatan' && value) {
      if (value.length > 0 && value.length !== 13) {
        error = 'BPJS Health must consist of 13 characters';
      }
    }
    
    // PERBAIKAN: no_bpjs_tk menerima alphanumeric dengan max 11 karakter
    if (name === 'no_bpjs_tk' && value) {
      if (value.length > 0 && value.length !== 11) {
        error = 'BPJS Social Security must be maximum 11 characters';
      }
    }
    
    // no_ktp harus angka saja dengan max 16 digit
    if (name === 'no_ktp' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'KTP Number must be maximum 16 digits';
      } else if (!/^\d*$/.test(value)) {
        error = 'KTP Number must contain only numbers';
      }
    }
    
    // no_kk harus angka saja dengan max 16 digit
    if (name === 'no_kk' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'Family Card must be maximum 16 digits';
      } else if (!/^\d*$/.test(value)) {
        error = 'Family Card must contain only numbers';
      }
    }
    
    // npwp harus angka saja dengan 15-16 digit
    if (name === 'npwp' && value) {
      if (value.length > 0 && value.length !== 15 && value.length !== 16) {
        error = 'NPWP Number must be 15–16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'NPWP Number must contain only numbers';
      }
    }
    
    return error;
  };

  // Handle input change dengan validasi yang diperbaiki
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir') {
      setChangedFields(prev => ({
        ...prev,
        [name]: true
      }));
      
      // console.log(`Changed ${name} to:`, value);
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (value && value.includes('/') && !isValidDDMMYYYY(value)) {
        setErrors(prev => ({
          ...prev,
          [name]: `Format tanggal tidak valid. Gunakan format DD/MM/YYYY`
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    } 
    // Validasi khusus untuk field dengan batasan karakter
    else if (['no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk'].includes(name)) {
      const maxLengths = {
        'no_bpjs_kesehatan': 13,
        'no_bpjs_tk': 11,
        'no_ktp': 16,
        'no_kk': 16,
        'npwp': 16
      };
      
      // Hanya lanjutkan jika belum melebihi panjang maksimum
      if (maxLengths[name] && value.length > maxLengths[name]) return;
      
      // PERBAIKAN: Untuk no_ktp, no_kk, npwp hanya izinkan angka
      // Untuk no_bpjs_kesehatan dan no_bpjs_tk izinkan alphanumeric
      if (['no_ktp', 'no_kk', 'npwp'].includes(name) && 
          value !== '' && 
          !/^\d*$/.test(value)) {
        return;
      }
      
      // Update formData
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Validasi field dan update errors
      const error = validateInputField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    else {
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

  const numericFields = [
    'gapok', 'ot', 'thp', 't_transport', 't_lapangan'
  ];
  
  // Handle file changes
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // console.log(`File dipilih untuk ${type}:`, {
      //   name: file.name, 
      //   size: file.size,
      //   type: file.type,
      //   lastModified: file.lastModified
      // });
      
      // Validasi ukuran file
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          [type]: 'File terlalu besar, maksimal 5MB' 
        }));
        return;
      }
      
      // Validasi tipe file
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
          [type]: 'Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.' 
        }));
        return;
      }
      
      setFiles(prev => {
        const newFiles = { ...prev };
        newFiles[type] = file;
        return newFiles;
      });
      
      setFileNames(prev => ({ 
        ...prev, 
        [type]: file.name 
      }));
      
      if (errors[type]) {
        setErrors(prev => ({ ...prev, [type]: null }));
      }
      
      // console.log(`File ${type} berhasil disimpan ke state:`, file.name);
    }
  };

  // Fungsi untuk mengubah nilai menjadi null jika kosong (untuk field numeric)
  const prepareNumericData = (data) => {
    const preparedData = { ...data };
    
    numericFields.forEach(field => {
      if (preparedData[field] === '' || preparedData[field] === undefined) {
        preparedData[field] = null;
      } else if (preparedData[field] !== null) {
        preparedData[field] = Number(preparedData[field]);
      }
    });
    return preparedData;
  };

  // Validate form dengan perbaikan validasi tanggal kontrak_akhir
  const validateForm = () => {
    try {
      const newErrors = {};
      
      const currentRequiredFields = getRequiredFields();
    
    currentRequiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });

    const dateFields = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir'];
    dateFields.forEach(field => {
      if (formData[field] && typeof formData[field] === 'string') {
        if (formData[field].includes('/')) {
          if (!isValidDDMMYYYY(formData[field])) {
            newErrors[field] = `Invalid ${field.replace(/_/g, ' ')} format (DD/MM/YYYY)`;
          }
        }
      }
    });

    // PERBAIKAN: Validasi kontrak hanya jika kedua field ada
    if (formData.kontrak_awal && formData.kontrak_akhir) {
      try {
        let startDateStr, endDateStr;
        
        if (formData.kontrak_awal.includes('/')) {
          const [day, month, year] = formData.kontrak_awal.split('/');
          startDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          startDateStr = formData.kontrak_awal;
        }
        
        if (formData.kontrak_akhir.includes('/')) {
          const [day, month, year] = formData.kontrak_akhir.split('/');
          endDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          endDateStr = formData.kontrak_akhir;
        }
        
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // Hanya validasi: tanggal akhir harus setelah tanggal mulai
        if (endDate <= startDate) {
          newErrors.kontrak_akhir = 'End date must be after start date';
        }

        } catch (error) {
          console.error('Error validating dates:', error);
          newErrors.kontrak_akhir = 'Invalid date format';
        }
      }
      
      if (isRestoring && originalData) {
      // Hanya warning, bukan error yang menghalangi submit
      if (formData.no_kontrak && formData.no_kontrak === originalData.no_kontrak) {
        // Ubah menjadi optional warning instead of blocking error
        // console.warn('Contract number unchanged during restore');
      }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error("Error in form validation:", error);
      setMessage({
        text: `Error during validation: ${error.message}`,
        type: 'error'
      });
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
   e.preventDefault();
  // console.log("Handle submit triggered!");
  
  if (validateForm()) {
    // console.log("Form is valid, proceeding...");
    setIsSubmitting(true);
    
    try {
      let dataToSubmit = {...formData};

      // Tambahkan flag untuk file yang dihapus
      Object.keys(deletedFiles).forEach(fileType => {
        if (deletedFiles[fileType]) {
          dataToSubmit[`${fileType}_filename`] = null;
          dataToSubmit[`${fileType}_filepath`] = null;
          dataToSubmit[`${fileType}_mimetype`] = null;
          dataToSubmit[`${fileType}_filesize`] = null;
          // console.log(`Marking ${fileType} file for deletion in submit`);
        }
      });
        
        // Untuk field tanggal yang tidak berubah, gunakan data asli
        if (isEditMode) {
        // Untuk tanggal_lahir, selalu pertahankan jika tidak berubah
        if (!changedFields['tanggal_lahir'] && originalData['tanggal_lahir']) {
          dataToSubmit['tanggal_lahir'] = originalData['tanggal_lahir'];
          // console.log(`Using original tanggal_lahir value:`, originalData['tanggal_lahir']);
        }
        
        // Untuk kontrak fields, izinkan pengosongan jika dalam mode restore
        if (isRestoring) {
          // Dalam mode restore, izinkan field kontrak dikosongkan atau diubah bebas
          // console.log('Restore mode: allowing contract fields to be modified freely');
        } else {
          // Mode edit biasa, pertahankan nilai asli jika tidak berubah
          const contractFields = ['kontrak_awal', 'kontrak_akhir'];
          contractFields.forEach(field => {
            if (!changedFields[field] && originalData[field]) {
              dataToSubmit[field] = originalData[field];
              // console.log(`Using original ${field} value:`, originalData[field]);
            }
          });
        }
      }

        // Pastikan format tanggal benar (YYYY-MM-DD)
        const dateFields = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir'];
        dateFields.forEach(field => {
          if (dataToSubmit[field]) {
            // console.log(`Before formatting: ${field} = ${dataToSubmit[field]}`);
            dataToSubmit[field] = formatDateToYYYYMMDD(dataToSubmit[field]);
            // console.log(`After formatting: ${field} = ${dataToSubmit[field]}`);
          } else {
            // PERBAIKAN: Untuk restore mode, izinkan null untuk kontrak fields
            // tapi jangan biarkan tanggal_lahir menjadi null
            if (field === 'tanggal_lahir') {
              // Jangan biarkan tanggal_lahir hilang
              if (originalData && originalData[field]) {
                dataToSubmit[field] = formatDateToYYYYMMDD(originalData[field]);
                // console.log(`Preserving original ${field}:`, dataToSubmit[field]);
              }
            } else {
              // Untuk kontrak fields, boleh null dalam restore mode
              dataToSubmit[field] = null;
            }
          }
        });

        // Persiapkan data numerik
        dataToSubmit = prepareNumericData(dataToSubmit);

        if (!dataToSubmit.nama_lengkap_karyawan || dataToSubmit.nama_lengkap_karyawan === '') {
        throw new Error('Employee name is required');
      }
        
        // HAPUS validasi wajib untuk kontrak dalam mode restore
      if (isRestoring) {
        dataToSubmit.sebab_na = null;
        
        // HAPUS validasi tanggal akhir kontrak untuk restore
        // Sekarang tanggal bisa diisi bebas
        // console.log('Restore mode: No date restrictions applied');
      }

        // console.log('Processed form data:', dataToSubmit);
        // console.log('Restore mode:', isRestoring ? 'Yes' : 'No');

        const endpoint = isEditMode && userId 
          ? `/users/${userId}` 
          : '/users';
        
        // console.log(`Submitting form to ${endpoint} with method ${isEditMode ? 'put' : 'post'}`);

        let response;
        if (isEditMode) {
          response = await api.put(endpoint, dataToSubmit);
        } else {
          response = await api.post(endpoint, dataToSubmit);
        }
        
        // console.log('Submit response:', response);

        const userIdForFiles = isEditMode ? userId : response.data.id || response.data.data?.id;
      
        // Upload files jika ada
        if (userIdForFiles && userIdForFiles !== 'undefined' && userIdForFiles !== undefined) {
          const hasFilesToUpload = Object.values(files).some(file => file !== null);
          
          if (hasFilesToUpload) {
            try {
              await uploadFiles(userIdForFiles);
              // console.log("Files uploaded successfully");
            } catch (fileError) {
              console.error("Error uploading files:", fileError);
              setMessage({
                text: 'Data saved but there was an error uploading files',
                type: 'warning'
              });
            }
          }
        } else {
          // console.warn("Cannot upload files: Invalid userId received from server", userIdForFiles);
        }
        
        // Pesan sukses spesifik untuk mode pemulihan
        if (isRestoring) {
          setSuccessMessage('Employee has been successfully restored and reactivated');
          setMessage({
            text: 'Employee has been successfully restored to active status!',
            type: 'success'
          });
        } else {
          setSuccessMessage(isEditMode 
            ? 'Data updated successfully' 
            : 'Data added successfully');
        }
        
        if (isEditMode && userId) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchAllContractHistory(userId);
          await fetchUserData(userId);

          if (!isRestoring) {
            setMessage({
              text: 'Data saved successfully and contract history updated',
              type: 'success'
            });
          }
        } else {
          // Reset form jika mode tambah
          setFormData({
            nama_lengkap_karyawan: '',
            no_kontrak: '',
            kontrak_awal: '',
            kontrak_akhir: '',
          });
  
          setFiles({
            cv: null, ijazah: null, sertifikat: null, pkwt: null,
            no_ktp: null, no_kk: null, npwp: null, no_bpjs_kesehatan: null,
            no_bpjs_tk: null, rekening: null
          });
          
          setFileNames({
            cv: '', ijazah: '', sertifikat: '', pkwt: '',
            no_ktp: '', no_kk: '', npwp: '', no_bpjs_kesehatan: '',
            no_bpjs_tk: '', rekening: ''
          });

          setExistingFiles({
            cv: null, ijazah: null, sertifikat: null, pkwt: null,
            no_ktp: null, no_kk: null, npwp: null, no_bpjs_kesehatan: null,
            no_bpjs_tk: null, rekening: null
          });
          
          setDeletedFiles({
            cv: false, ijazah: false, sertifikat: false, pkwt: false,
            no_ktp: false, no_kk: false, npwp: false, no_bpjs_kesehatan: false,
            no_bpjs_tk: false, rekening: false
          });

          // Reset file input elements
          const fileInputs = [
            fileInputRefCV, fileInputRefIjazah, fileInputRefSertifikat, fileInputRefPKWT,
            fileInputRefKTP, fileInputRefKK, fileInputRefNPWP, fileInputRefBPJSKes,
            fileInputRefBPJSTK, fileInputRefRekening
          ];
          
          fileInputs.forEach(ref => {
            if (ref.current) ref.current.value = '';
          });
        }
        
        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
  
        if (error.response) {
          // console.log('Error response:', error.response.status, error.response.data);
          setErrorMessage(error.response.data?.message || `Error occurred (${error.response.status}): ${error.response.statusText}`);
        } else if (error.request) {
          // console.log('Error request:', error.request);
          setErrorMessage('No response from server. Check your network connection.');
        } else {
          // console.log('Error message:', error.message);
          setErrorMessage('An error occurred: ' + error.message);
        }
        
        setMessage({
          text: 'Failed to save data. ' + error.message,
          type: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Upload files
  const uploadFiles = async (userId) => {
    if (!userId || userId === 'undefined' || userId === undefined) {
      throw new Error('Invalid user ID for file upload');
    }

    // console.log(`Memulai upload file untuk user ID: ${userId}`);
    // console.log("File yang akan diupload:", Object.keys(files).filter(type => files[type]));
    
    const validFiles = Object.keys(files).filter(type => 
      files[type] && files[type].size > 0
    );
    
    if (validFiles.length === 0) {
      // console.log("Tidak ada file valid yang tersedia untuk diunggah");
      return { success: true, message: "Tidak ada file untuk diupload" };
    }
    
    // console.log(`Ada ${validFiles.length} file valid yang akan diupload`);
    
    const uploadResults = [];
    
    // Proses upload satu per satu
    for (const type of validFiles) {
      try {
        const formData = new FormData();
        formData.append('file', files[type]);
        
        // console.log(`Uploading file ${type} for user ${userId}`);
        
        const response = await api.post(
          `/users/${userId}/upload/${type}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          }
        );
        
        // console.log(`Upload success for ${type}:`, response.data);
        uploadResults.push({
          type,
          success: true,
          data: response.data
        });
      } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        uploadResults.push({
          type,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: uploadResults.some(r => r.success),
      results: uploadResults
    };
  };

  // Fungsi untuk mengunduh file
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

  // Fungsi untuk menghapus file
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
          
          // Reset file input berdasarkan tipe
          const fileInputRefs = {
            cv: fileInputRefCV,
            ijazah: fileInputRefIjazah,
            sertifikat: fileInputRefSertifikat,
            pkwt: fileInputRefPKWT,
            no_ktp: fileInputRefKTP,
            no_kk: fileInputRefKK,
            npwp: fileInputRefNPWP,
            no_bpjs_kesehatan: fileInputRefBPJSKes,
            no_bpjs_tk: fileInputRefBPJSTK,
            rekening: fileInputRefRekening
          };
          
          if (fileInputRefs[type] && fileInputRefs[type].current) {
            fileInputRefs[type].current.value = '';
          }
          
          setMessage({
            text: `${type} file deleted successfully`,
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
          cv: fileInputRefCV,
          ijazah: fileInputRefIjazah,
          sertifikat: fileInputRefSertifikat,
          pkwt: fileInputRefPKWT,
          no_ktp: fileInputRefKTP,
          no_kk: fileInputRefKK,
          npwp: fileInputRefNPWP,
          no_bpjs_kesehatan: fileInputRefBPJSKes,
          no_bpjs_tk: fileInputRefBPJSTK,
          rekening: fileInputRefRekening
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
        text: `Error occurred when deleting file on server. File will be deleted when saving.`,
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
    link.setAttribute('download', `contract-history-${formData.nama_lengkap_karyawan}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleApiError = (error) => {
    if (error.response) {
      // console.log('Error response:', error.response.status, error.response.data);
      setErrorMessage(error.response.data?.message || 'Error occurred while retrieving data');
    } else if (error.request) {
      // console.log('Error request:', error.request);
      setErrorMessage('No response from server');
    } else {
      // console.log('Error message:', error.message);
      setErrorMessage('Error occurred: ' + error.message);
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
            <p className="text-gray-500">No contract change history available</p>
            <p className="text-gray-400 text-sm mt-1">History will appear when you change contract data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Contract No</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Start Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old End Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Contract No</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Start Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New End Date</th>
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

  useEffect(() => {
    if (submitted) {
      setTimeout(() => {
        navigate('/umran-edit', {
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
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Personal Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_lengkap_karyawan">
              Employee Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_lengkap_karyawan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="nama_lengkap_karyawan"
              name="nama_lengkap_karyawan"
              placeholder="Enter full name"
              value={formData.nama_lengkap_karyawan || ''}
              onChange={handleChange}
            />
            {errors.nama_lengkap_karyawan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_lengkap_karyawan}</p>}
          </div>

          {/* Birth Date */}
          <div>
            <label
              className={`block text-gray-700 text-sm font-bold mb-2 ${
                isEditMode ? 'text-blue-700' : ''
              }`}
              htmlFor="tanggal_lahir"
            >
              Birth Date
              {isEditMode && (
                <span className="text-blue-500 text-xs ml-1">(Changes will be recorded in history)</span>
              )}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border ${
                  errors.tanggal_lahir
                    ? 'border-red-500'
                    : isEditMode
                    ? 'border-blue-200'
                    : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="tanggal_lahir"
                name="tanggal_lahir"
                placeholder="DD/MM/YYYY"
                value={formData.tanggal_lahir ? formatDateToDDMMYYYY(formData.tanggal_lahir) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value || /^(\d{0,2}\/)?(\d{0,2}\/)?(\d{0,4})$/.test(value)) {
                    handleChange({
                      target: {
                        name: 'tanggal_lahir',
                        value: value
                      }
                    });
                    setChangedFields((prev) => ({
                      ...prev,
                      tanggal_lahir: true
                    }));
                  }
                }}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
            </div>
            {errors.tanggal_lahir && (
              <p className="text-red-500 text-xs italic mt-1">{errors.tanggal_lahir}</p>
            )}
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status_pernikahan">
              Marital Status
            </label>
            <select
              className={`shadow appearance-none border ${errors.status_pernikahan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="status_pernikahan"
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

          {/* Domicile Address */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_domisili">
              Domicile Address
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.alamat_domisili ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="alamat_domisili"
              name="alamat_domisili"
              rows="3"
              placeholder="Enter domicile address"
              value={formData.alamat_domisili || ''}
              onChange={handleChange}
            ></textarea>
            {errors.alamat_domisili && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_domisili}</p>}
          </div>

          {/* ID Card Address */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_ktp">
              KTP Address
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.alamat_ktp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="alamat_ktp"
              name="alamat_ktp"
              rows="3"
              placeholder="Enter ID card address"
              value={formData.alamat_ktp || ''}
              onChange={handleChange}
            ></textarea>
            {errors.alamat_ktp && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_ktp}</p>}
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
          {/* Position */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jabatan">
              Position
            </label>
            <input
              className={`shadow appearance-none border ${errors.jabatan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="jabatan"
              name="jabatan"
              placeholder="Enter position"
              value={formData.jabatan || ''}
              onChange={handleChange}
            />
            {errors.jabatan && <p className="text-red-500 text-xs italic mt-1">{errors.jabatan}</p>}
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nik_tar">
              TAR ID
            </label>
            <input
              className={`shadow appearance-none border ${errors.nik_tar ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="nik_tar"
              name="nik_tar"
              placeholder="Enter TAR ID"
              value={formData.nik_tar || ''}
              onChange={handleNumberChange}
            />
            {errors.nik_tar && <p className="text-red-500 text-xs italic mt-1">{errors.nik_tar}</p>}
          </div>

          {/* Contract Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_kontrak">
              Contract Number {isEditMode && <span className="text-blue-500 text-xs">(Changes will be recorded in history)</span>}
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_kontrak ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="no_kontrak"
              name="no_kontrak"
              placeholder="Enter Contract Number"
              value={formData.no_kontrak || ''}
              onChange={handleChange}
            />
            {errors.no_kontrak && <p className="text-red-500 text-xs italic mt-1">{errors.no_kontrak}</p>}
          </div>

          {/* Contract Start Date */}
          <div>
            <label className={`block text-gray-700 text-sm font-bold mb-2 ${isEditMode ? 'text-blue-700' : ''}`} htmlFor="kontrak_awal">
              Contract Start Date <span className="text-red-500">*</span>
              {isEditMode && <span className="text-blue-500 text-xs ml-1">(Changes will be recorded in history)</span>}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border ${errors.kontrak_awal ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="kontrak_awal"
                name="kontrak_awal"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_awal ? formatDateToDDMMYYYY(formData.kontrak_awal) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value || /^(\d{0,2}\/)?(\d{0,2}\/)?(\d{0,4})$/.test(value)) {
                    handleChange({
                      target: {
                        name: 'kontrak_awal',
                        value: value
                      }
                    });
                    setChangedFields(prev => ({
                      ...prev,
                      kontrak_awal: true
                    }));
                  }
                }}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
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
                id="kontrak_akhir"
                name="kontrak_akhir"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_akhir ? formatDateToDDMMYYYY(formData.kontrak_akhir) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value || /^(\d{0,2}\/)?(\d{0,2}\/)?(\d{0,4})$/.test(value)) {
                    handleChange({
                      target: {
                        name: 'kontrak_akhir',
                        value: value
                      }
                    });
                    setChangedFields(prev => ({
                      ...prev,
                      kontrak_akhir: true
                    }));
                  }
                }}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
            </div>
            {errors.kontrak_akhir && <p className="text-red-500 text-xs italic mt-1">{errors.kontrak_akhir}</p>}
          </div>

          {/* Form Submission Email */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email_pengiriman_form">
              Form Submission Email
            </label>
            <input
              className={`shadow appearance-none border ${errors.email_pengiriman_form ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="email"
              id="email_pengiriman_form"
              name="email_pengiriman_form"
              placeholder="email@example.com"
              value={formData.email_pengiriman_form || ''}
              onChange={handleChange}
            />
            {errors.email_pengiriman_form && <p className="text-red-500 text-xs italic mt-1">{errors.email_pengiriman_form}</p>}
          </div>

          {/* Active Email */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email_aktif">
              Active Email
            </label>
            <input
              className={`shadow appearance-none border ${errors.email_aktif ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="email"
              id="email_aktif"
              name="email_aktif"
              placeholder="email@example.com"
              value={formData.email_aktif || ''}
              onChange={handleChange}
            />
            {errors.email_aktif && <p className="text-red-500 text-xs italic mt-1">{errors.email_aktif}</p>}
          </div>

          {/* Phone/WhatsApp Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_hp_wa_aktif">
              Phone/WhatsApp Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_hp_wa_aktif ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="no_hp_wa_aktif"
              name="no_hp_wa_aktif"
              placeholder="08xxxxxxxxxx"
              value={formData.no_hp_wa_aktif || ''}
              onChange={handleNumberChange}
            />
            {errors.no_hp_wa_aktif && <p className="text-red-500 text-xs italic mt-1">{errors.no_hp_wa_aktif}</p>}
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="kontak_darurat">
              Emergency Contact
            </label>
            <input
              className={`shadow appearance-none border ${errors.kontak_darurat ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="kontak_darurat"
              name="kontak_darurat"
              placeholder="08xxxxxxxxxx"
              value={formData.kontak_darurat || ''}
              onChange={handleNumberChange}
            />
            {errors.kontak_darurat && <p className="text-red-500 text-xs italic mt-1">{errors.kontak_darurat}</p>}
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_kontak_darurat">
              Emergency Contact Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_kontak_darurat ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="nama_kontak_darurat"
              name="nama_kontak_darurat"
              placeholder="Enter emergency contact name"
              value={formData.nama_kontak_darurat || ''}
              onChange={handleChange}
            />
            {errors.nama_kontak_darurat && <p className="text-red-500 text-xs italic mt-1">{errors.nama_kontak_darurat}</p>}
          </div>

          {/* Mother's Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_ibu_kandung">
              Mother's Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_ibu_kandung ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="nama_ibu_kandung"
              name="nama_ibu_kandung"
              placeholder="Enter mother's name"
              value={formData.nama_ibu_kandung || ''}
              onChange={handleChange}
            />
            {errors.nama_ibu_kandung && <p className="text-red-500 text-xs italic mt-1">{errors.nama_ibu_kandung}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Render education data section
  const renderEducationDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Education & Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Education Level and Major */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pendidikan_terakhir_jurusan">
              Education & Major
            </label>
            <input
              className={`shadow appearance-none border ${errors.pendidikan_terakhir_jurusan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="pendidikan_terakhir_jurusan"
              name="pendidikan_terakhir_jurusan"
              placeholder="Example: Bachelor of Computer Science"
              value={formData.pendidikan_terakhir_jurusan || ''}
              onChange={handleChange}
            />
            {errors.pendidikan_terakhir_jurusan && <p className="text-red-500 text-xs italic mt-1">{errors.pendidikan_terakhir_jurusan}</p>}
          </div>

          {/* Educational Institution Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_instansi_pendidikan">
              Educational Institution
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_instansi_pendidikan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="nama_instansi_pendidikan"
              name="nama_instansi_pendidikan"
              placeholder="Enter Institution Name"
              value={formData.nama_instansi_pendidikan || ''}
              onChange={handleChange}
            />
            {errors.nama_instansi_pendidikan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_instansi_pendidikan}</p>}
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

          {/* Tombol Manage Certificates */}
          {userId && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Certificates
              </label>
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
        
        {/* File Upload Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

        </div>
      </div>
    );
  };

  // Render administrative data section (6 field baru dengan upload)
  const renderAdministrativeDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Administrative Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ID Card Number */}
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
                  placeholder="Enter KTP Number"
                  value={formData.no_ktp || ''}
                  onChange={handleInputChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefKTP}
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

          {/* Family Card Number */}
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
                    ref={fileInputRefKK}
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

          {/* Tax ID Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="npwp">
              NPWP Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.npwp ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="npwp"
                  placeholder="Enter NPWP Number"
                  value={formData.npwp || ''}
                  onChange={handleInputChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefNPWP}
                    type="file"
                    name="npwp"
                    onChange={(e) => handleFileChange(e, 'npwp')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.npwp && <p className="text-red-500 text-xs italic mt-1">{errors.npwp}</p>}
              <small className="text-gray-500 mt-1">Must be 15-16 digits.</small>
              {fileNames.npwp && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.npwp}</p>}
              {existingFiles.npwp && !files.npwp && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.npwp.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('npwp')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('npwp')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Insurance Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_bpjs_kesehatan">
              BPJS Health
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_bpjs_kesehatan ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_bpjs_kesehatan"
                  placeholder="Enter BPJS Health"
                  value={formData.no_bpjs_kesehatan || ''}
                  onChange={handleInputChange}
                  maxLength={13}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefBPJSKes}
                    type="file"
                    name="no_bpjs_kesehatan"
                    onChange={(e) => handleFileChange(e, 'no_bpjs_kesehatan')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_bpjs_kesehatan && <p className="text-red-500 text-xs italic mt-1">{errors.no_bpjs_kesehatan}</p>}
              <small className="text-gray-500 mt-1">Maximum 13 characters (alphanumeric).</small>
              {fileNames.no_bpjs_kesehatan && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.no_bpjs_kesehatan}</p>}
              {existingFiles.no_bpjs_kesehatan && !files.no_bpjs_kesehatan && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.no_bpjs_kesehatan.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('no_bpjs_kesehatan')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('no_bpjs_kesehatan')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employment Insurance Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_bpjs_tk">
              BPJS Social Security
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_bpjs_tk ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_bpjs_tk"
                  placeholder="Enter BPJS Social Security Number"
                  value={formData.no_bpjs_tk || ''}
                  onChange={handleInputChange}
                  maxLength={11}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefBPJSTK}
                    type="file"
                    name="no_bpjs_tk"
                    onChange={(e) => handleFileChange(e, 'no_bpjs_tk')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_bpjs_tk && <p className="text-red-500 text-xs italic mt-1">{errors.no_bpjs_tk}</p>}
              <small className="text-gray-500 mt-1">Maximum 11 characters (alphanumeric).</small>
              {fileNames.no_bpjs_tk && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.no_bpjs_tk}</p>}
              {existingFiles.no_bpjs_tk && !files.no_bpjs_tk && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.no_bpjs_tk.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('no_bpjs_tk')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('no_bpjs_tk')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asuransi Lainnya */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="asuransi_lainnya">
            Other Insurance
            </label>
            <input
              className={`shadow appearance-none border ${errors.asuransi_lainnya ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="asuransi_lainnya"
              placeholder="Enter other Insurance"
              value={formData.asuransi_lainnya || ''}
              onChange={handleChange}
            />
            {errors.asuransi_lainnya && <p className="text-red-500 text-xs italic mt-1">{errors.asuransi_lainnya}</p>}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rekening">
              Account Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.rekening ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="rekening"
                  placeholder="Enter Account Number"
                  value={formData.rekening || ''}
                  onChange={handleNumberChange}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefRekening}
                    type="file"
                    name="rekening"
                    onChange={(e) => handleFileChange(e, 'rekening')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.rekening && <p className="text-red-500 text-xs italic mt-1">{errors.rekening}</p>}
              {fileNames.rekening && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.rekening}</p>}
              {existingFiles.rekening && !files.rekening && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.rekening.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('rekening')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('rekening')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BPJS Status */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status_bpjs">
              BPJS Health Status
            </label>
            <input
              className={`shadow appearance-none border ${errors.status_bpjs ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="status_bpjs"
              name="status_bpjs"
              placeholder="Example: Active"
              value={formData.status_bpjs || ''}
              onChange={handleChange}
            />
            {errors.status_bpjs && <p className="text-red-500 text-xs italic mt-1">{errors.status_bpjs}</p>}
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_pemilik_rekening">
              Bank Account Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_pemilik_rekening ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              id="nama_pemilik_rekening"
              name="nama_pemilik_rekening"
              placeholder="Enter Bank Account Name"
              value={formData.nama_pemilik_rekening || ''}
              onChange={handleChange}
            />
            {errors.nama_pemilik_rekening && <p className="text-red-500 text-xs italic mt-1">{errors.nama_pemilik_rekening}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Render financial data section
  const renderFinancialDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Financial Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Base Salary */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gapok">
              Base Salary
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.gapok ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="gapok"
                name="gapok"
                placeholder="0.00"
                value={formData.gapok || ''}
                onChange={handleNumberChange}
              />
            </div>
            {errors.gapok && <p className="text-red-500 text-xs italic mt-1">{errors.gapok}</p>}
            <p className="text-gray-400 text-xs mt-1">Format: numbers without thousand separators (e.g. 5000000.00)</p>
          </div>

          {/* Overtime */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ot">
              OT
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.ot ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="ot"
                name="ot"
                placeholder="0.00"
                value={formData.ot || ''}
                onChange={handleNumberChange}
              />
            </div>
            {errors.ot && <p className="text-red-500 text-xs italic mt-1">{errors.ot}</p>}
          </div>

          {/* Total Salary */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="thp">
              THP
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.thp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="thp"
                name="thp"
                placeholder="0.00"
                value={formData.thp || ''}
                onChange={handleNumberChange}
              />
            </div>
            {errors.thp && <p className="text-red-500 text-xs italic mt-1">{errors.thp}</p>}
          </div>

          {/* Transportation Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_transport">
            Transportation Allowance
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.t_transport ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="t_transport"
                name="t_transport"
                placeholder="0.00"
                value={formData.t_transport || ''}
                onChange={handleNumberChange}
              />
            </div>
            {errors.t_transport && <p className="text-red-500 text-xs italic mt-1">{errors.t_transport}</p>}
          </div>

          {/* Field Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_lapangan">
              Field Allowance
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.t_lapangan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                id="t_lapangan"
                name="t_lapangan"
                placeholder="0.00"
                value={formData.t_lapangan || ''}
                onChange={handleNumberChange}
              />
            </div>
            {errors.t_lapangan && <p className="text-red-500 text-xs italic mt-1">{errors.t_lapangan}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='bg-(--background-tar-color)'> 
      <div className="flex">
        <div className='h-screen fixed left-0 top-0'>
          {/* Sidebar = Aside*/}
          <AsideComponents />
        </div>
    
        {/* Main Content (Header, Main, Footer) */}
        <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
          {/* Header */}
          <div className='w-fill h-hug py-3'>
            <HeaderComponents />
          </div>

          {/* Main Content */}
          <main className="flex-1 bg-(--background-tar-color) space-y-6">
            <div className='flex flex-col bg-white p-6 shadow-md rounded gap-4'>
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                  {isEditMode 
                    ? isRestoreMode 
                      ? 'Employee Data Restoration Form' 
                      : 'Edit Employee Data Form'
                    : 'Add Employee Data Form'
                  }
                </h2>
                
                {/* Show messages */}
                {message.text && (
                  <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                    <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
                  </div>
                )}

                {/* Display special banner for restoration mode */}
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
                          <p className="font-bold">To reactivate the employee, you MUST:</p>
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

                {/* Display sebab_na in read-only mode if in edit mode and not restoration mode */}
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
                
                {/* Show submission confirmation */}
                {submitted ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Success!</strong>
                    <p className="block sm:inline"> Form has been {isEditMode ? 'updated' : 'submitted'} successfully. Redirecting to employee list page...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Show restoration message */}
                    {isRestoreMode && (
                      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4">
                        <strong className="font-bold">Attention!</strong>
                        <p className="block sm:inline"> 
                          You are restoring inactive employee data. To restore, ensure the contract end date is in the future.
                        </p>
                      </div>
                    )}
                    
                    {/* Data Sections */}
                    {renderPersonalDataSection()}
                    {renderEmploymentDataSection()}
                    {renderEducationDataSection()}
                    {renderAdministrativeDataSection()}
                    {renderFinancialDataSection()}
                    
                    {/* Submit Button */}
                    <div className="flex flex-row gap-x-10 items-center justify-center">
                      <button
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        type="submit"
                        disabled={isSubmitting}
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} className='w-4 h-4 mr-2' /> 
                        {isSubmitting ? 'Submitting...' : isEditMode ? (isRestoring ? 'Reactivate' : 'Save Changes') : 'Save Data'}
                      </button>
                      <button 
                        type="button" 
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => navigate('/umran-edit')}
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            {/* Contract History Section */}
            {isEditMode && renderContractHistorySection()}
          </main>

          {/* Modal untuk mengelola sertifikat */}
          {showSertifikatModal && (
            <SertifikatModal
              isOpen={showSertifikatModal}
              onClose={() => setShowSertifikatModal(false)}
              userId={userId}
              userName={formData.nama_lengkap_karyawan}
              viewOnly={false}
              apiPrefix="umran" // Set apiPrefix untuk umran
            />
          )}
          
          {/* Footer*/}
          <FooterComponents/>
        </div>
      </div>
    </div>
  )
};

export default TambahUserUmran;