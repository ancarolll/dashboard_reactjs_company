import React, { useState, useEffect, useCallback } from 'react'
import AsideComponents from '../../components/AsideComponents'
import FooterComponents from '../../components/FooterComponents'
import HeaderComponents from '../../components/HeaderComponents'
import ViewTarSection from '../../components/manajemencom/ViewTarSection'
import '../../styles/main.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import LoginOverlay from '../../components/logincom/LoginOverlay';
import ManagementService from '../../service/managementService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  
  // Login overlay states
  const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [targetPage, setTargetPage] = useState('');

  // Function to load documents from API
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Menggunakan API untuk mendapatkan dokumen
      const response = await ManagementService.getAllDocuments(
        currentPage,
        perPage,
        searchTerm,
        sectionFilter === 'all' ? '' : sectionFilter
      );
      
      if (response.success) {
        setDocuments(response.data.data || []);
        setTotalEntries(response.data.pagination?.total || 0);
        
        // Load sections
        loadSections();
      } else {
        toast.error(response.message || 'Error loading documents');
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error('Failed to load documents. Please try again.');
      setDocuments([]);
      setTotalEntries(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, sectionFilter]);
  
  // Function to load sections
  const loadSections = async () => {
    try {
      const response = await ManagementService.getAllSections();
      
      if (response.success) {
        // Sort sections alphabetically
        const sortedSections = [...(response.data || [])].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setAvailableSections(sortedSections);
      } else {
        toast.error(response.message || 'Error loading sections');
      }
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error('Failed to load sections. Please try again.');
      setAvailableSections([]);
    }
  };

  // Initial load of documents
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Effect untuk dokumen yang difilter
  useEffect(() => {
    setFilteredDocuments(documents);
  }, [documents]);

  // Effect untuk filter aktif
  useEffect(() => {
    applyFilter(activeFilter);
  }, [activeFilter, documents]);

  // Effect untuk reset currentPage ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sectionFilter]);

  // Fungsi untuk menghitung selisih hari
  const getDaysDifference = (endDate) => {
    if (!endDate) return null;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(0, 0, 0, 0);
      
      const diffTime = endDateObj.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days:", e);
      return null;
    }
  };
  
  // Function to get the status and color
  const getStatusInfo = (days) => {
    if (days === null) return { text: "No Date", color: "bg-gray-100" };

    if (days <= 0) return { text: `Expired ${Math.abs(days)} days ago`, color: "bg-red-200" };
    if (days <= 45) return { text: `${days} days remaining`, color: "bg-yellow-200" };
    if (days <= 90) return { text: `${days} days remaining`, color: "bg-green-200" };
    return { text: `${days} days remaining`, color: "bg-blue-100" };
  };
  
  // Fungsi untuk filter dokumen
  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    
    if (filterType === 'all') {
      setFilteredDocuments(documents);
      return;
    }
    
    const filtered = documents.filter(doc => {
      const days = getDaysDifference(doc.akhir_berlaku);
      
      if (days === null) return false;
      
      switch (filterType) {
        case 'reminder2':
          return days > 0 && days <= 45;
        case 'reminder1':
          return days > 45 && days <= 90;
        case 'expired':
          return days <= 0;
        default:
          return true;
      }
    });
    
    setFilteredDocuments(filtered);
  };
  
  // Komponen StatBox
  const StatBox = () => {
    const totalDocuments = documents.length;
    
    const reminder2Documents = documents.filter(doc => {
      const days = getDaysDifference(doc.akhir_berlaku);
      return days !== null && days > 0 && days <= 45;
    }).length;
    
    const reminder1Documents = documents.filter(doc => {
      const days = getDaysDifference(doc.akhir_berlaku);
      return days !== null && days > 45 && days <= 90;
    }).length;
    
    const expiredDocuments = documents.filter(doc => {
      const days = getDaysDifference(doc.akhir_berlaku);
      return days !== null && days <= 0;
    }).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'all' ? 'border-2 border-blue-500' : ''}`}
          onClick={() => applyFilter('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Documents</p>
              <h3 className="text-2xl font-bold">{totalDocuments}</h3>
              <p className="text-xs text-blue-500">All Documents</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'reminder2' ? 'border-2 border-yellow-500' : ''}`}
          onClick={() => applyFilter('reminder2')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reminder 2</p>
              <h3 className="text-2xl font-bold">{reminder2Documents}</h3>
              <p className="text-xs text-yellow-600">1-45 Days Remaining</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'reminder1' ? 'border-2 border-green-500' : ''}`}
          onClick={() => applyFilter('reminder1')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reminder 1</p>
              <h3 className="text-2xl font-bold">{reminder1Documents}</h3>
              <p className="text-xs text-green-600">46-90 Days Remaining</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer ${activeFilter === 'expired' ? 'border-2 border-red-500' : ''}`}
          onClick={() => applyFilter('expired')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expired Documents</p>
              <h3 className="text-2xl font-bold">{expiredDocuments}</h3>
              <p className="text-xs text-red-500">Already Past Due Date</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle view file
  const handleViewFile = (document) => {
    if (!document.file_name) {
      toast.info('No file available for this document.');
      return;
    }
    
    const fileData = {
      id: document.id,
      title: document.title,
      fileName: document.file_name,
      fileUrl: ManagementService.getDocumentFileUrl(document.id),
      fileType: document.file_type
    };
    
    setSelectedFile(fileData);
    setShowFilePreview(true);
  };

  // Handle close preview
  const handleClosePreview = () => {
    setShowFilePreview(false);
    setSelectedFile(null);
  };

  // Handle download file
  const handleDownloadFile = (document) => {
    if (!document.file_name) {
      toast.info('No file available for this document.');
      return;
    }
    
    window.open(ManagementService.getDocumentDownloadUrl(document.id), '_blank');
  };

  // Login overlay functions
  const openLoginOverlay = (targetPage) => {
    setTargetPage(targetPage);
    setIsLoginOverlayOpen(true);
  };

  const closeLoginOverlay = () => {
    setIsLoginOverlayOpen(false);
    // Reset form fields when closing
    setUsername('');
    setPassword('');
  };

  const handleLoginClick = () => {
    // Login is handled in LoginOverlay component
    navigate(targetPage);
    closeLoginOverlay();
  };

  // Handle section filter change
  const handleSectionFilterChange = (e) => {
    setSectionFilter(e.target.value);
  };

  // Handle pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Definisi kolom tabel
  const columns = [
    {
      name: 'Status',
      selector: row => row.akhir_berlaku,
      sortable: true,
      width: '200px',
      cell: row => {
        const days = getDaysDifference(row.akhir_berlaku);
        const status = getStatusInfo(days);
        
        return (
          <div className={`px-3 py-1 rounded-full ${status.color}`}>
            {status.text}
          </div>
        );
      }
    },
    {
      name: 'No',
      selector: row => row.id,
      width: '80px',
      cell: (row, index) => {
        const pageStart = (currentPage - 1) * perPage;
        return <div className="text-indigo-600">{pageStart + index + 1}</div>;
      }
    },
    {
      name: 'Title',
      selector: row => row.title,
      sortable: true,
      width: '300px',
      cell: row => <div className="text-indigo-600">{row.title}</div>
    },
    {
      name: 'Section',
      selector: row => row.section,
      sortable: true,
      width: '150px',
      cell: row => <div className="px-2 py-1 bg-gray-100 rounded">{row.section || '-'}</div>
    },
    {
      name: 'File',
      selector: row => row.file_name,
      sortable: true,
      width: '300px',
      cell: row => (
        row.file_name ? (
          <button 
            onClick={() => handleViewFile(row)}
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            {row.file_name}
          </button>
        ) : (
          <span className="text-gray-400">No File</span>
        )
      )
    },
    {
      name: 'Upload Date',
      selector: row => row.upload_date,
      sortable: true,
      width: '150px',
      cell: row => {
        if (!row.upload_date) return '';
        const date = new Date(row.upload_date);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    },
    {
      name: 'Effective Date',
      selector: row => row.awal_berlaku,
      sortable: true,
      width: '150px',
      cell: row => {
        if (!row.awal_berlaku) return '-';
        const date = new Date(row.awal_berlaku);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    },
    {
      name: 'Expired Date',
      selector: row => row.akhir_berlaku,
      sortable: true,
      width: '150px',
      cell: row => {
        if (!row.akhir_berlaku) return '-';
        const date = new Date(row.akhir_berlaku);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    },
    {
      name: 'Actions',
      width: '80px',
      cell: row => (
        <div className="flex space-x-2">
          <button 
            onClick={() => handleDownloadFile(row)}
            className="text-green-500 hover:bg-green-100 p-2 rounded"
            title="Download"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>
      )
    }
  ];

  // React Data Table custom styles
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid #e5e7eb',
      },
    },
    rows: {
      style: {
        minHeight: '50px',
        borderBottom: '1px solid #e5e7eb',
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e5e7eb',
        marginTop: '10px',
      },
    },
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
            <div className="flex justify-center items-center mb-6">
              <h1 className="text-2xl text-center text-brown-600">DOCUMENT MANAGEMENT</h1>
            </div>
          
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <StatBox />

              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div className="md:w-1/3 mb-4 md:mb-0">
                  <label htmlFor="sectionFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Section
                  </label>
                  <select
                    id="sectionFilter"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={sectionFilter}
                    onChange={handleSectionFilterChange}
                  >
                    <option value="all">All Sections</option>
                    {availableSections.map((section) => (
                      <option key={section.id} value={section.name}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:w-1/2">
                  <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Documents
                  </label>
                  <div className="relative">
                    <input
                      id="searchTerm"
                      type="text"
                      placeholder="Search documents..."
                      className="border rounded w-full px-3 py-2 pl-10"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <div className="absolute left-3 top-2.5">
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Edit Data button with login overlay */}
              <button 
                onClick={() => openLoginOverlay('/management-edit')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded mb-4 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Data
              </button>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">
                    {sectionFilter === 'all' ? 'All Documents' : sectionFilter}
                  </h4>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading data...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border rounded-md">
                    <p>No documents found</p>
                    <p className="text-sm mt-2">Please contact admin to add new documents or modify the search filter</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredDocuments.length > 0 ? filteredDocuments : documents}
                    customStyles={customStyles}
                    conditionalRowStyles={[
                      {
                        when: row => {
                          const days = getDaysDifference(row.akhir_berlaku);
                          return days !== null && days <= 0;
                        },
                        style: {
                          backgroundColor: 'rgba(254, 202, 202, 0.5)', // Light red for expired documents
                        },
                      },
                      {
                        when: row => {
                          const days = getDaysDifference(row.akhir_berlaku);
                          return days !== null && days <= 45 && days > 0;
                        },
                        style: {
                          backgroundColor: 'rgba(254, 240, 138, 0.5)', // Light yellow for reminder 2
                        },
                      },
                      {
                        when: row => {
                          const days = getDaysDifference(row.akhir_berlaku);
                          return days !== null && days <= 90 && days > 45;
                        },
                        style: {
                          backgroundColor: 'rgba(187, 247, 208, 0.5)', // Light green for reminder 1
                        },
                      },
                    ]}
                    pagination
                    paginationServer
                    paginationTotalRows={totalEntries}
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    noHeader
                    persistTableHead
                    progressPending={loading}
                  />
                )}
              </div>
            </div>

            {/* Edit Data button with login overlay */}
              <button 
                onClick={() => openLoginOverlay('/management-edit')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded mb-4 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Data
              </button>

              <div className="mt-4">
              <ViewTarSection 
                showTitle={false} 
                customTitle="Employee MCU Data View" 
              />
            </div>

          </main>
          <FooterComponents/>
        </div>
      </div>
      
      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedFile.title}</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto mb-4 min-h-96">
              {selectedFile.fileType?.includes('pdf') ? (
                <iframe
                  src={selectedFile.fileUrl}
                  className="w-full h-full min-h-96 border"
                  title={selectedFile.title}
                ></iframe>
              ) : selectedFile.fileType?.includes('image') ? (
                <img
                  src={selectedFile.fileUrl}
                  alt={selectedFile.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-96">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-lg text-gray-600">This file cannot be displayed directly.</p>
                  <p className="mt-2 text-gray-500">{selectedFile.fileName}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <a
                href={ManagementService.getDocumentDownloadUrl(selectedFile.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Overlay */}
      {isLoginOverlayOpen && 
        <LoginOverlay
          isOpen={isLoginOverlayOpen}
          onClose={closeLoginOverlay}
          onLogin={handleLoginClick}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          targetPage={targetPage}
        />
      }
      
      {/* Toast container for notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ManagementPage