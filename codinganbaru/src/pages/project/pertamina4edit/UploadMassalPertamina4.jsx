import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowDown, faArrowUpFromBracket, faFileExcel, faXmark, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate } from 'react-router-dom';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AsideComponents from '../../../components/AsideComponents';
import FooterComponents from '../../../components/FooterComponents';
import HeaderComponents from '../../../components/HeaderComponents';
import ButtonComponents from '../../../components/ButtonComponents';
import '../../../styles/main.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

const UploadMassalPertamina4 = () => {

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState({ message: '', isSuccess: false, show: false });
    const [previewData, setPreviewData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploadResult, setUploadResult] = useState(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const [uploadCancelled, setUploadCancelled] = useState(false);
    let cancelTokenSource = null;

    // Template CSV file URL
    const templateUrl = `${API_BASE_URL}/regional4/template/csv`;

    const validateMimeType = (file) => {
        const validMimeTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/csv',
            'text/plain' // Terkadang CSV terdeteksi sebagai text/plain
        ];
        
        return validMimeTypes.includes(file.type);
    };    

    // Fungsi untuk menangani perubahan file
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadStatus({ message: '', isSuccess: false, show: false });
            setPreviewData(null);
            setValidationErrors([]);
            setUploadResult(null);
                
            // Validasi tipe file
            const validTypes = ['.csv', '.xlsx', '.xls'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

            if (!validTypes.includes(fileExtension)) {
                setUploadStatus({
                    message: 'File must be in CSV (.csv) or Excel (.xlsx, .xls) format',
                    isSuccess: false,
                    show: true
                });
                return;
            }
            
            // Preview file CSV
        if (fileExtension === '.csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                preview: 5,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        // Log hasil parsing untuk debugging
                        
                        setPreviewData(results);
                        validateCSVData(results);
                    } else {
                        setValidationErrors(['CSV file is empty or invalid']);
                    }
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    setValidationErrors([`Error parsing CSV: ${error.message}`]);
                }
            });
        } else if (['xlsx', 'xls'].includes(fileExtension.substring(1))) {
            // Add special message for Excel
            setUploadStatus({
                message: 'Excel file detected. Make sure the data format matches the template.',
                isSuccess: true,
                show: true
            });
        }
    }
};

