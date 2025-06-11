import React from 'react';
import ButtonComponents from '../ButtonComponents';

const AccLoginOverlay = ({ isOpen, onClose, onLogin, username, setUsername, password, setPassword }) => {

    if (!isOpen) return null;
  
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"> {/* Overlay background */}
        <div className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
                onClick={onClose} // Menutup modal saat overlay diklik
                />

        <div className="relative z-50 overlay-content shadow-xl w-full max-w-md mx-4 h-fill" onClick={(e) => e.stopPropagation()}> {/* Stop propagation!*/}
            <h3 className='font-semibold mb-6 text-center bg-(--shading-tar-color) rounded p-3'>Login</h3>
                <input
                type="text"
                className="border rounded w-full p-2 mb-2"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />

                <input
                type="password"
                className="border rounded w-full p-2 mb-4"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4 mt-2">
                <ButtonComponents variant="loginoly" onClick={onLogin}>Login</ButtonComponents>
                <ButtonComponents variant="loginoly" onClick={onClose}>Close</ButtonComponents>
                
            </div>
  </div>
</div>
  )
}

export default AccLoginOverlay