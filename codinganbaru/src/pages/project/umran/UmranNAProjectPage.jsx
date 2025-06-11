import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import '../../../styles/main.css';
import AsideComponents from '../../../components/AsideComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import FooterComponents from '../../../components/FooterComponents';
import ButtonComponents from '../../../components/ButtonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTrashCan, faRotateRight, faDownload, faFileExcel, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { faFile, faFileImage, faFileWord, faFilePdf } from '@fortawesome/free-regular-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';

// Konstanta API URL
const API_BASE_URL = 'http://localhost:3005/api';

const UmranNAProjectPage = () => {  
  // State untuk data
  const [nonActiveData, setNonActiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk UI
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [message, setMessage] = useState({text: '', type: '' });
  const navigate = useNavigate();

  // Function untuk menghitung selisih hari
  const getDaysDifference = (endDate) => {
    if (!endDate) return 0;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0);
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days:", e);
      return 0;
    }
  };

  // Fungsi untuk format waktu_sa dengan format yang konsisten
const formatWaktuSA = (dateTimeString) => {
  if (!dateTimeString) return '-';
  try {
    // Anggap waktu dari server sudah dalam timezone yang benar (WIB)
    const date = new Date(dateTimeString);
    
    // Format tanggal dan waktu dalam format Indonesia
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} | ${hours}:${minutes} WIB`;
  } catch (e) {
    console.error("Error formatting waktu_sa:", e);
    return '-';
  }
};

     // Fetch data dari API backend dan otomatis update status non-aktif jika kontrak sudah berakhir
    const fetchNonActiveData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // LANGKAH 1: Panggil endpoint check-expired untuk memeriksa dan mengupdate semua kontrak kadaluarsa
        console.log('Checking expired contracts...');
        try {
          const checkResult = await axios.get(`${API_BASE_URL}/umran/check-expired`, {
            headers: {
              'Accept': 'application/json'
            },
            timeout: 15000
          });
          
          if (checkResult.data && checkResult.data.count > 0) {
            console.log(`Found and updated ${checkResult.data.count} expired contracts`);
          } else {
            console.log('No contracts need to be updated');
          }
        } catch (checkError) {
          console.error('Failed to check expired contracts:', checkError);
          // Continue execution even if check-expired fails
        }
        
        // LANGKAH 2: Dapatkan semua data karyawan langsung dari endpoint NA khusus
        // Ini akan menggunakan query SQL yang tepat di backend
        console.log('Getting inactive employee data from specific endpoint...')
        const response = await axios.get(`${API_BASE_URL}/umran/na`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          params: {
            format: 'json'  // Meminta format JSON dari endpoint
          },
          timeout: 15000
        });
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid data format from API');
        }
        
        console.log('Inactive employee data from API:', response.data.length + ' records');
        
        // Update state dengan semua data non-aktif
        setNonActiveData(response.data || []);
        
        // LANGKAH 3: Periksa dan update karyawan dengan kontrak kedaluwarsa tapi belum punya sebab_na
        const expiredWithoutSebabNA = response.data.filter(employee => {
          if (!employee) return false;
          
          const days = getDaysDifference(employee.kontrak_akhir);
          return days < 0 && !employee.sebab_na;
        });
        
        if (expiredWithoutSebabNA.length > 0) {
          console.log(`Found ${expiredWithoutSebabNA.length} employees with expired contracts but no inactive reason`);
          
          // Update sebab_na untuk karyawan tersebut
          for (const employee of expiredWithoutSebabNA) {
            try {
              console.log(`Updating inactive reason for employee ${employee.nama_karyawan} (ID: ${employee.id})`);
              await axios.put(`${API_BASE_URL}/umran/users/${employee.id}/na`, 
                { sebab_na: 'EOC' },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                }
              );
            } catch (err) {
              console.error(`Failed to update status for ${employee.nama_karyawan}:`, err);
            }
          }
          
          // Refresh data setelah update selesai
          if (expiredWithoutSebabNA.length > 0) {
            console.log('Refreshing data after updating sebab_na...');
            const refreshResponse = await axios.get(`${API_BASE_URL}/umran/na`, {
              headers: {
                'Accept': 'application/json'
              },
              params: {
                format: 'json'
              }
            });
            
            if (refreshResponse.data && Array.isArray(refreshResponse.data)) {
              setNonActiveData(refreshResponse.data);
              console.log(`Refresh Data: ${refreshResponse.data.length} records`);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching inactive data:', err);
        setError(err.message || 'An error occurred while fetching inactive data');
        
        // Jika gagal mengambil dari endpoint /na, coba dengan metode backup
        try {
          console.log('Trying backup method to get data...');
          const backupResponse = await axios.get(`${API_BASE_URL}/umran/users`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (backupResponse.data && Array.isArray(backupResponse.data)) {
            // Filter manual di frontend sebagai fallback
            const nonActiveData = backupResponse.data.filter(employee => {
              if (!employee) return false;
              
              // Kondisi 1: Jika ada sebab_na (tidak null), user dianggap non-aktif
              if (employee.sebab_na) return true;
              
              // Kondisi 2: Atau jika kontrak sudah berakhir
              if (employee.kontrak_akhir) {
                const days = getDaysDifference(employee.kontrak_akhir);
                return days < 0;
              }
              
              return false;
            });
            
            console.log(`Backup method successful: ${nonActiveData.length} records found`);
            setNonActiveData(nonActiveData);
          }
        } catch (backupError) {
          console.error('Backup method also failed:', backupError);
        }
      } finally {
        setLoading(false);
      }
    };


  // Tambahkan fungsi ini
const manualCheckExpired = async () => {
  try {
    console.log('Running manual contract check...')
    
    // Panggil API untuk mendapatkan semua karyawan
    const response = await axios.get(`${API_BASE_URL}/umran/users`, {
      headers: { 'Accept': 'application/json' }
    });
    
    // Filter untuk karyawan dengan kontrak berakhir tapi tanpa sebab_na
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiredNoSebabNA = response.data.filter(user => {
      if (!user.kontrak_akhir) return false;
      
      const endDate = new Date(user.kontrak_akhir);
      endDate.setHours(0, 0, 0, 0);
      
      return endDate < today && !user.sebab_na;
    });
    
    console.log(`Found ${expiredNoSebabNA.length} employees with expired contracts without inactive reason`);
    
    // Update sebab_na untuk setiap karyawan yang ditemukan
    const updatePromises = expiredNoSebabNA.map(user => 
      axios.put(`${API_BASE_URL}/umran/users/${user.id}/na`, 
        { sebab_na: 'EOC' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )
    );
    
    // Tunggu semua update selesai
    const results = await Promise.allSettled(updatePromises);
    
    // Hitung yang berhasil dan gagal
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Manual update complete: ${successful} succeeded, ${failed} failed`);
      // Refresh data
    if (successful > 0) {
      fetchNonActiveData();
    }
    
    return { successful, failed };
  } catch (err) {
    console.error('Error during manual check:', err);
    return { successful: 0, failed: 0, error: err.message };
  }
};

