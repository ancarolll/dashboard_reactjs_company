import React, { useState, useEffect } from 'react';
import ButtonComponents from '../ButtonComponents';
import '../../styles/main.css'
import LoginOverlay from '../../components/logincom/LoginOverlay'
import { useNavigate } from 'react-router-dom';
import BubbleNotifComponents from '../BubbleNotifComponents';

export const HseBox = ({ variant, title, linkTo, hseId }) => {
    const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleView = () => {
        if (linkTo) {
            navigate(`${linkTo}-view`);
        }
    };
    
    const openLoginOverlay = () => {
        setIsLoginOverlayOpen(true);
    };
    
    const closeLoginOverlay = () => {
        setIsLoginOverlayOpen(false);
        setUsername('');
        setPassword('');
    };
    
    const handleLoginClick = () => {
        // Login sudah ditangani di dalam LoginOverlay
        navigate(linkTo);
        closeLoginOverlay();
    };

    return (
        <div className="flex flex-col items-center p-4 w-full sm:w-64 md:w-72 bg-white rounded-lg shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
            <div className='mb-4 flex justify-center'>
                <img
                    src="/tar_black.jpeg"
                    alt="Tar Logo"
                    className="w-28 h-auto object-cover rounded-lg"
                />
            </div>
            <h5 className="text-lg font-bold mb-3 text-center text-black">{title}</h5>
            {hseId && (
                <div className="mb-3 flex justify-center">
                    <BubbleNotifComponents hseId={hseId} stacked={true} />
                </div>
            )}
            <div className='flex flex-col w-full gap-3 mt-2 items-center'>
                <div className="w-full max-w-xs flex justify-center">
                    <ButtonComponents 
                        variant="prisview" 
                        className='w-full text-center flex justify-center items-center' 
                        onClick={handleView}>
                        View
                    </ButtonComponents>
                </div>
                <div className="w-full max-w-xs flex justify-center">
                    <ButtonComponents 
                        variant="prismall" 
                        className='w-full text-center flex justify-center items-center' 
                        onClick={openLoginOverlay}>
                        Edit
                    </ButtonComponents>
                </div>
            </div>

            {isLoginOverlayOpen && (
                <LoginOverlay
                    isOpen={isLoginOverlayOpen}
                    onClose={closeLoginOverlay}
                    onLogin={handleLoginClick}
                    username={username}
                    setUsername={setUsername}
                    password={password}
                    setPassword={setPassword}
                    targetPage={linkTo}
                />
            )}
        </div>
    );
};

const HseButtonComponent = () => {
    const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [targetPage, setTargetPage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const openLoginOverlay = (targetPage) => {
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
        // Login sudah ditangani di dalam LoginOverlay
        navigate(targetPage);
        closeLoginOverlay();
    };

    const boxes = [
        {
            variant: 'mcu',
            title: 'Medical Check Up',
            linkTo: '/mcu',
            hseId: 'mcu'
        },
        {
            variant: 'hsepassport',
            title: 'HSE Passport',
            linkTo: '/hsepassport',
            hseId: 'hsepassport'
        },
        {
            variant: 'siml',
            title: 'SIML',
            linkTo: '/siml',
            hseId: 'mcu'
        },
        {
            variant: 'rigemr',
            title: 'RIG EMR',
            linkTo: '/rigemr',
            hseId: 'rigemr'
        }
    ];

    return (
        <div className='bg-white p-4 rounded-lg'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center'>
                {boxes.map((box, index) => (
                    <HseBox
                        key={index}
                        variant={box.variant}
                        title={box.title}
                        linkTo={box.linkTo}
                        hseId={box.hseId}
                    />
                ))}
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
        </div>
    );
};

export default HseButtonComponent