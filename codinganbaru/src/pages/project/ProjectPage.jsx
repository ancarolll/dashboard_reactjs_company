import React, { useState, useEffect, useContext } from 'react';
import AsideComponents from '../../components/AsideComponents'
import FooterComponents from '../../components/FooterComponents'
import HeaderComponents from '../../components/HeaderComponents'
import '../../styles/main.css';
import ButtonComponents from '../../components/ButtonComponents';
import BubbleNotifComponents from '../../components/BubbleNotifComponents';
import LoginOverlay from '../../components/logincom/LoginOverlay'
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, hasAccess } from '../../utils/AuthChecker';

const ProjectPage = () => {
  const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [targetPage, setTargetPage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  // Load current user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const openLoginOverlay = (targetPage) => {
    // Check if already authenticated and has access
    if (isAuthenticated() && hasAccess(targetPage)) {
      // Navigate directly if already authenticated and has access
      navigate(targetPage);
      return;
    }
    // Otherwise open login overlay
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
    // Navigasi ke halaman target yang telah disimpan
    if (targetPage) {
      navigate(targetPage);
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

        {/* Main Content */}
        <main className="flex-1 bg-(--background-tar-color) ">
          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
              <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                <img src="/elnusa.jpg" alt="elnusa" 
                className='w-full h-full object-cover rounded-lg'/>
              </div>
                <div className='flex-1 p-3 text-color'>PT. Elnusa
                  <span className='flex items-center ml-1'>
                  <BubbleNotifComponents project="elnusa" stacked={true} /></span>
                </div>
              <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
              <Link to='/elnusa-view'><ButtonComponents variant="primary">View</ButtonComponents></Link>
              {/* <Link to="/elnusa-edit" > */}
              <ButtonComponents variant="secondary" onClick={() => openLoginOverlay('/elnusa-edit')}
                  >Edit</ButtonComponents>
                {/* </Link> */}

              </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                  <img src="/pertamina_img.jpeg" alt="pertamina ep reg 4" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 4
                    <span className='flex items-center ml-1'>
                    <BubbleNotifComponents project="regional4" stacked={true} /></span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
              <Link to='/regional4-view'><ButtonComponents variant="primary">View</ButtonComponents></Link>
              <ButtonComponents 
              variant="secondary" 
              onClick={() => openLoginOverlay('/regional4-edit')} >Edit</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2 (Eksplorasi)" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 (Eksplorasi)
                    <span className='flex items-center ml-1'>
                    <BubbleNotifComponents project="regional2x" stacked={true} /></span>
                </div>

            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <Link to='/regional2x-view'>
              <ButtonComponents variant="primary">View</ButtonComponents>
            </Link>
            <ButtonComponents 
              variant="secondary" 
              onClick={() => openLoginOverlay('/regional2x-edit')}>Edit</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2 (Subsurface)" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 (Subsurface)
                    <span className='flex items-center ml-1'>
                    <BubbleNotifComponents project="regional2s" stacked={true} /></span>
                </div>

            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <Link to="/regional2s-view">
              <ButtonComponents variant="primary">View</ButtonComponents>
            </Link>
            <ButtonComponents 
              variant="secondary" 
              onClick={() => openLoginOverlay('/regional2s-edit')}>Edit</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2 zona 7 (DevPlan)" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 Zona 7 (DevPlan)
                    <span className='flex items-center ml-1'>
                    <BubbleNotifComponents project="regional2Z7D" stacked={true} /></span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <Link to="/regional2z7d-view">
              <ButtonComponents variant="primary">View</ButtonComponents>
            </Link>
            <ButtonComponents 
              variant="secondary" 
              onClick={() => openLoginOverlay('/regional2z7d-edit')}>Edit</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2 zona 7 (WOPDM)" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 Zona 7 (WOPDM)
                    <span className='flex items-center ml-1'>
                    <BubbleNotifComponents project="regional2Z7W" stacked={true} /></span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <Link to="/regional2z7w-view">
              <ButtonComponents variant="primary">View</ButtonComponents>
            </Link>
            <ButtonComponents 
              variant="secondary" 
              onClick={() => openLoginOverlay('/regional2z7w-edit')}>Edit</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow '>
                  <img src="/urp_img.jpg" alt="umran rubi perkasa" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Umran Rubi Perkasa
                    <span className='flex items-center ml-1'>
                    <BubbleNotifComponents project="umran" stacked={true} /></span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <Link to="/umran-view">
              <ButtonComponents variant="primary">View</ButtonComponents>
            </Link>
            <ButtonComponents 
              variant="secondary" 
              onClick={() => openLoginOverlay('/umran-edit')}>Edit</ButtonComponents>
            </div>
          </div>

           {/* Modal untuk memilih tipe input data */}
           {isLoginOverlayOpen &&  // Tampilkan modal hanya jika isModalOpen true
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
        </main>

        
        {/* Footer*/}
        <FooterComponents/>
        </div>
        </div>
    </div>
  )
}

export default ProjectPage