import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faFolder, faUserGroup, faArrowRightFromBracket, faMinus} from '@fortawesome/free-solid-svg-icons';
import '../styles/main.css';


const AsideComponents = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  const getLinkClassName = (path) => {
    const baseClasses = "flex items-center space-x-2 p-3 rounded-lg btn-aside no-underline text-black";
    return `${baseClasses} ${activePath === path ? 'active' : ''}`;
  };

  // Fungsi untuk menghandle logout
  const handleLogout = (e) => {
    e.preventDefault(); // Mencegah navigasi default dari Link
    
    // Hapus semua data otentikasi dari storage
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('baseAuth');
    
    // Reset data lain yang mungkin disimpan
    localStorage.removeItem('admin_users');
    
    // Tampilkan pesan jika diperlukan
    alert('Logout successful');
    
    // Arahkan ke halaman login
    navigate('/login');
  };

  return (
    <div className='flex sticky top-0'>
      <aside className="w-70 bg-white text-black-70 p-4 flex flex-col h-screen overflow-y-auto">
          <div className='w-full px-2 py-3 text-center text-'>
            <div className="flex justify-center space-x-4 p-3">
            {/* Gambar */}
            <img 
              src="/tar.jpeg"
              alt="Tar Logo"
              className="w-80 h-auto object-cover rounded-lg"
            />
          </div>
          <h4 className="text-center font-bold  mt-2 gap-2 drop-shadow">Timur Adi Raya</h4>
        </div>

    <nav className="mt-4 space-y-2 gap-y-2">
      <Link to="/" className={getLinkClassName('/')}>
        <FontAwesomeIcon icon={faHouse} className='text-lg'/>
        <span className='text-sm'>Dashboard</span>
      </Link>
      
      <br />
      <div className="text-(--ash-60-oppacity) flex items-center space-x-2 px-3">
      <FontAwesomeIcon icon={faMinus} className='text-xs'/>
        <span className='text-xs'>PAGES</span>
      </div>

      <Link to="/project" className={getLinkClassName('/project')}>
        <FontAwesomeIcon icon={faFolder} className='text-lg'/>
        <span className='text-sm'>PROJECT</span>
      </Link>
      
      <Link to="/hse" className={getLinkClassName('/hse')}>
        <FontAwesomeIcon icon={faFolder} className='text-lg'/>
        <span className='text-sm'>HSE</span>
      </Link>
      
      <Link to="/management" className={getLinkClassName('/management')}>
        <FontAwesomeIcon icon={faFolder} className='text-lg'/>
        <span className='text-sm'>MANAGEMENT</span>
      </Link>


      <br />
      <div className="text-(--ash-60-oppacity) flex items-center space-x-2 px-3">
        <FontAwesomeIcon icon={faMinus} className='text-xs'/>
        <span className='text-xs'>ACCOUNT</span>
      </div>

      <Link to="/account" className={getLinkClassName('/account')}>
        <FontAwesomeIcon icon={faUserGroup} className='text-lg'/>
        <span className='text-sm'>Account</span>
      </Link>

      {/* Tombol Logout yang memanggil handleLogout */}
      <a href="#" 
          onClick={handleLogout} 
          className={getLinkClassName('/login')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} className='text-lg' />
          <span className='text-sm'>Logout</span>
        </a>
      </nav>
    </aside>
  </div>
  )
}

export default AsideComponents
