import React from 'react';
import ButtonComponents from '../ButtonComponents';
import '../../styles/main.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';


export const AccBox = ({ variant, title, icon, linkTo }) => {
  const variants= {
      masteradmin:"bg-white ",
      admin:"bg-white",
      user:"bg-white",
    };

    const iconColors = {
      masteradmin: "text-(--font-tar-maroon-color)",
      admin: "text-(--font-tar-maroon-color)",
      user: "text-(--font-tar-maroon-color)",
    };

    const handleClick = () => {
      if (linkTo) {
          window.location.href = linkTo; // Navigasi jika linkTo ada
      }
  };

    return (
      <div className='items-center justify-center text-center'>
      <div className='flex justify-center rounded px-6' > {/* Container untuk memusatkan dan responsif */}
      <div className={`${variants[variant]} `}
       onClick={handleClick}
      >
        <p className="text-2xl text-(--font-tar-maroon-color) font-bold mb-3">{title}</p>
        {icon && (
          <div className={`mb-4 text-2xl ${iconColors[variant]}`}>
            <FontAwesomeIcon icon={icon} size='5x'/>
          </div>
        )}

      </div>
      </div>
      </div>
    )
  }


const AccountButtonComponents = () => {

    const boxes = [
        {
            variant:'masteradmin',
            title: '',
            icon: faCircleUser,
            linkTo: '/management-account'
        },
        {
            variant:'admin',
            title: '',
            icon: faCircleUser,
            linkTo: '/management-account'
        },
        {
            variant:'user',
            title: '',
            icon: faCircleUser,
            linkTo: '/management-account'
        }
    ]

  return (
    <div className='bg-white'>
        <div className='flex flex-row wrap justify-center gap-2 p-4'>
            {boxes.map((box, index) => (
                <AccBox
                key={index}
                variant={box.variant}
                title={box.title}
                icon={box.icon}
                linkTo={box.linkTo}
                />
                        ))}
        </div>
    </div>
  )
}

export default AccountButtonComponents