// Panggil fungsi ini di useEffect
useEffect(() => {
  // Jalankan pengecekan check-expired standar
  fetchNonActiveData();
  
  // Jalankan pengecekan manual sebagai backup
  setTimeout(() => {
    manualCheckExpired();
  }, 3000); // Tunggu 3 detik setelah fetchNonActiveData
  
  // Interval untuk refresh data setiap 5 menit
  const refreshInterval = setInterval(() => {
    fetchNonActiveData();
  }, 5 * 60 * 1000);
  
  // Bersihkan interval saat komponen unmount
  return () => clearInterval(refreshInterval);
}, []);


  // Delete user dari backend - DIMODIFIKASI untuk menggunakan endpoint yang tersedia
  const deleteUserFromBackend = async (id) => {
    try {
      if (!id) {
        throw new Error('User ID cannot be empty');
      }
      
      // Gunakan endpoint delete yang benar
      const response = await axios.delete(`${API_BASE_URL}/umran/users/${id}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Refresh data setelah penghapusan
      fetchNonActiveData();
      
      return response.data;
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  // Restore user ke status aktif - DIMODIFIKASI untuk menggunakan endpoint yang tersedia
  const restoreUserToActive = async (id) => {
    try {
      if (!id) {
        throw new Error('User ID cannot be empty');
      }
      
      // Gunakan endpoint yang benar untuk mengubah status kembali ke aktif
      const response = await axios.put(
        `${API_BASE_URL}/umran/users/${id}/restore`, 
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      // Refresh data setelah pemulihan
      fetchNonActiveData();
      
      return response.data;
    } catch (err) {
      console.error('Error restoring user:', err);
      throw err;
    }
  };

  // Function untuk menentukan warna status
  const getStatusColor = (daysRemaining) => {
    if (daysRemaining < 0) return 'bg-(--ash-60-oppacity)'; //contrak END
    if (daysRemaining <= 14) return 'bg-red-200';
    if (daysRemaining <= 30) return 'bg-yellow-200';
    if (daysRemaining <= 45) return 'bg-green-200';
    return '';
  };

  // Fungsi untuk format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // PERBAIKAN: Format tanggal DD/MM/YYYY yang konsisten
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

   // Fungsi untuk mendapatkan ikon file yang sesuai
  const getFileIcon = (fileType) => {
    if (!fileType) return faFile;
    if (fileType.includes('pdf')) return faFilePdf;
    if (fileType.includes('image')) return faFileImage;
    if (fileType.includes('word') || fileType.includes('document')) return faFileWord;
    if (fileType.includes('excel') || fileType.includes('sheet')) return faFileExcel;
    return faFileAlt; // Default file icon
  };

  // Fungsi untuk mendapatkan nama tampilan file
  const getDisplayFileName = (fileName) => fileName ? 
    fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName : 'No File';

  const handleFilter = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filtered records based on search term
  const filteredRecords = React.useMemo(() => {
    if (!nonActiveData || !Array.isArray(nonActiveData)) return [];
    
    return nonActiveData.filter(row => {
      if (!row || typeof row !== 'object') return false;
      
      // Cari di semua kolom string
      return Object.values(row).some(value => 
        value !== null && 
        value !== undefined && 
        typeof value.toString === 'function' && 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [nonActiveData, searchTerm]);

   // Fungsi handle restore - arahkan ke halaman edit untuk semua kasus
   // Fungsi handle restore - arahkan ke halaman edit untuk mengubah kontrak
  const handleRestore = (user) => {
    if (!user || !user.id) {
      console.error("Cannot restore user: incomplete data");
      setMessage({text: "Restoration failed: incomplete user data", type: "error"});
      return;
    }

    // PERBAIKAN: Validasi data user sebelum restore
    console.log("User data before restore:", {
      id: user.id,
      nama_lengkap_karyawan: user.nama_lengkap_karyawan,
      tanggal_lahir: user.tanggal_lahir,
      kontrak_awal: user.kontrak_awal,
      kontrak_akhir: user.kontrak_akhir,
      sebab_na: user.sebab_na
    });
    
    const confirmMessage = `Are you sure you want to restore employee "${user.nama_karyawan}" to active status?
  
  IMPORTANT: 
- This action will remove the inactive reason (${user.sebab_na || '-'})
- You MUST update the contract dates and contract number to reactivate the employee
- The contract end date must be in the future`;
  
    if (window.confirm(confirmMessage)) {
      setMessage({text: "Processing restoration request...", type: "info"});
      
      try {
        // Tampilkan loading state untuk UX yang lebih baik
        setLoading(true);

        const userDataToRestore = {
        ...user,
        // Pastikan field penting ada
        nama_lengkap_karyawan: user.nama_lengkap_karyawan || user.nama_karyawan,
        tanggal_lahir: user.tanggal_lahir,
        kontrak_awal: user.kontrak_awal,
        kontrak_akhir: user.kontrak_akhir
      };
      
      console.log("Sending restore request with user data:", userDataToRestore);
        
        // Proses 2 langkah:
        // 1. Memanggil API untuk menghapus sebab_na
        // 2. Arahkan ke halaman edit setelah berhasil
        axios.put(
          `${API_BASE_URL}/umran/users/${user.id}/restore`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        )
        .then(response => {
          console.log('Successfully removed sebab_na:', response.data);
          
          let userData = response.data.data || userDataToRestore;
        
        // PERBAIKAN: Pastikan tanggal_lahir tidak hilang
        if (!userData.tanggal_lahir && userDataToRestore.tanggal_lahir) {
          userData.tanggal_lahir = userDataToRestore.tanggal_lahir;
          console.log("Restored tanggal_lahir from original data:", userData.tanggal_lahir);
        }
        
        // PERBAIKAN: Pastikan nama karyawan tidak hilang
        if (!userData.nama_lengkap_karyawan && userDataToRestore.nama_lengkap_karyawan) {
          userData.nama_lengkap_karyawan = userDataToRestore.nama_lengkap_karyawan;
        }
        
        // PERBAIKAN: Log data yang akan dikirim ke halaman edit
        console.log("Final userData for edit page:", {
          id: userData.id,
          nama_lengkap_karyawan: userData.nama_lengkap_karyawan,
          tanggal_lahir: userData.tanggal_lahir,
          kontrak_awal: userData.kontrak_awal,
          kontrak_akhir: userData.kontrak_akhir,
          sebab_na: userData.sebab_na
        });
          
          // Persiapkan pesan yang informatif untuk tampilan edit
          let instruksi = 'To reactivate the employee, you must:';
          instruksi += '\n1. Update the contract number';
          instruksi += '\n2. Update the contract start date (if needed)';
          instruksi += '\n3. Update the contract end date (must be later than today)';
          
          setMessage({text: "Restoration successful! Redirecting to edit page...", type: "success"});
          
          // Tunda navigasi untuk memberi waktu melihat pesan sukses
          setTimeout(() => {
          // PERBAIKAN: Pastikan semua data yang diperlukan dikirim
          const navigationState = {
            editMode: true,
            userData: userData,
            projectId: 'umran',
            message: instruksi,
            restored: true,
            // PERBAIKAN: Tambahkan backup data untuk keperluan debugging
            originalUser: userDataToRestore,
            restoreTimestamp: new Date().toISOString()
          };
          
          console.log("Navigation state:", navigationState);
          
          // Arahkan ke halaman edit
          navigate('/tambah-user-umran', {
            state: navigationState
          });
        }, 1500);
      })
        .catch(err => {
          console.error('Failed to call restore API:', err);
           // PERBAIKAN: Error handling yang lebih detail
        let errorMessage = 'Failed to restore employee: ';
        
        if (err.response) {
          errorMessage += err.response.data?.message || `Server error (${err.response.status})`;
        } else if (err.request) {
          errorMessage += 'No response from server. Check your connection.';
        } else {
          errorMessage += err.message;
        }
        
        setMessage({
          text: errorMessage,
          type: "error"
        });
      })
      .finally(() => {
        setLoading(false);
      });
    } catch (err) {
      console.error('Error while restoring employee:', err);
      setMessage({
        text: `Failed to process restoration: ${err.message}`,
        type: "error"
      });
      setLoading(false);
    }
  }
};

  // Handle row selection
  const handleRowSelected = (state) => {
    setSelectedRows(state.selectedRows);
  };

  // Handle multiple delete
  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      setMessage({ text: 'Please select at least one data to delete', type: 'error' });
      return;
    }
    
    if (window.confirm(`Are you sure you want to permanently delete ${selectedRows.length} selected items?`)) {
      const deletePromises = selectedRows.map(row => deleteUserFromBackend(row.id));
      
      Promise.all(deletePromises)
        .then(() => {
          setMessage({ text: `${selectedRows.length} data successfully deleted!`, type: 'success' });
          setSelectedRows([]);
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        })
        .catch(err => {
          setMessage({ text: `Failed to delete some data: ${err.message}`, type: 'error' });
        });
    }
  };

  // Handle delete all data
  const handleDeleteAll = () => {
    if (filteredRecords.length === 0) {
      setMessage({ text: 'No data to delete', type: 'error' });
      return;
    }
    
    if (window.confirm(`Are you sure you want to permanently delete all ${filteredRecords.length} records?`)) {
      const deletePromises = filteredRecords.map(row => deleteUserFromBackend(row.id));
      
      Promise.all(deletePromises)
        .then(() => {
          setMessage({ text: `${filteredRecords.length} data successfully deleted!`, type: 'success' });
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        })
        .catch(err => {
          setMessage({ text: `Failed to delete some data: ${err.message}`, type: 'error' });
        });
    }
  };
  
   // File download handler
  const downloadFile = async (userId, docType, fileName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/umran/users/${userId}/download/${docType}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `${docType}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setMessage({ 
        text: `Failed to download file: ${err.response?.statusText || err.message}`, 
        type: 'error' 
      });
    }
  };

  // Export functionality
  const exportToExcel = (dataToExport, fileName) => {
      if (!dataToExport || dataToExport.length === 0) {
        setMessage({ text: 'No data to export', type: 'error' });
        return;
      }
      
      try {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        setMessage({ text: `Data successfully exported to ${fileName}.xlsx`, type: 'success' });
      } catch (error) {
        setMessage({ text: `Export failed: ${error.message}`, type: 'error' });
      }
    };

  // Handler untuk tombol export all data
  const handleExportAllData = () => {
    if (filteredRecords.length === 0) {
      setMessage({ text: 'No data to export', type: 'error' });
      return;
    }
    exportToExcel(filteredRecords, 'all_inactive_employee_data_umran');
  };

  // Handler untuk tombol export selected data
  const handleExportSelectedData = () => {
    if (selectedRows.length === 0) {
      setMessage({ text: 'Select at least one row of data to export', type: 'error' });
      return;
    }
    exportToExcel(selectedRows, 'selected_inactive_employee_data_umran');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this data?')) {
      deleteUserFromBackend(id)
        .then(() => {
          setMessage({ text: 'Data successfully deleted!', type: 'success' });
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        })
        .catch((err) => {
          setMessage({ text: `Failed to delete data: ${err.message}`, type: 'error' });
        });
    }
  };

  // Fungsi untuk mendapatkan badge warna untuk status karyawan
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Non-Aktif':
        return 'bg-red-100 text-red-800';
      case 'Aktif':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

    // Fungsi untuk mendapatkan badge warna untuk sebab NA
    const getSebabNABadgeColor = (sebabNA) => {
      switch (sebabNA) {
        case 'EOC':
          return 'bg-yellow-100 text-yellow-800';
        case 'Resign':
          return 'bg-blue-100 text-blue-800';
        case 'Meninggal':
          return 'bg-gray-100 text-gray-800';
        case '-':
          return 'bg-gray-100 text-gray-400';
        default:
          return 'bg-purple-100 text-purple-800';
      }
    };

    // Fungsi untuk menghitung lama karyawan menjadi non-aktif
    const getDaysSinceDeactivation = (updatedAt) => {
      if (!updatedAt) return '';
      
      try {
        const updatedDate = new Date(updatedAt);
        const today = new Date();
        
        const diffTime = Math.abs(today - updatedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch (e) {
      return '';
    }
  };

    const columns = [
      {
        name: 'Aksi',
        cell: (row) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleRestore(row)}
              className="px-3 py-1 text-(--font-tar-maroon-color) rounded-md flex items-center gap-1 btn-primary">
              <FontAwesomeIcon icon={faRotateRight} /></button>
            <button
              onClick={() => handleDelete(row.id)}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1">
              <FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ),
        width: "150px"
      },
      {
        name: 'Reason NA',
        cell: row => {
          const sebabNA = row.sebab_na || '-';
          return (
            <div className={`px-3 py-1 rounded-full ${getSebabNABadgeColor(sebabNA)}`}>
              {sebabNA}
              {row.sebab_na && (
                <div className="text-xs opacity-75 mt-1">
                  {getDaysSinceDeactivation(row.updated_at)}
                </div>
              )}
            </div>
          );
        },
        sortable: true,
        width: "150px"
      },
      {
        name: 'Nonactive Time',
        selector: row => row.waktu_sa,
        cell: row => {
          if (!row.waktu_sa) return '-';
          
          return (
            <div className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
              {formatWaktuSA(row.waktu_sa)}
            </div>
          );
        },
        sortable: true,
        width: "200px"
      },
      {
        name: 'Contract',
        cell: row => {
          const daysRemaining = getDaysDifference(row.kontrak_akhir);
          const isExpired = daysRemaining < 0;
          
          return (
            <div className={`px-3 py-1 rounded-full ${getStatusColor(daysRemaining)}`}>
              {isExpired ? 
                `EOC ${Math.abs(daysRemaining)} days ago` : 
              `${daysRemaining} days remaining`
              }
              <div className="text-xs opacity-75 mt-1">
                {formatDate(row.kontrak_akhir)}
              </div>
            </div>
          );
        },
        sortable: true,
        width: "200px"
      },
      { name: 'Full Name',  selector: row => row.nama_lengkap_karyawan, sortable: true, width: "auto" },
      { name: 'Phone/WhatsApp Number',  selector: row => row.no_hp_wa_aktif, sortable: true, width: "250px" },
      { name: 'Vendor ID', selector: row => row.nik_vendor, sortable: true, width: "120px" },
      { name: 'Umran ID', selector: row => row.nik_umran, sortable: true, width: "120px" },
      { name: 'Position', selector: row => row.jabatan || '', sortable: true, width: "auto" },
      { name: 'Contract Number', selector: row => row.no_kontrak, sortable: true, width: "250px" },
      { name: 'Contract Start', selector: row => row.kontrak_awal, sortable: true, cell: row => formatDate(row.kontrak_awal),width: "250px" },
      { name: 'Contract End', selector: row => row.kontrak_akhir, sortable: true, cell: row => formatDate(row.kontrak_akhir), width: "250px" },
      { name: 'Unit', selector: row => row.unit, sortable: true,width: "250px" },
      { name: 'Project', selector: row => row.proyek, sortable: true,width: "130px" 
      }
  ];
    
    const customStyles = {
      rows: {
        style:{
          minHeight:'60px',
        },
      },
      headCells: {
        style: {
          paddingLeft: '16px',
          paddingRight: '16px',
          backgroundColor: '#802600',
          fontWeight: 'bold',
          color:'#FFFFFF' ,
        },
      },
      cells: {
        style: {
          paddingLeft: '16px',
          paddingRight: '16px',
        },
      },
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
          <Link to='/umran-edit'>
          <ButtonComponents variant="back">&lt; Back</ButtonComponents>
          </Link>
    
            {/* Main Content */}
          <main className="flex-1">
    
            <div className='flex-1 flex flex-col text-center overflow-y-auto px-6 py-3'>
              <div className="mb-4 p-4 rounded bg-blue-100 text-blue-700">
                <p className="font-bold">Inactive Employees Page</p>
                <p>This page displays all employees who have an inactive reason or contracts that have expired.</p>
                <p>To restore an employee to active status, click the Restore button and update the contract dates and contract number.</p>
              </div>
            
            {message.text && (
                <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                  <button className="float-right" onClick={() => setMessage({ text: '', type: '' })}>×</button>
                </div>
              )}
    
              <div className='flex justify-between items-center mb-4'>
                {/* Pencarian */}
                <div className='relative w-64'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center'>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className='text-gray-400'/>
                  </span>
                  <input type="text" value={searchTerm} onChange={handleFilter} placeholder="Search..." className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                    leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    transition duration-150 ease-in-out text-lg' />
                </div>
                 {/* Action Buttons */}
                 <div className='flex gap-2'>
                  <ButtonComponents 
                    variant='secondary'
                    onClick={handleExportSelectedData}
                    disabled={selectedRows.length === 0}
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                    Export Selected ({selectedRows.length})
                  </ButtonComponents>
                  <ButtonComponents 
                    variant='secondary'
                    onClick={handleExportAllData}
                    disabled={filteredRecords.length === 0}
                  >
                    <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                    Export All ({filteredRecords.length})
                  </ButtonComponents>
                </div>
              </div>
              {/* Delete Action Buttons */}
              <div className='flex justify-end gap-2 mb-4'>
                <ButtonComponents 
                  variant='danger'
                  onClick={handleDeleteSelected}
                  disabled={selectedRows.length === 0}
                >
                  <FontAwesomeIcon icon={faTrashCan} className="mr-2" />
                  Delete Selected ({selectedRows.length})
                </ButtonComponents>
                <ButtonComponents 
                  variant='danger'
                  onClick={handleDeleteAll}
                  disabled={filteredRecords.length === 0}
                >
                  <FontAwesomeIcon icon={faTrashCan} className="mr-2" />
                  Delete All ({filteredRecords.length})
                </ButtonComponents>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Loading Employee data non-aktif...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center bg-red-50 rounded">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <DataTable 
                  columns={columns}
                  data={filteredRecords}
                  selectableRows
                  onSelectedRowsChange={handleRowSelected}
                  fixedHeader
                  pagination
                  paginationPerPage={perPage}
                  paginationRowsPerPageOptions={[5, 10, 25, 50]}
                  customStyles={customStyles}
                  highlightOnHover
                  striped
                  pointerOnHover
                  responsive
                  noDataComponent={
                    <div className="p-4 text-center text-gray-500">
                      No Employee data non-aktif.
                    </div>
                  }
                />
              )}
            </div>
            </main>
            
            {/* Footer*/}
            <FooterComponents/>   
    </div>
    </div>
  </div>
)
}

export default UmranNAProjectPage