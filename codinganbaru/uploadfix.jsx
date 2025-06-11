import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowDown, faArrowUpFromBracket, faFileExcel, faXmark, faCheckCircle, faExclamationTriangle, faTimesCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
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

const UploadMassalElnusa = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState({ message: '', isSuccess: false, show: false });
    const [previewData, setPreviewData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [validationSummary, setValidationSummary] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [progress, setProgress] = useState(0);
    const [cellErrors, setCellErrors] = useState({}); // Untuk highlight cell yang error
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Template CSV file URL
    const templateUrl = `${API_BASE_URL}/elnusa/template/csv`;

    // Definisi kolom numerik yang harus divalidasi
    const numericColumns = [
        'honorarium', 'gaji_pokok', 'gaji_terupdate',
        't_variabel', 't_makan', 't_transport', 't_pulsa', 
        't_specialis', 't_lapangan', 'thp', 'lemburan_otomatis', 
        't_posisi', 't_offshore', 't_lapangan_perhari',
        't_onshore', 't_onshore_eksp', 't_warehouse_office', 
        't_proyek', 't_karantina', 'tunjangan_lembur', 't_supervisor',
        'tahun_masuk', 'tahun_keluar', 'usia'
    ];

    // Fungsi untuk validasi format numerik yang sangat ketat
    const isValidNumeric = (value) => {
        // Jika null, undefined, atau string kosong, dianggap valid (optional)
        if (!value || value === '' || value === null || value === undefined) {
            return { isValid: true, error: null };
        }
        
        // Konversi ke string dan hapus spasi di awal dan akhir
        const cleanValue = value.toString().trim();
        
        // Jika kosong setelah trim, dianggap valid
        if (cleanValue === '') {
            return { isValid: true, error: null };
        }
        
        console.log(`[DEBUG] Validating numeric value: "${cleanValue}"`);
        
        // Cek kata-kata terlarang (case insensitive)
        const forbiddenWords = [
            'rp', 'idr', 'usd', 'eur', 'jpy', 'sgd', 'rupiah', 'dollar', 'euro',
            'ribu', 'juta', 'miliar', 'thousand', 'million', 'billion',
            'rb', 'jt', 'M', 'K'
        ];
        
        const lowerValue = cleanValue.toLowerCase();
        const foundForbiddenWord = forbiddenWords.find(word => lowerValue.includes(word));
        
        if (foundForbiddenWord) {
            return { 
                isValid: false, 
                error: `Contains forbidden word "${foundForbiddenWord}". Use only numbers.` 
            };
        }
        
        // Cek karakter yang tidak diperbolehkan
        const invalidChars = /[a-zA-Z$₹£€¥₽₴₦₨₡₭₩₪₫\s%@#&*()_+=\[\]{}|\\:";'<>?\/~`!]/;
        const foundInvalidChar = cleanValue.match(invalidChars);
        
        if (foundInvalidChar) {
            return { 
                isValid: false, 
                error: `Contains invalid character "${foundInvalidChar[0]}". Use only numbers.` 
            };
        }
        
        // Pattern untuk angka valid
        const validPatterns = [
            /^-?\d+$/, // Integer: 1234, -1234
            /^-?\d+\.\d+$/, // Decimal dengan titik: 1234.56
            /^-?\d+,\d+$/, // Decimal dengan koma: 1234,56
            /^-?\d{1,3}(,\d{3})*$/, // Ribuan: 1,234
            /^-?\d{1,3}(,\d{3})*\.\d+$/ // Ribuan dengan decimal: 1,234.56
        ];
        
        const isValidPattern = validPatterns.some(pattern => pattern.test(cleanValue));
        
        if (!isValidPattern) {
            return { 
                isValid: false, 
                error: `Invalid number format. Use formats like: 5000, 5000.50, or 1,234.56` 
            };
        }
        
        // Test konversi ke angka
        try {
            let normalizedValue = cleanValue;
            
            // Handle thousand separators
            if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleanValue)) {
                normalizedValue = cleanValue.replace(/,(?=\d{3})/g, '');
            } else if (/^\d+,\d+$/.test(cleanValue)) {
                normalizedValue = cleanValue.replace(',', '.');
            }
            
            const numericValue = parseFloat(normalizedValue);
            
            if (isNaN(numericValue) || !isFinite(numericValue)) {
                return { 
                    isValid: false, 
                    error: `Cannot convert to number. Check the format.` 
                };
            }
            
            console.log(`[DEBUG] Validation successful: "${cleanValue}" -> ${numericValue}`);
            return { isValid: true, error: null };
            
        } catch (error) {
            return { 
                isValid: false, 
                error: `Number conversion failed. Use only numeric values.` 
            };
        }
    };

    // Fungsi untuk validasi format tanggal
    const isValidDate = (dateString) => {
        if (!dateString) return { isValid: true, error: null };
        
        const dateStr = dateString.toString().trim();
        
        // Format YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const isValid = date.getFullYear() === year && 
                   date.getMonth() === month - 1 && 
                   date.getDate() === day;
            
            return { 
                isValid, 
                error: isValid ? null : `Invalid date: ${dateStr}. Check day/month values.` 
            };
        }
        
        // Format DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            const isValid = date.getDate() === day && 
                   date.getMonth() === month - 1 && 
                   date.getFullYear() === year;
            
            return { 
                isValid, 
                error: isValid ? null : `Invalid date: ${dateStr}. Check day/month values.` 
            };
        }
        
        return { 
            isValid: false, 
            error: `Invalid date format: ${dateStr}. Use DD/MM/YYYY or YYYY-MM-DD` 
        };
    };

    // Fungsi untuk menangani perubahan file
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadStatus({ message: '', isSuccess: false, show: false });
            setPreviewData(null);
            setValidationErrors([]);
            setValidationSummary(null);
            setCellErrors({});
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
            
            // Preview file
            if (fileExtension === '.csv') {
                previewCSV(file);
            } else {
                previewExcel(file);
            }
        }
    };

    // Fungsi untuk preview file Excel
    const previewExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    setValidationErrors(['Excel file must have at least header and one data row']);
                    return;
                }
                
                // Convert to object format
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1, 11); // First 10 rows
                const convertedData = dataRows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
                
                const mockResult = {
                    data: convertedData,
                    meta: { fields: headers }
                };
                
                setPreviewData(mockResult);
                validatePreviewData(mockResult);
                
            } catch (error) {
                console.error('Error parsing Excel:', error);
                setValidationErrors([`Error parsing Excel: ${error.message}`]);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Fungsi untuk preview data CSV dengan validasi yang sangat detail
    const previewCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            preview: 10, // Preview 10 baris
            complete: function(results) {
                console.log('[DEBUG] CSV Parse Results:', results);
                
                if (results.data && results.data.length > 0) {
                    setPreviewData(results);
                    validatePreviewData(results);
                } else {
                    setValidationErrors(['CSV file is empty or invalid']);
                    setValidationSummary({
                        total: 0,
                        errors: 1,
                        warnings: 0,
                        valid: 0
                    });
                }
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                setValidationErrors([`Error parsing CSV: ${error.message}`]);
            }
        });
    };

    // Fungsi validasi detail untuk preview data
    const validatePreviewData = (results) => {
        console.log('[DEBUG] Starting validation for preview data');
        
        const availableColumns = results.meta.fields || [];
        const requiredColumns = ['nama_karyawan', 'kontrak_awal', 'kontrak_akhir'];
        const dateColumns = ['kontrak_awal', 'kontrak_akhir', 'tanggal_lahir'];
        
        let errors = [];
        let cellErrorsMap = {};
        let validCount = 0;
        let errorCount = 0;
        let warningCount = 0;
        
        // Cek kolom yang diperlukan
        const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
        if (missingColumns.length > 0) {
            errors.push({
                type: 'critical',
                message: `❌ CRITICAL: Required columns missing: ${missingColumns.join(', ')}`,
                severity: 'high'
            });
            errorCount++;
        }
        
        if (availableColumns.length > 0 && results.data.length > 0) {
            results.data.forEach((row, rowIndex) => {
                const rowNum = rowIndex + 2; // +2 karena header + 0-based index
                
                // Validasi kolom wajib
                requiredColumns.forEach(col => {
                    if (availableColumns.includes(col)) {
                        if (!row[col] || row[col].toString().trim() === '') {
                            errors.push({
                                type: 'critical',
                                message: `❌ Row ${rowNum}: "${col}" is required but empty`,
                                row: rowNum,
                                column: col,
                                severity: 'high'
                            });
                            
                            cellErrorsMap[`${rowIndex}-${col}`] = {
                                type: 'critical',
                                message: 'Required field is empty',
                                value: row[col]
                            };
                            errorCount++;
                        }
                    }
                });
                
                // Validasi tanggal
                dateColumns.forEach(col => {
                    if (availableColumns.includes(col) && row[col] && row[col] !== '') {
                        const dateValidation = isValidDate(row[col]);
                        if (!dateValidation.isValid) {
                            errors.push({
                                type: 'warning',
                                message: `⚠️ Row ${rowNum}: Invalid date in "${col}": "${row[col]}" - ${dateValidation.error}`,
                                row: rowNum,
                                column: col,
                                severity: 'medium'
                            });
                            
                            cellErrorsMap[`${rowIndex}-${col}`] = {
                                type: 'warning',
                                message: dateValidation.error,
                                value: row[col]
                            };
                            warningCount++;
                        }
                    }
                });
                
                // Validasi numerik yang SANGAT ketat
                numericColumns.forEach(col => {
                    if (availableColumns.includes(col) && row[col] && row[col] !== '') {
                        console.log(`[DEBUG] Validating ${col} in row ${rowNum}: "${row[col]}"`);
                        
                        const numericValidation = isValidNumeric(row[col]);
                        if (!numericValidation.isValid) {
                            const errorMsg = `🚫 Row ${rowNum}: Invalid numeric value in "${col}": "${row[col]}" - ${numericValidation.error}`;
                            
                            errors.push({
                                type: 'error',
                                message: errorMsg,
                                row: rowNum,
                                column: col,
                                severity: 'high',
                                suggestion: getNumericSuggestion(row[col])
                            });
                            
                            cellErrorsMap[`${rowIndex}-${col}`] = {
                                type: 'error',
                                message: numericValidation.error,
                                value: row[col],
                                suggestion: getNumericSuggestion(row[col])
                            };
                            errorCount++;
                        } else {
                            validCount++;
                        }
                    }
                });
            });
        }
        
        // Set validation summary
        setValidationSummary({
            total: results.data.length,
            errors: errorCount,
            warnings: warningCount,
            valid: validCount,
            hasIssues: errorCount > 0 || warningCount > 0
        });
        
        setValidationErrors(errors);
        setCellErrors(cellErrorsMap);
        
        console.log('[DEBUG] Validation complete:', {
            totalErrors: errors.length,
            cellErrors: Object.keys(cellErrorsMap).length,
            summary: { errorCount, warningCount, validCount }
        });
    };

    // Fungsi untuk memberikan saran perbaikan numerik
    const getNumericSuggestion = (value) => {
        const strValue = value.toString().toLowerCase();
        
        if (strValue.includes('rp') || strValue.includes('idr')) {
            return `Remove "Rp" or "IDR". Example: "5000000" instead of "${value}"`;
        }
        if (strValue.includes('ribu') || strValue.includes('juta')) {
            return `Remove text like "ribu" or "juta". Use actual numbers.`;
        }
        if (strValue.includes('%')) {
            return `Remove "%" symbol. Use decimal if needed (e.g., 0.15 for 15%)`;
        }
        if (/[a-zA-Z]/.test(strValue)) {
            return `Remove all letters. Use only numbers and decimal points.`;
        }
        
        return `Use only numbers. Valid formats: 5000, 5000.50, 1,234.56`;
    };

    // Fungsi untuk mendapatkan warna cell berdasarkan error
    const getCellClassName = (rowIndex, columnName) => {
        const cellKey = `${rowIndex}-${columnName}`;
        const cellError = cellErrors[cellKey];
        
        if (!cellError) return 'bg-white';
        
        switch (cellError.type) {
            case 'critical':
                return 'bg-red-100 border-red-300 border-2';
            case 'error':
                return 'bg-orange-100 border-orange-300 border-2';
            case 'warning':
                return 'bg-yellow-100 border-yellow-300 border-2';
            default:
                return 'bg-white';
        }
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
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_employee_data_elnusa.csv');
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
        
        // Jika ada error kritis, tolak upload
        const criticalErrors = validationErrors.filter(error => error.type === 'critical');
        if (criticalErrors.length > 0) {
            const proceed = window.confirm(
                `Found ${criticalErrors.length} critical error(s) that must be fixed before upload. ` +
                `Click OK to see details, or Cancel to proceed anyway (not recommended).`
            );
            if (proceed) return;
        }
        
        // Jika ada banyak error, konfirmasi
        if (validationErrors.length > 0) {
            const proceed = window.confirm(
                `Found ${validationErrors.length} validation issue(s). ` +
                `${validationSummary?.errors || 0} errors and ${validationSummary?.warnings || 0} warnings. ` +
                `Continue with upload? Some data may fail to process.`
            );
            if (!proceed) return;
        }
    
        try {
            setIsProcessing(true);
            setUploadStatus({
                message: 'Uploading and processing data...',
                isSuccess: true,
                show: true
            });
            setProgress(10);
    
            const formData = new FormData();
            formData.append('file', selectedFile);
    
            console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);

            const response = await axios.post(
                `${API_BASE_URL}/elnusa/upload-bulk`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 50) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                }
            );    

            setProgress(60);
            setTimeout(() => setProgress(80), 500);
            setTimeout(() => setProgress(100), 1000);
    
            setUploadResult(response.data);
            setUploadStatus({
                message: `Data uploaded successfully! ${response.data.success} successful entries, ${response.data.errors?.length || 0} errors.`,
                isSuccess: true,
                show: true
            });
    
            if (response.data.success > 0 && (response.data.errors?.length || 0) === 0) {
                setTimeout(() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }, 3000);
                
                if ((response.data.errors?.length || 0) === 0) {
                    setTimeout(() => {
                        navigate('/elnusa-edit', {
                            state: {
                                message: `${response.data.success} employee data records successfully uploaded!`,
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
                errorMessage = error.response.data?.message || 
                              `Error: ${error.response.status} - ${error.response.statusText}`;
                
                if (error.response.data?.errors) {
                    setUploadResult(error.response.data);
                }
                
                console.error('Response error details:', error.response.data);
            } else if (error.request) {
                errorMessage = 'Server did not respond. Check your network connection.';
                console.error('Request made but no response:', error.request);
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
        setValidationSummary(null);
        setCellErrors({});
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
                    <AsideComponents />
                </div>
            
                <div className="flex-1 flex flex-col h-screen ml-68 bg-(--background-tar-color) overflow-y-auto px-6 py-3">
                    <div className='w-fill h-hug py-3'>
                        <HeaderComponents />
                    </div>
                    
                    <Link to='/elnusa-edit'>
                        <ButtonComponents variant="back">&lt; Back</ButtonComponents>
                    </Link>

                    <main className="flex-1 bg-(--background-tar-color) space-y-6">
                        <div className="flex flex-col bg-white p-6 shadow-md rounded gap-4">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="px-6 py-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Employee Data Upload</h2>
                                    
                                    {/* Validation Summary Alert */}
                                    {validationSummary && validationSummary.hasIssues && (
                                        <div className={`mb-6 p-4 rounded-lg border-2 ${
                                            validationSummary.errors > 0 
                                                ? 'bg-red-50 border-red-300' 
                                                : 'bg-yellow-50 border-yellow-300'
                                        }`}>
                                            <div className="flex items-center mb-3">
                                                <FontAwesomeIcon 
                                                    icon={validationSummary.errors > 0 ? faTimesCircle : faExclamationTriangle} 
                                                    className={`text-xl mr-3 ${
                                                        validationSummary.errors > 0 ? 'text-red-500' : 'text-yellow-500'
                                                    }`} 
                                                />
                                                <h3 className={`text-lg font-bold ${
                                                    validationSummary.errors > 0 ? 'text-red-700' : 'text-yellow-700'
                                                }`}>
                                                    Data Validation Results
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-gray-700">{validationSummary.total}</div>
                                                    <div className="text-sm text-gray-600">Total Rows</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-600">{validationSummary.errors}</div>
                                                    <div className="text-sm text-red-600">Critical Errors</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-yellow-600">{validationSummary.warnings}</div>
                                                    <div className="text-sm text-yellow-600">Warnings</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">{validationSummary.valid}</div>
                                                    <div className="text-sm text-green-600">Valid Fields</div>
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                validationSummary.errors > 0 ? 'text-red-700' : 'text-yellow-700'
                                            }`}>
                                                {validationSummary.errors > 0 
                                                    ? '⚠️ Critical errors found! Fix these issues before uploading.'
                                                    : '✅ No critical errors, but some warnings need attention.'
                                                }
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Template Section */}
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
                                                <li>Date format must be in <strong>DD/MM/YYYY</strong> or <strong>YYYY-MM-DD</strong> format</li>
                                                <li>Do not change column names or template structure</li>
                                                <li>Required fields: <strong>nama_karyawan</strong>, <strong>kontrak_awal</strong>, and <strong>kontrak_akhir</strong></li>
                                                <li>Ensure numeric data does not contain characters other than numbers and periods (example: 5000000.00)</li>
                                                <li>File format: CSV with maximum size of 5MB</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="mt-5 text-sm text-gray-600">
                                            <p className="font-semibold mb-2">🚨 CRITICAL: Numeric Column Rules</p>
                                            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                                                <p className="font-semibold text-red-700 mb-2">❌ NEVER USE THESE IN NUMERIC COLUMNS:</p>
                                                <ul className="list-disc pl-5 space-y-1 text-red-600">
                                                    <li><code>"Rp 5000000"</code> → Use <code>5000000</code></li>
                                                    <li><code>"5000 ribu"</code> → Use <code>5000000</code></li>
                                                    <li><code>"USD 100"</code> → Use <code>100</code></li>
                                                    <li><code>"15%"</code> → Use <code>15</code></li>
                                                    <li><code>"5.000.000,-"</code> → Use <code>5000000</code></li>
                                                </ul>
                                            </div>
                                            <div className="bg-green-50 border border-green-200 rounded p-3">
                                                <p className="font-semibold text-green-700 mb-2">✅ CORRECT NUMERIC FORMATS:</p>
                                                <ul className="list-disc pl-5 space-y-1 text-green-600">
                                                    <li><code>5000000</code> (simple integer)</li>
                                                    <li><code>5000000.50</code> (decimal with dot)</li>
                                                    <li><code>1,234,567</code> (thousands with comma)</li>
                                                    <li><code>1,234,567.89</code> (thousands with decimal)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Upload Section */}
                                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                                        <h4 className="text-lg font-medium text-blue-600 mb-4">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full mr-2 text-sm">2</span>
                                            Upload Data
                                        </h4>
                                        
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
                                                            <span className="font-medium text-blue-600">Click to choose file</span> or drag & drop
                                                        </div>
                                                        <p className="text-xs text-gray-500">CSV (.csv) - Max 5MB</p>
                                                        {selectedFile && (
                                                            <div className="mt-2">
                                                                <p className="text-sm text-green-600 font-medium flex items-center justify-center">
                                                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                                                    File selected: {selectedFile.name}
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
                                        
                                        {/* Enhanced Validation Errors Display */}
                                        {validationErrors.length > 0 && (
                                            <div className="mb-4 p-4 bg-white border-2 border-red-300 rounded-lg shadow-sm">
                                                <div className="flex items-center mb-3">
                                                    <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 text-xl mr-2" />
                                                    <h5 className="font-bold text-red-700 text-lg">
                                                        Found {validationErrors.length} Validation Issue(s)
                                                    </h5>
                                                </div>
                                                
                                                <div className="max-h-96 overflow-y-auto space-y-2">
                                                    {validationErrors.map((error, index) => (
                                                        <div 
                                                            key={index} 
                                                            className={`p-3 rounded border-l-4 ${
                                                                error.type === 'critical' 
                                                                    ? 'bg-red-50 border-red-500' 
                                                                    : error.type === 'error'
                                                                    ? 'bg-orange-50 border-orange-500'
                                                                    : 'bg-yellow-50 border-yellow-500'
                                                            }`}
                                                        >
                                                            <div className="font-medium text-sm">
                                                                {error.message}
                                                            </div>
                                                            {error.suggestion && (
                                                                <div className="mt-1 text-xs text-blue-600 font-medium">
                                                                    💡 Suggestion: {error.suggestion}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                                                    <div className="flex items-center mb-2">
                                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-blue-500 mr-2" />
                                                        <span className="font-semibold text-blue-700">How to Fix:</span>
                                                    </div>
                                                    <ul className="list-disc pl-5 space-y-1 text-blue-700">
                                                        <li>Remove all currency symbols (Rp, IDR, USD, etc.) from numeric columns</li>
                                                        <li>Remove all text from numeric columns (ribu, juta, thousand, etc.)</li>
                                                        <li>Use only numbers and decimal points in salary/allowance columns</li>
                                                        <li>Check date formats: use DD/MM/YYYY or YYYY-MM-DD</li>
                                                        <li>Fill all required fields (nama_karyawan, kontrak_awal, kontrak_akhir)</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Enhanced Preview Data with Error Highlighting */}
                                        {previewData && previewData.data.length > 0 && (
                                            <div className="mb-4 overflow-x-auto">
                                                <h5 className="font-medium text-gray-700 mb-2">
                                                    📋 Data Preview (first {previewData.data.length} rows)
                                                    {Object.keys(cellErrors).length > 0 && (
                                                        <span className="ml-2 text-red-600 font-bold">
                                                            - {Object.keys(cellErrors).length} cells with issues highlighted
                                                        </span>
                                                    )}
                                                </h5>
                                                
                                                {/* Legend */}
                                                <div className="mb-3 flex flex-wrap gap-4 text-xs">
                                                    <div className="flex items-center">
                                                        <div className="w-4 h-4 bg-red-100 border-red-300 border-2 mr-1"></div>
                                                        <span>Critical Error</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-4 h-4 bg-orange-100 border-orange-300 border-2 mr-1"></div>
                                                        <span>Numeric Error</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-4 h-4 bg-yellow-100 border-yellow-300 border-2 mr-1"></div>
                                                        <span>Warning</span>
                                                    </div>
                                                </div>
                                                
                                                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">No.</th>
                                                            {previewData.meta.fields.slice(0, 8).map((field, index) => (
                                                                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                                                    {field}
                                                                    {numericColumns.includes(field) && (
                                                                        <span className="text-red-500 ml-1" title="Numeric only column">🔢</span>
                                                                    )}
                                                                </th>
                                                            ))}
                                                            {previewData.meta.fields.length > 8 && (
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">...</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {previewData.data.map((row, rowIndex) => (
                                                            <tr key={rowIndex}>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border font-medium">
                                                                    {rowIndex + 1}
                                                                </td>
                                                                {previewData.meta.fields.slice(0, 8).map((field, colIndex) => (
                                                                    <td 
                                                                        key={colIndex} 
                                                                        className={`px-3 py-2 whitespace-nowrap text-sm text-gray-900 border ${getCellClassName(rowIndex, field)}`}
                                                                        title={cellErrors[`${rowIndex}-${field}`]?.message || ''}
                                                                    >
                                                                        <div className="flex items-center">
                                                                            <span className={cellErrors[`${rowIndex}-${field}`] ? 'font-bold' : ''}>
                                                                                {row[field] || '-'}
                                                                            </span>
                                                                            {cellErrors[`${rowIndex}-${field}`] && (
                                                                                <FontAwesomeIcon 
                                                                                    icon={faExclamationTriangle} 
                                                                                    className="text-red-500 ml-1 text-xs" 
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                ))}
                                                                {previewData.meta.fields.length > 8 && (
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border">...</td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
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
                                                    {progress === 100 ? 'Complete' : `Processing... ${progress}%`}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Upload Result */}
                                        {uploadResult && (
                                            <div className={`mb-4 p-4 rounded-md ${
                                                (uploadResult.errors?.length || 0) === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                                            }`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h5 className={`font-medium ${(uploadResult.errors?.length || 0) === 0 ? 'text-green-700' : 'text-yellow-700'} mb-2`}>
                                                            Upload Results
                                                        </h5>
                                                        <ul className="list-disc ml-5 text-sm">
                                                            <li className="text-green-600">Successful: {uploadResult.success} records</li>
                                                            <li className={(uploadResult.errors?.length || 0) > 0 ? 'text-red-600' : 'text-gray-600'}>
                                                                Failed: {uploadResult.errors?.length || 0} records
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
                                                
                                                {(uploadResult.errors?.length || 0) > 0 && (
                                                    <div className="mt-3">
                                                        <p className="font-medium text-red-600 text-sm mb-1">Errors found:</p>
                                                        <div className="max-h-40 overflow-y-auto bg-white border border-red-100 rounded p-2">
                                                            <ul className="list-decimal ml-5 text-xs text-red-600">
                                                                {uploadResult.errors.slice(0, 10).map((error, index) => (
                                                                    <li key={index} className="mb-1">
                                                                        <span className="font-medium">{error.row ? `Row ${error.row}:` : ''}</span> {error.message}
                                                                    </li>
                                                                ))}
                                                                {(uploadResult.errors?.length || 0) > 10 && (
                                                                    <li className="text-gray-500">...and {uploadResult.errors.length - 10} other errors</li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Upload Status */}
                                        {uploadStatus.show && (
                                            <div className={`mb-4 p-3 rounded-md ${
                                                uploadStatus.isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
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
                                                    : validationSummary?.errors > 0
                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white transition-colors font-medium'
                                                    : 'bg-green-500 hover:bg-green-600 text-white transition-colors font-medium'
                                                }`}
                                            >
                                                <FontAwesomeIcon icon={faArrowUpFromBracket} className="mr-2" />
                                                {isProcessing ? 'Processing...' : 
                                                 validationSummary?.errors > 0 ? 'Upload with Errors' : 'Upload Data'}
                                            </button>
                                            
                                            {selectedFile && !isProcessing && (
                                                <button
                                                    onClick={resetForm}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            
                                            <Link to="/elnusa-edit">
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

                    <FooterComponents/>
                </div>
            </div>
        </div>
    );
};

export default UploadMassalElnusa;