// Fungsi validasi yang lebih komprehensif
const validateCSVData = (results) => {
    if (!results.data || results.data.length === 0) {
        setValidationErrors(['CSV file is empty']);
        return;
    }
    
    const errors = [];
    
    // 1. Cek kolom yang diperlukan
    const requiredColumns = ['nama_karyawan', 'kontrak_awal', 'kontrak_akhir'];
    const availableColumns = results.meta.fields || [];
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
    
    if (missingColumns.length > 0) {
        errors.push(`Required columns not found: ${missingColumns.join(', ')}`);
    }
    
    // 2. Validasi data di setiap baris
    const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
    
    results.data.forEach((row, index) => {
        // Cek data kosong pada kolom wajib
        requiredColumns.forEach(col => {
            if (!row[col] && availableColumns.includes(col)) {
                errors.push(`Row ${index + 1}: ${col} cannot be empty`);
            }
        });
        
        // Cek format tanggal
        dateColumns.forEach(col => {
            if (row[col] && availableColumns.includes(col)) {
                if (!isValidDate(row[col])) {
                    errors.push(`Row ${index + 1}: Invalid date format for ${col}: "${row[col]}". Use DD/MM/YYYY or YYYY-MM-DD format`);
                }
            }
        });
    });
    
    // Batasi jumlah error yang ditampilkan
    if (errors.length > 10) {
        const displayErrors = errors.slice(0, 10);
        displayErrors.push(`...and ${errors.length - 10} more errors`);
        setValidationErrors(displayErrors);
    } else {
        setValidationErrors(errors);
    }
};

    const cancelUpload = () => {
        if (cancelTokenSource) {
            cancelTokenSource.cancel('Upload cancelled by user');
            setUploadCancelled(true);
            setIsProcessing(false);
            setUploadStatus({
                message: 'Upload cancelled',
                isSuccess: false,
                show: true
            });
        }
    };

    // Fungsi untuk preview data CSV
    const previewCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            preview: 5, // Tampilkan 5 baris pertama untuk preview
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    setPreviewData(results);
                    
                    // Log data untuk debugging
                    
                    // Validasi kolom yang diperlukan
                    const requiredColumns = ['nama_karyawan', 'kontrak_awal', 'kontrak_akhir'];
                    const availableColumns = results.meta.fields || [];
                    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
                    
                    let errors = [];
                    if (missingColumns.length > 0) {
                        errors.push(
                            `Required columns not found: ${missingColumns.join(', ')}`
                        );
                    }
                    
                    // Validasi format tanggal
                    if (availableColumns.length > 0) {
                        const dateErrors = [];
                        const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir', 'awal_mcu', 'akhir_mcu', 'awal_hsepassport', 'akhir_hsepassport', 'awal_siml', 'akhir_siml'];
                        
                        results.data.forEach((row, index) => {
                            dateColumns.forEach(col => {
                                if (availableColumns.includes(col) && row[col] && !isValidDate(row[col])) {
                                    dateErrors.push(`Row ${index + 1}: Invalid date format for ${col}: "${row[col]}". Use DD/MM/YYYY or YYYY-MM-DD format`);
                                }
                            });
                        });
                        
                        if (dateErrors.length > 0) {
                            errors = [...errors, ...dateErrors.slice(0, 5)]; // Batasi jumlah error yang ditampilkan
                            if (dateErrors.length > 5) {
                                errors.push(`...and ${dateErrors.length - 5} more errors`);
                            }
                        }
                    }
                    
                    setValidationErrors(errors);
                } else {
                    console.error('CSV Parse Error: No data returned', results);
                    setValidationErrors(['CSV file is empty or invalid']);
                }
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                setValidationErrors([`Error parsing CSV: ${error.message}`]);
            }
        });
    };

    // Fungsi untuk validasi format tanggal
    const isValidDate = (dateString) => {
        if (!dateString) return true; // Kosong dianggap valid
        
        // Cek format YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            // Cek tanggal valid (bulan 1-12, tanggal 1-31)
            if (month < 1 || month > 12) return false;
            if (day < 1 || day > 31) return false;
            
            // Validasi tanggal untuk bulan-bulan tertentu
            if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) return false;
            if (month === 2) {
                // Cek tahun kabisat
                const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                if (day > (isLeapYear ? 29 : 28)) return false;
            }
            return true;
        }
        
        // Cek format DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/').map(Number);
            // Cek tanggal valid (bulan 1-12, tanggal 1-31)
            if (month < 1 || month > 12) return false;
            if (day < 1 || day > 31) return false;
            
            // Validasi tanggal untuk bulan-bulan tertentu
            if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) return false;
            if (month === 2) {
                // Cek tahun kabisat
                const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                if (day > (isLeapYear ? 29 : 28)) return false;
            }
            return true;
        }
        
        return false;
    };

    // Fungsi untuk mengunduh template
    const handleDownloadTemplate = async () => {
        try {
            setUploadStatus({
                message: 'Downloading template...',
                isSuccess: true,
                show: true
            });
            
            const response = await axios.get(templateUrl, {
                responseType: 'blob'
            });
            
            // Buat link untuk download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_data_karyawan_pertamina_regional4.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setUploadStatus({
                message: 'Template downloaded successfully!',
                isSuccess: true,
                show: true
            });
        } catch (error) {
            console.error('Error downloading template:', error);
            setUploadStatus({
                message: `Failed to download template: ${error.message}`,
                isSuccess: false,
                show: true
            });
        }
    };

    // Fungsi untuk upload file
    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus({
                message: 'Please select a file first!',
                isSuccess: false,
                show: true
            });
            return;
        }
         // Validate file size
    if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadStatus({
            message: 'File size exceeds maximum limit of 5MB',
            isSuccess: false,
            show: true
        });
        return;
    }
    
    // Jika ada validation errors, konfirmasi sebelum melanjutkan
    if (validationErrors.length > 0) {
        const confirm = window.confirm(`There are ${validationErrors.length} validation warnings. Continue with upload anyway?`);
        if (!confirm) return;
    }
    
    try {
        setIsProcessing(true);
        setUploadStatus({
            message: 'Uploading and processing data...',
            isSuccess: true,
            show: true
        });
        setProgress(10);
        
        // Buat FormData untuk upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Log untuk debugging
        
        // Upload file ke server dengan axios
        const response = await axios.post(
            `${API_BASE_URL}/regional4/upload-bulk`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 50) / progressEvent.total
                    );
                    setProgress(percentCompleted); // Max 50% untuk upload
                },
                // Tambahkan timeout yang lebih lama untuk file besar
                timeout: 300000 // 5 menit
            }
        );
        
        // Log respons untuk debugging
        
        // Simulasi progress processing
        setProgress(60);
        setTimeout(() => setProgress(80), 500);
        setTimeout(() => setProgress(100), 1000);
        
        // Tampilkan hasil upload
        setUploadResult(response.data);
        setUploadStatus({
            message: `Data uploaded successfully! ${response.data.success} successful entries, ${response.data.errors.length} errors.`,
            isSuccess: true,
            show: true
        });
        
        // Reset form jika berhasil
        if (response.data.success > 0 && response.data.errors.length === 0) {
            setTimeout(() => {
                resetForm();
            }, 3000);
            
            // Redirect ke halaman utama setelah 3 detik jika semua berhasil
            if (response.data.errors.length === 0) {
                setTimeout(() => {
                    navigate('/regional4-edit', {
                        state: {
                            message: `${response.data.success} employee records successfully uploaded!`,
                            type: 'success'
                        }
                    });
                }, 3000);
            }
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        
        let errorMessage = 'An error occurred while uploading the file';
        
        if (error.response) {
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
            console.error('Response error details:', error.response.data);
            
            // Log detail error
            if (error.response.data?.errors && error.response.data.errors.length > 0) {
                console.error('Detailed errors:', JSON.stringify(error.response.data.errors, null, 2));
                
                // Ambil pesan error pertama untuk ditampilkan
                const firstError = error.response.data.errors[0];
                errorMessage = firstError.message || errorMessage;
            } else {
                errorMessage = error.response.data?.message || 
                `Error: ${error.response.status} - ${error.response.statusText}`;
            }
            
            // Set upload result dengan error jika ada
            if (error.response.data) {
                setUploadResult(error.response.data);
            }
        } else if (error.request) {
            console.error('Request made but no response:', error.request);
            errorMessage = 'Server did not respond. Check your network connection.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }
        
        setUploadStatus({
            message: errorMessage,
            isSuccess: false,
            show: true
        });
    } finally {
        setIsProcessing(false);
        setProgress(100);
    }
};

