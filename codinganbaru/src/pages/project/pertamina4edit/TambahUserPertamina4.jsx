import React, { useState, useRef, useEffect } from 'react';
import AsideComponents from '../../../components/AsideComponents';
import FooterComponents from '../../../components/FooterComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import SertifikatModal from '../../../components/SerfikatModal';
import '../../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-regular-svg-icons';
import { faDownload, faHistory, faFileAlt, faUpload } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Fungsi bantuan untuk memvalidasi format tanggal DD/MM/YYYY
const isValidDDMMYYYY = (dateString) => {
  // Periksa apakah string kosong
  if (!dateString) return false;
  
  try {
    // Periksa format dasar dengan regex
    if (!dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return false;
    
    // Pecah menjadi komponen
    const [day, month, year] = dateString.split('/').map(Number);
    
    // Validasi dasar
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false; // Batasan reasonable untuk tahun
    
    // Validasi jumlah hari dalam bulan (termasuk tahun kabisat)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Periksa untuk bulan Februari di tahun kabisat
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
    // Jika sudah dalam format YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Jika dalam format DD/MM/YYYY
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Jika dengan timestamp, ambil hanya bagian tanggal
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Log warning dan kembalikan string asli jika format tidak dikenali
    return dateString;
  } catch (error) {
    console.error('Error saat konversi format tanggal:', error);
    return '';
  }
};

// Fungsi untuk format date dalam DD/MM/YYYY untuk tampilan
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
    
    // Log warning jika format tidak dikenali
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const api = axios.create({
  baseURL: 'http://localhost:3005/api/regional4'
});

api.interceptors.request.use(
  (config) => {
    // Jika data berisi tanggal, pastikan format benar
    if (config.data) {
      const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
      
      dateFields.forEach(field => {
        if (config.data[field] && typeof config.data[field] === 'string') {
          // Konversi ke YYYY-MM-DD untuk database
          config.data[field] = formatDateToYYYYMMDD(config.data[field]);
        }
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Fungsi untuk sanitasi tanggal dari berbagai input
const sanitizeDate = (dateInput) => {
  if (!dateInput) return null;
    
  try {
    // Jika sudah dalam bentuk Date object
    if (dateInput instanceof Date) {
      // Cek apakah Date valid
      if (isNaN(dateInput.getTime())) {
        console.error('Invalid Date object');
        return null;
      }
      
      // Format ke YYYY-MM-DD
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Jika dalam bentuk string
    if (typeof dateInput === 'string') {
      // Format DD/MM/YYYY
      if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateInput.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Format YYYY-MM-DD
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateInput;
      }
      
      // Format dengan timestamp (ISO)
      if (dateInput.includes('T')) {
        return dateInput.split('T')[0];
      }
      
      // Coba parse berbagai format dengan pendekatan failsafe
      const possibleFormats = [
        // 31/12/2023
        (str) => {
          const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (match) {
            const [_, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return null;
        },
        // 31-12-2023
        (str) => {
          const match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
          if (match) {
            const [_, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return null;
        },
        // 2023/12/31
        (str) => {
          const match = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
          if (match) {
            const [_, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return null;
        }
      ];
      
      // Coba semua format yang mungkin
      for (const formatFn of possibleFormats) {
        const result = formatFn(dateInput);
        if (result) return result;
      }
      
      // Jika tidak ada format yang cocok, coba dengan Date
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      console.error(`Cannot recognize date format: ${dateInput}`);
      return null;
    }
    
    // If data type not supported
    console.error(`Date data type not supported: ${typeof dateInput}`);
    return null;
  } catch (error) {
    console.error(`Error while sanitizing date: ${error.message}`, error);
    return null;
  }
};

// Fungsi untuk memastikan tanggal selalu valid di form
const ensureValidDate = (formData, fieldName) => {
  try {
    if (!formData[fieldName]) return formData;
    
    const sanitized = sanitizeDate(formData[fieldName]);
    
    // Jika sanitas gagal, kembalikan format asli untuk ditangani oleh validator form
    if (sanitized === null) return formData;
    
    // Gunakan spread operator untuk tidak memodifikasi objek asli
    return {
      ...formData,
      [fieldName]: sanitized
    };
  } catch (error) {
    console.error(`Error while ensuring valid date: ${error.message}`, error);
    return formData; // Kembalikan formData asli jika terjadi error
  }
};

const TambahUserPertamina4 = () => {
  const [formData, setFormData] = useState({
    nama_karyawan: '', nik_pep_reg4: '', nik_tar: '', jabatan: '', no_kontrak: '', kontrak_awal: '', kontrak_akhir: '', tanggal_lahir: '', alamat_domisili: '',
    nomor_hp: '', nama_kontak_emergency: '', no_telp_kontak_emergency: '', hubungan_kontak_emergency: '', nik: '', no_kk: '', nama_pasangan: '', nama_anak_ke_1: '', nama_anak_ke_2: '',
    status_nikah: '', bpjs_kesehatan: '', bpjs_ketenagakerjaan: '', asuransi_lainnya: '', npwp: '', alamat_email: '', pendidikan_terakhir: '', universitas: '', jurusan: '', ukuran_sepatu: '',
    ukuran_coveroll: '', nomor_rekening: '', nama_pemilik: '', bank: '', cv: ''
  });

  const [showSertifikatModal, setShowSertifikatModal] = useState(false);
  
   // State untuk file uploads
  const [files, setFiles] = useState({
  cv: null, ijazah: null, sertifikat: null, pkwt: null, 
  nik: null, no_kk: null, npwp: null, bpjs_kesehatan: null, 
  bpjs_ketenagakerjaan: null, nomor_rekening: null
});

// Update file names state
const [fileNames, setFileNames] = useState({
  cv: '', ijazah: '', sertifikat: '', pkwt: '', 
  nik: '', no_kk: '', npwp: '', bpjs_kesehatan: '', 
  bpjs_ketenagakerjaan: '', nomor_rekening: ''
});

// Update existing files state
const [existingFiles, setExistingFiles] = useState({
  cv: null, ijazah: null, sertifikat: null, pkwt: null, 
  nik: null, no_kk: null, npwp: null, bpjs_kesehatan: null, 
  bpjs_ketenagakerjaan: null, nomor_rekening: null
});

// Update deleted files state
const [deletedFiles, setDeletedFiles] = useState({
  cv: false, ijazah: false, sertifikat: false, pkwt: false, 
  nik: false, no_kk: false, npwp: false, bpjs_kesehatan: false, 
  bpjs_ketenagakerjaan: false, nomor_rekening: false
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
  
  // Gunakan satu state untuk history dan loading
  const [sortedHistory, setSortedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRefCV = useRef(null);
  const fileInputRefIjazah = useRef(null);
  const fileInputRefSertifikat = useRef(null);
  const fileInputRefPKWT = useRef(null);

  // Tambahkan ref untuk file input
  const fileInputRefNIK = useRef(null);
  const fileInputRefKK = useRef(null);
  const fileInputRefNPWP = useRef(null);
  const fileInputRefBPJSKes = useRef(null);
  const fileInputRefBPJSKT = useRef(null);
  const fileInputRefRekening = useRef(null);


  // State for marital status options
  const statusPerkawinanOptions = [
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

  
  // State for education options
  const pendidikanOptions = [
    { value: '', label: 'Select Education' },
    { value: 'SD', label: 'SD' },
    { value: 'SMP', label: 'SMP' },
    { value: 'SMA/SMK', label: 'SMA/SMK' },
    { value: 'D1', label: 'D1' },
    { value: 'D2', label: 'D2' },
    { value: 'D3', label: 'D3' },
    { value: 'D4', label: 'D4' },
    { value: 'S1', label: 'S1' },
    { value: 'S2', label: 'S2' },
    { value: 'S3', label: 'S3' }
  ];

  // Fields required for form submission
  const requiredFields = [
    'nama_karyawan',
    'kontrak_awal',
    'kontrak_akhir'
  ];

  // Fungsi untuk mendapatkan hari ini dalam format YYYY-MM-DD
  const getTodayYYYYMMDD = () => {
    try {
      // Buat tanggal sekarang
      const now = new Date();
      
      // Konversi ke string ISO
      const isoString = now.toISOString();
      
      // Ambil tanggal saja (YYYY-MM-DD)
      return isoString.split('T')[0];
    } catch (error) {
      // Fallback manual jika terjadi error
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
      
      // Simpan data asli
      setOriginalData({
        tanggal_lahir: userToEdit.tanggal_lahir,
        kontrak_awal: userToEdit.kontrak_awal,
        kontrak_akhir: userToEdit.kontrak_akhir
      });
      
      // Extract date only (no timestamp) for display in form
      const getDateString = (dateString) => {
        if (!dateString) return '';
        
        // Jika sudah dalam format YYYY-MM-DD, gunakan langsung
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        
        // Jika format lain (misalnya dengan timestamp), ambil hanya bagian tanggalnya
        if (dateString.includes('T')) {
          return dateString.split('T')[0];
        }
        
        // Jika format lain, coba ekstrak dengan cara aman
        try {
          // Kita split di sini dan ambil nilai asli saja, tanpa konversi
          return dateString.substring(0, 10);
        } catch (e) {
          console.error('Error extracting date:', e);
          return '';
        }
      };
      
      // Set form data from userToEdit
      setFormData({
        ...userToEdit,
        // Gunakan fungsi getDateString yang lebih aman
        tanggal_lahir: getDateString(userToEdit.tanggal_lahir),
        kontrak_awal: getDateString(userToEdit.kontrak_awal),
        kontrak_akhir: getDateString(userToEdit.kontrak_akhir),
        awal_mcu: getDateString(userToEdit.awal_mcu),
        akhir_mcu: getDateString(userToEdit.akhir_mcu),
        awal_hsepassport: getDateString(userToEdit.awal_hsepassport),
        akhir_hsepassport: getDateString(userToEdit.akhir_hsepassport),
        awal_siml: getDateString(userToEdit.awal_siml),
        akhir_siml: getDateString(userToEdit.akhir_siml)
      });
    }
  }, [isEditMode, userToEdit]);

  // Effect kedua untuk menangani data dari URL atau location state
  useEffect(() => {
    // Ambil data dari location.state jika ada
    if (location.state?.userData?.id) {
      setUserId(location.state.userData.id);
      setFormData(location.state.userData);
    } 
    // Jika tidak ada, coba ambil dari URL parameter
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
        
        // Tambahkan pesan informasi
        setMessage({
          text: location.state.message || 'To reactivate the employee, update the contract and contract number',
          type: 'info'
        });
        
        // Kosongkan field sebab_na jika ada
        setFormData(prev => ({
          ...prev,
          sebab_na: null
        }));
        
        // Delay untuk memastikan DOM sudah siap
        setTimeout(() => {
          try {
            // Highlight field yang perlu diperbarui
            const noKontrakField = document.getElementById('no_kontrak');
            const kontrakAwalField = document.getElementById('kontrak_awal');
            const kontrakAkhirField = document.getElementById('kontrak_akhir');
            
            if (noKontrakField) noKontrakField.classList.add('border-blue-500', 'bg-blue-50');
            if (kontrakAwalField) kontrakAwalField.classList.add('border-blue-500', 'bg-blue-50');
            if (kontrakAkhirField) kontrakAkhirField.classList.add('border-blue-500', 'bg-blue-50');
            
            // Kustomisasi tombol simpan
            const saveButton = document.querySelector('button[type="submit"]');
            if (saveButton) {
              saveButton.textContent = 'Reactivate';
              saveButton.classList.add('bg-green-600', 'hover:bg-green-700');
            }
          } catch (domError) {
            console.error("Error modifying DOM:", domError);
            // Lanjutkan meskipun ada error DOM
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error detecting restoration mode:", error);
      // Jangan biarkan error pada effect mengganggu render komponen
    }
  }, [location.state]);

  // Effect untuk mendeteksi apakah user sedang memulihkan karyawan dari NA
  useEffect(() => {
    if (location.state?.restored) {
      setIsRestoring(true);
      setMessage({
        text: location.state.message || 'To reactivate the employee, update the contract and contract number',
        type: 'info'
      });
    }
  }, [location.state]);
  
  // Fetch contract history sebagai useEffect terpisah
  useEffect(() => {
      if (userId) {
        fetchAllContractHistory(userId);
      }
    }, [userId]);

    useEffect(() => {
      if (isEditMode && userId) {
        // Fungsi untuk mendapatkan info file
        const fetchFileInfo = async () => {
          try {
            const response = await api.get(`/users/${userId}`);
            
            if (response.data) {
              const userData = response.data;
              
              // Periksa apakah ada file CV
              if (userData.cv_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  cv: {
                    filename: userData.cv_filename,
                    filepath: userData.cv_filepath,
                    mimetype: userData.cv_mimetype,
                    filesize: userData.cv_filesize
                  }
                }));
              }
              
              // Periksa apakah ada file Ijazah
              if (userData.ijazah_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  ijazah: {
                    filename: userData.ijazah_filename,
                    filepath: userData.ijazah_filepath,
                    mimetype: userData.ijazah_mimetype,
                    filesize: userData.ijazah_filesize
                  }
                }));
              }
              
              // Periksa apakah ada file Sertifikat
              if (userData.sertifikat_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  sertifikat: {
                    filename: userData.sertifikat_filename,
                    filepath: userData.sertifikat_filepath,
                    mimetype: userData.sertifikat_mimetype,
                    filesize: userData.sertifikat_filesize
                  }
                }));
              }

              if (userData.pkwt_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  pkwt: {
                    filename: userData.pkwt_filename,
                    filepath: userData.pkwt_filepath,
                    mimetype: userData.pkwt_mimetype,
                    filesize: userData.pkwt_filesize
                  }
                }));
              }
              // Check for KTP file
              if (userData.nik_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  nik: {
                    filename: userData.nik_filename,
                    filepath: userData.nik_filepath,
                    mimetype: userData.nik_mimetype,
                    filesize: userData.nikp_filesize
                  }
                }));
              }
              
              // Check for KK file
              if (userData.no_kk_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  no_kk: {
                    filename: userData.no_kk_filename,
                    filepath: userData.no_kk_filepath,
                    mimetype: userData.no_kk_mimetype,
                    filesize: userData.no_kk_filesize
                  }
                }));
              }
              
              // Check for NPWP file
              if (userData.npwp_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  npwp: {
                    filename: userData.npwp_filename,
                    filepath: userData.npwp_filepath,
                    mimetype: userData.npwp_mimetype,
                    filesize: userData.npwp_filesize
                  }
                }));
              }
              
              // Check for BPJS Kesehatan file
              if (userData.bpjs_kesehatan_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  bpjs_kesehatan: {
                    filename: userData.bpjs_kesehatan_filename,
                    filepath: userData.bpjs_kesehatan_filepath,
                    mimetype: userData.bpjs_kesehatan_mimetype,
                    filesize: userData.bpjs_kesehatan_filesize
                  }
                }));
              }
              
              // Check for BPJS TK file
              if (userData.bpjs_ketenagakerjaan_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  bpjs_ketenagakerjaan: {
                    filename: userData.bpjs_ketenagakerjaan_filename,
                    filepath: userData.bpjs_ketenagakerjaan_filepath,
                    mimetype: userData.bpjs_ketenagakerjaan_mimetype,
                    filesize: userData.bpjs_ketenagakerjaan_filesize
                  }
                }));
              }
              
              // Check for Rekening file
              if (userData.nomor_rekening_filename) {
                setExistingFiles(prev => ({
                  ...prev,
                  nomor_rekening: {
                    filename: userData.nomor_rekening_filename,
                    filepath: userData.nomor_rekening_filepath,
                    mimetype: userData.nomor_rekening_mimetype,
                    filesize: userData.nomor_rekening_filesize
                  }
                }));
              }            

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
        // Format tanggal untuk tampilan
        setFormData({
          ...userData,
          tanggal_lahir: userData.tanggal_lahir ? userData.tanggal_lahir.split('T')[0] : '',
          kontrak_awal: userData.kontrak_awal ? userData.kontrak_awal.split('T')[0] : '',
          kontrak_akhir: userData.kontrak_akhir ? userData.kontrak_akhir.split('T')[0] : '',
          awal_mcu: userData.awal_mcu ? userData.awal_mcu.split('T')[0] : '',
          akhir_mcu: userData.akhir_mcu ? userData.akhir_mcu.split('T')[0] : '',
          awal_hsepassport: userData.awal_hsepassport ? userData.awal_hsepassport.split('T')[0] : '',
          akhir_hsepassport: userData.akhir_hsepassport ? userData.akhir_hsepassport.split('T')[0] : '',
          awal_siml: userData.awal_siml ? userData.awal_siml.split('T')[0] : '',
          akhir_siml: userData.akhir_siml ? userData.akhir_siml.split('T')[0] : ''
        });

        // Set existing files if available
        if (userData.cv_filename) {
          setExistingFiles(prev => ({
            ...prev,
            cv: {
              filename: userData.cv_filename,
              filepath: userData.cv_filepath,
              mimetype: userData.cv_mimetype
            }
          }));
        }

        if (userData.ijazah_filename) {
          setExistingFiles(prev => ({
            ...prev,
            ijazah: {
              filename: userData.ijazah_filename,
              filepath: userData.ijazah_filepath,
              mimetype: userData.ijazah_mimetype
            }
          }));
        }

        if (userData.sertifikat_filename) {
          setExistingFiles(prev => ({
            ...prev,
            sertifikat: {
              filename: userData.sertifikat_filename,
              filepath: userData.sertifikat_filepath,
              mimetype: userData.sertifikat_mimetype
            }
          }));
        }

        if (userData.pkwt_filename) {
          setExistingFiles(prev => ({
            ...prev,
            pkwt: {
              filename: userData.pkwt_filename,
              filepath: userData.pkwt_filepath,
              mimetype: userData.pkwt_mimetype
            }
          }));
        }        
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setErrorMessage('Failed to retrieve user data');
    }
  };

  // Fetch kontrak history
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
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika field tanggal diubah, tangani dengan benar
    if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir' || 
        name === 'awal_mcu' || name === 'akhir_mcu' || name === 'awal_hsepassport' || 
        name === 'akhir_hsepassport' || name === 'awal_siml' || name === 'akhir_siml') {
      setChangedFields(prev => ({
        ...prev,
        [name]: true
      }));
      
      // Log untuk debug format tanggal
      
      // Jangan membuat objek Date untuk menghindari pergeseran timezone
      // Simpan string tanggal apa adanya
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Validasi format tanggal jika dalam format DD/MM/YYYY
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
      // Untuk field non-tanggal, gunakan implementasi biasa
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Hapus error jika ada
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  // Handle tanggal secara terpisah
  const handleDateChange = (name, value) => {
    // Validasi format DD/MM/YYYY
    if (value && !value.match(/^(\d{0,2}\/)?(\d{0,2}\/)?(\d{0,4})$/)) {
      return; // Abaikan input yang tidak sesuai pola
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setChangedFields(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validasi hanya jika inputnya lengkap
    if (value && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      if (!isValidDDMMYYYY(value)) {
        setErrors(prev => ({
          ...prev,
          [name]: `Invalid date format or date doesn't exist in calendar`
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    } else {
      // Hapus error selama proses pengetikan
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

     // Handle file changes
  const handleFileChange = (e, type) => {
  const file = e.target.files[0];
  if (file) {
    
    // Validasi ukuran file
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        [type]: 'File is too large, maximum size is 5MB' 
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
        [type]: 'Unsupported file format. Please use PDF, DOC, DOCX, JPG, or PNG.' 
      }));
      return;
    }
    
    // Update state files dengan metode yang benar
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
    
    // Hapus error jika ada
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
  
      // Validasi format tanggal
      const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir', 
                          'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 
                          'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
      dateFields.forEach(field => {
        if (formData[field] && typeof formData[field] === 'string') {
          // Jika format DD/MM/YYYY, validasi format
          if (formData[field].includes('/')) {
            if (!isValidDDMMYYYY(formData[field])) {
              newErrors[field] = `Invalid ${field.replace(/_/g, ' ')} format (DD/MM/YYYY)`;
            }
          }
        }
      });
  
      // Validasi kontrak akhir harus setelah kontrak awal
      if (formData.kontrak_awal && formData.kontrak_akhir) {
        try {
          // Konversi ke format YYYY-MM-DD tanpa menggunakan objek Date
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
          
          // Untuk perbandingan tanggal
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          
          // Set waktu ke 00:00:00
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          
          // Validasi: tanggal akhir harus setelah tanggal mulai
          if (endDate <= startDate) {
            newErrors.kontrak_akhir = 'End date must be after start date';
          }
        } catch (error) {
          console.error('Error validating dates:', error);
          newErrors.kontrak_akhir = 'Invalid date format';
        }
      }
      
      // Validasi khusus untuk mode pemulihan
      if (isRestoring && originalData) {
        // Cek apakah nomor kontrak telah diubah
        if (formData.no_kontrak === originalData.no_kontrak) {
          newErrors.no_kontrak = 'To restore the employee, you must change the contract number';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error("Error in form validation:", error);
      setMessage({
        text: `An error occurred during validation: ${error.message}`,
        type: 'error'
      });
      return false;
    }
  };

    // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Log file state untuk debugging
    Object.keys(files).forEach(type => {
      if (files[type]) {
      }
    });
    
    // Cek apakah ada file valid yang akan diupload
    const hasValidFiles = Object.values(files).some(file => file && file.size > 0);
    if (hasValidFiles) {
    }
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Buat salinan dari data form
        let dataToSubmit = {...formData};
        
        // Hapus field gaji_net jika ada (untuk mencegah error database)
        if ('gaji_net' in dataToSubmit) {
          delete dataToSubmit.gaji_net;
        }
        
        // Format tanggal dengan benar
        if (dataToSubmit.kontrak_awal) {
          dataToSubmit.kontrak_awal = formatDateToYYYYMMDD(dataToSubmit.kontrak_awal);
        }
        
        if (dataToSubmit.kontrak_akhir) {
          dataToSubmit.kontrak_akhir = formatDateToYYYYMMDD(dataToSubmit.kontrak_akhir);
        }
        
        // Log data yang akan dikirim
        
        // Tentukan endpoint & method
        const endpoint = isEditMode ? `/users/${userId}` : '/users';
        const method = isEditMode ? 'PUT' : 'POST';
        // Submit data form
        const response = await api({
          method: method,
          url: endpoint,
          data: dataToSubmit,
          timeout: 30000 // 30 seconds timeout
        });
        

        
        // Ambil user ID dari response
        const userIdForFiles = isEditMode ? userId : response.data.id || response.data.data?.id;

        
        // Upload file jika ada userId dan file valid
        if (userIdForFiles && hasValidFiles) {

          const uploadResult = await uploadFiles(userIdForFiles);

        }
        
        setSuccessMessage(isEditMode ? 'Data successfully updated' : 'Data successfully added');
        setSubmitted(true);
        
      } catch (error) {
        console.error(" Error submitting form:", error);
        handleSubmitError(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Fungsi untuk menangani error submit
  const handleSubmitError = (error) => {
    if (error.response) {

      setErrorMessage(
        error.response.data?.message || 
        `Error ${error.response.status}: ${error.response.statusText}`
      );
    } else if (error.request) {

      setErrorMessage("No response from server. Check your network connection.");
    } else {

      setErrorMessage(`Error: ${error.message}`);
    }
    
    setMessage({
      text: 'Failed to save data. ' + error.message,
      type: 'error'
    });
  };

  // Upload files
  const uploadFiles = async (userId) => {
    try {

      
      const validFiles = Object.keys(files).filter(type => 
        files[type] && files[type].size > 0
      );
      
      if (validFiles.length === 0) {

        return { success: true, message: "No files to upload" };
      }
      
      
      const uploadResults = [];
      
      // Proses upload satu per satu
      for (const type of validFiles) {
        try {
          const formData = new FormData();
          formData.append('file', files[type]);
          

          
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
    } catch (error) {
      console.error("Error in uploadFiles function:", error);
      return {
        success: false,
        message: error.message
      };
    }
  };

  // Fungsi untuk mengunduh file
  const downloadFile = async (type) => {
    try {
      if (userId) {
        // Dapatkan URL untuk download
        const url = `${api.defaults.baseURL}/users/${userId}/download/${type}`;
        
        // Buat link untuk download dan klik secara otomatis
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
          // Update state existingFiles dan fileNames
          setExistingFiles(prev => ({
            ...prev,
            [type]: null
          }));
          
          setFileNames(prev => ({
            ...prev,
            [type]: ''
          }));

          // Tandai bahwa file ini telah dihapus
          setDeletedFiles(prev => ({
            ...prev,
            [type]: true
          }));
          
          // Reset file input - perbaiki disini
          if (type === 'cv' && fileInputRefCV.current) {
            fileInputRefCV.current.value = '';
          } else if (type === 'ijazah' && fileInputRefIjazah.current) {
            fileInputRefIjazah.current.value = '';
          } else if (type === 'sertifikat' && fileInputRefSertifikat.current) {
            fileInputRefSertifikat.current.value = '';
          } else if (type === 'pkwt' && fileInputRefPKWT.current) {
            fileInputRefPKWT.current.value = '';
          }
          
          setMessage({
            text: `${type} file successfully deleted`,
            type: 'success'
          });
        } else {
          throw new Error(response.data?.message || 'Failed to delete file');
        }
      } else {
        // Jika belum ada userId (mode tambah data)
        setExistingFiles(prev => ({
          ...prev,
          [type]: null
        }));
        
        setFileNames(prev => ({
          ...prev,
          [type]: ''
        }));
        
        // Tandai file sebagai dihapus
        setDeletedFiles(prev => ({
          ...prev,
          [type]: true
        }));
        
        // Reset file input
        setFiles(prev => ({
          ...prev,
          [type]: null
        }));
        
        // Reset file input DOM berdasarkan tipe
        if (type === 'cv' && fileInputRefCV.current) {
          fileInputRefCV.current.value = '';
        } else if (type === 'ijazah' && fileInputRefIjazah.current) {
          fileInputRefIjazah.current.value = '';
        } else if (type === 'sertifikat' && fileInputRefSertifikat.current) {
          fileInputRefSertifikat.current.value = '';
        } else if (type === 'pkwt' && fileInputRefPKWT.current) {
          fileInputRefPKWT.current.value = '';
        }
        
        setMessage({
          text: `${type} file deleted`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error(`Error deleting ${type} file:`, error);
      // Tambahkan fallback mode - tandai file untuk dihapus meskipun API error
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

  // Fungsi validasi field dokumen
  const validateInputField = (name, value) => {
    let error = '';
    
    if (name === 'bpjs_kesehatan' && value) {
      if (value.length > 0 && value.length !== 13) {
        error = 'BPJS Health must consist of 13 characters';
      }
    }
    
    if (name === 'bpjs_ketenagakerjaan' && value) {
      if (value.length > 0 && value.length !== 11) {
        error = 'BPJS Social Security must consist of 11 characters';
      }
    }
    
    if (name === 'nik' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'KTP Number must be 16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'KTP Number contain only numbers';
      }
    }
    
    if (name === 'no_kk' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'Family Card Number must be 16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'Family Card Number must contain only numbers';
      }
    }
    
    if (name === 'npwp' && value) {
      if (value.length > 0 && value.length !== 15 && value.length !== 16) {
        error = 'NPWP Number must be 15–16 digits';
      } else if (!/^\d+$/.test(value)) {
        error = 'NPWP Number must contain only numbers';
      }
    }
    
    return error;
  };

  const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  // Jika field tanggal diubah, tangani dengan benar
  if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir' || 
      name === 'awal_mcu' || name === 'akhir_mcu' || name === 'awal_hsepassport' || 
      name === 'akhir_hsepassport' || name === 'awal_siml' || name === 'akhir_siml') {
    setChangedFields(prev => ({
      ...prev,
      [name]: true
    }));

    
    // Jangan membuat objek Date untuk menghindari pergeseran timezone
    // Simpan string tanggal apa adanya
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validasi format tanggal jika dalam format DD/MM/YYYY
    if (value && value.includes('/') && !isValidDDMMYYYY(value)) {
      setErrors(prev => ({
        ...prev,
        [name]: `Invalid date format. Use the format DD/MM/YYYY`
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  } 
  // Validasi khusus untuk field tertentu
  else if (['nik', 'no_kk', 'npwp', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan'].includes(name)) {
    // Cek panjang maksimum untuk field tertentu
    const maxLengths = {
      'bpjs_kesehatan': 13,
      'bpjs_ketenagakerjaan': 11,
      'nik': 16,
      'no_kk': 16,
      'npwp': 16
    };
    
    // Hanya lanjutkan jika belum melebihi panjang maksimum
    if (maxLengths[name] && value.length > maxLengths[name]) return;
    
    // Untuk nik, no_kk, npwp hanya izinkan angka
    if (['nik', 'no_kk', 'npwp'].includes(name) && 
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
    // Untuk field non-tanggal, gunakan implementasi biasa
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hapus error jika ada
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
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
      'Old Contract Number',
      'Old Contract Start',
      'Old Contract End',
      'New Contract Number',
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
    link.setAttribute('download', `contract-history-${formData.nama_karyawan}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Effect untuk memuat kontrak history pada load
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

  // Cek URL parameter id pada awal load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    // Jika ada parameter ID, berarti mode edit
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Kontrak Lama</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mulai Lama</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akhir Lama</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Kontrak Baru</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mulai Baru</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akhir Baru</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diubah Oleh</th>
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
      // Add some delay for visual confirmation
      setTimeout(() => {
        navigate('/regional4-edit', {
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

  // Dapatkan tanggal hari ini dalam format YYYY-MM-DD untuk input date
  const today = getTodayYYYYMMDD();

  // Render form sections
  const renderPersonalDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Personal Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nama Karyawan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_karyawan">
            Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_karyawan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_karyawan"
              placeholder="Enter full name"
              value={formData.nama_karyawan || ''}
              onChange={handleChange}
            />
            {errors.nama_karyawan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_karyawan}</p>}
          </div>

           {/* Tanggal Lahir */}
           <div>
            <label
              className={`block text-gray-700 text-sm font-bold mb-2 ${
                isEditMode ? 'text-blue-700' : ''
              }`}
              htmlFor="tanggal_lahir"
            >
              Date of Birth <span className="text-red-500">*</span>
              {isEditMode && (
                <span className="text-blue-500 text-xs ml-1">(Changes will be recorded in history)</span>
              )}
            </label>
            <div className="relative">
              <input
              className={`shadow appearance-none border ${
                errors.tanggal_lahir
                  ? 'border-reed-500'
                    : isEditMode
                    ? 'border-blue-200'
                    : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text" // Gunakan type text untuk format DD/MM/YYYY
                name="tanggal_lahir"
                placeholder="DD/MM/YYYY"
                value={formData.tanggal_lahir ? formatDateToDDMMYYYY(formData.tanggal_lahir) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Hanya izinkan format DD/MM/YYYY
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

          {/* Alamat Domisili */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_domisili">
            Domicile Address
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.alamat_domisili ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="alamat_domisili"
              rows="3"
              placeholder="Enter complete domicile address"
              value={formData.alamat_domisili || ''}
              onChange={handleChange}
            ></textarea>
            {errors.alamat_domisili && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_domisili}</p>}
          </div>

          {/* Nomor HP */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomor_hp">
            Phone Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.nomor_hp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nomor_hp"
              placeholder="Enter phone number"
              value={formData.nomor_hp || ''}
              onChange={handleNumberChange}
            />
            {errors.nomor_hp && <p className="text-red-500 text-xs italic mt-1">{errors.nomor_hp}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_email">
              Email
            </label>
            <input
              className={`shadow appearance-none border ${errors.alamat_email ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="email"
              name="alamat_email"
              placeholder="email@example.com"
              value={formData.alamat_email || ''}
              onChange={handleChange}
            />
            {errors.alamat_email && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_email}</p>}
          </div>

          {/* Nama Pasangan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_pasangan">
            Spouse Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_pasangan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_pasangan"
             placeholder="Enter spouse name"
              value={formData.nama_pasangan || ''}
              onChange={handleChange}
            />
            {errors.nama_pasangan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_pasangan}</p>}
          </div>

          {/* Status Nikah */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status_nikah">
            Marital Status
            </label>
            <select
              className={`shadow appearance-none border ${errors.status_nikah ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="status_nikah"
              value={formData.status_nikah || ''}
              onChange={handleChange}
            >
              {statusPerkawinanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status_nikah && <p className="text-red-500 text-xs italic mt-1">{errors.status_nikah}</p>}
          </div>

          {/* Nama Anak ke-1 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_anak_ke_1">
            1st Child Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_anak_ke_1 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_anak_ke_1"
              placeholder="Enter first child's name"
              value={formData.nama_anak_ke_1 || ''}
              onChange={handleChange}
            />
            {errors.nama_anak_ke_1 && <p className="text-red-500 text-xs italic mt-1">{errors.nama_anak_ke_1}</p>}
          </div>

          {/* Nama Anak ke-2 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_anak_ke_2">
            2nd Child Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_anak_ke_2 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_anak_ke_2"
              placeholder="Enter second child's name"
              value={formData.nama_anak_ke_2 || ''}
              onChange={handleChange}
            />
            {errors.nama_anak_ke_2 && <p className="text-red-500 text-xs italic mt-1">{errors.nama_anak_ke_2}</p>}
          </div>

          {/* Nama Kontak Darurat */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_kontak_emergency">
            Emergency Contact Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_kontak_emergency ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_kontak_emergency"
              placeholder="Enter emergency contact name"
              value={formData.nama_kontak_emergency || ''}
              onChange={handleChange}
            />
            {errors.nama_kontak_emergency && <p className="text-red-500 text-xs italic mt-1">{errors.nama_kontak_emergency}</p>}
          </div>

          {/* No Telp Kontak Darurat */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_telp_kontak_emergency">
            Emergency Contact Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_telp_kontak_emergency ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="no_telp_kontak_emergency"
              placeholder="Enter emergency contact number"
              value={formData.no_telp_kontak_emergency || ''}
              onChange={handleNumberChange}
            />
            {errors.no_telp_kontak_emergency && <p className="text-red-500 text-xs italic mt-1">{errors.no_telp_kontak_emergency}</p>}
          </div>

          {/* Hubungan Kontak Darurat */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hubungan_kontak_emergency">
            Emergency Contact Relation
            </label>
            <input
              className={`shadow appearance-none border ${errors.hubungan_kontak_emergency ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="hubungan_kontak_emergency"
              placeholder="Example: Husband, Wife, Child"
              value={formData.hubungan_kontak_emergency || ''}
              onChange={handleChange}
            />
            {errors.hubungan_kontak_emergency && <p className="text-red-500 text-xs italic mt-1">{errors.hubungan_kontak_emergency}</p>}
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
          {/* Jabatan */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="jabatan">
            Position
            </label>
            <input
              className={`shadow appearance-none border ${errors.jabatan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="jabatan"
              placeholder="Enter position"
              value={formData.jabatan || ''}
              onChange={handleChange}
            />
            {errors.jabatan && <p className="text-red-500 text-xs italic mt-1">{errors.jabatan}</p>}
          </div>

          {/* NIK PEP REG4 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nik_pep_reg4">
              PEP Reg4 ID
            </label>
            <input
              className={`shadow appearance-none border ${errors.nik_pep_reg4 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nik_pep_reg4"
              placeholder="Enter PEP Reg4 ID"
              value={formData.nik_pep_reg4 || ''}
              onChange={handleNumberChange}
            />
            {errors.nik_pep_reg4 && <p className="text-red-500 text-xs italic mt-1">{errors.nik_pep_reg4}</p>}
          </div>

          {/* NIK TAR */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nik_tar">
              TAR ID
            </label>
            <input
              className={`shadow appearance-none border ${errors.nik_tar ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nik_tar"
              placeholder="Enter TAR ID"
              value={formData.nik_tar || ''}
              onChange={handleChange}
            />
            {errors.nik_tar && <p className="text-red-500 text-xs italic mt-1">{errors.nik_tar}</p>}
          </div>

          {/* No Kontrak */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_kontrak">
            Contract Number {isEditMode && <span className="text-blue-500 text-xs">(Changes will be recorded in history)</span>}
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_kontrak ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="no_kontrak"
              id="no_kontrak"
              placeholder="Enter Contract Number"
              value={formData.no_kontrak || ''}
              onChange={handleChange}
            />
            {errors.no_kontrak && <p className="text-red-500 text-xs italic mt-1">{errors.no_kontrak}</p>}
          </div>

          {/* Kontrak Awal */}
          <div>
            <label className={`block text-gray-700 text-sm font-bold mb-2 ${isEditMode ? 'text-blue-700' : ''}`} htmlFor="kontrak_awal">
            Contract Start Date <span className="text-red-500">*</span>
              {isEditMode && <span className="text-blue-500 text-xs ml-1">(Changes will be recorded in history)</span>}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border ${errors.kontrak_awal ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text" // Gunakan type text untuk format DD/MM/YYYY
                name="kontrak_awal"
                id="kontrak_awal"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_awal ? formatDateToDDMMYYYY(formData.kontrak_awal) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Hanya izinkan format DD/MM/YYYY
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

          {/* Kontrak Akhir */}
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
                type="text" // Gunakan type text untuk format DD/MM/YYYY
                name="kontrak_akhir"
                id="kontrak_akhir"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_akhir ? formatDateToDDMMYYYY(formData.kontrak_akhir) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Hanya izinkan format DD/MM/YYYY
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
          {/* Pendidikan Terakhir */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pendidikan_terakhir">
            Last Education
            </label>
            <select
              className={`shadow appearance-none border ${errors.pendidikan_terakhir ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="pendidikan_terakhir"
              value={formData.pendidikan_terakhir || ''}
              onChange={handleChange}
            >
              {pendidikanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.pendidikan_terakhir && <p className="text-red-500 text-xs italic mt-1">{errors.pendidikan_terakhir}</p>}
          </div>

          {/* Universitas */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="universitas">
            University
            </label>
            <input
              className={`shadow appearance-none border ${errors.universitas ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="universitas"
              placeholder="Enter University Name"
              value={formData.universitas || ''}
              onChange={handleChange}
            />
            {errors.universitas && <p className="text-red-500 text-xs italic mt-1">{errors.universitas}</p>}
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
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Administrative Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NIK */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nik">
            KTP Number
          </label>
          <div className="flex flex-col">
            <div className="flex">
              <input
                className={`shadow appearance-none border ${errors.nik ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="nik"
                placeholder="Enter KTP Number"
                value={formData.nik || ''}
                onChange={handleInputChange}
                maxLength={16}
              />
              <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                <input
                  ref={fileInputRefNIK}
                  type="file"
                  name="nik"
                  onChange={(e) => handleFileChange(e, 'nik')}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
            {errors.nik && <p className="text-red-500 text-xs italic mt-1">{errors.nik}</p>}
            <small className="text-gray-500 mt-1">Must be 16 digit.</small>
            {fileNames.nik && <p className="text-green-600 text-xs mt-1">sSelected file: {fileNames.nik}</p>}
            {existingFiles.nik && !files.nik && (
              <div className="flex items-center mt-2">
                <p className="text-blue-600 text-xs">Current file: {existingFiles.nik.filename}</p>
                <div className="ml-2 flex">
                  <button
                    type="button"
                    className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                    onClick={() => downloadFile('nik')}
                  >
                    Download
                  </button>
                  <button
                    type="button" 
                    className="text-red-500 text-xs hover:text-red-700"
                    onClick={() => deleteFile('nik')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No KK */}
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
            <small className="text-gray-500 mt-1">Must be 16 digit.</small>
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

        {/* NPWP */}
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
            <small className="text-gray-500 mt-1">Must be 15-16 digit.</small>
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

        {/* BPJS Kesehatan */}
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
            <small className="text-gray-500 mt-1">Must be 13 digit.</small>
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

        {/* BPJS Ketenagakerjaan */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_ketenagakerjaan">
            BPJS Social Security
          </label>
          <div className="flex flex-col">
            <div className="flex">
              <input
                className={`shadow appearance-none border ${errors.bpjs_ketenagakerjaan ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="bpjs_ketenagakerjaan"
                placeholder="Enter BPJS Social Security"
                value={formData.bpjs_ketenagakerjaan || ''}
                onChange={handleInputChange}
                maxLength={11}
              />
              <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                <input
                  ref={fileInputRefBPJSKT}
                  type="file"
                  name="bpjs_ketenagakerjaan"
                  onChange={(e) => handleFileChange(e, 'bpjs_ketenagakerjaan')}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
            {errors.bpjs_ketenagakerjaan && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_ketenagakerjaan}</p>}
            <small className="text-gray-500 mt-1">Must be 11 digit number.</small>
            {fileNames.bpjs_ketenagakerjaan && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.bpjs_ketenagakerjaan}</p>}
            {existingFiles.bpjs_ketenagakerjaan && !files.bpjs_ketenagakerjaan && (
              <div className="flex items-center mt-2">
                <p className="text-blue-600 text-xs">Current file:: {existingFiles.bpjs_ketenagakerjaan.filename}</p>
                <div className="ml-2 flex">
                  <button
                    type="button"
                    className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                    onClick={() => downloadFile('bpjs_ketenagakerjaan')}
                  >
                    Download
                  </button>
                  <button
                    type="button" 
                    className="text-red-500 text-xs hover:text-red-700"
                    onClick={() => deleteFile('bpjs_ketenagakerjaan')}
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

        {/* Nomor Rekening */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomor_rekening">
            Bank Account
          </label>
          <div className="flex flex-col">
            <div className="flex">
              <input
                className={`shadow appearance-none border ${errors.nomor_rekening ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="nomor_rekening"
                placeholder="Enter Bank Account Number"
                value={formData.nomor_rekening || ''}
                onChange={handleNumberChange}
              />
              <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                <input
                  ref={fileInputRefRekening}
                  type="file"
                  name="nomor_rekening"
                  onChange={(e) => handleFileChange(e, 'nomor_rekening')}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
            {errors.nomor_rekening && <p className="text-red-500 text-xs italic mt-1">{errors.nomor_rekening}</p>}
            {fileNames.nomor_rekening && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.nomor_rekening}</p>}
            {existingFiles.nomor_rekening && !files.nomor_rekening && (
              <div className="flex items-center mt-2">
                <p className="text-blue-600 text-xs">Current file: {existingFiles.nomor_rekening.filename}</p>
                <div className="ml-2 flex">
                  <button
                    type="button"
                    className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                    onClick={() => downloadFile('nomor_rekening')}
                  >
                    Download
                  </button>
                  <button
                    type="button" 
                    className="text-red-500 text-xs hover:text-red-700"
                    onClick={() => deleteFile('nomor_rekening')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Nama Pemilik */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_pemilik">
              Bank Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_pemilik ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_pemilik"
              placeholder="Enter Bank Name"
              value={formData.nama_pemilik || ''}
              onChange={handleChange}
            />
            {errors.nama_pemilik && <p className="text-red-500 text-xs italic mt-1">{errors.nama_pemilik}</p>}
          </div>

          {/* Bank */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bank">
              Bank
            </label>
            <input
              className={`shadow appearance-none border ${errors.bank ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bank"
              placeholder="Enter Bank Name"
              value={formData.bank || ''}
              onChange={handleChange}
            />
            {errors.bank && <p className="text-red-500 text-xs italic mt-1">{errors.bank}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Render medical data section
  const renderAuthorDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Other Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ukuran Sepatu */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ukuran_sepatu">
            Shoe Size
            </label>
            <input
              className={`shadow appearance-none border ${errors.ukuran_sepatu ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="ukuran_sepatu"
              placeholder="Enter Shoe Size"
              value={formData.ukuran_sepatu || ''}
              onChange={handleNumberChange}
            />
            {errors.ukuran_sepatu && <p className="text-red-500 text-xs italic mt-1">{errors.ukuran_sepatu}</p>}
          </div>

          {/* Ukuran Coveroll */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ukuran_coveroll">
            Coverall Size
            </label>
            <input
              className={`shadow appearance-none border ${errors.ukuran_coveroll ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="ukuran_coveroll"
               placeholder="Enter Coverall Size"
              value={formData.ukuran_coveroll || ''}
              onChange={handleChange}
            />
            {errors.ukuran_coveroll && <p className="text-red-500 text-xs italic mt-1">{errors.ukuran_coveroll}</p>}
          </div>
        </div>
      </div>
    );
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

          {/* Main Content */}
          <main className="flex-1 bg-(--background-tar-color) space-y-6">
            <div className='flex flex-col bg-white p-6 shadow-md rounded gap-4'>
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                  {isEditMode 
                    ? isRestoreMode 
                    ? 'Form to Restore PT Pertamina Regional 4 User Data' 
                    : 'Form to Edit PT Pertamina Regional 4 User Data'
                  : 'Form to Add PT Pertamina Regional 4 User Data'
                  }
                </h2>
                
                {/* Show messages */}
                {message.text && (
                  <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : message.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                    <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
                  </div>
                )}

                {/* Tampilkan banner khusus untuk mode pemulihan */}
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

                {/* Tampilkan field sebab_na dalam mode hanya baca jika dalam mode edit dan bukan mode pemulihan */}
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
                    <p className="block sm:inline"> Form has been successfully {isEditMode ? 'updated' : 'submitted'}. Redirecting to user list page...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Data Sections */}
                    {renderPersonalDataSection()}
                    {renderEmploymentDataSection()}
                    {renderEducationDataSection()}
                    {renderAdministrationDataSection()}
                    {renderAuthorDataSection()}
                    
                    {/* Submit Button */}
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
                        onClick={() => navigate('/regional4-edit')}
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
              userName={formData.nama_karyawan}
              viewOnly={false}
              apiPrefix="regional4" // Tambahkan apiPrefix sesuai kebutuhan
            />
          )}
          
          {/* Footer*/}
          <FooterComponents/>
        </div>
      </div>
    </div>
  );
};

export default TambahUserPertamina4;