import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';

const EmployeeDataComponents = ({ isOpen, onClose, onPersonalClick, onMassalClick }) => {

    if (!isOpen) return null;

    // Stop propagation untuk menghindari modal tertutup saat klik di dalam
    const handleContainerClick = (e) => {
        e.stopPropagation();
    };

    // Tambahkan stopPropagation pada handler tombol
    const handlePersonalButtonClick = (e) => {
        e.stopPropagation();
        onPersonalClick();
    };

    const handleMassalButtonClick = (e) => {
        e.stopPropagation();
        onMassalClick();
    };
  
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay background */}
            <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity pointer-events-none"
            onClick={onClose} // Menutup modal saat overlay diklik
            />

            {/* Modal content */}
            <div className="relative z-50 overlay-content shadow-xl w-full max-w-md mx-4 h-fill" onClick={(e) => e.stopPropagation()}> {/* Stop propagation! */}
                
                    {/* Modal header */}
                    <h3 className=" font-semibold mb-6 text-center bg-(--shading-tar-color) rounded p-3">Select Employee data entry method</h3>
                    
                    {/* Button options */}
                    <div className="grid grid-cols-2 gap-4 mt-10">
                        <button
                            onClick={handlePersonalButtonClick}
                            className='flex flex-col items-center justify-center p-2 border-4 rounded border-(--font-tar-maroon-color) hover:bg-(--shading-tar-color) transition-all'>
                            <FontAwesomeIcon icon={faUser} 
                                className='w-12 h-12 text-(--font-tar-maroon-color) mb-2'
                                fill="none"  
                                stroke="currentColor"/>
                            <span className="text-lg font-medium">Individual</span>
                        </button>
                    
                        <button
                            onClick={handleMassalButtonClick}
                            className="flex flex-col items-center justify-center p-2 border-4 rounded border-(--font-tar-maroon-color) hover:bg-(--shading-tar-color) transition-all" >
                            <FontAwesomeIcon icon={faArrowUpFromBracket} 
                            className='w-12 h-12 text-(--font-tar-maroon-color) mb-2'
                            fill="none"  
                            stroke="currentColor"/>
                            <span className="text-lg font-medium">Bulk</span>
                        </button>

                </div>
            </div>
    </div>
  )
}

export default EmployeeDataComponents