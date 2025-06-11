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
// PERBAIKAN: Menghindari penggunaan objek Date sama sekali
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Deteksi format yang diberikan
    
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
    
    return dateString;
  } catch (error) {
    console.error('Error converting date format:', error);
    return dateString;
  }
};

// Fungsi untuk format date dalam DD/MM/YYYY untuk tampilan
// PERBAIKAN: Menghindari penggunaan objek Date sama sekali
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

const api = axios.create({
  baseURL: 'http://localhost:3005/api/elnusa'
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

  // Interceptor untuk response
  api.interceptors.response.use(
    (response) => {
      // Jika response berisi data tanggal, konversi ke format yang diinginkan
      // (untuk kasus fetching data, tidak untuk submit form)
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
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
          
          console.error(`Unable to recognize date format: ${dateInput}`);
          return null;
        }
        
        // Jika tipe data tidak didukung
        console.error(`Date data type is not supported: ${typeof dateInput}`);
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
        console.error(`Error while checking date validity: ${error.message}`, error);
        return formData; // Kembalikan formData asli jika terjadi error
      }
    };

const TambahUserElnusa = () => {
  const [formData, setFormData] = useState({ nama_karyawan: '', jabatan: '', nik_vendor: '', nik_elnusa: '', no_kontrak: '', wbs_cctr: '', proyek: '', unit: '', unit_temp: '', 
    lokasi_penerimaan: '', user_name: '', kontrak_awal: '', kontrak_akhir: '', no_ktp: '', no_kk: '', no_bpjs_kesehatan: '', keterangan_bpjs_kesehatan: '', no_bpjs_tk: '', 
    keterangan_bpjs_tk: '', asuransi_lainnya: '', npwp: '', alamat_lengkap_domisili: '', jenis_kelamin: '', hse: '', tanggal_lahir: '', usia: '', agama: '', status_perkawinan: '', pendidikan_terakhir: '', 
    nama_instansi_pendidikan: '', jurusan: '', tahun_masuk: '', tahun_keluar: '', alamat_email: '', nomor_telepon: '', nomor_telepon_darurat: '', nama_telepon_darurat: '', 
    nama_pemilik_buku_tabungan: '', no_rekening: '', bank_penerbit: '', honorarium: '', gaji_pokok: '', gaji_terupdate: '', t_variabel: '', t_makan: '', t_transport: '', 
    t_pulsa: '', t_specialis: '', t_lapangan: '', thp: '', lemburan_otomatis: '', t_posisi: '', t_offshore: '', t_lapangan_perhari: '', t_onshore: '', t_onshore_eksp: '', 
    t_warehouse_office: '', t_proyek: '', t_karantina: '', tunjangan_lembur: '', t_supervisor: '', status_karyawan: '', hak_asuransi: '', cv: ''});

  const [files, setFiles] = useState({
  cv: null, ijazah: null, sertifikat: null, pkwt: null, no_ktp: null, no_kk: null, npwp: null, no_bpjs_kesehatan: null, no_bpjs_tk: null, no_rekening: null });
  
  // State untuk file names
  const [fileNames, setFileNames] = useState({
  cv: '', ijazah: '', sertifikat: '', pkwt: '', no_ktp: '', no_kk: '', npwp: '', no_bpjs_kesehatan: '', no_bpjs_tk: '', no_rekening: '' });
  
  // State untuk existing file info
  const [existingFiles, setExistingFiles] = useState({
  cv: null, ijazah: null, sertifikat: null, pkwt: null, no_ktp: null, no_kk: null, npwp: null, no_bpjs_kesehatan: null, no_bpjs_tk: null, no_rekening: null });
  
  // State untuk menandai file yang telah dihapus (untuk backend)
  const [deletedFiles, setDeletedFiles] = useState({
  cv: false, ijazah: false, sertifikat: false, pkwt: false, no_ktp: false, no_kk: false, npwp: false, no_bpjs_kesehatan: false, no_bpjs_tk: false, no_rekening: false });

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

  const [showSertifikatModal, setShowSertifikatModal] = useState(false);

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

  const fileInputRefKTP = useRef(null);
  const fileInputRefKK = useRef(null);
  const fileInputRefNPWP = useRef(null);
  const fileInputRefBPJSKesehatan = useRef(null);
  const fileInputRefBPJSTK = useRef(null);
  const fileInputRefRekening = useRef(null);

  // State for gender options
  const genderOptions = [
    { value: '', label: 'Choose Gender' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  // State for gender options
  const hseOptions = [
    { value: '', label: 'Choose hse status' },
    { value: 'RIG EMR', label: 'RIG EMR' },
    { value: ' ', label: 'No' }
  ];

  // State for religion options
  const agamaOptions = [
    { value: '', label: 'Choose Religion' },
    { value: 'Islam', label: 'Islam' },
    { value: 'Kristen', label: 'Kristen' },
    { value: 'Katolik', label: 'Katolik' },
    { value: 'Hindu', label: 'Hindu' },
    { value: 'Buddha', label: 'Buddha' },
    { value: 'Konghucu', label: 'Konghucu' },
    { value: 'Lainnya', label: 'Lainnya' }
  ];

  // State for marital status options
  const statusPerkawinanOptions = [
    { value: '', label: 'Choose Marital status' },
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
    { value: '', label: 'Choose Education' },
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
      kontrak_akhir: userToEdit.kontrak_akhir,
      no_kontrak: userToEdit.no_kontrak
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
        
        // Tambahkan pesan informasi
        setMessage({
          text: location.state.message || 'To reactivate an employee, you must update the contract number and contract end date.',
          type: 'info'
        });
        
        // Dapatkan daftar field yang perlu diubah dari state navigasi
        const fieldsToUpdate = location.state.fieldsToUpdate || ['no_kontrak', 'kontrak_akhir'];
        
        // Delay untuk memastikan DOM sudah siap
        setTimeout(() => {
          try {
            // Highlight hanya field yang perlu diperbarui
            fieldsToUpdate.forEach(fieldName => {
              const field = document.getElementById(fieldName);
              if (field) {
                field.classList.add('border-blue-500', 'bg-blue-50');
                
                // Opsional: Tambahkan focus ke field pertama yang perlu diubah
                if (fieldName === fieldsToUpdate[0]) {
                  field.focus();
                }
              }
            });
            
            // Kustomisasi tombol simpan
            const saveButton = document.querySelector('button[type="submit"]');
            if (saveButton) {
              saveButton.textContent = 'Reactivate';
              saveButton.classList.add('bg-green-600', 'hover:bg-green-700');
            }
          } catch (domError) {
            console.error("Error while modifying the DOM:", domError);
            // Lanjutkan meskipun ada error DOM
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error detecting recovery mode:", error);
      // Jangan biarkan error pada effect mengganggu render komponen
    }
  }, [location.state]);

// Effect untuk mendeteksi apakah user sedang memulihkan karyawan dari NA
useEffect(() => {
  if (location.state?.restored) {
    setIsRestoring(true);
    setMessage({
      text: location.state.message || 'To reactivate an employee, update the contract and contract number',
      type: 'info'
    });
  }
}, [location.state]);
  
  // Fetch contract history sebagai useEffect terpisah
  useEffect(() => {
    if (isEditMode && userId) {
      fetchAllContractHistory(userId);
    }
  }, [userId]);


  useEffect(() => {
    if (isEditMode && userId) {
      // Function to get file info
      const fetchFileInfo = async () => {
        try {
          const response = await api.get(`/users/${userId}`);
          
          if (response.data) {
            const userData = response.data;
            
            // Check for CV file
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
            
            // Check for Ijazah file
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
            
            // Check for Sertifikat file
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

            // Check for PKWT file
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
            if (userData.no_bpjs_kesehatan_filename) {
              setExistingFiles(prev => ({
                ...prev,
                no_bpjs_kesehatan: {
                  filename: userData.no_bpjs_kesehatan_filename,
                  filepath: userData.no_bpjs_kesehatan_filepath,
                  mimetype: userData.no_bpjs_kesehatan_mimetype,
                  filesize: userData.no_bpjs_kesehatan_filesize
                }
              }));
            }
            
            // Check for BPJS TK file
            if (userData.no_bpjs_tk_filename) {
              setExistingFiles(prev => ({
                ...prev,
                no_bpjs_tk: {
                  filename: userData.no_bpjs_tk_filename,
                  filepath: userData.no_bpjs_tk_filepath,
                  mimetype: userData.no_bpjs_tk_mimetype,
                  filesize: userData.no_bpjs_tk_filesize
                }
              }));
            }
            
            // Check for Rekening file
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
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika field tanggal diubah, tangani dengan benar
    if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir') {
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
          [name]: `Invalid date format or date does not exist in the calendar`
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

  // Handle currency input changes (untuk field uang/gaji/tunjangan)
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    // Terima string kosong atau angka dengan maksimal 2 desimal
    if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const numericFields = [
    'tahun_masuk', 'tahun_keluar', 'usia', 
    'gaji_pokok', 'gaji_terupdate', 't_variabel', 't_makan', 't_transport', 
    't_pulsa', 't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis', 
    't_posisi', 't_offshore', 't_lapangan_perhari', 't_onshore', 
    't_onshore_eksp', 't_warehouse_office', 't_proyek', 't_karantina', 
    'tunjangan_lembur', 't_supervisor'
  ];
  

  // Handle file changes
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, [type]: 'Unsupported file type' }));
        return;
      }
      
      setFiles(prev => ({ ...prev, [type]: file }));
      setFileNames(prev => ({ ...prev, [type]: file.name }));
      
      if (errors[type]) setErrors(prev => ({ ...prev, [type]: null }));
    }
  };

   // Fungsi untuk mengubah nilai menjadi null jika kosong (untuk field numeric)
  const prepareNumericData = (data) => {
    const preparedData = { ...data };
    
    // Konversi field numeric kosong menjadi null
    numericFields.forEach(field => {
      if (preparedData[field] === '' || preparedData[field] === undefined) {
        preparedData[field] = null;
      } else if (preparedData[field] !== null) {
        // Konversi string ke number jika ada nilai
        preparedData[field] = Number(preparedData[field]);
      }
    });
    return preparedData;
  };

   // Validate form
  const validateForm = () => {
  try {
    const newErrors = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = `${field.replace(/_/g, ' ')} Required field`;
      }
    });

    // Validasi format tanggal
    const dateFields = ['kontrak_awal', 'kontrak_akhir'];
    dateFields.forEach(field => {
      if (formData[field] && typeof formData[field] === 'string') {
        // Jika format DD/MM/YYYY, validasi format
        if (formData[field].includes('/')) {
          if (!isValidDDMMYYYY(formData[field])) {
            newErrors[field] = `Invalid format for ${field.replace(/_/g, ' ')} (DD/MM/YYYY)`;
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
    if (isRestoring) {
      // Cek apakah nomor kontrak telah diubah
      if (formData.no_kontrak === originalData.no_kontrak) {
        newErrors.no_kontrak = 'To restore the employee, you must change the contract number';
      }
      
      // Cek apakah tanggal akhir kontrak telah diubah
      if (formData.kontrak_akhir === originalData.kontrak_akhir) {
        newErrors.kontrak_akhir = 'To restore the employee, you must change the contract end date';
      }
    }
    
    // Validasi field-field khusus
    ['no_bpjs_kesehatan', 'no_bpjs_tk', 'no_ktp', 'no_kk', 'npwp'].forEach(field => {
      if (formData[field]) {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  } catch (error) {
    console.error("Error dalam validasi form:", error);
    setMessage({
      text: `An error occurred during validation: ${error.message}`,
      type: 'error'
    });
    return false;
  }
  };

  const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  // Jika field tanggal diubah, tangani dengan benar
  if (name === 'kontrak_awal' || name === 'kontrak_akhir' || name === 'tanggal_lahir') {
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
  else if (['no_bpjs_kesehatan', 'no_bpjs_tk', 'no_ktp', 'no_kk', 'npwp'].includes(name)) {
    // Cek panjang maksimum untuk field tertentu
    const maxLengths = {
      'no_bpjs_kesehatan': 13,
      'no_bpjs_tk': 11,
      'no_ktp': 16,
      'no_kk': 16,
      'npwp': 16
    };
    
    // Hanya lanjutkan jika belum melebihi panjang maksimum
    if (maxLengths[name] && value.length > maxLengths[name]) return;
    
    // Untuk no_ktp, no_kk, npwp hanya izinkan angka
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
    const error = validateField(name, value);
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

  const validateField = (name, value) => {
  let error = '';
  
  if (name === 'no_bpjs_kesehatan' && value) {
    if (value.length > 0 && value.length !== 13) {
      error = 'BPJS Health must consist of 13 characters';
    }
    // Menghapus validasi yang hanya memperbolehkan angka
  }
  
  if (name === 'no_bpjs_tk' && value) {
    if (value.length > 0 && value.length !== 11) {
      error = 'BPJS Social Security must consist of 11 characters';
    }
    // Menghapus validasi yang hanya memperbolehkan angka
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
  
  if (name === 'npwp' && value) {
    if (value.length > 0 && value.length !== 15 && value.length !== 16) {
      error = 'NPWP Number must be 15–16 digits';
    } else if (!/^\d+$/.test(value)) {
      error = 'NPWP Number must contain only numbers';
    }
  }
  
  return error;
  };

   // Handle form submission
   const handleSubmit = async (e) => {
    e.preventDefault();
    
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
            // Ubah semua format ke YYYY-MM-DD tanpa menggunakan objek Date
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
        

        // GUNAKAN api INSTANCE yang telah dikonfigurasi dengan baseURL
        let response;
        if (isEditMode) {
          response = await api.put(endpoint, dataToSubmit);
        } else {
          response = await api.post(endpoint, dataToSubmit);
        }
        

        // PENTING: Dapatkan userId yang benar dari response
        const userIdForFiles = isEditMode ? userId : response.data.id || response.data.data?.id;

        // Jika ada userId valid, upload file
        if (userIdForFiles && userIdForFiles !== 'undefined' && userIdForFiles !== undefined) {
          // Check if there are files to upload
          const hasFilesToUpload = Object.values(files).some(file => file !== null);
          
          if (hasFilesToUpload) {
            try {
              const uploadResult = await uploadFiles(userIdForFiles);
              
              if (!uploadResult.success) {
                // Tampilkan pesan warning jika beberapa file gagal
                setMessage({
                  text: uploadResult.message || 'Data saved, but some files failed to upload.',
                  type: 'warning'
                });
              } else {
              }
            } catch (fileError) {
              // Tetap lanjutkan karena user sudah dibuat, hanya file yang gagal
              setMessage({
                text: 'Data saved, but an error occurred while uploading the file.',
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
            nama_lengkap: '',
            no_kontrak: '',
            kontrak_awal: '',
            kontrak_akhir: '',
            // ... reset field lainnya
          });
  
          setFiles({
            cv: null,
            ijazah: null,
            sertifikat: null,
            pkwt: null
          });
          
          setFileNames({
            cv: '',
            ijazah: '',
            sertifikat: '',
            pkwt: ''
          });

          setExistingFiles({
            cv: null,
            ijazah: null,
            sertifikat: null,
            pkwt: null
          });
          
          // Reset deleted files state
          setDeletedFiles({
            cv: false,
            ijazah: false,
            sertifikat: false,
            pkwt: false
          });

          // Reset file input elements
          if (fileInputRefCV.current) fileInputRefCV.current.value = '';
          if (fileInputRefIjazah.current) fileInputRefIjazah.current.value = '';
          if (fileInputRefSertifikat.current) fileInputRefSertifikat.current.value = '';
          if (fileInputRefPKWT.current) fileInputRefPKWT.current.value = '';
        }
        
        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
  
        // Tampilkan pesan error yang lebih detail
        if (error.response) {
          setErrorMessage(error.response.data?.message || `An error occurred (${error.response.status}): ${error.response.statusText}`);
        } else if (error.request) {
          setErrorMessage('No response from server. Please check your network connection.');
        } else {
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
  // Validasi userId
  if (!userId || userId === 'undefined' || userId === undefined) {
    throw new Error('Invalid User ID for file upload');
  }

  const fileTypes = [
    'cv', 'ijazah', 'sertifikat', 'pkwt',
    'no_ktp', 'no_kk', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_tk', 'no_rekening'
  ];
  
  // Hapus variabel uploadPromises yang tidak digunakan
  const uploadResults = [];
  
  // Log untuk debug
  
  for (const type of fileTypes) {
    if (files[type]) {
      const formData = new FormData();
      formData.append('file', files[type]);
      
      
      try {
        // Gunakan timeout yang lebih panjang untuk mengatasi masalah jaringan
        const response = await api.post(
          `/users/${userId}/upload/${type}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 detik timeout
          }
        );
        
        uploadResults.push({
          type,
          success: true,
          data: response.data
        });
      } catch (error) {
        console.error(`Error while uploading file ${type}:`, error);
        uploadResults.push({
          type,
          success: false,
          error: error.message || 'Unknown error'
        });
        // Lanjutkan dengan file berikutnya
      }
    }
  }
  
  // Periksa file yang gagal
  const failedUploads = uploadResults.filter(result => !result.success);
  if (failedUploads.length > 0) {
    // Tampilkan error tapi jangan throw exception agar tidak mengganggu proses lain
    return {
      success: uploadResults.some(r => r.success),
      message: `${failedUploads.length} File failed to upload, but user data has been saved`,
      failedUploads
    };
  }
  
  return {
    success: true,
    message: "All files uploaded successfully",
    results: uploadResults
  };
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
        text: `Failed to download file ${type}`,
        type: 'error'
      });
    }
  };

  // Fungsi untuk menghapus file
  const deleteFile = async (type) => {
    try {
      if (userId) {
        // Mode 1: Hapus file dari server jika user sudah ada
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
          if (type === 'cv' && fileInputRefCV.current) {
            fileInputRefCV.current.value = '';
          } else if (type === 'ijazah' && fileInputRefIjazah.current) {
            fileInputRefIjazah.current.value = '';
          } else if (type === 'sertifikat' && fileInputRefSertifikat.current) {
            fileInputRefSertifikat.current.value = '';
          }
          else if (type === 'pkwt' && fileInputRefPKWT.current) {
            fileInputRefPKWT.current.value = '';
          }
          
          setMessage({
            text: `File ${type} Successfully deleted`,
            type: 'success'
          });
        } else {
          throw new Error(response.data?.message || 'Failed to delete file');
        }
      } else {
        // Mode 2: Hapus file lokal jika user belum ada (mode tambah)
        setExistingFiles(prev => ({
          ...prev,
          [type]: null
        }));
        
        setFileNames(prev => ({
          ...prev,
          [type]: ''
        }));
        
        // Tandai file sebagai dihapus untuk operasi submit
        setDeletedFiles(prev => ({
          ...prev,
          [type]: true
        }));
        
        // Reset file input
        setFiles(prev => ({
          ...prev,
          [type]: null
        }));
        
        // Reset file input DOM berdasarkan tipe file
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
          text: `File ${type} deleted`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error(`Error deleting ${type} file:`, error);
      
      // Failsafe: Tandai file untuk dihapus meskipun API error
      setDeletedFiles(prev => ({
        ...prev,
        [type]: true
      }));
      
      setExistingFiles(prev => ({
        ...prev,
        [type]: null
      }));
      
      setMessage({
        text: `An error occurred while deleting the file on the server. The file will be deleted upon saving.`,
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
      'Change Date',
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
    link.setAttribute('download', `History-Contract-${formData.nama_karyawan}.csv`);
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

  const handleApiError = (error) => {
    if (error.response) {
      setErrorMessage(error.response.data?.message || 'An error occurred while fetching data');
    } else if (error.request) {
      setErrorMessage('No response from the server');
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
              <p className="text-gray-400 text-sm mt-1">
                The history will appear once you change the contract data
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Old Contract No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Old Contract Start
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Old Contract End
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Contract No.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Contract Start
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Contract End
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedHistory.map((history, index) => (
                    <tr
                      key={history.id || index}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(
                          history.tanggal_perubahan || history.waktu_perubahan
                        ).toLocaleString()}
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
        navigate('/elnusa-edit', {
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
          {/* Employee Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_karyawan">
              Employee Name <span className="text-red-500">*</span>
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

          {/* HSE Status */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hse">
              HSE Status
            </label>
            <select
              className={`shadow appearance-none border ${errors.hse ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="hse"
              value={formData.hse || ''}
              onChange={handleChange}
            >
              {hseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.hse && <p className="text-red-500 text-xs italic mt-1">{errors.hse}</p>}
          </div>
  
          {/* Date of Birth */}
          <div>
            <label
              className={`block text-gray-700 text-sm font-bold mb-2 ${
                isEditMode ? 'text-blue-700' : ''
              }`}
              htmlFor="tanggal_lahir"
            >
              Date of Birth <span className="text-red-500">*</span>
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
                type="text" // Use text type for DD/MM/YYYY format
                name="tanggal_lahir"
                placeholder="DD/MM/YYYY"
                value={formData.tanggal_lahir ? formatDateToDDMMYYYY(formData.tanggal_lahir) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow DD/MM/YYYY format
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
  
          {/* Age */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="usia">
              Age
            </label>
            <input
              className={`shadow appearance-none border ${errors.usia ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="usia"
              placeholder="Enter age"
              value={formData.usia || ''}
              onChange={handleNumberChange}
            />
            {errors.usia && <p className="text-red-500 text-xs italic mt-1">{errors.usia}</p>}
          </div>
  
          {/* Religion */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="agama">
              Religion
            </label>
            <select
              className={`shadow appearance-none border ${errors.agama ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="agama"
              value={formData.agama || ''}
              onChange={handleChange}
            >
              {agamaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.agama && <p className="text-red-500 text-xs italic mt-1">{errors.agama}</p>}
          </div>
  
          {/* Marital Status */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status_perkawinan">
              Marital Status
            </label>
            <select
              className={`shadow appearance-none border ${errors.status_perkawinan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="status_perkawinan"
              value={formData.status_perkawinan || ''}
              onChange={handleChange}
            >
              {statusPerkawinanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status_perkawinan && <p className="text-red-500 text-xs italic mt-1">{errors.status_perkawinan}</p>}
          </div>
  
          {/* Complete Domicile Address */}
          <div className="md:col-span-3">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamat_lengkap_domisili">
            Domicile Address
            </label>
            <textarea
              className={`shadow appearance-none border ${errors.alamat_lengkap_domisili ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              name="alamat_lengkap_domisili"
              rows="3"
              placeholder="Enter domicile address"
              value={formData.alamat_lengkap_domisili || ''}
              onChange={handleChange}
            ></textarea>
            {errors.alamat_lengkap_domisili && <p className="text-red-500 text-xs italic mt-1">{errors.alamat_lengkap_domisili}</p>}
          </div>
  
          {/* Email Address */}
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
  
          {/* Phone Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomor_telepon">
              Phone Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.nomor_telepon ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nomor_telepon"
              placeholder="Enter phone number"
              value={formData.nomor_telepon || ''}
              onChange={handleNumberChange}
            />
            {errors.nomor_telepon && <p className="text-red-500 text-xs italic mt-1">{errors.nomor_telepon}</p>}
          </div>
  
          {/* Emergency Phone Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nomor_telepon_darurat">
              Emergency Phone Number
            </label>
            <input
              className={`shadow appearance-none border ${errors.nomor_telepon_darurat ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nomor_telepon_darurat"
              placeholder="Enter emergency phone number"
              value={formData.nomor_telepon_darurat || ''}
              onChange={handleNumberChange}
            />
            {errors.nomor_telepon_darurat && <p className="text-red-500 text-xs italic mt-1">{errors.nomor_telepon_darurat}</p>}
          </div>
  
          {/* Emergency Contact Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_telepon_darurat">
              Emergency Contact Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_telepon_darurat ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_telepon_darurat"
              placeholder="Enter emergency contact name"
              value={formData.nama_telepon_darurat || ''}
              onChange={handleChange}
            />
            {errors.nama_telepon_darurat && <p className="text-red-500 text-xs italic mt-1">{errors.nama_telepon_darurat}</p>}
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
              name="jabatan"
              placeholder="Enter position"
              value={formData.jabatan || ''}
              onChange={handleChange}
            />
            {errors.jabatan && <p className="text-red-500 text-xs italic mt-1">{errors.jabatan}</p>}
          </div>
  
          {/* Vendor ID */}
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
              onChange={handleNumberChange}
            />
            {errors.nik_vendor && <p className="text-red-500 text-xs italic mt-1">{errors.nik_vendor}</p>}
          </div>
  
          {/* Elnusa ID */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nik_elnusa">
              Elnusa ID
            </label>
            <input
              className={`shadow appearance-none border ${errors.nik_elnusa ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nik_elnusa"
              placeholder="Enter Elnusa ID"
              value={formData.nik_elnusa || ''}
              onChange={handleNumberChange}
            />
            {errors.nik_elnusa && <p className="text-red-500 text-xs italic mt-1">{errors.nik_elnusa}</p>}
          </div>
  
          {/* Contract Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_kontrak">
              Contract Number {isEditMode && <span className="text-blue-500 text-xs">(Changes will be added to history)</span>}
            </label>
            <input
              className={`shadow appearance-none border ${errors.no_kontrak ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
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
              {isEditMode && <span className="text-blue-500 text-xs ml-1">(Changes will be added to history)</span>}
            </label>
            {/* Changed from type="date" to the following */}
            <div className="relative">
              <input
                className={`shadow appearance-none border ${errors.kontrak_awal ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text" // Use text type for DD/MM/YYYY format
                name="kontrak_awal"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_awal ? formatDateToDDMMYYYY(formData.kontrak_awal) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow DD/MM/YYYY format
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
              {isEditMode && <span className="text-blue-500 text-xs ml-1">(Changes will be added to history)</span>}
            </label>
            {/* Changed from type="date" to the following */}
            <div className="relative">
              <input
                className={`shadow appearance-none border ${
                  errors.kontrak_akhir ? 'border-red-500' : isEditMode ? 'border-blue-200' : 'border-gray-300'
                } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text" // Use text type for DD/MM/YYYY format
                name="kontrak_akhir"
                placeholder="DD/MM/YYYY"
                value={formData.kontrak_akhir ? formatDateToDDMMYYYY(formData.kontrak_akhir) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow DD/MM/YYYY format
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
          
          {/* WBS/CCTR */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="wbs_cctr">
              WBS/CCTR
            </label>
            <input
              className={`shadow appearance-none border ${errors.wbs_cctr ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="wbs_cctr"
              placeholder="Enter WBS/CCTR"
              value={formData.wbs_cctr || ''}
              onChange={handleChange}
            />
            {errors.wbs_cctr && <p className="text-red-500 text-xs italic mt-1">{errors.wbs_cctr}</p>}
          </div>
  
          {/* Project */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="proyek">
              Project
            </label>
            <input
              className={`shadow appearance-none border ${errors.proyek ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="proyek"
              placeholder="Enter Project"
              value={formData.proyek || ''}
              onChange={handleChange}
            />
            {errors.proyek && <p className="text-red-500 text-xs italic mt-1">{errors.proyek}</p>}
          </div>
  
          {/* Unit */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="unit">
              Unit
            </label>
            <input
              className={`shadow appearance-none border ${errors.unit ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="unit"
              placeholder="Enter Unit"
              value={formData.unit || ''}
              onChange={handleChange}
            />
            {errors.unit && <p className="text-red-500 text-xs italic mt-1">{errors.unit}</p>}
          </div>
  
          {/* Temp Unit */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="unit_temp">
              Temp Unit
            </label>
            <input
              className={`shadow appearance-none border ${errors.unit_temp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="unit_temp"
              placeholder="Enter Temp Unit"
              value={formData.unit_temp || ''}
              onChange={handleChange}
            />
            {errors.unit_temp && <p className="text-red-500 text-xs italic mt-1">{errors.unit_temp}</p>}
          </div>
  
          {/* Reception Location */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lokasi_penerimaan">
              Reception Location
            </label>
            <input
              className={`shadow appearance-none border ${errors.lokasi_penerimaan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="lokasi_penerimaan"
              placeholder="Enter Reception Location"
              value={formData.lokasi_penerimaan || ''}
              onChange={handleChange}
            />
            {errors.lokasi_penerimaan && <p className="text-red-500 text-xs italic mt-1">{errors.lokasi_penerimaan}</p>}
          </div>
  
          {/* User Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="user_name">
              User Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.user_name ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="user_name"
              placeholder="Enter User Name"
              value={formData.user_name || ''}
              onChange={handleChange}
            />
            {errors.user_name && <p className="text-red-500 text-xs italic mt-1">{errors.user_name}</p>}
          </div>
  
          {/* Employee Status */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status_karyawan">
              Employee Status
            </label>
            <input
              className={`shadow appearance-none border ${errors.status_karyawan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="status_karyawan"
              placeholder="Enter Employee Status"
              value={formData.status_karyawan || ''}
              onChange={handleChange}
            />
            {errors.status_karyawan && <p className="text-red-500 text-xs italic mt-1">{errors.status_karyawan}</p>}
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
          {/* Highest Education */}
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
  
          {/* Name of Educational Institution */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_instansi_pendidikan">
              Name of Educational Institution
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_instansi_pendidikan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_instansi_pendidikan"
              placeholder="Enter Institution Name"
              value={formData.nama_instansi_pendidikan || ''}
              onChange={handleChange}
            />
            {errors.nama_instansi_pendidikan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_instansi_pendidikan}</p>}
          </div>
  
          {/* Major/Field of Study */}
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
  
          {/* Start Year */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tahun_masuk">
              Year of Entry
            </label>
            <input
              className={`shadow appearance-none border ${errors.tahun_masuk ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="tahun_masuk"
              placeholder="Enter Year of Entry"
              value={formData.tahun_masuk || ''}
              onChange={handleNumberChange}
            />
            {errors.tahun_masuk && <p className="text-red-500 text-xs italic mt-1">{errors.tahun_masuk}</p>}
          </div>
  
          {/* End Year */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tahun_keluar">
              Year of Exit
            </label>
            <input
              className={`shadow appearance-none border ${errors.tahun_keluar ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="tahun_keluar"
              placeholder="Enter Year of Exit"
              value={formData.tahun_keluar || ''}
              onChange={handleNumberChange}
            />
            {errors.tahun_keluar && <p className="text-red-500 text-xs italic mt-1">{errors.tahun_keluar}</p>}
          </div>
        </div>

        {/* Tombol di samping End Year */}
        {userId && (
          <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
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
        
        {/* File Upload Section */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

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
                maxLength={16} // Membatasi panjang input
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
            <small className="text-gray-500 mt-1">Must be 16 digits (numbers only).</small>
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
                maxLength={16} // Membatasi panjang input
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
            <small className="text-gray-500 mt-1">Must be 16 digits (numbers only).</small>
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
                maxLength={16} // Membatasi panjang input
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
            <small className="text-gray-500 mt-1">Must be 15-16 digits (numbers only).</small>
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
                maxLength={13} // Membatasi panjang input
              />
              <label className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 cursor-pointer">
                <FontAwesomeIcon icon={faUpload} className="text-gray-500" />
                <input
                  ref={fileInputRefBPJSKesehatan}
                  type="file"
                  name="no_bpjs_kesehatan"
                  onChange={(e) => handleFileChange(e, 'no_bpjs_kesehatan')}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
            {errors.no_bpjs_kesehatan && <p className="text-red-500 text-xs italic mt-1">{errors.no_bpjs_kesehatan}</p>}
            <small className="text-gray-500 mt-1">Maximum 13 characters. Can include letters and numbers.</small>
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
  
          {/* Health Insurance Details */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keterangan_bpjs_kesehatan">
              BPJS Health Details
            </label>
            <input
              className={`shadow appearance-none border ${errors.keterangan_bpjs_kesehatan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="keterangan_bpjs_kesehatan"
              placeholder="Enter BPJS Health Details"
              value={formData.keterangan_bpjs_kesehatan || ''}
              onChange={handleChange}
            />
            {errors.keterangan_bpjs_kesehatan && <p className="text-red-500 text-xs italic mt-1">{errors.keterangan_bpjs_kesehatan}</p>}
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
                placeholder="Enter BPJS Social Security"
                value={formData.no_bpjs_tk || ''}
                onChange={handleInputChange}
                maxLength={11} // Membatasi panjang input
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
            <small className="text-gray-500 mt-1">Maximum 11 characters. Can include letters and numbers.</small>
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
  
          {/* Employment Insurance Details */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keterangan_bpjs_tk">
              BPJS Social Security Details
            </label>
            <input
              className={`shadow appearance-none border ${errors.keterangan_bpjs_tk ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="keterangan_bpjs_tk"
              placeholder="Enter BPJS Social Security Details"
              value={formData.keterangan_bpjs_tk || ''}
              onChange={handleChange}
            />
            {errors.keterangan_bpjs_tk && <p className="text-red-500 text-xs italic mt-1">{errors.keterangan_bpjs_tk}</p>}
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
  
          {/* Insurance Benefits */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hak_asuransi">
              Insurance Benefits
            </label>
            <input
              className={`shadow appearance-none border ${errors.hak_asuransi ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="hak_asuransi"
              placeholder="Enter Insurance Benefits"
              value={formData.hak_asuransi || ''}
              onChange={handleChange}
            />
            {errors.hak_asuransi && <p className="text-red-500 text-xs italic mt-1">{errors.hak_asuransi}</p>}
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
          {/* Account Holder Name */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nama_pemilik_buku_tabungan">
              Bank Account Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.nama_pemilik_buku_tabungan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="nama_pemilik_buku_tabungan"
              placeholder="Enter Bank Name"
              value={formData.nama_pemilik_buku_tabungan || ''}
              onChange={handleChange}
            />
            {errors.nama_pemilik_buku_tabungan && <p className="text-red-500 text-xs italic mt-1">{errors.nama_pemilik_buku_tabungan}</p>}
          </div>
  
          {/* Account Number */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="no_rekening">
            Bank Account
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
                  ref={fileInputRefRekening}
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
  
          {/* Issuing Bank */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bank_penerbit">
              Bank Name
            </label>
            <input
              className={`shadow appearance-none border ${errors.bank_penerbit ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="bank_penerbit"
              placeholder="Enter Issuing Bank"
              value={formData.bank_penerbit || ''}
              onChange={handleChange}
            />
            {errors.bank_penerbit && <p className="text-red-500 text-xs italic mt-1">{errors.bank_penerbit}</p>}
          </div>
  
          {/* Honorarium */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="honorarium">
              Honorarium
            </label>
            <input
              className={`shadow appearance-none border ${errors.honorarium ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="honorarium"
              placeholder="Enter Honorarium"
              value={formData.honorarium || ''}
              onChange={handleNumberChange}
            />
            {errors.honorarium && <p className="text-red-500 text-xs italic mt-1">{errors.honorarium}</p>}
          </div>
  
          {/* Basic Salary */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gaji_pokok">
              Basic Salary
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                Rp
              </span>
              <input
                className={`shadow appearance-none border ${errors.gaji_pokok ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                type="text"
                name="gaji_pokok"
                placeholder="0.00"
                value={formData.gaji_pokok || ''}
                onChange={handleNumberChange}
              />
            </div>
            {errors.gaji_pokok && <p className="text-red-500 text-xs italic mt-1">{errors.gaji_pokok}</p>}
            <p className="text-gray-400 text-xs mt-1">Format: numbers without thousand separators (e.g: 5000000.00)</p>
          </div>
  
          {/* Updated Salary */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gaji_terupdate">
              Updated Salary
            </label>
            <input
              className={`shadow appearance-none border ${errors.gaji_terupdate ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="gaji_terupdate"
              placeholder="Enter Updated Salary"
              value={formData.gaji_terupdate || ''}
              onChange={handleNumberChange}
            />
            {errors.gaji_terupdate && <p className="text-red-500 text-xs italic mt-1">{errors.gaji_terupdate}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Render allowances data section
  const renderAllowancesDataSection = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Allowance Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Variable Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_variabel">
              Variable Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_variabel ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_variabel"
              placeholder="Enter Variable Allowance"
              value={formData.t_variabel || ''}
              onChange={handleNumberChange}
            />
            {errors.t_variabel && <p className="text-red-500 text-xs italic mt-1">{errors.t_variabel}</p>}
          </div>
  
          {/* Meal Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_makan">
              Meal Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_makan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_makan"
              placeholder="Enter Meal Allowance"
              value={formData.t_makan || ''}
              onChange={handleNumberChange}
            />
            {errors.t_makan && <p className="text-red-500 text-xs italic mt-1">{errors.t_makan}</p>}
          </div>
  
          {/* Transportation Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_transport">
              Transportation Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_transport ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_transport"
              placeholder="Enter Transportation Allowance"
              value={formData.t_transport || ''}
              onChange={handleNumberChange}
            />
            {errors.t_transport && <p className="text-red-500 text-xs italic mt-1">{errors.t_transport}</p>}
          </div>

          {/* Allowance Quarantine */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_karantina">
              Allowance Quarantine
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_karantina ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_transport"
              placeholder="Enter Allowance Quarantine"
              value={formData.t_karantina || ''}
              onChange={handleNumberChange}
            />
            {errors.t_karantina && <p className="text-red-500 text-xs italic mt-1">{errors.t_karantina}</p>}
          </div>
  
          {/* Phone Credit Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_pulsa">
              Phone Credit Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_pulsa ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_pulsa"
              placeholder="Enter Phone Credit Allowance"
              value={formData.t_pulsa || ''}
              onChange={handleNumberChange}
            />
            {errors.t_pulsa && <p className="text-red-500 text-xs italic mt-1">{errors.t_pulsa}</p>}
          </div>
  
          {/* Specialist Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_specialis">
              Specialist Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_specialis ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_specialis"
              placeholder="Enter Specialist Allowance"
              value={formData.t_specialis || ''}
              onChange={handleNumberChange}
            />
            {errors.t_specialis && <p className="text-red-500 text-xs italic mt-1">{errors.t_specialis}</p>}
          </div>
  
          {/* Field Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_lapangan">
              Field Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_lapangan ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_lapangan"
              placeholder="Enter Field Allowance"
              value={formData.t_lapangan || ''}
              onChange={handleNumberChange}
            />
            {errors.t_lapangan && <p className="text-red-500 text-xs italic mt-1">{errors.t_lapangan}</p>}
          </div>
  
          {/* Daily Field Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_lapangan_perhari">
              Daily Field Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_lapangan_perhari ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_lapangan_perhari"
              placeholder="Enter Daily Field Allowance"
              value={formData.t_lapangan_perhari || ''}
              onChange={handleNumberChange}
            />
            {errors.t_lapangan_perhari && <p className="text-red-500 text-xs italic mt-1">{errors.t_lapangan_perhari}</p>}
          </div>
  
          {/* Position Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_posisi">
              Position Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_posisi ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_posisi"
              placeholder="Enter Position Allowance"
              value={formData.t_posisi || ''}
              onChange={handleNumberChange}
            />
            {errors.t_posisi && <p className="text-red-500 text-xs italic mt-1">{errors.t_posisi}</p>}
          </div>
  
          {/* Offshore Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_offshore">
              Offshore Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_offshore ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_offshore"
              placeholder="Enter Offshore Allowance"
              value={formData.t_offshore || ''}
              onChange={handleNumberChange}
            />
            {errors.t_offshore && <p className="text-red-500 text-xs italic mt-1">{errors.t_offshore}</p>}
          </div>
  
          {/* Onshore Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_onshore">
              Onshore Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_onshore ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_onshore"
              placeholder="Enter Onshore Allowance"
              value={formData.t_onshore || ''}
              onChange={handleNumberChange}
            />
            {errors.t_onshore && <p className="text-red-500 text-xs italic mt-1">{errors.t_onshore}</p>}
          </div>
  
          {/* Onshore Expert Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_onshore_eksp">
              Onshore Expert Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_onshore_eksp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_onshore_eksp"
              placeholder="Enter Onshore Expert Allowance"
              value={formData.t_onshore_eksp || ''}
              onChange={handleNumberChange}
            />
            {errors.t_onshore_eksp && <p className="text-red-500 text-xs italic mt-1">{errors.t_onshore_eksp}</p>}
          </div>
  
          {/* Warehouse Office Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_warehouse_office">
              Warehouse Office Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_warehouse_office ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_warehouse_office"
              placeholder="Enter Warehouse Office Allowance"
              value={formData.t_warehouse_office || ''}
              onChange={handleNumberChange}
            />
            {errors.t_warehouse_office && <p className="text-red-500 text-xs italic mt-1">{errors.t_warehouse_office}</p>}
          </div>
  
          {/* Project Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_proyek">
              Project Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_proyek ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_proyek"
              placeholder="Enter Project Allowance"
              value={formData.t_proyek || ''}
              onChange={handleNumberChange}
            />
            {errors.t_proyek && <p className="text-red-500 text-xs italic mt-1">{errors.t_proyek}</p>}
          </div>
  
          {/* Supervisor Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="t_supervisor">
              Supervisor Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.t_supervisor ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="t_supervisor"
              placeholder="Enter Supervisor Allowance"
              value={formData.t_supervisor || ''}
              onChange={handleNumberChange}
            />
            {errors.t_supervisor && <p className="text-red-500 text-xs italic mt-1">{errors.t_supervisor}</p>}
          </div>
  
          {/* Overtime Allowance */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tunjangan_lembur">
              OT Allowance
            </label>
            <input
              className={`shadow appearance-none border ${errors.tunjangan_lembur ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="tunjangan_lembur"
              placeholder="Enter Overtime Allowance"
              value={formData.tunjangan_lembur || ''}
              onChange={handleNumberChange}
            />
            {errors.tunjangan_lembur && <p className="text-red-500 text-xs italic mt-1">{errors.tunjangan_lembur}</p>}
          </div>
  
          {/* Automatic Overtime */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lemburan_otomatis">
              Automatic Overtime
            </label>
            <input
              className={`shadow appearance-none border ${errors.lemburan_otomatis ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="lemburan_otomatis"
              placeholder="Enter Automatic Overtime"
              value={formData.lemburan_otomatis || ''}
              onChange={handleNumberChange}
            />
            {errors.lemburan_otomatis && <p className="text-red-500 text-xs italic mt-1">{errors.lemburan_otomatis}</p>}
          </div>
  
          {/* Take-Home Pay */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="thp">
              TH Pay
            </label>
            <input
              className={`shadow appearance-none border ${errors.thp ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              type="text"
              name="thp"
              placeholder="Enter Take-Home Pay"
              value={formData.thp || ''}
              onChange={handleNumberChange}
            />
            {errors.thp && <p className="text-red-500 text-xs italic mt-1">{errors.thp}</p>}
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
                      ? 'User Data Restoration Form' 
                      : 'User Data Edit Form'
                    : 'Add User Data Form'
                  }
                </h2>
                
                {/* Show messages */}
                {message.text && (
                  <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                            <li className="mb-1">Update the <span className="font-bold">Contract Start Date</span> (if necessary)</li>
                            <li className="mb-1">Update the <span className="font-bold">Contract End Date</span> (must be after today)</li>
                          </ol>
                          <p className="mt-2">Previous Non-Active reason: <span className="font-bold">{originalData.sebab_na || '-'}</span></p>
                          <p className="mt-2 text-xs">Contract changes will be saved in history</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
  
                {/* Display sebab_na field in read-only mode if in edit mode and not restoration mode */}
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
                    {/* Show restoration message */}
                    {isRestoreMode && (
                      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4">
                        <strong className="font-bold">Attention!</strong>
                        <p className="block sm:inline"> 
                          You are restoring an inactive employee's data. To restore, make sure the contract end date is in the future.
                        </p>
                      </div>
                    )}
                    
                    {/* Data Sections */}
                    {renderPersonalDataSection()}
                    {renderEmploymentDataSection()}
                    {renderEducationDataSection()}
                    {renderAdministrationDataSection()}
                    {renderFinancialDataSection()}
                    {renderAllowancesDataSection()}
                    
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
                        onClick={() => navigate('/elnusa-edit')}
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
            {/* ... other sections ... */}
          </main>
          
          {/* Footer*/}
          <FooterComponents/>

          {/* Modal untuk mengelola sertifikat */}
            {showSertifikatModal && (
              <SertifikatModal
                isOpen={showSertifikatModal}
                onClose={() => setShowSertifikatModal(false)}
                userId={userId}
                userName={formData.nama_karyawan}
                viewOnly={false}
                apiPrefix="elnusa" // Tambahkan apiPrefix sesuai kebutuhan
              />
            )}
        </div>
      </div>
    </div>
  )
};


export default TambahUserElnusa

          {/* <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cv">
              CV
            </label>
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  ref={fileInputRefCV}
                  className={`shadow appearance-none border ${errors.cv ? 'border-red-500' : 'border-gray-300'} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                  type="file"
                  name="cv"
                  onChange={(e) => handleFileChange(e, 'cv')}
                />
              </div>
              {fileNames.cv && <p className="text-green-600 text-xs mt-1">Selected file: {fileNames.cv}</p>}
              {existingFiles.cv && !files.cv && (
                <div className="flex items-center mt-2">
                  <p className="text-blue-600 text-xs">Current file: {existingFiles.cv.filename}</p>
                  <div className="ml-2 flex">
                    <button
                      type="button"
                      className="text-blue-500 text-xs hover:text-blue-700 mr-2"
                      onClick={() => downloadFile('cv')}
                    >
                      Download
                    </button>
                    <button
                      type="button" 
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => deleteFile('cv')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              {errors.cv && <p className="text-red-500 text-xs italic mt-1">{errors.cv}</p>}
            </div>
          </div> */}

