import React, { useState, useEffect } from 'react';
import AsideComponents from '../../components/AsideComponents'
import FooterComponents from '../../components/FooterComponents'
import HeaderComponents from '../../components/HeaderComponents'
import '../../styles/main.css';
import { AccBox } from '../../components/accountcom/AccountButtonComponents';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';
import LoginOverlay from '../../components/logincom/LoginOverlay';
import ButtonComponents from '../../components/ButtonComponents';
import { useNavigate } from 'react-router-dom';


const AccountPage = () => {
  const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [targetPage, setTargetPage] = useState("");
  const navigate = useNavigate();
  
  // Load current user from localStorage on component mount
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const openLoginOverlay = (page) => {
    setTargetPage(page);
    setIsLoginOverlayOpen(true);
  };
  
  const closeLoginOverlay = () => {
    setIsLoginOverlayOpen(false);
    setUsername('');
    setPassword('');
  };

    const handleLoginClick = () => {
      // Login dan verifikasi akses sudah ditangani di dalam LoginOverlay
      navigate(targetPage);
      closeLoginOverlay();
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

        {/* Main Content */}
        <main className="flex-1 bg-(--background-tar-color) ">
          <h2 className='text-center'>Manage Account</h2>
        
          <div className='flex-1 flex flex-row bg-(--white-tar-color) justify-center overflow-y-auto px-6 py-3 gap-x-8'>
            <div className='flex flex-col sm:w-75 h-80 p-6 items-center rounded-lg shadow-md border border-gray-300 transition duration-300 cursor-pointer'>
            <AccBox variant='masteradmin' title='MASTER ADMIN' icon={faCircleUser} />
            <ButtonComponents variant="prismall" className='text-end' onClick={() => openLoginOverlay('/admin-account')}>Enter</ButtonComponents>
            </div>
            <div className='flex flex-col sm:w-75 h-80 p-6 items-center rounded-lg shadow-md border border-gray-300 transition duration-300 cursor-pointer'>
            <AccBox variant='user' title='USER' icon={faCircleUser} />
            <ButtonComponents variant="prismall" className='text-end' onClick={() => openLoginOverlay('/user-account')}>Enter</ButtonComponents>
            </div>
          </div>

          {/* Modal untuk login */}
          {isLoginOverlayOpen && (
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
            )}
        </main>

        
        {/* Footer*/}
        <FooterComponents/>
        </div>
        </div>
    </div>
  )
}

export default AccountPage