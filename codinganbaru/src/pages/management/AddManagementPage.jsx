import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import AsideComponents from '../../components/AsideComponents'
import HeaderComponents from '../../components/HeaderComponents'
import FooterComponents from '../../components/FooterComponents'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpFromBracket, faPlus } from '@fortawesome/free-solid-svg-icons';
import ManagementService from '../../service/managementService'
import { toast } from 'react-toastify'


const AddManagementPage = ({ isEditing = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [formData, setFormData] = useState({
        section: '',
        addSection: '',
        nameFile: '',
        file: null,
        uploadDate: new Date().toISOString().split('T')[0],
        awalBerlaku: '', 
        akhirBerlaku: '' 
    });

    const [fileName, setFileName] = useState('');
    const [fileObject, setFileObject] = useState(null);
    const [filePreview, setFilePreview] = useState('');
    const [fileType, setFileType] = useState('');
    const [customSection, setCustomSection] = useState('');
    const [showCustomSection, setShowCustomSection] = useState(false);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Extract data from location.state
    const editMode = location.state?.editMode || false;
    const documentId = location.state?.documentId || id;

   // Load document data if in edit mode
   useEffect(() => {
    const loadDocumentData = async () => {
        if (documentId) {
            try {
                setLoading(true);
                const response = await ManagementService.getDocumentById(documentId);
                
                if (response.success && response.data) {
                    const doc = response.data;
                    setFormData({
                        section: doc.section || '',
                        addSection: doc.title || '',
                        nameFile: doc.file_name || '',
                        file: null,
                        uploadDate: doc.upload_date || new Date().toISOString().split('T')[0],
                        awalBerlaku: doc.awal_berlaku || '', // Align with column name
                        akhirBerlaku: doc.akhir_berlaku || '' // Align with column name
                    });
                    
                    setFileName(doc.file_name || '');
                    setFileType(doc.file_type || '');
                    
                    // Set file preview if exists
                    if (doc.file_name) {
                        setFilePreview(ManagementService.getDocumentFileUrl(doc.id));
                    }
                } else {
                    toast.error(response.message || 'Error loading document');
                    navigate('/management-edit');
                }
            } catch (error) {
                console.error("Error loading document:", error);
                toast.error('Failed to load document. Please try again.');
                navigate('/management-edit');
            } finally {
                setLoading(false);
            }
        }
    };
    loadDocumentData();
}, [documentId, navigate]);

// Load sections
useEffect(() => {
    const loadSections = async () => {
        try {
            setLoading(true);
            const response = await ManagementService.getAllSections();
            
            if (response.success) {
                setSections(response.data || []);
            } else {
                toast.error(response.message || 'Error loading sections');
            }
        } catch (error) {
            console.error("Error loading sections:", error);
            toast.error('Failed to load sections. Please try again.');
            setSections([]);
        } finally {
            setLoading(false);
        }
    };
    
    loadSections();
}, []);

const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
    ...formData,
    [name]: value
    });
};

const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file size (max 8MB)
        if (file.size > 8 * 1024 * 1024) {
            toast.error('File size too large. Maximum 8MB.');
            return;
        }

    setFormData({
        ...formData,
        file
    });
    setFileName(file.name);
    setFileObject(file);
    setFileType(file.type);

     // Create a preview URL for image files
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
    } else if (file.type.includes('pdf')) {
        // For PDF files, we can create an object URL
        const fileURL = URL.createObjectURL(file);
        setFilePreview(fileURL);
    } else {
        // For other file types, no preview
        setFilePreview('');
        }
    }
};

const handleCustomSectionChange = (e) => {
    setCustomSection(e.target.value);
};

const handleToggleCustomSection = () => {
    setShowCustomSection(!showCustomSection);
    if (!showCustomSection) {
        setFormData({
            ...formData,
            section: ''
        });
    }
};

const handleAddCustomSection = async () => {
    if (customSection.trim() === '') {
        toast.warning('Section name cannot be empty.');
        return;
    }
    
    try {
        setLoading(true);
        const response = await ManagementService.addSection(customSection);
        
        if (response.success) {
            toast.success('Section successfully added');
            
            // Update sections list
            setSections(prevSections => [...prevSections, response.data]);
            
            // Set the form data section to the new section
            setFormData({
                ...formData,
                section: customSection
            });
            
            // Reset the custom section input and hide it
            setCustomSection('');
            setShowCustomSection(false);
        } else {
            toast.error(response.message || 'Error adding section');
        }
    } catch (error) {
        console.error('Error adding section:', error);
        toast.error('Failed to add section. Please try again.');
    } finally {
        setLoading(false);
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        setSubmitting(true);
        
        const sectionValue = showCustomSection ? customSection : formData.section;
        
        if (!sectionValue) {
            toast.warning('Please select or enter a section.');
            setSubmitting(false);
            return;
        }
        
        if (!formData.addSection || formData.addSection.trim() === '') {
            toast.warning('Document title cannot be empty.');
            setSubmitting(false);
            return;
        }
        
        // Prepare data for API
        const documentData = {
            section: sectionValue,
            addSection: formData.addSection,
            nameFile: formData.nameFile,
            uploadDate: formData.uploadDate,
            awalBerlaku: formData.awalBerlaku,
            akhirBerlaku: formData.akhirBerlaku,
            file: formData.file
        };
        
        let response;
        
        if (documentId) {
            // Update existing document
            response = await ManagementService.updateDocument(documentId, documentData);
        } else {
            // Add new document
            response = await ManagementService.addDocument(documentData);
        }
        
        
        if (response.success) {
            toast.success(`Document successfully ${documentId ? 'updated' : 'added'}!`);
            
            // Navigate back to management page
            navigate('/management-edit', {
                state: { [documentId ? 'editedDocument' : 'addedDocument']: true }
            });
        } else {
            toast.error(response.message || `Error ${documentId ? 'updating' : 'adding'} document`);
        }
    } catch (error) {
        console.error('Error saving document:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Failed to save document. Please try again.');
    } finally {
        setSubmitting(false);
    }
};

