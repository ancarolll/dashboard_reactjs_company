import React from 'react'
import AsideComponents from '../../components/AsideComponents'
import FooterComponents from '../../components/FooterComponents'
import HeaderComponents from '../../components/HeaderComponents'
import '../../styles/main.css';
import ButtonComponents from '../../components/ButtonComponents';
import BubbleNotifComponents from '../../components/BubbleNotifComponents';
import { useNavigate } from 'react-router-dom';

const HsePage = () => {
  const navigate = useNavigate();

    // Fungsi untuk mengarahkan ke halaman bagian dengan meneruskan informasi tombol yang dipilih
  const handleButtonClick = (buttonType) => {
    navigate('/hse-pt', { state: { buttonType } });
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
              <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                <img src="/tar.jpeg" alt="tar" 
                className='w-full h-full object-cover rounded-lg'/>
              </div>
                <div className='flex-1 p-3 text-color'>PT. Timur Adi Raya
                  <span className='flex items-center ml-1'>
                    {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>
              <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
              <ButtonComponents variant="primary" onClick={() => handleButtonClick('G')}>Enter</ButtonComponents>
              </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
              <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                <img src="/elnusa.jpg" alt="elnusa" 
                className='w-full h-full object-cover rounded-lg'/>
              </div>
                <div className='flex-1 p-3 text-color'>PT. Elnusa
                  <span className='flex items-center ml-1'>
                    {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>
              <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
              <ButtonComponents variant="primary" onClick={() => handleButtonClick('A')}>Enter</ButtonComponents>
              </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                  <img src="/pertamina_img.jpeg" alt="pertamina ep reg 4" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 4
                    <span className='flex items-center ml-1'>
                    {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <ButtonComponents variant="primary" onClick={() => handleButtonClick('B')}>Enter</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 (Eksplorasi)
                    <span className='flex items-center ml-1'>
                    {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>

            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <ButtonComponents variant="primary" onClick={() => handleButtonClick('C')}>Enter</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 (Subsurface)
                    <span className='flex items-center ml-1'>
                     {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>

            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <ButtonComponents variant="primary" onClick={() => handleButtonClick('D')}>Enter</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2 zona 7" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 Zona 7 (DevPlan)
                    <span className='flex items-center ml-1'>
                    {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <ButtonComponents variant="primary" onClick={() => handleButtonClick('E')}>Enter</ButtonComponents>
            </div>
          </div>
          <br />

          <div className='flex bg-white max-h-60 p-3 shadow-md rounded items-center gap-4'>
                <div className='w-80 h-32 flex items-center justify-center rounded overflow-hidden'>
                  <img src="/pertamina_img.jpeg" alt="Pertamina Ep Regional 2 zona 7" 
                  className='w-full h-full object-cover rounded-lg'
                  />
                  </div>
                  <div className='flex-1 p-3 text-color'>PT. Pertamina Ep Regional 2 Zona 7 (WOPDM)
                    <span className='flex items-center ml-1'>
                    {/* <BubbleNotifComponents  stacked={true}/> */}
                    </span>
                </div>
            <div className='flex flex-col gap-y-2 items-center w-auto h-auto text-center p-2'>
            <ButtonComponents variant="primary" onClick={() => handleButtonClick('F')}>Enter</ButtonComponents>
            </div>
          </div>
          <br />
          
        </main>

        
        {/* Footer*/}
        <FooterComponents/>
        </div>
        </div>
    </div>
  )
}

export default HsePage