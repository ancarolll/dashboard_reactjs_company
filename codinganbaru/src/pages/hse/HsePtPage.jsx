import React, { useState } from 'react';
import AsideComponents from '../../components/AsideComponents'
import FooterComponents from '../../components/FooterComponents'
import HeaderComponents from '../../components/HeaderComponents'
import '../../styles/main.css';
import { HseBox } from '../../components/hsecom/HseButtonComponent';
import ButtonComponents from '../../components/ButtonComponents';
import { useLocation, Link } from 'react-router-dom';
import { isAuthenticated, hasAccess } from '../../utils/AuthChecker';

const HsePtPage = () => {
    const location = useLocation();
    const buttonType = location.state?.buttonType || 'A' ; //default ke A jika tidak ada state

    //konfiguasi tombol berdasarkan tombil yang di klik di halaman utama 
    const getButtons = () => {
        switch (buttonType) {
            case 'A':
            // Hanya menampilkan 1 button untuk tombol A (Elnusa - RIG EMR)
                return [
                { id: 1, variant: 'rigemr', title: 'Elnusa RIG EMR', linkTo: '/hse-elnusa', hseId: 'elnusa-rigemr' }
                ];
            case 'B':
                return [
                    { id: 2, variant: 'mcu', title: 'Pertamina EP REG 4 - HSE', linkTo: '/hse-regional4', hseId: 'regional4-mcu' },
                    // { id: 3, variant: 'hsepassport', title: 'HSE Passport', linkTo: '/regional4-hsepassport', hseId: 'regional4-hsepassport' },
                    // { id: 4, variant: 'siml', title: 'SIML', linkTo: '/regional4-siml', hseId: 'regional4-siml' }
                ];
            case 'C':
                return [
                    { id: 5, variant: 'mcu', title: 'Pertamina EP REG 2 Eksplorasi - HSE', linkTo: '/hse-regional2x', hseId: 'regional2-eksplorasi-mcu' },
                    // { id: 6, variant: 'hsepassport', title: 'HSE Passport', linkTo: '/regional2-eksplorasi-hsepassport', hseId: 'regional2-eksplorasi-hsepassport' },
                    // { id: 7, variant: 'siml', title: 'SIML', linkTo: '/regional2-eksplorasi-siml', hseId: 'regional2-eksplorasi-siml' }
                ];
            case 'D':
                return [
                    { id: 8, variant: 'mcu', title: 'Pertamina EP REG 2 Subsurface - HSE', linkTo: '/hse-regional2s', hseId: 'regional2-subsurface-mcu' },
                    // { id: 9, variant: 'hsepassport', title: 'HSE Passport', linkTo: '/regional2-subsurface-hsepassport', hseId: 'regional2-subsurface-hsepassport' },
                    // { id: 10, variant: 'siml', title: 'SIML', linkTo: '/regional2-subsurface-siml', hseId: 'regional2-subsurface-siml' }
                ];
            case 'E':
                return [
                    { id: 11, variant: 'mcu', title: 'Pertamina EP REG 2 Zona 7 DEVPLAN - HSE', linkTo: '/hse-regional2z7d', hseId: 'regional2zona7-devplan-mcu' },
                    // { id: 12, variant: 'hsepassport', title: 'HSE Passport', linkTo: '/regional2zona7-devplan-hsepassport', hseId: 'regional2zona7-devplan-hsepassport' },
                    // { id: 13, variant: 'siml', title: 'SIML', linkTo: '/regional2zona7-devplan-siml', hseId: 'regional2zona7-devplan-siml' }
                ];
            case 'F':
                return [
                    { id: 14, variant: 'mcu', title: 'Pertamina EP REG 2 Zona 7 WOPDM - HSE', linkTo: '/hse-regional2z7w', hseId: 'regional2zona7-wopdm-mcu' },
                    // { id: 15, variant: 'hsepassport', title: 'HSE Passport', linkTo: '/regional2zona7-wopdm-hsepassport', hseId: 'regional2zona7-wopdm-hsepassport' },
                    // { id: 16, variant: 'siml', title: 'SIML', linkTo: '/regional2zona7-wopdm-siml', hseId: 'regional2zona7-wopdm-siml' }
                ];
            case 'G':
                return [
                    { id: 14, variant: 'mcu', title: 'TAR - HSE', linkTo: '/hse-tar', hseId: 'tarhse' },
                    // { id: 15, variant: 'hsepassport', title: 'HSE Passport', linkTo: '/regional2zona7-wopdm-hsepassport', hseId: 'regional2zona7-wopdm-hsepassport' },
                    // { id: 16, variant: 'siml', title: 'SIML', linkTo: '/regional2zona7-wopdm-siml', hseId: 'regional2zona7-wopdm-siml' }
                ];// { id: 16, variant: 'siml', title: 'SIML', linkTo: '/regional2zona7-wopdm-siml', hseId: 'regional2zona7-wopdm-siml' }
            default:
                return [];

        }
    };

    const getPageTitle = () => {
        switch (buttonType) {
            case 'A': 
                return 'PT. Elnusa';
            case 'B':
                return 'PT. Pertamina EP Regional 4';
            case 'C':
                return 'PT. Pertamina EP Regional 2 Eksplorasi';
            case 'D':
                return 'PT. Pertamina EP Regional 2 Subsurface';
            case 'E':
                return 'PT. Pertamina EP Regional 2 Zona 7 DevPlan';
            case 'F':
                return 'PT. Pertamina EP Regional 2 Zona 7 WOPDM';
            case 'G':
                return 'PT. Timur Adi Raya';
            default:
                return 'HSE Menu';
        }
    };

    // Function untuk mendapatkan hse ID untuk BubbleNotif berdasarkan buttonType
    const getMainHseId = () => {
        switch (buttonType) {
            case 'A': 
                return 'elnusahse';
            case 'B':
                return 'regional4hse';
            case 'C':
                return 'regional2xhse';
            case 'D':
                return 'regional2shse';
            case 'E':
                return 'regional2z7dhse';
            case 'F':
                return 'regional2z7whse';
            case 'G':
                return 'tarhse';
            default:
                return '';
        }
    };

    const buttons = getButtons();
    const pageTitle = getPageTitle();
    const mainHseId = getMainHseId();

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

        <Link to="/hse">
            <ButtonComponents variant="back">&lt; Back</ButtonComponents>
        </Link>

        {/* Main Content */}
        <main className="flex-1 bg-(--background-tar-color) ">
            <div className="flex items-center justify-center mb-6 mt-4">
            <h3 className="text-2xl font-bold">{pageTitle} - HSE Menu</h3>
            </div>

            <div className="flex-1 flex justify-center items-center w-full px-4 py-6">
                <div className="">
                    <div className="">
                        {buttons.map((button) => (
                            <div key={button.id} className="w-full max-w-md mx-auto">
                                <HseBox
                                    variant={button.variant} 
                                    title={button.title} 
                                    linkTo={button.linkTo} 
                                    hseId={button.hseId}
                                />
                            </div>
                        ))}
                    </div>
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

export default HsePtPage