// Reset form
const resetForm = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadStatus({ message: '', isSuccess: false, show: false });
    setProgress(0);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
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
            
    <Link to='/regional4-edit'>
        <ButtonComponents variant="back">&lt; Back</ButtonComponents>
    </Link>

{/* Main Content */}
<main className="flex-1 bg-(--background-tar-color) space-y-6">
    <div className="flex flex-col bg-white p-6 shadow-md rounded gap-4">
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Employee Data Upload</h2>
                    
        {/* Bagian Template */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-lg font-medium text-blue-600 mb-4">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full mr-2 text-sm">1</span>
                Download Template
            </h4>
            <p className="text-gray-600 mb-4">Please download the CSV template for bulk employee data input.</p>
            
            <button 
                onClick={handleDownloadTemplate}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                disabled={isProcessing}
            >
                <FontAwesomeIcon icon={faCloudArrowDown} className="h-5 w-5 mr-2"/>
                Download CSV Template
            </button>
            
            <div className="mt-5 text-sm text-gray-600">
            <p className="font-semibold mb-2">Template usage instructions:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Fill in data according to the provided column format</li>
                    <li>
                        Date format must be in <strong>DD/MM/YYYY</strong> or <strong>YYYY-MM-DD</strong> format.<br />
                        Make sure that the day and month use two digits (e.g., <strong>05/05/2025</strong> instead of <strong>5/5/2025</strong>)
                    </li>
                    <li>Do not change column names or template structure</li>
                    <li>Required fields: <strong>nama_karyawan</strong>, <strong>kontrak_awal</strong>, and <strong>kontrak_akhir</strong></li>
                    <li>Ensure numeric data does not contain characters other than numbers and periods (example: 5000000.00)</li>
                    <li>File format: CSV with maximum size of 5MB</li>
                </ul>
            </div>
        </div>
                    
    {/* Bagian Upload */}
    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h4 className="text-lg font-medium text-blue-600 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full mr-2 text-sm">2</span>
            Upload Data
        </h4>
        <p className="text-gray-600 mb-4">After filling the template, upload the completed CSV file.</p>              
        <div className="mt-2 mb-6">
            <div className="relative">
                <label 
                    className={`flex justify-center items-center px-6 py-8 border-2 border-dashed rounded-lg 
                    ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'} 
                    hover:border-gray-400 transition-colors cursor-pointer`}
                >
                    <div className="space-y-1 text-center">
                        <FontAwesomeIcon 
                            icon={selectedFile ? faFileExcel : faArrowUpFromBracket} 
                            className={`mx-auto h-10 w-10 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`}
                        />
                        <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Click to select file</span> or drag &amp; drop
                        </div>
                        <p className="text-xs text-gray-500">
                            CSV or Excel (.csv, .xlsx, .xls) - Max 5MB
                        </p>
                        {selectedFile && (
                            <div className="mt-2">
                                <p className="text-sm text-green-600 font-medium flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                    Selected file: {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        accept=".csv,.xlsx,.xls"
                        disabled={isProcessing}
                    />
                </label>
            </div>
        </div>
                        
            {/* Validasi Errors */}
            {validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                    <div className="flex items-center mb-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-2" />
                        <h5 className="font-medium text-yellow-700">Validation Warnings</h5>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1 ml-6 list-disc">
                        {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}
                        
            {/* Preview Data */}
            {previewData && previewData.data.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                <h5 className="font-medium text-gray-700 mb-2">Data Preview (first 5 rows):</h5>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                    <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    {previewData.meta.fields.slice(0, 8).map((field, index) => (
                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field}
                    </th>
                    ))}
                    {previewData.meta.fields.length > 8 && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ...
                    </th>
                    )}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{rowIndex + 1}</td>
                        {previewData.meta.fields.slice(0, 8).map((field, colIndex) => (
                        <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {row[field] || '-'} </td>
                        ))}
                        {previewData.meta.fields.length > 8 && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">...</td>
                        )}
                    </tr>
                    ))}
                    </tbody>
                </table>
                    <p className="text-xs text-gray-500 mt-2">
                    Showing {previewData.data.length} of {previewData.data.length} rows and {Math.min(8, previewData.meta.fields.length)} of {previewData.meta.fields.length} columns.
                    </p>
                </div>
            )}
                        
            {/* Progress bar */}
            {isProcessing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                    ></div>
                    <p className="text-xs text-center mt-1 text-gray-500">
                    {progress === 100 ? 'Selesai' : `Memproses... ${progress}%`}
                    </p>
                    <button 
                    onClick={cancelUpload}
                    className="text-xs text-red-500 hover:text-red-700"
                    >Cancel</button>
                </div>
            )}
                        
            {/* Upload Result */}
            {uploadResult && (
                <div className={`mb-4 p-4 rounded-md ${
                    uploadResult.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                <div className="flex justify-between items-start">
                <div>
                <h5 className={`font-medium ${uploadResult.errors.length === 0 ? 'text-green-700' : 'text-yellow-700'} mb-2`}>
                Upload Result </h5>
                <ul className="list-disc ml-5 text-sm">
                    <li className="text-green-600">Success: {uploadResult.success} records</li>
                    <li className={uploadResult.errors.length > 0 ? 'text-red-600' : 'text-gray-600'}>
                        Failed: {uploadResult.errors.length} records
                    </li>
                    <li className="text-gray-600">Total: {uploadResult.total} records</li>
                </ul>
                </div>
                <button 
                    onClick={() => setUploadResult(null)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
                </div>
                    
                {uploadResult.errors.length > 0 && (
                <div className="mt-3">
                <p className="font-medium text-red-600 text-sm mb-1">Errors found:</p>
                <div className="max-h-40 overflow-y-auto bg-white border border-red-100 rounded p-2">
                <ul className="list-decimal ml-5 text-xs text-red-600">
                    {uploadResult.errors.slice(0, 10).map((error, index) => (
                    <li key={index} className="mb-1">
                        <span className="font-medium">{error.row ? `Baris ${error.row}:` : ''}</span> {error.message}
                    </li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                    <li className="text-gray-500">...and {uploadResult.errors.length - 10} more errors</li>
                    )}
                </ul>
                </div>
                <p className="text-xs text-gray-500 mt-1">Fix the data and upload again. Common errors: incorrect date format, empty required fields, or invalid number format.</p>
            </div>
                )}
                </div>
            )}
                        
            {/* Upload Status */}
            {uploadStatus.show && (
                <div className={`mb-4 p-3 rounded-md ${ uploadStatus.isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                } flex items-start justify-between`}>
                <div className="flex items-center">
                    <FontAwesomeIcon 
                        icon={uploadStatus.isSuccess ? faCheckCircle : faExclamationTriangle} 
                        className="mr-2"
                    />
                    <span>{uploadStatus.message}</span>
                </div>
                    <button 
                        onClick={() => setUploadStatus({...uploadStatus, show: false})}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}
                        
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isProcessing}
                    className={`px-4 py-2 rounded flex items-center ${
                        !selectedFile || isProcessing 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600 text-white transition-colors font-medium'
                    }`}
                >
                    <FontAwesomeIcon icon={faArrowUpFromBracket} className="mr-2" />
                    {isProcessing ? 'Processing...' : 'Upload Data'}
                </button>
                            
                {selectedFile && !isProcessing && (
                    <button
                        onClick={resetForm}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                            
                <Link to="/regional4-edit">
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                        Back
                    </button>
                </Link>
            </div>
            </div>
        </div>
        </div>
    </div>
    </main>

    {/* Footer*/}
    <FooterComponents/>
    </div>
</div>
</div>
);
};


export default UploadMassalPertamina4