import React, { useState } from 'react';
import ButtonComponents from './ButtonComponents';

const DeleteReasonComponents = ({ isOpen, onClose, onConfirm, userName }) => {
  const [selectedReason, setSelectedReason] = useState('EOC');
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // If the "Other" option is selected, use the value from the custom input
    const finalReason = selectedReason === 'Other' ? otherReason : selectedReason;

    // Ensure a reason is provided
    if (selectedReason === 'Other' && finalReason.trim() === '') {
      alert('Please enter a reason');
      return;
    }
    setIsSubmitting(true);

    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={!isSubmitting ? onClose : null}></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md max-h-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b rounded-t">
        <h3 className="text-lg font-semibold text-gray-900">
          Confirm Employee Inactivation
        </h3>
          <button
              type="button"
              className={`text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={onClose}
              disabled={isSubmitting}
            >
              <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
        </div>

        {/* Modal Body */}
        <div className="mb-6">
          <p className="text-base text-gray-700 mb-4">
            You are about to move employee <span className="font-bold">{userName}</span> to Inactive status.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Inactivation:
            </label>

            {/* Radio options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                    id="EOC"
                    name="reason"
                    type="radio"
                    checked={selectedReason === 'EOC'}
                    onChange={() => setSelectedReason('EOC')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    disabled={isSubmitting}
                  />
                <label htmlFor="EOC" className="ml-2 block text-sm text-gray-700">
                  EOC (End of Contract)
                </label>
              </div>

              <div className="flex items-center">
                <input
                    id="Resign"
                    name="reason"
                    type="radio"
                    checked={selectedReason === 'Resign'}
                    onChange={() => setSelectedReason('Resign')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    disabled={isSubmitting}
                  />
                <label htmlFor="Resign" className="ml-2 block text-sm text-gray-700">
                  Resign
                </label>
              </div>

              <div className="flex items-center">
                <input
                    id="Meninggal"
                    name="reason"
                    type="radio"
                    checked={selectedReason === 'Deceased'}
                    onChange={() => setSelectedReason('Deceased')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    disabled={isSubmitting}
                  />
                <label htmlFor="Deceased" className="ml-2 block text-sm text-gray-700">
                  Deceased
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="Lainnya"
                  name="reason"
                  type="radio"
                  checked={selectedReason === 'Other'}
                  onChange={() => setSelectedReason('Other')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  disabled={isSubmitting}
                />
                <label htmlFor="Lainnya" className="ml-2 block text-sm text-gray-700">
                  Other
                </label>
              </div>

               {/* Custom reason input if "Other" is selected */}
               {selectedReason === 'Other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Enter other reason"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2">
          <ButtonComponents
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </ButtonComponents>
          <ButtonComponents
            variant="danger"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : "Confirm"}
          </ButtonComponents>
        </div>
      </div>
    </div>
  );
};

export default DeleteReasonComponents;