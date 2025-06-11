import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDownload, faFile, faFileImage, faFileWord, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons';

const FileUploadModal = ({ 
    isOpen, 
    onClose, 
    userId, 
    userName, 
    docType,
    existingFile = null,
    onDownload = null
  }) => {

    if (!isOpen) return null;

    // Fungsi untuk menangani klik download
    const handleDownload = () => {
      if (existingFile && onDownload) {
        onDownload();
      }
    };
  
    const docTypeLabel = {
      cv: 'CV',
      ijazah: 'Ijazah',
      sertifikat: 'Sertifikat'
    };

    // Fungsi untuk mendapatkan ikon yang sesuai berdasarkan tipe file
    const getFileIcon = (fileName) => {
      if (!fileName) return faFile;
      
      const extension = fileName.split('.').pop().toLowerCase();
      
      if (['pdf'].includes(extension)) return faFilePdf;
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return faFileImage;
      if (['doc', 'docx'].includes(extension)) return faFileWord;
      if (['xls', 'xlsx', 'csv'].includes(extension)) return faFileExcel;
      
      return faFile;
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              Detail {docTypeLabel[docType] || 'Dokumen'}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <p className="mb-4 text-gray-600">
            Karyawan: <span className="font-semibold">{userName}</span>
          </p>
          
          {/* Tampilkan info file */}
          {existingFile ? (
            <div className="mb-6 p-6 bg-gray-100 rounded-lg">
              <div className="flex flex-col items-center text-center">
                <div className="text-5xl text-blue-600 mb-4">
                  <FontAwesomeIcon icon={getFileIcon(existingFile.name)} />
                </div>
                <p className="font-medium mb-2 break-all">{existingFile.name}</p>
                <button 
                  onClick={handleDownload}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download File
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Tidak ada file yang tersedia</p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
};

export default FileUploadModal;