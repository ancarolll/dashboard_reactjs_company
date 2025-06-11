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
    // Jika dalam format DD/MM/YYYY
    if (dateString.includes('/')) {
      // Validasi format
      if (!isValidDDMMYYYY(dateString)) {
        console.error(`Invalid date format: ${dateString}`);
        return dateString; // Kembalikan string asli
      }
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
    // Log warning jika format tidak dikenali
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
  baseURL: 'http://localhost:3005/api/regional2Z7W'
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
    console.error(`Error during date sanitization: ${error.message}`, error);
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


const TambahUserPertamina2Z7W = () => {
  const [formData, setFormData] = useState({
    nama_lengkap: '', no_kontrak: '', jabatan: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', no_telepon: '', 
    nama_ibu_kandung: '', kontak_darurat: '', nama_kontak_darurat: '', email: '', paket_tender: '', alamat_ktp: '', 
    alamat_domisili: '', nik_vendor: '', gaji_net: '', no_kk: '', no_ktp: '', no_npwp: '', no_rekening: '', nama_bank: '', 
    bpjs_kesehatan_karyawan: '', bpjs_kesehatan_suami_istri: '', bpjs_anak1: '', bpjs_anak2: '', bpjs_anak3: '', 
    bpjstk: '', bpjstk_keterangan: '', asuransi_lainnya: '', kontrak_awal: '', kontrak_akhir: '', cv: '', status_pernikahan: ''
  });

  const [showSertifikatModal, setShowSertifikatModal] = useState(false);
  
  // State untuk file uploads - diperluas sesuai database
  const [files, setFiles] = useState({
    cv: null,
    ijazah: null,
    sertifikat: null,
    pkwt: null,
    no_ktp: null,
    no_kk: null, 
    no_npwp: null,
    bpjs_kesehatan_karyawan: null,
    bpjstk: null,
    no_rekening: null
  });

  // State untuk file names - diperluas sesuai database
  const [fileNames, setFileNames] = useState({
    cv: '',
    ijazah: '',
    sertifikat: '',
    pkwt: '',
    no_ktp: '',
    no_kk: '',
    no_npwp: '',
    bpjs_kesehatan_karyawan: '',
    bpjstk: '',
    no_rekening: ''
  });

  // State untuk existing file info - diperluas sesuai database
  const [existingFiles, setExistingFiles] = useState({
    cv: null,
    ijazah: null,
    sertifikat: null,
    pkwt: null,
    no_ktp: null,
    no_kk: null,
    no_npwp: null,
    bpjs_kesehatan_karyawan: null,
    bpjstk: null,
    no_rekening: null
  });

  // State untuk deleted files - diperluas sesuai database
  const [deletedFiles, setDeletedFiles] = useState({
    cv: false,
    ijazah: false,
    sertifikat: false,
    pkwt: false,
    no_ktp: false,
    no_kk: false,
    no_npwp: false,
    bpjs_kesehatan_karyawan: false,
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
  
  // Gunakan satu state untuk history dan loading
  const [sortedHistory, setSortedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // File input refs - diperluas sesuai kebutuhan
  const fileInputRefCV = useRef(null);
  const fileInputRefIjazah = useRef(null);
  const fileInputRefSertifikat = useRef(null);
  const fileInputRefPKWT = useRef(null);
  const fileInputRefKTP = useRef(null);
  const fileInputRefKK = useRef(null);
  const fileInputRefNPWP = useRef(null);
  const fileInputRefBPJSKesehatan = useRef(null);
  const fileInputRefBPJSTK = useRef(null);
  const fileInputRefRekening = useRef(null);
  
  const [originalUserData, setOriginalUserData] = useState(null);

  // State for gender options
  const jenisKelaminOptions = [
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

  // Fields required for form submission
  const requiredFields = [
    'nama_lengkap',
    'no_kontrak',
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
        kontrak_awal: getDateString(userToEdit.kontrak_awal),
        kontrak_akhir: getDateString(userToEdit.kontrak_akhir)
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
        // Add information message
        setMessage({
          text: location.state.message || 'To reactivate employee, update contract and contract number',
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
            console.error("Error when modifying DOM:", domError);
            // Lanjutkan meskipun ada error DOM
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error when detecting recovery mode:", error);
      // Jangan biarkan error pada effect mengganggu render komponen
    }
  }, [location.state]);

  // Effect untuk mendeteksi apakah user sedang memulihkan karyawan dari NA
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
    if (location.state?.userData) {
      // Simpan data original untuk referensi
      setOriginalUserData(location.state.userData);
      // Inisialisasi form dengan data yang ada
      setFormData(initializeFormData(location.state.userData));
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
            
            // File lama (CV, Ijazah, Sertifikat, PKWT)
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

            // File baru sesuai database schema
            if (userData.no_ktp_filename) {
              setExistingFiles(prev => ({
                ...prev,
                no_ktp: {
                  filename: userData.no_ktp_filename,
                  filepath: userData.no_ktp_filepath,
                  mimetype: userData.no_ktp_mimetype,
                  filesize: userData.no_ktp_filesize
                }
              }));
            }

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

            if (userData.no_npwp_filename) {
              setExistingFiles(prev => ({
                ...prev,
                no_npwp: {
                  filename: userData.no_npwp_filename,
                  filepath: userData.no_npwp_filepath,
                  mimetype: userData.no_npwp_mimetype,
                  filesize: userData.no_npwp_filesize
                }
              }));
            }

            if (userData.bpjs_kesehatan_karyawan_filename) {
              setExistingFiles(prev => ({
                ...prev,
                bpjs_kesehatan_karyawan: {
                  filename: userData.bpjs_kesehatan_karyawan_filename,
                  filepath: userData.bpjs_kesehatan_karyawan_filepath,
                  mimetype: userData.bpjs_kesehatan_karyawan_mimetype,
                  filesize: userData.bpjs_kesehatan_karyawan_filesize
                }
              }));
            }

            if (userData.bpjstk_filename) {
              setExistingFiles(prev => ({
                ...prev,
                bpjstk: {
                  filename: userData.bpjstk_filename,
                  filepath: userData.bpjstk_filepath,
                  mimetype: userData.bpjstk_mimetype,
                  filesize: userData.bpjstk_filesize
                }
              }));
            }

            if (userData.no_rekening_filename) {
              setExistingFiles(prev => ({
                ...prev,
                no_rekening: {
                  filename: userData.no_rekening_filename,
                  filepath: userData.no_rekening_filepath,
                  mimetype: userData.no_rekening_mimetype,
                  filesize: userData.no_rekening_filesize
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
          kontrak_akhir: userData.kontrak_akhir ? userData.kontrak_akhir.split('T')[0] : ''
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
      setErrorMessage('Failed to fetch user data');
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

  const initializeFormData = (userData) => {
    if (!userData) return { /* default values */ };
    // Pastikan semua tanggal diformat dengan benar
    return {
      ...userData,
      tanggal_lahir: userData.tanggal_lahir ? formatDateForDisplay(userData.tanggal_lahir) : '',
      // Format field lainnya...
    };
  };

  // Fungsi untuk memformat tanggal untuk tampilan
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      // Konversi ke format yang diterima input date (YYYY-MM-DD)
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      // Jika sudah dalam format YYYY-MM-DD
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      // Jika dalam format DD/MM/YYYY
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
      }
      return '';
    } catch (e) {
      console.error('Error formatting date for display:', e);
      return '';
    }
  };

  // Fungsi validasi field input berdasarkan permintaan
  const validateInputField = (name, value) => {
    let error = '';
    
    // Validasi untuk field yang membutuhkan kombinasi alphanumeric
    if (name === 'bpjs_kesehatan_karyawan' && value) {
      if (value.length > 0 && value.length !== 13) {
        error = 'BPJS Health Number must be a maximum of 13 characters';
      }
    }
    
    if (name === 'bpjstk' && value) {
      if (value.length > 0 && value.length !== 11) {
        error = 'BPJS Social Security Number must be a maximum of 11 characters';
      }
    }
    
    // Validasi untuk field yang hanya menerima angka
    if (name === 'no_ktp' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'KTP Number must be a maximum of 16 digits';
      } else if (!/^\d*$/.test(value)) {
        error = 'KTP Number must contain only numbers';
      }
    }
    
    if (name === 'no_kk' && value) {
      if (value.length > 0 && value.length !== 16) {
        error = 'Family Card Number must be a maximum of 16 digits';
      } else if (!/^\d*$/.test(value)) {
        error = 'Family Card Number must contain only numbers';
      }
    }
    
    if (name === 'no_npwp' && value) {
      if (value.length > 0 && value.length !== 15 && value.length !== 16) {
        error = 'NPWP Number must be between 15-16 digits';
      } else if (!/^\d*$/.test(value)) {
        error = 'NPWP Number must contain only numbers';
      }
    }
    
    return error;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika field tanggal diubah, tangani dengan benar
    if (name === 'kontrak_awal' || name === 'kontrak_akhir') {
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
    } 
    // Validasi khusus untuk field tertentu
    else if (['no_ktp', 'no_kk', 'no_npwp', 'bpjs_kesehatan_karyawan', 'bpjstk'].includes(name)) {
      // Cek panjang maksimum untuk field tertentu
      const maxLengths = {
        'bpjs_kesehatan_karyawan': 13,
        'bpjstk': 11,
        'no_ktp': 16,
        'no_kk': 16,
        'no_npwp': 16
      };
      
      // Hanya lanjutkan jika belum melebihi panjang maksimum
      if (maxLengths[name] && value.length > maxLengths[name]) return;
      
      // Untuk no_ktp, no_kk, no_npwp hanya izinkan angka
      if (['no_ktp', 'no_kk', 'no_npwp'].includes(name) && 
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
          [name]: `Invalid date format or date does not exist in calendar`
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

  // Khusus untuk field gaji_net yang bisa berupa numerik
  const handleGajiNetChange = (e) => {
    const { name, value } = e.target;
    // Hanya izinkan angka dan titik desimal
    if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      
      // Validasi ukuran file
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          [type]: 'File too large, maximum 5MB' 
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
          [type]: 'File format not supported. Use PDF, DOC, DOCX, JPG, or PNG.' 
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

  // Validate form - DIPERBAIKI: hilangkan validasi masa depan untuk kontrak_akhir
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
      const dateFields = ['tanggal_lahir', 'kontrak_awal', 'kontrak_akhir'];
      dateFields.forEach(field => {
        if (formData[field] && typeof formData[field] === 'string') {
          // Jika format DD/MM/YYYY, validasi format
          if (formData[field].includes('/')) {
            if (!isValidDDMMYYYY(formData[field])) {
              newErrors[field] = `Format ${field.replace(/_/g, ' ')} format is invalid (DD/MM/YYYY)`;
            }
          }
        }
      });
  
      // Validasi kontrak akhir harus setelah kontrak awal (TANPA validasi masa depan)
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
          newErrors.no_kontrak = 'To restore employee, you must change the contract number';
        }
        
        // Cek apakah tanggal akhir kontrak telah diubah
        if (formData.kontrak_akhir === originalData.kontrak_akhir) {
          newErrors.kontrak_akhir = 'To restore employee, you must change the contract end date';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error("Error dalam validasi form:", error);
      setMessage({
        text: `Error during validation:: ${error.message}`,
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

     // Validasi nilai tanggal lahir sebelum submit
    const formDataToSubmit = {...formData};
    
    // Pastikan tanggal lahir selalu ada jika pernah ada
    if (!formDataToSubmit.tanggal_lahir && originalUserData?.tanggal_lahir) {

      formDataToSubmit.tanggal_lahir = originalUserData.tanggal_lahir;
    }
    
    // Format nilai tanggal untuk API
    if (formDataToSubmit.tanggal_lahir) {
      // Format untuk API (YYYY-MM-DD)
      const formatted = formatDateForAPI(formDataToSubmit.tanggal_lahir);
      formDataToSubmit.tanggal_lahir = formatted;
    }
    
    if (validateForm()) {

      setIsSubmitting(true);
      
      try {
        // Buat salinan data form untuk dikirim
        let dataToSubmit = {...formData};

        // Tambahkan flag untuk file yang dihapus
        Object.keys(deletedFiles).forEach(fileType => {
          if (deletedFiles[fileType]) {
            // Tambahkan properti ke dataToSubmit untuk menandai file dihapus
            dataToSubmit[`${fileType}_filename`] = null;
            dataToSubmit[`${fileType}_filepath`] = null;
            dataToSubmit[`${fileType}_mimetype`] = null;
            dataToSubmit[`${fileType}_filesize`] = null;

          }
        });
        
        // Untuk field tanggal yang tidak berubah, gunakan data asli
        if (isEditMode) {
          const dateFields = ['kontrak_awal', 'kontrak_akhir'];
          dateFields.forEach(field => {
            if (!changedFields[field] && originalData[field]) {
              // Gunakan data asli dari server jika field tidak diubah
              dataToSubmit[field] = originalData[field];

            }
          });
        }

        // Pastikan format tanggal benar (YYYY-MM-DD)
        const dateFields = ['kontrak_awal', 'kontrak_akhir'];
        dateFields.forEach(field => {
          if (dataToSubmit[field]) {

            dataToSubmit[field] = formatDateToYYYYMMDD(dataToSubmit[field]);

          } else {
            dataToSubmit[field] = null;
          }
        });

        // Validasi khusus untuk field tanggal yang wajib
        if (!dataToSubmit.kontrak_awal || dataToSubmit.kontrak_awal === '') {
          throw new Error('Contract start date is required');
        }
        
        if (!dataToSubmit.kontrak_akhir || dataToSubmit.kontrak_akhir === '') {
          throw new Error('Contract end date is required');
        }

        // PENTING: Jika dalam mode pemulihan, pastikan sebab_na adalah null
        if (isRestoring) {
          dataToSubmit.sebab_na = null;
        }


        // Tentukan endpoint
        const endpoint = isEditMode && userId 
          ? `/users/${userId}` 
          : '/users';
        
        // Log untuk debugging

        // Gunakan api instance yang telah dikonfigurasi
        let response;
        if (isEditMode) {
          response = await api.put(endpoint, dataToSubmit);
        } else {
          response = await api.post(endpoint, dataToSubmit);
        }
        

        // Dapatkan userId yang benar dari response
        const userIdForFiles = isEditMode ? userId : response.data.id || response.data.data?.id;
      
        // Pastikan userIdForFiles adalah nilai yang valid sebelum melanjutkan
        if (userIdForFiles && userIdForFiles !== 'undefined' && userIdForFiles !== undefined) {
          // Check if there are files to upload
          const hasFilesToUpload = Object.values(files).some(file => file !== null);
          
          if (hasFilesToUpload) {
            try {
              await uploadFiles(userIdForFiles);
            } catch (fileError) {
              console.error("Error uploading files:", fileError);
              // Tetap lanjutkan karena user sudah dibuat, hanya file yang gagal
              setMessage({
                text: 'Data saved but there was an error uploading files',
                type: 'warning'
              });
            }
          }
        } else {

        }
        
        // Pesan sukses spesifik untuk mode pemulihan
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
        
        // Refresh data jika dalam mode edit
        if (isEditMode && userId) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchAllContractHistory(userId);
  
          // Refresh file info jika perlu
          await fetchUserData(userId);
  
          if (!isRestoring) {
            setMessage({
              text: 'Data successfully saved and contract history updated',
              type: 'success'
            });
          }
        } else {
          // Reset form jika mode tambah
          setFormData({
            nama_lengkap: '', no_kontrak: '', jabatan: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', no_telepon: '', 
            nama_ibu_kandung: '', kontak_darurat: '', nama_kontak_darurat: '', email: '', paket_tender: '', alamat_ktp: '', 
            alamat_domisili: '', nik_vendor: '', gaji_net: '', no_kk: '', no_ktp: '', no_npwp: '', no_rekening: '', nama_bank: '', 
            bpjs_kesehatan_karyawan: '', bpjs_kesehatan_suami_istri: '', bpjs_anak1: '', bpjs_anak2: '', bpjs_anak3: '', 
            bpjstk: '', bpjstk_keterangan: '', kontrak_awal: '', kontrak_akhir: '', status_pernikahan: ''
          });          
  
          setFiles({
            cv: null,
            ijazah: null,
            sertifikat: null,
            pkwt: null,
            no_ktp: null,
            no_kk: null,
            no_npwp: null,
            bpjs_kesehatan_karyawan: null,
            bpjstk: null,
            no_rekening: null
          });
          
          setFileNames({
            cv: '',
            ijazah: '',
            sertifikat: '',
            pkwt: '',
            no_ktp: '',
            no_kk: '',
            no_npwp: '',
            bpjs_kesehatan_karyawan: '',
            bpjstk: '',
            no_rekening: ''
          });

          setExistingFiles({
            cv: null,
            ijazah: null,
            sertifikat: null,
            pkwt: null,
            no_ktp: null,
            no_kk: null,
            no_npwp: null,
            bpjs_kesehatan_karyawan: null,
            bpjstk: null,
            no_rekening: null
          });
          
          // Reset deleted files state
          setDeletedFiles({
            cv: false,
            ijazah: false,
            sertifikat: false,
            pkwt: false,
            no_ktp: false,
            no_kk: false,
            no_npwp: false,
            bpjs_kesehatan_karyawan: false,
            bpjstk: false,
            no_rekening: false
          });
          
          // Reset file input elements
          if (fileInputRefCV.current) fileInputRefCV.current.value = '';
          if (fileInputRefIjazah.current) fileInputRefIjazah.current.value = '';
          if (fileInputRefSertifikat.current) fileInputRefSertifikat.current.value = '';
          if (fileInputRefPKWT.current) fileInputRefPKWT.current.value = '';
          if (fileInputRefKTP.current) fileInputRefKTP.current.value = '';
          if (fileInputRefKK.current) fileInputRefKK.current.value = '';
          if (fileInputRefNPWP.current) fileInputRefNPWP.current.value = '';
          if (fileInputRefBPJSKesehatan.current) fileInputRefBPJSKesehatan.current.value = '';
          if (fileInputRefBPJSTK.current) fileInputRefBPJSTK.current.value = '';
          if (fileInputRefRekening.current) fileInputRefRekening.current.value = '';
        }
        
        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
  
        // Tampilkan pesan error yang lebih detail
        if (error.response) {

          setErrorMessage(error.response.data?.message || `Error occurred (${error.response.status}): ${error.response.statusText}`);
        } else if (error.request) {

          setErrorMessage('No response from server. Check your network connection.');
        } else {

          setErrorMessage('Error occurred: ' + error.message);
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

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Jika dari input HTML date, sudah dalam format YYYY-MM-DD
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      // Konversi dari format lain jika perlu
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return dateString; // Kembalikan nilai asli jika tidak bisa dikonversi
    } catch (e) {
      console.error('Error formatting date for API:', e);
      return dateString;
    }
  };

  // Upload files
  const uploadFiles = async (userId) => {
    try {
      
      const validFiles = Object.keys(files).filter(type => 
        files[type] && files[type].size > 0
      );
      
      if (validFiles.length === 0) {

        return { success: true, message: "Tidak ada file untuk diupload" };
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
        text: `Failed to download ${type} file`,
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
          
          // Reset file input berdasarkan tipe
          const fileInputRefs = {
            cv: fileInputRefCV,
            ijazah: fileInputRefIjazah,
            sertifikat: fileInputRefSertifikat,
            pkwt: fileInputRefPKWT,
            no_ktp: fileInputRefKTP,
            no_kk: fileInputRefKK,
            no_npwp: fileInputRefNPWP,
            bpjs_kesehatan_karyawan: fileInputRefBPJSKesehatan,
            bpjstk: fileInputRefBPJSTK,
            no_rekening: fileInputRefRekening
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
        const fileInputRefs = {
          cv: fileInputRefCV,
          ijazah: fileInputRefIjazah,
          sertifikat: fileInputRefSertifikat,
          pkwt: fileInputRefPKWT,
          no_ktp: fileInputRefKTP,
          no_kk: fileInputRefKK,
          no_npwp: fileInputRefNPWP,
          bpjs_kesehatan_karyawan: fileInputRefBPJSKesehatan,
          bpjstk: fileInputRefBPJSTK,
          no_rekening: fileInputRefRekening
        };
        
        if (fileInputRefs[type] && fileInputRefs[type].current) {
          fileInputRefs[type].current.value = '';
        }
        
        setMessage({
          text: `${type} file successfully deleted`,
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
        text: `Error occurred while deleting file on server. File will be deleted when saving.`,
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
      'Old Contract No.',
      'Old Contract Start',
      'Old Contract End',
      'New Contract No.',
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

      setErrorMessage(error.response.data?.message || 'Error occurred while fetching data');
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Contract No.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Start</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old End</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Contract No.</th>
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
      // Add some delay for visual confirmation
      setTimeout(() => {
        navigate('/regional2z7w-edit', {
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

          {/* Tanggal Lahir */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tanggal_lahir"
            >
              Birth Date
            </label>
            <div className="relative">
              <input
              className={`shadow appearance-none border ${errors.tanggal_lahir ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
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
                  }
                }}
              />
              <small className="text-gray-500 mt-1 block">Format: DD/MM/YYYY</small>
            </div>
            {errors.tanggal_lahir && (
              <p className="text-red-500 text-xs italic mt-1">{errors.tanggal_lahir}</p>
            )}
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

          {/* Jenis Kelamin */}
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
              {jenisKelaminOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.jenis_kelamin && <p className="text-red-500 text-xs italic mt-1">{errors.jenis_kelamin}</p>}
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_telepon">
              Phone Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_telepon ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="no_telepon"
              placeholder="Enter Phone Number"
              value={formData.no_telepon || ''}
              onChange={handleNumberChange}
            />
            {errors.no_telepon && <p className="text-red-500 text-xs italic mt-1">{errors.no_telepon}</p>}
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

          {/* Nama Kontak Darurat */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_kontak_darurat">
              Emergency Contact Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_kontak_darurat ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_kontak_darurat"
              placeholder="Enter Emergency Contact Name"
              value={formData.nama_kontak_darurat || ''}
              onChange={handleChange}
            />
            {errors.nama_kontak_darurat && <p className="text-red-500 text-xs italic mt-1">{errors.nama_kontak_darurat}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className={`shadow appearance-none border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="email"
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
              placeholder="Enter KTP Address"
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
              Contract Number <span className="text-red-500">*</span> {isEditMode && <span className="text-blue-500 text-xs">(Changes will be recorded in history)</span>}
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

          {/* Gaji Net */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gaji_net">
              Net Salary
            </label>
            <input
              className={`shadow appearance-none border ${errors.gaji_net ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="gaji_net"
              placeholder="Enter Net Salary"
              value={formData.gaji_net || ''}
              onChange={handleNumberChange}
            />
            <small className="text-gray-500 mt-1 block">Format: 3000000.00 for 3 million</small>
            {errors.gaji_net && <p className="text-red-500 text-xs italic mt-1">{errors.gaji_net}</p>}
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

  // Render education/document data section
  const renderEducationDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Document Data</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

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

          {/* Manage Certificates Button */}
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

  // Bagian untuk menampilkan form data administrasi (KTP, KK, NPWP, rekening) dengan upload file
  const renderAdministrationDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Administration Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ID Card Number dengan upload */}
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
                  placeholder="Enter KTP ID"
                  value={formData.no_ktp || ''}
                  onChange={handleChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefKTP}
                    type="file"
                    onChange={(e) => handleFileChange(e, 'no_ktp')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_ktp && <p className="text-red-500 text-xs italic mt-1">{errors.no_ktp}</p>}
              <small className="text-gray-500 mt-1">Must be a maximum of 16 digits.</small>
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

          {/* Family Card Number dengan upload */}
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
                  onChange={handleChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefKK}
                    type="file"
                    onChange={(e) => handleFileChange(e, 'no_kk')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_kk && <p className="text-red-500 text-xs italic mt-1">{errors.no_kk}</p>}
              <small className="text-gray-500 mt-1">Must be a maximum of 16 digits.</small>
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

          {/* Tax ID Number dengan upload */}
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
                  onChange={handleChange}
                  maxLength={16}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefNPWP}
                    type="file"
                    onChange={(e) => handleFileChange(e, 'no_npwp')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.no_npwp && <p className="text-red-500 text-xs italic mt-1">{errors.no_npwp}</p>}
              <small className="text-gray-500 mt-1">Must be between 15-16 digits.</small>
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

          {/* Account Number dengan upload */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_rekening">
              Bank Number
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.no_rekening ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="no_rekening"
                  placeholder="Enter Bank Number"
                  value={formData.no_rekening || ''}
                  onChange={handleNumberChange}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefRekening}
                    type="file"
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

          {/* Nama Bank */}
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

  // Bagian untuk menampilkan form data BPJS
  const renderBPJSDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">BPJS Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          
          {/* Health Insurance Number dengan upload */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_kesehatan_karyawan">
              BPJS Health
            </label>
            <div className="flex flex-col">
              <div className="flex">
                <input
                  className={`shadow appearance-none border ${errors.bpjs_kesehatan_karyawan ? 'border-red-500' : 'border-gray-300'} rounded-l-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="text"
                  name="bpjs_kesehatan_karyawan"
                  placeholder="Enter BPJS Health"
                  value={formData.bpjs_kesehatan_karyawan || ''}
                  onChange={handleChange}
                  maxLength={13}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefBPJSKesehatan}
                    type="file"
                    onChange={(e) => handleFileChange(e, 'bpjs_kesehatan_karyawan')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.bpjs_kesehatan_karyawan && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_kesehatan_karyawan}</p>}
              <small className="text-gray-500 mt-1">Must be a maximum of 13 characters.</small>
              {fileNames.bpjs_kesehatan_karyawan && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.bpjs_kesehatan_karyawan}</p>}
              {existingFiles.bpjs_kesehatan_karyawan && !files.bpjs_kesehatan_karyawan && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.bpjs_kesehatan_karyawan.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('bpjs_kesehatan_karyawan')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('bpjs_kesehatan_karyawan')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employment Insurance Number dengan upload */}
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
                  placeholder="Enter BPJS Social Security Number"
                  value={formData.bpjstk || ''}
                  onChange={handleChange}
                  maxLength={11}
                />
                <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                  <input
                    ref={fileInputRefBPJSTK}
                    type="file"
                    onChange={(e) => handleFileChange(e, 'bpjstk')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.bpjstk && <p className="text-red-500 text-xs italic mt-1">{errors.bpjstk}</p>}
              <small className="text-gray-500 mt-1">Must be a maximum of 11 characters.</small>
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

          {/* BPJS Kesehatan Suami/Istri */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_kesehatan_suami_istri">
              Spouses BPJS
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_kesehatan_suami_istri ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_kesehatan_suami_istri"
              placeholder="Enter Spouses BPJS Number"
              value={formData.bpjs_kesehatan_suami_istri || ''}
              onChange={handleChange}
            />
            {errors.bpjs_kesehatan_suami_istri && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_kesehatan_suami_istri}</p>}
          </div>

          {/* BPJS Anak 1 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_anak1">
              BPJS Child 1
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_anak1 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_anak1"
              placeholder="Enter BPJS Child 1"
              value={formData.bpjs_anak1 || ''}
              onChange={handleChange}
            />
            {errors.bpjs_anak1 && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_anak1}</p>}
          </div>

          {/* BPJS Anak 2 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_anak2">
              BPJS Child 2
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_anak2 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_anak2"
              placeholder="Enter BPJS Child 2"
              value={formData.bpjs_anak2 || ''}
              onChange={handleChange}
            />
            {errors.bpjs_anak2 && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_anak2}</p>}
          </div>

           {/* BPJS Anak 3 */}
           <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjs_anak3">
              BPJS Child 3
            </label>
            <input
              className={`shadow appearance-none border ${errors.bpjs_anak3 ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bpjs_anak3"
              placeholder="Enter BPJS Child 3"
              value={formData.bpjs_anak3 || ''}
              onChange={handleChange}
            />
            {errors.bpjs_anak3 && <p className="text-red-500 text-xs italic mt-1">{errors.bpjs_anak3}</p>}
          </div>

          {/* BPJS Ketenagakerjaan Keterangan */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bpjstk_keterangan">
              BPJS Social Security Details
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.bpjstk_keterangan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="bpjstk_keterangan"
              rows="2"
              placeholder="Enter BPJS Social SecurityDetails "
              value={formData.bpjstk_keterangan || ''}
              onChange={handleChange}
            ></textarea>
            {errors.bpjstk_keterangan && <p className="text-red-500 text-xs italic mt-1">{errors.bpjstk_keterangan}</p>}
          </div>
        </div>
      </div>
    );
  };

// Komponen utama/render utama
return (
  <div className='bg-(--background-tar-color)'> 
    <div className="flex">
      <div className='h-screen fixed left-0 top-0'>
        {/* Sidebar */}
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
                    ? 'Form to Restore PT Pertamina EP Regional 2 Zone 7 WOPDM Data' 
                    : 'Form to Edit PT Pertamina EP Regional 2 Zone 7 WOPDM Data'
                  : 'Form to Add PT Pertamina EP Regional 2 Zone 7 WOPDM Data'
                }
              </h2>
              
              {/* Tampilkan pesan */}
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
                          <li className="mb-1">Update <span className="font-bold">Contract Number</span></li>
                          <li className="mb-1">Update <span className="font-bold">Contract Start Date</span> (if needed)</li>
                          <li className="mb-1">Update <span className="font-bold">Contract End Date</span> (must be after today)</li>
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
                        <span className="font-bold">Attention:</span> This employee has an Inactive status with reason: <span className="font-bold">{formData.sebab_na}</span>
                      </p>
                      <p className="text-xs mt-1">
                        To reactivate, use the "Restore" button on the Inactive page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tampilkan konfirmasi pengiriman */}
              {submitted ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                  <strong className="font-bold">Success!</strong>
                  <p className="block sm:inline"> Form has been successfully {isEditMode ? 'updated' : 'submitted'}. Redirecting to user list page...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Bagian-bagian form */}
                  {renderPersonalDataSection()}
                  {renderEmploymentDataSection()}
                  {renderEducationDataSection()}
                  {renderAdministrationDataSection()}
                  {renderBPJSDataSection()}
                  
                  {/* Tombol Submit */}
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
                      onClick={() => navigate('/regional2z7w-edit')}
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          
          {/* Bagian Riwayat Kontrak */}
          {isEditMode && renderContractHistorySection()}
        </main>

        {/* Modal untuk mengelola sertifikat */}
        {showSertifikatModal && (
          <SertifikatModal
            isOpen={showSertifikatModal}
            onClose={() => setShowSertifikatModal(false)}
            userId={userId}
            userName={formData.nama_lengkap}
            viewOnly={false}
            apiPrefix="regional2z7w" // Sesuai dengan endpoint API
          />
        )}
        
        {/* Footer*/}
        <FooterComponents/>
      </div>
    </div>
  </div>
);
}

export default TambahUserPertamina2Z7W;