const handleCancel = () => {
    navigate('/management-edit');
};

// Show file preview if available
const renderFilePreview = () => {
    if (!filePreview && !fileObject) return null;
    
    if (filePreview && (fileType?.startsWith('image/') || fileObject?.type?.startsWith('image/'))) {
        return (
            <div className="mt-2 border rounded-md p-2">
                <p className="text-sm text-gray-500 mb-2">File Preview:</p>
                <img 
                    src={filePreview} 
                    alt="File Preview" 
                    className="max-w-full h-auto max-h-48 object-contain"
                />
            </div>
        );
    }
    return (
        <div className="mt-2 border rounded-md p-3">
            <p className="text-sm text-gray-500">File selected: {fileName}</p>
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

            <main className="flex-1 bg-(--background-tar-color) space-y-6">
            
            <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-left p-2 mx-3 text-brown-600">
                    {documentId ? 'Edit Management Data' : 'Add Management Data'}
                </h2>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="mt-2 text-gray-600">Loading data...</p>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="section" className="block font-medium mb-1">Section</label>
                        <button 
                        type="button" 
                        onClick={handleToggleCustomSection}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                        {showCustomSection ? 'Use Dropdown' : 'Add New Section'}
                        </button>
                    </div>
                    {showCustomSection ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="customSection"
                                value={customSection}
                                onChange={handleCustomSectionChange}
                                placeholder="Enter new section name"
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomSection}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 rounded-md flex items-center"
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                    ) : (
                        <>
                        {sections.length > 0 ? (
                            <select
                                id="section"
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="" disabled>Select section</option>
                                {sections.map(section => (
                                    <option key={section.id} value={section.name}>{section.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-center p-3 bg-gray-50 rounded-md">
                                <p>No sections yet. Please add a new section.</p>
                            </div>
                        )}
                    </>
                )}    
                </div>
                    
                    <div className="mb-4">
                            <label htmlFor="addSection" className="block font-medium mb-1">Document Title</label>
                            <input
                            type="text"
                            id="addSection"
                            name="addSection"
                            value={formData.addSection}
                            onChange={handleChange}
                            placeholder="Enter document title"
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            />
                    </div>
                    
                    <div className="mb-4">
                            <label htmlFor="nameFile" className="block font-medium mb-1">File Name</label>
                            <input
                            type="text"
                            id="nameFile"
                            name="nameFile"
                            value={formData.nameFile}
                            onChange={handleChange}
                            placeholder={fileName || "Enter file name"}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                If left empty, the original filename will be used
                            </p>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="awalBerlaku" className="block font-medium mb-1">Effective Date (opsional)</label>
                        <input
                            type="date"
                            id="awalBerlaku"
                            name="awalBerlaku"
                            value={formData.awalBerlaku}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Optional: Date when document becomes effective
                        </p>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="akhirBerlaku" className="block font-medium mb-1">Expired Date (opsional)</label>
                        <input
                            type="date"
                            id="akhirBerlaku"
                            name="akhirBerlaku"
                            value={formData.akhirBerlaku}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Optional: Date when document expires
                        </p>
                    </div>

                    <div className="mb-4">
                            <label htmlFor="uploadDate" className="block font-medium mb-1">Upload Date</label>
                            <input
                            type="date"
                            id="uploadDate"
                            name="uploadDate"
                            value={formData.uploadDate}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                    </div>
                    
                    <div className="mb-6">
                            <label htmlFor="file" className="block font-medium mb-1">File</label>
                            <div className="relative border border-gray-300 rounded-md">
                            <input
                                type="file"
                                id="file"
                                name="file"
                                onChange={handleFileChange}
                                className="sr-only"
                            />
                            <label
                                htmlFor="file"
                                className="flex items-center cursor-pointer p-3"
                            >
                                <FontAwesomeIcon className='text-gray-500 mx-2' icon={faArrowUpFromBracket} />
                                <span className="text-gray-500">
                                {fileName || 'Upload File'}
                                </span>
                            </label>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Upload file max 8 MB</p>
                            
                            {/* File preview */}
                            {renderFilePreview()}
                    </div>
                    
                    <div className="flex flex-row space-x-4 items-center justify-center">
                        <button
                        type="submit"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium mx-3 py-2 px-4 rounded flex items-center"
                        disabled={submitting}
                        >
                        {submitting ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                        </button>
                        <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
                        disabled={submitting}
                        >
                        Cancel
                        </button>
                    </div>
                    </form>
                    )}
                </div>
                </div>
            </main>
                {/* Footer*/}
            <FooterComponents/>
            </div>    
        </div>    
    </div>
  )
}

export default AddManagementPage